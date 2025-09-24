import { BasePlugin, PluginConfig, PluginSettings } from '../base-plugin';

export class GoogleLocalPlugin extends BasePlugin {
  private static settingsSchema: PluginSettings = {
    placeId: {
      type: 'string',
      label: 'Google Place ID',
      required: true,
      description: 'Your Google Place ID (e.g., ChIJrTLr-GyuEmsRBfyf1GD_B6g)'
    },
    apiKey: {
      type: 'string',
      label: 'Google Maps API Key',
      required: true,
      description: 'Your Google Maps JavaScript API key'
    },
    enableReviews: {
      type: 'boolean',
      label: 'Enable Reviews',
      required: false,
      default: true,
      description: 'Display Google reviews'
    },
    enableDirections: {
      type: 'boolean',
      label: 'Enable Directions',
      required: false,
      default: true,
      description: 'Show directions button'
    },
    enablePhotos: {
      type: 'boolean',
      label: 'Enable Photos',
      required: false,
      default: true,
      description: 'Display place photos'
    },
    mapContainerId: {
      type: 'string',
      label: 'Map Container ID',
      required: false,
      default: 'google-map',
      description: 'ID of the container element for the map'
    }
  };

  private map: any = null;
  private placeService: any = null;
  private placeDetails: any = null;

  constructor(config: PluginConfig) {
    super(config);
  }

  async load(): Promise<void> {
    if (typeof window === 'undefined' || this.isLoaded) return;

    try {
      const settings = this.config.settings || {};
      
      if (!settings.placeId || !settings.apiKey) {
        console.error('Place ID and API key are required for Google Local plugin');
        return;
      }

      // Load Google Maps JavaScript API
      await this.loadGoogleMapsAPI(settings.apiKey);

      // Initialize map and services
      await this.initializeMap(settings);

      // Load place details
      await this.loadPlaceDetails(settings.placeId);

      // Inject local business structured data
      this.injectLocalBusinessStructuredData();

      this.isLoaded = true;
      console.log('Google Local plugin loaded successfully');
    } catch (error) {
      console.error('Failed to load Google Local plugin:', error);
    }
  }

  async unload(): Promise<void> {
    if (!this.isLoaded) return;

    try {
      // Remove Google Maps scripts
      const scripts = document.querySelectorAll('script[src*="maps.googleapis"]');
      scripts.forEach(script => script.remove());

      // Clear map
      if (this.map) {
        const container = document.getElementById(this.config.settings?.mapContainerId || 'google-map');
        if (container) {
          container.innerHTML = '';
        }
      }

      // Remove structured data
      const structuredDataScripts = document.querySelectorAll('script[type="application/ld+json"]');
      structuredDataScripts.forEach(script => {
        if (script.textContent?.includes('LocalBusiness')) {
          script.remove();
        }
      });

      this.map = null;
      this.placeService = null;
      this.placeDetails = null;
      this.isLoaded = false;
      console.log('Google Local plugin unloaded successfully');
    } catch (error) {
      console.error('Failed to unload Google Local plugin:', error);
    }
  }

  private async loadGoogleMapsAPI(apiKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleLocalPlugin`;
      script.async = true;
      script.defer = true;
      
      // Set up callback
      (window as any).initGoogleLocalPlugin = () => {
        resolve();
      };
      
      script.onerror = () => reject(new Error('Failed to load Google Maps API'));
      
      document.head.appendChild(script);
    });
  }

  private async initializeMap(settings: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const container = document.getElementById(settings.mapContainerId || 'google-map');
      if (!container) {
        reject(new Error('Map container not found'));
        return;
      }

      // Create map
      this.map = new (window as any).google.maps.Map(container, {
        center: { lat: 0, lng: 0 },
        zoom: 15,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      // Create places service
      this.placeService = new (window as any).google.maps.places.PlacesService(this.map);

      resolve();
    });
  }

  private async loadPlaceDetails(placeId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.placeService) {
        reject(new Error('Place service not initialized'));
        return;
      }

      const request = {
        placeId: placeId,
        fields: [
          'name', 'formatted_address', 'formatted_phone_number', 'website',
          'rating', 'reviews', 'photos', 'geometry', 'opening_hours',
          'price_level', 'types'
        ]
      };

      this.placeService.getDetails(request, (place: any, status: string) => {
        if (status === 'OK') {
          this.placeDetails = place;
          
          // Center map on place
          if (this.map && place.geometry) {
            this.map.setCenter(place.geometry.location);
            
            // Add marker
            new (window as any).google.maps.Marker({
              position: place.geometry.location,
              map: this.map,
              title: place.name
            });
          }

          resolve();
        } else {
          reject(new Error(`Failed to load place details: ${status}`));
        }
      });
    });
  }

  private injectLocalBusinessStructuredData(): void {
    if (!this.placeDetails) return;

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: this.placeDetails.name,
      image: this.placeDetails.photos?.[0]?.getUrl(),
      address: this.placeDetails.formatted_address,
      telephone: this.placeDetails.formatted_phone_number,
      priceRange: this.getPriceRange(),
      aggregateRating: this.placeDetails.rating ? {
        '@type': 'AggregateRating',
        ratingValue: this.placeDetails.rating,
        reviewCount: this.placeDetails.reviews?.length || 0
      } : undefined,
      geo: this.placeDetails.geometry ? {
        '@type': 'GeoCoordinates',
        latitude: this.placeDetails.geometry.location.lat(),
        longitude: this.placeDetails.geometry.location.lng()
      } : undefined,
      openingHours: this.getOpeningHours(),
      url: this.placeDetails.website
    };

    this.injectStructuredData(structuredData);
  }

  private getPriceRange(): string {
    if (!this.placeDetails.price_level) return '';
    
    const priceRanges = ['', '$', '$$', '$$$', '$$$$'];
    return priceRanges[this.placeDetails.price_level] || '';
  }

  private getOpeningHours(): any[] {
    if (!this.placeDetails.opening_hours) return [];

    return this.placeDetails.opening_hours.weekday_text.map((text: string) => {
      const [days, hours] = text.split(': ');
      return {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: days.split(' - ')[0],
        opens: hours.split(' – ')[0],
        closes: hours.split(' – ')[1]
      };
    });
  }

  // Public methods to access place data
  getPlaceDetails(): any {
    return this.placeDetails ? { ...this.placeDetails } : null;
  }

  getReviews(): any[] {
    return this.placeDetails?.reviews || [];
  }

  getPhotos(): any[] {
    return this.placeDetails?.photos || [];
  }

  getRating(): number {
    return this.placeDetails?.rating || 0;
  }

  // Method to show directions
  showDirections(destination: string): void {
    if (typeof window === 'undefined') return;
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    window.open(url, '_blank');
  }

  // Method to get directions URL
  getDirectionsUrl(): string {
    if (!this.placeDetails) return '';
    
    const destination = `${this.placeDetails.name}, ${this.placeDetails.formatted_address}`;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  }

  static getSettingsSchema(): PluginSettings {
    return GoogleLocalPlugin.settingsSchema;
  }
}