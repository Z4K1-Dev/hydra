import { BasePlugin, PluginConfig, PluginSettings } from '../base-plugin';

export interface LocalBusinessData {
  name: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  telephone?: string;
  website?: string;
  openingHours?: OpeningHours[];
  priceRange?: string;
  image?: string;
  description?: string;
  categories?: string[];
  paymentAccepted?: string[];
  currenciesAccepted?: string[];
}

export interface OpeningHours {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  opens: string;
  closes: string;
}

export interface ReviewData {
  author: string;
  rating: number;
  date: string;
  comment?: string;
}

export interface GoogleLocalOptions {
  enableMaps: boolean;
  enableReviews: boolean;
  enableDirections: boolean;
  enablePlaceActions: boolean;
  autoDetectLocation: boolean;
  showOpeningStatus: boolean;
}

export class GoogleLocalPlugin extends BasePlugin {
  private static settingsSchema: PluginSettings = {
    placeId: {
      type: 'string',
      label: 'Google Place ID',
      required: false,
      description: 'Your Google Place ID (e.g., ChIJrTLr-GyuEmsRBfyf1GD_B6wQ)'
    },
    apiKey: {
      type: 'string',
      label: 'Google Maps API Key',
      required: false,
      description: 'Google Maps JavaScript API key'
    },
    businessData: {
      type: 'object',
      label: 'Business Data',
      required: false,
      default: {},
      description: 'Your business information'
    },
    enableMaps: {
      type: 'boolean',
      label: 'Enable Maps',
      required: false,
      default: true,
      description: 'Enable Google Maps integration'
    },
    enableReviews: {
      type: 'boolean',
      label: 'Enable Reviews',
      required: false,
      default: true,
      description: 'Enable Google Reviews integration'
    },
    enableDirections: {
      type: 'boolean',
      label: 'Enable Directions',
      required: false,
      default: true,
      description: 'Enable Google Directions integration'
    },
    enablePlaceActions: {
      type: 'boolean',
      label: 'Enable Place Actions',
      required: false,
      default: true,
      description: 'Enable Google Place Actions (Call, Save, etc.)'
    },
    autoDetectLocation: {
      type: 'boolean',
      label: 'Auto-detect Location',
      required: false,
      default: false,
      description: 'Automatically detect user location'
    },
    showOpeningStatus: {
      type: 'boolean',
      label: 'Show Opening Status',
      required: false,
      default: true,
      description: 'Show business opening/closing status'
    },
    language: {
      type: 'string',
      label: 'Language',
      required: false,
      default: 'en',
      description: 'Language code for Google services'
    },
    region: {
      type: 'string',
      label: 'Region',
      required: false,
      default: 'US',
      description: 'Region code for Google services'
    }
  };

  private businessData: LocalBusinessData | null = null;
  private reviews: ReviewData[] = [];
  private placeDetails: any = null;
  private mapsLoaded: boolean = false;
  private userLocation: { lat: number; lng: number } | null = null;
  private openingStatusInterval: NodeJS.Timeout | null = null;
  private mapsScriptLoaded: boolean = false;

  constructor(config: PluginConfig) {
    super(config);
  }

  async load(): Promise<void> {
    if (typeof window === 'undefined' || this.isLoaded) return;

    try {
      const settings = this.config.settings || {};
      
      // Validate settings
      const isValid = this.validateSettings(settings, GoogleLocalPlugin.settingsSchema);
      if (!isValid) {
        console.error('Invalid Google Local settings');
        return;
      }

      // Initialize business data
      this.businessData = settings.businessData || null;

      // Load Google Maps script if needed
      if (settings.enableMaps && settings.apiKey) {
        await this.loadGoogleMapsScript(settings.apiKey);
      }

      // Get place details if Place ID is provided
      if (settings.placeId) {
        await this.loadPlaceDetails(settings.placeId);
      }

      // Setup user location detection
      if (settings.autoDetectLocation) {
        await this.detectUserLocation();
      }

      // Setup opening status updates
      if (settings.showOpeningStatus && this.businessData?.openingHours) {
        this.setupOpeningStatusUpdates();
      }

      // Register hooks
      this.registerHooks();

      // Add event listeners
      this.addEventListeners();

      // Inject structured data
      this.injectBusinessStructuredData();

      // Emit plugin loaded event
      this.getEventEmitter().emit('googleLocalLoaded', this.config);

      this.isLoaded = true;
      console.log('Google Local plugin loaded successfully');
    } catch (error) {
      console.error('Failed to load Google Local plugin:', error);
      this.getEventEmitter().emit('googleLocalError', error);
    }
  }

  async unload(): Promise<void> {
    if (!this.isLoaded) return;

    try {
      // Clear opening status interval
      if (this.openingStatusInterval) {
        clearInterval(this.openingStatusInterval);
        this.openingStatusInterval = null;
      }

      // Remove hooks
      this.unregisterHooks();

      // Remove event listeners
      this.removeEventListeners();

      // Clear business data
      this.businessData = null;
      this.reviews = [];
      this.placeDetails = null;
      this.userLocation = null;

      // Remove Google Maps script if loaded
      if (this.mapsLoaded) {
        this.removeGoogleMapsScript();
      }

      // Emit plugin unloaded event
      this.getEventEmitter().emit('googleLocalUnloaded', this.config);

      this.isLoaded = false;
      console.log('Google Local plugin unloaded successfully');
    } catch (error) {
      console.error('Failed to unload Google Local plugin:', error);
      this.getEventEmitter().emit('googleLocalError', error);
    }
  }

  private async loadGoogleMapsScript(apiKey: string): Promise<void> {
    if (this.mapsScriptLoaded) return;

    try {
      const settings = this.config.settings || {};
      const language = settings.language || 'en';
      const region = settings.region || 'US';
      
      const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&language=${language}&region=${region}&libraries=places`;
      
      await this.injectScript(scriptUrl);
      
      // Wait for Google Maps to load
      await this.waitForGoogleMaps();
      
      this.mapsLoaded = true;
      this.mapsScriptLoaded = true;
      
      this.getEventEmitter().emit('googleMapsLoaded');
    } catch (error) {
      console.error('Failed to load Google Maps script:', error);
      throw error;
    }
  }

  private waitForGoogleMaps(): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkGoogleMaps = () => {
        if ((window as any).google && (window as any).google.maps) {
          resolve();
        } else {
          setTimeout(checkGoogleMaps, 100);
        }
      };
      
      checkGoogleMaps();
      
      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Google Maps failed to load'));
      }, 10000);
    });
  }

  private removeGoogleMapsScript(): void {
    const scripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
    scripts.forEach(script => script.remove());
    
    // Clear Google Maps from window object
    delete (window as any).google;
    
    this.mapsLoaded = false;
    this.mapsScriptLoaded = false;
  }

  private async loadPlaceDetails(placeId: string): Promise<void> {
    if (!this.mapsLoaded) {
      console.warn('Google Maps not loaded, cannot fetch place details');
      return;
    }

    try {
      const service = new (window as any).google.maps.places.PlacesService(document.createElement('div'));
      
      return new Promise<void>((resolve, reject) => {
        service.getDetails(
          { placeId, fields: ['all'] },
          (result: any, status: string) => {
            if (status === 'OK') {
              this.placeDetails = result;
              this.processPlaceDetails(result);
              this.getEventEmitter().emit('placeDetailsLoaded', result);
              resolve();
            } else {
              console.error('Failed to load place details:', status);
              reject(new Error(`Failed to load place details: ${status}`));
            }
          }
        );
      });
    } catch (error) {
      console.error('Error loading place details:', error);
      throw error;
    }
  }

  private processPlaceDetails(details: any): void {
    // Update business data with place details
    if (!this.businessData) {
      this.businessData = {
        name: '',
        address: {
          streetAddress: '',
          addressLocality: '',
          addressRegion: '',
          postalCode: '',
          addressCountry: ''
        }
      };
    }

    // Update basic information
    if (details.name) this.businessData.name = details.name;
    if (details.formatted_address) {
      const address = this.parseAddress(details.formatted_address);
      this.businessData.address = address;
    }
    if (details.formatted_phone_number) {
      this.businessData.telephone = details.formatted_phone_number;
    }
    if (details.website) {
      this.businessData.website = details.website;
    }
    if (details.geometry && details.geometry.location) {
      this.businessData.geo = {
        latitude: details.geometry.location.lat(),
        longitude: details.geometry.location.lng()
      };
    }

    // Process opening hours
    if (details.opening_hours) {
      this.businessData.openingHours = details.opening_hours.weekday_text.map((text: string) => {
        const parts = text.split(': ');
        const day = parts[0];
        const hours = parts[1];
        
        let opens = '00:00';
        let closes = '23:59';
        
        if (hours !== 'Closed') {
          const timeRange = hours.split(' – ');
          opens = this.convertTo24Hour(timeRange[0]);
          closes = this.convertTo24Hour(timeRange[1]);
        }
        
        return {
          day: this.normalizeDay(day),
          opens,
          closes
        };
      });
    }

    // Process reviews
    if (details.reviews) {
      this.reviews = details.reviews.map((review: any) => ({
        author: review.author_name,
        rating: review.rating,
        date: new Date(review.time * 1000).toISOString(),
        comment: review.text
      }));
    }

    // Process other details
    if (details.price_level) {
      const priceRanges = ['$', '$$', '$$$', '$$$$'];
      this.businessData.priceRange = priceRanges[details.price_level - 1] || '$';
    }

    if (details.types) {
      this.businessData.categories = details.types;
    }
  }

  private parseAddress(formattedAddress: string): LocalBusinessData['address'] {
    // Simple address parsing - in production, use a proper address parser
    const parts = formattedAddress.split(', ');
    
    return {
      streetAddress: parts[0] || '',
      addressLocality: parts[1] || '',
      addressRegion: parts[2] || '',
      postalCode: parts[3] || '',
      addressCountry: parts[4] || ''
    };
  }

  private normalizeDay(day: string): OpeningHours['day'] {
    const dayMap: Record<string, OpeningHours['day']> = {
      'Monday': 'Monday',
      'Tuesday': 'Tuesday',
      'Wednesday': 'Wednesday',
      'Thursday': 'Thursday',
      'Friday': 'Friday',
      'Saturday': 'Saturday',
      'Sunday': 'Sunday',
      'Mon': 'Monday',
      'Tue': 'Tuesday',
      'Wed': 'Wednesday',
      'Thu': 'Thursday',
      'Fri': 'Friday',
      'Sat': 'Saturday',
      'Sun': 'Sunday'
    };
    
    return dayMap[day] || 'Monday';
  }

  private convertTo24Hour(time: string): string {
    const [timePart, period] = time.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  private async detectUserLocation(): Promise<void> {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      this.userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      this.getEventEmitter().emit('userLocationDetected', this.userLocation);
    } catch (error) {
      console.error('Error detecting user location:', error);
    }
  }

  private setupOpeningStatusUpdates(): void {
    // Update opening status every minute
    this.updateOpeningStatus();
    this.openingStatusInterval = setInterval(() => {
      this.updateOpeningStatus();
    }, 60000);
  }

  private updateOpeningStatus(): void {
    if (!this.businessData?.openingHours) return;

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }) as OpeningHours['day'];
    const currentTime = now.toTimeString().slice(0, 5);

    const todayHours = this.businessData.openingHours.find(hours => hours.day === currentDay);
    
    if (todayHours) {
      const isOpen = this.isTimeInRange(currentTime, todayHours.opens, todayHours.closes);
      const status = isOpen ? 'open' : 'closed';
      
      this.getEventEmitter().emit('openingStatusUpdated', {
        status,
        day: currentDay,
        currentTime,
        opens: todayHours.opens,
        closes: todayHours.closes
      });
    }
  }

  private isTimeInRange(time: string, start: string, end: string): boolean {
    const timeNum = parseInt(time.replace(':', ''));
    const startNum = parseInt(start.replace(':', ''));
    const endNum = parseInt(end.replace(':', ''));
    
    return timeNum >= startNum && timeNum <= endNum;
  }

  private registerHooks(): void {
    const hookManager = this.getHookManager();
    
    hookManager.addHook('getDirections', this.getDirections.bind(this));
    hookManager.addHook('calculateDistance', this.calculateDistance.bind(this));
    hookManager.addHook('getPlaceDetails', this.getPlaceDetails.bind(this));
    hookManager.addHook('getOpeningStatus', this.getOpeningStatus.bind(this));
    hookManager.addHook('showMap', this.showMap.bind(this));
    hookManager.addHook('callBusiness', this.callBusiness.bind(this));
  }

  private unregisterHooks(): void {
    const hookManager = this.getHookManager();
    
    hookManager.removeHook('getDirections', this.getDirections.bind(this));
    hookManager.removeHook('calculateDistance', this.calculateDistance.bind(this));
    hookManager.removeHook('getPlaceDetails', this.getPlaceDetails.bind(this));
    hookManager.removeHook('getOpeningStatus', this.getOpeningStatus.bind(this));
    hookManager.removeHook('showMap', this.showMap.bind(this));
    hookManager.removeHook('callBusiness', this.callBusiness.bind(this));
  }

  private addEventListeners(): void {
    const eventEmitter = this.getEventEmitter();
    
    eventEmitter.on('businessDataUpdated', this.handleBusinessDataUpdate.bind(this));
    eventEmitter.on('userLocationChanged', this.handleUserLocationChange.bind(this));
  }

  private removeEventListeners(): void {
    const eventEmitter = this.getEventEmitter();
    
    eventEmitter.off('businessDataUpdated', this.handleBusinessDataUpdate.bind(this));
    eventEmitter.off('userLocationChanged', this.handleUserLocationChange.bind(this));
  }

  private handleBusinessDataUpdate(data: LocalBusinessData): void {
    this.businessData = data;
    this.injectBusinessStructuredData();
    this.getEventEmitter().emit('businessStructuredDataUpdated');
  }

  private handleUserLocationChange(location: { lat: number; lng: number }): void {
    this.userLocation = location;
    this.getEventEmitter().emit('userLocationUpdated', location);
  }

  private injectBusinessStructuredData(): void {
    if (!this.businessData) return;

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: this.businessData.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: this.businessData.address.streetAddress,
        addressLocality: this.businessData.address.addressLocality,
        addressRegion: this.businessData.address.addressRegion,
        postalCode: this.businessData.address.postalCode,
        addressCountry: this.businessData.address.addressCountry
      },
      telephone: this.businessData.telephone,
      website: this.businessData.website
    };

    if (this.businessData.geo) {
      structuredData.geo = {
        '@type': 'GeoCoordinates',
        latitude: this.businessData.geo.latitude,
        longitude: this.businessData.geo.longitude
      };
    }

    if (this.businessData.openingHours) {
      structuredData.openingHoursSpecification = this.businessData.openingHours.map(hours => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: hours.day,
        opens: hours.opens,
        closes: hours.closes
      }));
    }

    if (this.businessData.priceRange) {
      structuredData.priceRange = this.businessData.priceRange;
    }

    if (this.businessData.image) {
      structuredData.image = this.businessData.image;
    }

    if (this.businessData.description) {
      structuredData.description = this.businessData.description;
    }

    this.injectStructuredData(structuredData);
  }

  // Public API methods
  async getDirections(destination?: string): Promise<any> {
    if (!this.mapsLoaded || !this.userLocation) {
      throw new Error('Google Maps not loaded or user location not available');
    }

    const directionsService = new (window as any).google.maps.DirectionsService();
    
    const request = {
      origin: this.userLocation,
      destination: destination || this.businessData?.address.streetAddress,
      travelMode: (window as any).google.maps.TravelMode.DRIVING
    };

    return new Promise((resolve, reject) => {
      directionsService.route(request, (result: any, status: string) => {
        if (status === 'OK') {
          resolve(result);
        } else {
          reject(new Error(`Directions request failed: ${status}`));
        }
      });
    });
  }

  async calculateDistance(destination?: string): Promise<number> {
    if (!this.mapsLoaded || !this.userLocation) {
      throw new Error('Google Maps not loaded or user location not available');
    }

    const distanceMatrixService = new (window as any).google.maps.DistanceMatrixService();
    
    const request = {
      origins: [this.userLocation],
      destinations: [destination || this.businessData?.address.streetAddress],
      travelMode: (window as any).google.maps.TravelMode.DRIVING,
      unitSystem: (window as any).google.maps.UnitSystem.METRIC
    };

    return new Promise((resolve, reject) => {
      distanceMatrixService.getDistanceMatrix(request, (result: any, status: string) => {
        if (status === 'OK' && result.rows[0].elements[0].status === 'OK') {
          resolve(result.rows[0].elements[0].distance.value); // Distance in meters
        } else {
          reject(new Error(`Distance calculation failed: ${status}`));
        }
      });
    });
  }

  getPlaceDetails(): any {
    return this.placeDetails;
  }

  getOpeningStatus(): { status: 'open' | 'closed'; nextChange?: string } {
    if (!this.businessData?.openingHours) {
      return { status: 'closed' };
    }

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }) as OpeningHours['day'];
    const currentTime = now.toTimeString().slice(0, 5);

    const todayHours = this.businessData.openingHours.find(hours => hours.day === currentDay);
    
    if (!todayHours) {
      return { status: 'closed' };
    }

    const isOpen = this.isTimeInRange(currentTime, todayHours.opens, todayHours.closes);
    
    // Calculate next opening/closing time
    let nextChange: string | undefined;
    
    if (isOpen) {
      nextChange = todayHours.closes;
    } else {
      // Find next opening time
      const tomorrowHours = this.businessData.openingHours.find(hours => 
        hours.day === this.getNextDay(currentDay)
      );
      if (tomorrowHours) {
        nextChange = tomorrowHours.opens;
      }
    }

    return {
      status: isOpen ? 'open' : 'closed',
      nextChange
    };
  }

  private getNextDay(currentDay: OpeningHours['day']): OpeningHours['day'] {
    const days: OpeningHours['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const currentIndex = days.indexOf(currentDay);
    return days[(currentIndex + 1) % 7];
  }

  showMap(container: string | HTMLElement, options?: any): void {
    if (!this.mapsLoaded || !this.businessData?.geo) {
      throw new Error('Google Maps not loaded or business location not available');
    }

    const mapElement = typeof container === 'string' 
      ? document.getElementById(container) 
      : container;

    if (!mapElement) {
      throw new Error('Map container not found');
    }

    const map = new (window as any).google.maps.Map(mapElement, {
      center: {
        lat: this.businessData.geo.latitude,
        lng: this.businessData.geo.longitude
      },
      zoom: 15,
      ...options
    });

    const marker = new (window as any).google.maps.Marker({
      position: {
        lat: this.businessData.geo.latitude,
        lng: this.businessData.geo.longitude
      },
      map,
      title: this.businessData.name
    });

    this.getEventEmitter().emit('mapShown', { map, marker });
  }

  callBusiness(): void {
    if (!this.businessData?.telephone) {
      throw new Error('Business telephone number not available');
    }

    window.location.href = `tel:${this.businessData.telephone}`;
    this.getEventEmitter().emit('businessCalled', this.businessData.telephone);
  }

  getBusinessData(): LocalBusinessData | null {
    return this.businessData ? { ...this.businessData } : null;
  }

  getReviews(): ReviewData[] {
    return [...this.reviews];
  }

  getUserLocation(): { lat: number; lng: number } | null {
    return this.userLocation ? { ...this.userLocation } : null;
  }

  updateBusinessData(data: Partial<LocalBusinessData>): void {
    if (!this.businessData) {
      this.businessData = {
        name: '',
        address: {
          streetAddress: '',
          addressLocality: '',
          addressRegion: '',
          postalCode: '',
          addressCountry: ''
        }
      };
    }

    this.businessData = { ...this.businessData, ...data };
    this.injectBusinessStructuredData();
    this.getEventEmitter().emit('businessDataUpdated', this.businessData);
  }

  // Utility methods
  isBusinessOpen(): boolean {
    return this.getOpeningStatus().status === 'open';
  }

  getDistanceFromUser(): Promise<number | null> {
    if (!this.userLocation || !this.businessData?.geo) {
      return Promise.resolve(null);
    }

    return this.calculateDistance();
  }

  getEstimatedTravelTime(): Promise<string | null> {
    if (!this.userLocation || !this.businessData?.geo) {
      return Promise.resolve(null);
    }

    return this.getDirections().then(directions => {
      const route = directions.routes[0];
      const leg = route.legs[0];
      return leg.duration.text;
    }).catch(() => null);
  }

  static getSettingsSchema(): PluginSettings {
    return GoogleLocalPlugin.settingsSchema;
  }
}