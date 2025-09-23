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

interface RichSnippetDemoProps {
  isActive: boolean;
}

interface ArticleData {
  headline: string;
  image: string;
  datePublished: string;
  dateModified: string;
  author: string;
  publisher: string;
  description: string;
}

interface ProductData {
  name: string;
  image: string;
  description: string;
  brand: string;
  sku: string;
  price: number;
  priceCurrency: string;
  availability: string;
  reviewCount: number;
  ratingValue: number;
}

interface LocalBusinessData {
  name: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo: {
    latitude: number;
    longitude: number;
  };
  telephone: string;
  openingHours: string[];
  priceRange: string;
  image: string;
}

export function RichSnippetDemo({ isActive }: RichSnippetDemoProps) {
  const [snippetConfig, setSnippetConfig] = useState({
    enableArticle: true,
    enableProduct: true,
    enableLocalBusiness: true,
    enableOrganization: true
  });

  const [articleData, setArticleData] = useState<ArticleData>({
    headline: 'Advanced Hybrid Plugin System for Next.js Applications',
    image: 'https://via.placeholder.com/800x600',
    datePublished: '2024-01-15',
    dateModified: '2024-01-15',
    author: 'Plugin System Team',
    publisher: 'Tech Demo',
    description: 'Learn how to build advanced hybrid plugin systems with Next.js and TypeScript for scalable web applications.'
  });

  const [productData, setProductData] = useState<ProductData>({
    name: 'Premium Plugin System License',
    image: 'https://via.placeholder.com/400x400',
    description: 'Complete license for our advanced hybrid plugin system with full support and updates.',
    brand: 'PluginTech',
    sku: 'PS-2024-PREMIUM',
    price: 299.99,
    priceCurrency: 'USD',
    availability: 'InStock',
    reviewCount: 42,
    ratingValue: 4.8
  });

  const [localBusinessData, setLocalBusinessData] = useState<LocalBusinessData>({
    name: 'Plugin System Solutions',
    address: {
      streetAddress: '123 Developer Street',
      addressLocality: 'Tech City',
      addressRegion: 'Silicon Valley',
      postalCode: '94025',
      addressCountry: 'US'
    },
    geo: {
      latitude: 37.4220656,
      longitude: -122.0840897
    },
    telephone: '+1-555-0123',
    openingHours: ['Mo-Fr 09:00-18:00', 'Sa 10:00-16:00'],
    priceRange: '$$',
    image: 'https://via.placeholder.com/400x300'
  });

  const [generatedSnippets, setGeneratedSnippets] = useState<Record<string, string>>({});

  const updateConfig = (key: string, value: boolean) => {
    setSnippetConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateArticleData = (key: keyof ArticleData, value: string) => {
    setArticleData(prev => ({ ...prev, [key]: value }));
  };

  const updateProductData = (key: keyof ProductData, value: string | number) => {
    setProductData(prev => ({ ...prev, [key]: value }));
  };

  const updateLocalBusinessData = (key: keyof LocalBusinessData, value: any) => {
    setLocalBusinessData(prev => ({ ...prev, [key]: value }));
  };

  const generateArticleSnippet = () => {
    const snippet = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: articleData.headline,
      image: articleData.image,
      datePublished: articleData.datePublished,
      dateModified: articleData.dateModified,
      author: {
        '@type': 'Person',
        name: articleData.author
      },
      publisher: {
        '@type': 'Organization',
        name: articleData.publisher
      },
      description: articleData.description
    };

    setGeneratedSnippets(prev => ({
      ...prev,
      article: JSON.stringify(snippet, null, 2)
    }));
  };

  const generateProductSnippet = () => {
    const snippet = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: productData.name,
      image: productData.image,
      description: productData.description,
      brand: {
        '@type': 'Brand',
        name: productData.brand
      },
      sku: productData.sku,
      offers: {
        '@type': 'Offer',
        price: productData.price,
        priceCurrency: productData.priceCurrency,
        availability: `https://schema.org/${productData.availability}`
      },
      review: productData.reviewCount && productData.ratingValue ? {
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: productData.ratingValue,
          bestRating: 5
        },
        author: {
          '@type': 'Person',
          name: 'Customer'
        }
      } : undefined,
      aggregateRating: productData.reviewCount && productData.ratingValue ? {
        '@type': 'AggregateRating',
        ratingValue: productData.ratingValue,
        reviewCount: productData.reviewCount
      } : undefined
    };

    setGeneratedSnippets(prev => ({
      ...prev,
      product: JSON.stringify(snippet, null, 2)
    }));
  };

  const generateLocalBusinessSnippet = () => {
    const snippet = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: localBusinessData.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: localBusinessData.address.streetAddress,
        addressLocality: localBusinessData.address.addressLocality,
        addressRegion: localBusinessData.address.addressRegion,
        postalCode: localBusinessData.address.postalCode,
        addressCountry: localBusinessData.address.addressCountry
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: localBusinessData.geo.latitude,
        longitude: localBusinessData.geo.longitude
      },
      telephone: localBusinessData.telephone,
      openingHours: localBusinessData.openingHours,
      priceRange: localBusinessData.priceRange,
      image: localBusinessData.image
    };

    setGeneratedSnippets(prev => ({
      ...prev,
      localBusiness: JSON.stringify(snippet, null, 2)
    }));
  };

  if (!isActive) {
    return (
      <Card className="opacity-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💎 Rich Snippet Plugin
            <Badge variant="secondary">Inactive</Badge>
          </CardTitle>
          <CardDescription>
            Generate structured data for rich results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">💎</div>
            <p>Plugin is inactive. Enable it to generate rich snippets.</p>
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
            💎 Rich Snippet Plugin
            <Badge variant="default">Active</Badge>
          </CardTitle>
          <CardDescription>
            Generate structured data for rich search results
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>⚙️ Snippet Configuration</CardTitle>
          <CardDescription>Enable/disable different snippet types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="enableArticle"
                checked={snippetConfig.enableArticle}
                onCheckedChange={(checked) => updateConfig('enableArticle', checked)}
              />
              <Label htmlFor="enableArticle">Article Snippets</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enableProduct"
                checked={snippetConfig.enableProduct}
                onCheckedChange={(checked) => updateConfig('enableProduct', checked)}
              />
              <Label htmlFor="enableProduct">Product Snippets</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enableLocalBusiness"
                checked={snippetConfig.enableLocalBusiness}
                onCheckedChange={(checked) => updateConfig('enableLocalBusiness', checked)}
              />
              <Label htmlFor="enableLocalBusiness">Local Business Snippets</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enableOrganization"
                checked={snippetConfig.enableOrganization}
                onCheckedChange={(checked) => updateConfig('enableOrganization', checked)}
              />
              <Label htmlFor="enableOrganization">Organization Snippets</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Snippet Editors */}
      <Tabs defaultValue="article" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="article">Article</TabsTrigger>
          <TabsTrigger value="product">Product</TabsTrigger>
          <TabsTrigger value="local">Local Business</TabsTrigger>
        </TabsList>

        <TabsContent value="article">
          <Card>
            <CardHeader>
              <CardTitle>📝 Article Snippet</CardTitle>
              <CardDescription>Configure structured data for articles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="articleHeadline">Headline</Label>
                <Input
                  id="articleHeadline"
                  value={articleData.headline}
                  onChange={(e) => updateArticleData('headline', e.target.value)}
                  placeholder="Article headline"
                />
              </div>

              <div>
                <Label htmlFor="articleImage">Image URL</Label>
                <Input
                  id="articleImage"
                  value={articleData.image}
                  onChange={(e) => updateArticleData('image', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="articleDatePublished">Date Published</Label>
                  <Input
                    id="articleDatePublished"
                    type="date"
                    value={articleData.datePublished}
                    onChange={(e) => updateArticleData('datePublished', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="articleDateModified">Date Modified</Label>
                  <Input
                    id="articleDateModified"
                    type="date"
                    value={articleData.dateModified}
                    onChange={(e) => updateArticleData('dateModified', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="articleAuthor">Author</Label>
                  <Input
                    id="articleAuthor"
                    value={articleData.author}
                    onChange={(e) => updateArticleData('author', e.target.value)}
                    placeholder="Author name"
                  />
                </div>

                <div>
                  <Label htmlFor="articlePublisher">Publisher</Label>
                  <Input
                    id="articlePublisher"
                    value={articleData.publisher}
                    onChange={(e) => updateArticleData('publisher', e.target.value)}
                    placeholder="Publisher name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="articleDescription">Description</Label>
                <Textarea
                  id="articleDescription"
                  value={articleData.description}
                  onChange={(e) => updateArticleData('description', e.target.value)}
                  placeholder="Article description"
                  rows={3}
                />
              </div>

              <Button onClick={generateArticleSnippet} className="w-full">
                Generate Article Snippet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="product">
          <Card>
            <CardHeader>
              <CardTitle>🛍️ Product Snippet</CardTitle>
              <CardDescription>Configure structured data for products</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  value={productData.name}
                  onChange={(e) => updateProductData('name', e.target.value)}
                  placeholder="Product name"
                />
              </div>

              <div>
                <Label htmlFor="productDescription">Description</Label>
                <Textarea
                  id="productDescription"
                  value={productData.description}
                  onChange={(e) => updateProductData('description', e.target.value)}
                  placeholder="Product description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="productBrand">Brand</Label>
                  <Input
                    id="productBrand"
                    value={productData.brand}
                    onChange={(e) => updateProductData('brand', e.target.value)}
                    placeholder="Brand name"
                  />
                </div>

                <div>
                  <Label htmlFor="productSku">SKU</Label>
                  <Input
                    id="productSku"
                    value={productData.sku}
                    onChange={(e) => updateProductData('sku', e.target.value)}
                    placeholder="Product SKU"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="productPrice">Price</Label>
                  <Input
                    id="productPrice"
                    type="number"
                    step="0.01"
                    value={productData.price}
                    onChange={(e) => updateProductData('price', parseFloat(e.target.value))}
                    placeholder="29.99"
                  />
                </div>

                <div>
                  <Label htmlFor="productCurrency">Currency</Label>
                  <Input
                    id="productCurrency"
                    value={productData.priceCurrency}
                    onChange={(e) => updateProductData('priceCurrency', e.target.value)}
                    placeholder="USD"
                  />
                </div>

                <div>
                  <Label htmlFor="productAvailability">Availability</Label>
                  <select
                    id="productAvailability"
                    value={productData.availability}
                    onChange={(e) => updateProductData('availability', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="InStock">In Stock</option>
                    <option value="OutOfStock">Out of Stock</option>
                    <option value="PreOrder">Pre Order</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="productRating">Rating Value</Label>
                  <Input
                    id="productRating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={productData.ratingValue}
                    onChange={(e) => updateProductData('ratingValue', parseFloat(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="productReviews">Review Count</Label>
                  <Input
                    id="productReviews"
                    type="number"
                    min="0"
                    value={productData.reviewCount}
                    onChange={(e) => updateProductData('reviewCount', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <Button onClick={generateProductSnippet} className="w-full">
                Generate Product Snippet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="local">
          <Card>
            <CardHeader>
              <CardTitle>🏪 Local Business Snippet</CardTitle>
              <CardDescription>Configure structured data for local businesses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={localBusinessData.name}
                  onChange={(e) => updateLocalBusinessData('name', e.target.value)}
                  placeholder="Business name"
                />
              </div>

              <div>
                <Label htmlFor="businessTelephone">Telephone</Label>
                <Input
                  id="businessTelephone"
                  value={localBusinessData.telephone}
                  onChange={(e) => updateLocalBusinessData('telephone', e.target.value)}
                  placeholder="+1-555-0123"
                />
              </div>

              <div>
                <Label htmlFor="businessPriceRange">Price Range</Label>
                <Input
                  id="businessPriceRange"
                  value={localBusinessData.priceRange}
                  onChange={(e) => updateLocalBusinessData('priceRange', e.target.value)}
                  placeholder="$$"
                />
              </div>

              <div>
                <Label>Address</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Street Address"
                    value={localBusinessData.address.streetAddress}
                    onChange={(e) => updateLocalBusinessData('address', {
                      ...localBusinessData.address,
                      streetAddress: e.target.value
                    })}
                  />
                  <Input
                    placeholder="City"
                    value={localBusinessData.address.addressLocality}
                    onChange={(e) => updateLocalBusinessData('address', {
                      ...localBusinessData.address,
                      addressLocality: e.target.value
                    })}
                  />
                  <Input
                    placeholder="State/Region"
                    value={localBusinessData.address.addressRegion}
                    onChange={(e) => updateLocalBusinessData('address', {
                      ...localBusinessData.address,
                      addressRegion: e.target.value
                    })}
                  />
                  <Input
                    placeholder="Postal Code"
                    value={localBusinessData.address.postalCode}
                    onChange={(e) => updateLocalBusinessData('address', {
                      ...localBusinessData.address,
                      postalCode: e.target.value
                    })}
                  />
                </div>
              </div>

              <div>
                <Label>Coordinates</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Latitude"
                    type="number"
                    step="0.000001"
                    value={localBusinessData.geo.latitude}
                    onChange={(e) => updateLocalBusinessData('geo', {
                      ...localBusinessData.geo,
                      latitude: parseFloat(e.target.value)
                    })}
                  />
                  <Input
                    placeholder="Longitude"
                    type="number"
                    step="0.000001"
                    value={localBusinessData.geo.longitude}
                    onChange={(e) => updateLocalBusinessData('geo', {
                      ...localBusinessData.geo,
                      longitude: parseFloat(e.target.value)
                    })}
                  />
                </div>
              </div>

              <Button onClick={generateLocalBusinessSnippet} className="w-full">
                Generate Local Business Snippet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generated Snippets */}
      {Object.keys(generatedSnippets).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🏗️ Generated Structured Data</CardTitle>
            <CardDescription>Copy this JSON-LD to your HTML head section</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={Object.keys(generatedSnippets)[0]} className="w-full">
              <TabsList>
                {Object.keys(generatedSnippets).map(key => (
                  <TabsTrigger key={key} value={key}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {Object.entries(generatedSnippets).map(([key, snippet]) => (
                <TabsContent key={key} value={key}>
                  <Textarea
                    value={`<script type="application/ld+json">
${snippet}
</script>`}
                    readOnly
                    rows={15}
                    className="font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => navigator.clipboard.writeText(
                      `<script type="application/ld+json">
${snippet}
</script>`
                    )}
                    className="mt-4"
                  >
                    Copy to Clipboard
                  </Button>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}