'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GoogleLocalDemoProps {
  isActive: boolean;
}

interface BusinessInfo {
  name: string;
  category: string;
  description: string;
  phone: string;
  website: string;
  email: string;
}

interface AddressInfo {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface HoursInfo {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

interface ReviewsInfo {
  totalReviews: number;
  averageRating: number;
  recentReviews: Array<{
    author: string;
    rating: number;
    comment: string;
    date: string;
  }>;
}

export function GoogleLocalDemo({ isActive }: GoogleLocalDemoProps) {
  const [localConfig, setLocalConfig] = useState({
    enablePlaces: true,
    enableMaps: true,
    enableReviews: true,
    enableDirections: true,
    enablePhotos: true
  });

  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    name: 'Plugin System Solutions',
    category: 'Software Development',
    description: 'Expert in developing advanced plugin systems and web applications with Next.js and TypeScript.',
    phone: '+1-555-0123',
    website: 'https://pluginsystem.com',
    email: 'info@pluginsystem.com'
  });

  const [addressInfo, setAddressInfo] = useState<AddressInfo>({
    street: '123 Developer Street',
    city: 'Tech City',
    state: 'CA',
    zipCode: '94025',
    country: 'United States'
  });

  const [hoursInfo, setHoursInfo] = useState<HoursInfo>({
    monday: '9:00 AM - 6:00 PM',
    tuesday: '9:00 AM - 6:00 PM',
    wednesday: '9:00 AM - 6:00 PM',
    thursday: '9:00 AM - 6:00 PM',
    friday: '9:00 AM - 6:00 PM',
    saturday: '10:00 AM - 4:00 PM',
    sunday: 'Closed'
  });

  const [reviewsInfo, setReviewsInfo] = useState<ReviewsInfo>({
    totalReviews: 127,
    averageRating: 4.8,
    recentReviews: [
      {
        author: 'John D.',
        rating: 5,
        comment: 'Excellent plugin system development services. Very professional and knowledgeable team.',
        date: '2024-01-10'
      },
      {
        author: 'Sarah M.',
        rating: 4,
        comment: 'Great work on our hybrid plugin system. Would recommend to others.',
        date: '2024-01-08'
      },
      {
        author: 'Mike R.',
        rating: 5,
        comment: 'Outstanding service and technical expertise. They delivered exactly what we needed.',
        date: '2024-01-05'
      }
    ]
  });

  const updateConfig = (key: string, value: boolean) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateBusinessInfo = (key: keyof BusinessInfo, value: string) => {
    setBusinessInfo(prev => ({ ...prev, [key]: value }));
  };

  const updateAddressInfo = (key: keyof AddressInfo, value: string) => {
    setAddressInfo(prev => ({ ...prev, [key]: value }));
  };

  const updateHoursInfo = (key: keyof HoursInfo, value: string) => {
    setHoursInfo(prev => ({ ...prev, [key]: value }));
  };

  const getStarRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex items-center gap-1">
        {Array(fullStars).fill(0).map((_, i) => (
          <span key={`full-${i}`} className="text-yellow-400">⭐</span>
        ))}
        {hasHalfStar && <span className="text-yellow-400">⭐</span>}
        {Array(emptyStars).fill(0).map((_, i) => (
          <span key={`empty-${i}`} className="text-gray-300">⭐</span>
        ))}
      </div>
    );
  };

  if (!isActive) {
    return (
      <Card className="opacity-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📍 Google Local Plugin
            <Badge variant="secondary">Inactive</Badge>
          </CardTitle>
          <CardDescription>
            Local business optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">📍</div>
            <p>Plugin is inactive. Enable it to access Google Local features.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📍 Google Local Plugin
            <Badge variant="default">Active</Badge>
          </CardTitle>
          <CardDescription>
            Optimize your business for local search and Google Maps
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>⚙️ Google Local Configuration</CardTitle>
          <CardDescription>Enable/disable different Google Local features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="enablePlaces"
                checked={localConfig.enablePlaces}
                onCheckedChange={(checked) => updateConfig('enablePlaces', checked)}
              />
              <Label htmlFor="enablePlaces">Google Places</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enableMaps"
                checked={localConfig.enableMaps}
                onCheckedChange={(checked) => updateConfig('enableMaps', checked)}
              />
              <Label htmlFor="enableMaps">Google Maps</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enableReviews"
                checked={localConfig.enableReviews}
                onCheckedChange={(checked) => updateConfig('enableReviews', checked)}
              />
              <Label htmlFor="enableReviews">Reviews</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enableDirections"
                checked={localConfig.enableDirections}
                onCheckedChange={(checked) => updateConfig('enableDirections', checked)}
              />
              <Label htmlFor="enableDirections">Directions</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enablePhotos"
                checked={localConfig.enablePhotos}
                onCheckedChange={(checked) => updateConfig('enablePhotos', checked)}
              />
              <Label htmlFor="enablePhotos">Photos</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle>🏢 Business Information</CardTitle>
          <CardDescription>Basic information about your business</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={businessInfo.name}
                onChange={(e) => updateBusinessInfo('name', e.target.value)}
                placeholder="Business name"
              />
            </div>

            <div>
              <Label htmlFor="businessCategory">Category</Label>
              <Input
                id="businessCategory"
                value={businessInfo.category}
                onChange={(e) => updateBusinessInfo('category', e.target.value)}
                placeholder="Business category"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="businessDescription">Description</Label>
            <Textarea
              id="businessDescription"
              value={businessInfo.description}
              onChange={(e) => updateBusinessInfo('description', e.target.value)}
              placeholder="Business description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="businessPhone">Phone</Label>
              <Input
                id="businessPhone"
                value={businessInfo.phone}
                onChange={(e) => updateBusinessInfo('phone', e.target.value)}
                placeholder="+1-555-0123"
              />
            </div>

            <div>
              <Label htmlFor="businessWebsite">Website</Label>
              <Input
                id="businessWebsite"
                value={businessInfo.website}
                onChange={(e) => updateBusinessInfo('website', e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <div>
              <Label htmlFor="businessEmail">Email</Label>
              <Input
                id="businessEmail"
                type="email"
                value={businessInfo.email}
                onChange={(e) => updateBusinessInfo('email', e.target.value)}
                placeholder="info@example.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle>📍 Address Information</CardTitle>
          <CardDescription>Business location details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="streetAddress">Street Address</Label>
            <Input
              id="streetAddress"
              value={addressInfo.street}
              onChange={(e) => updateAddressInfo('street', e.target.value)}
              placeholder="123 Main Street"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={addressInfo.city}
                onChange={(e) => updateAddressInfo('city', e.target.value)}
                placeholder="City"
              />
            </div>

            <div>
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                value={addressInfo.state}
                onChange={(e) => updateAddressInfo('state', e.target.value)}
                placeholder="State"
              />
            </div>

            <div>
              <Label htmlFor="zipCode">ZIP/Postal Code</Label>
              <Input
                id="zipCode"
                value={addressInfo.zipCode}
                onChange={(e) => updateAddressInfo('zipCode', e.target.value)}
                placeholder="12345"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={addressInfo.country}
              onChange={(e) => updateAddressInfo('country', e.target.value)}
              placeholder="Country"
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <CardTitle>🕐 Business Hours</CardTitle>
          <CardDescription>Set your business operating hours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(hoursInfo).map(([day, hours]) => (
              <div key={day}>
                <Label htmlFor={day}>{day.charAt(0).toUpperCase() + day.slice(1)}</Label>
                <Input
                  id={day}
                  value={hours}
                  onChange={(e) => updateHoursInfo(day as keyof HoursInfo, e.target.value)}
                  placeholder="9:00 AM - 6:00 PM"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Google Business Preview */}
      <Card>
        <CardHeader>
          <CardTitle>🔍 Google Business Preview</CardTitle>
          <CardDescription>How your business appears in Google search</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-6 bg-white">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-2xl">
                🏢
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-blue-600 mb-1">{businessInfo.name}</h3>
                <div className="flex items-center gap-2 mb-2">
                  {getStarRating(reviewsInfo.averageRating)}
                  <span className="text-sm text-gray-600">
                    {reviewsInfo.averageRating} ({reviewsInfo.totalReviews} reviews)
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>🏷️ {businessInfo.category}</div>
                  <div>📍 {addressInfo.street}, {addressInfo.city}, {addressInfo.state} {addressInfo.zipCode}</div>
                  <div>📞 {businessInfo.phone}</div>
                  <div>🌐 {businessInfo.website}</div>
                  <div>🕒 Hours: {hoursInfo.monday}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Section */}
      <Card>
        <CardHeader>
          <CardTitle>⭐ Customer Reviews</CardTitle>
          <CardDescription>Manage and display customer reviews</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <div className="text-2xl font-bold">{reviewsInfo.averageRating}</div>
                <div className="text-sm text-gray-600">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{reviewsInfo.totalReviews}</div>
                <div className="text-sm text-gray-600">Total Reviews</div>
              </div>
              <div className="flex items-center gap-1">
                {getStarRating(reviewsInfo.averageRating)}
              </div>
            </div>

            <div className="space-y-4">
              {reviewsInfo.recentReviews.map((review, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{review.author}</div>
                    <div className="flex items-center gap-2">
                      {getStarRating(review.rating)}
                      <span className="text-sm text-gray-600">{review.date}</span>
                    </div>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maps Integration */}
      <Card>
        <CardHeader>
          <CardTitle>🗺️ Maps Integration</CardTitle>
          <CardDescription>Google Maps integration preview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Location Preview</h4>
                <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🗺️</div>
                    <div className="text-sm text-gray-600">Google Maps Integration</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {addressInfo.street}, {addressInfo.city}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Directions</h4>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    🚗 Get Directions
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    📱 Save to Phone
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    📤 Share Location
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}