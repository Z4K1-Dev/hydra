# Hydra Platform - Development Plan

## Project Overview

Hydra Platform adalah platform website builder berbasis SaaS dengan fokus Modular Architecture, menggunakan arsitektur multi-tenant dan sistem plugin modular. Platform ini memungkinkan pengguna untuk membuat website dengan memilih plugin yang sesuai kebutuhan mereka.

## Tech Stack

### Frontend
- **Next.js 15** dengan App Router
- **TypeScript** untuk type safety
- **Tailwind CSS** untuk styling
- **shadcn/ui** untuk component library
- **Zustand** untuk state management
- **tRPC** untuk type-safe API calls
- **Zod** untuk validation schema

### Backend
- **Next.js API Routes** dengan tRPC
- **tRPC** untuk end-to-end type safety
- **Prisma** sebagai ORM
- **MariaDB/MySQL** sebagai database
- **Auth.js** (formerly NextAuth.js) untuk authentication
- **JWT** untuk session management

### Infrastructure
- **Single database** dengan table-level isolation
- **Connection pooling** untuk performance optimization
- **File storage** dengan tenant-based access control
- **Theme system** dengan Light/Dark mode (default: Dark)

## Architecture Overview

### 1. Multi-tenant Architecture
- **Table-level isolation** menggunakan `tenant_id` di setiap tabel
- **Single database** untuk semua tenant
- **Tenant context** untuk scoped operations
- **Resource quota management** per tenant

### 2. Plugin System
- **hooks system** (actions & filters)
- **Priority system** untuk eksekusi terkontrol
- **Dynamic plugin loading** berdasarkan konfigurasi prioritas

### 3. Component System
- **Modular components** untuk website builder
- **JSON-based content storage**
- **Responsive design** dengan breakpoint management
- **Component library** yang extensible

### 4. Theme System
- **Light/Dark theme support** (default: Dark)
- **Customizable themes** per tenant
- **Theme variables** untuk consistency
- **Theme switching** di runtime

## Database Schema

### Core Tables
```sql
-- Tenants
tenants (id, name, domain, status, plan, settings, created_at, updated_at)

-- Users
users (id, tenant_id, email, password_hash, role, last_login, created_at, updated_at)

-- Websites
websites (id, tenant_id, name, slug, domain, status, settings, created_at, updated_at)

-- Pages
pages (id, tenant_id, website_id, name, slug, content, seo_data, status, published_at, created_at, updated_at)

-- Templates
templates (id, name, category, description, preview_url, template_data, required_plan, is_active, created_at, updated_at)

-- Tenant Templates
tenant_templates (id, tenant_id, template_id, installed_at)

-- Assets
assets (id, tenant_id, filename, original_name, mime_type, size, path, url, uploaded_by, created_at)

-- Tenant Plugins
tenant_plugins (id, tenant_id, plugin_id, is_active, settings, installed_at, updated_at)
```

## Development Phases

### Phase 1: Foundation (Days 1-2)
**Goal: Setup core infrastructure and basic functionality**

#### 1.1 Project Setup
- [ ] Initialize Next.js 15 project with TypeScript
- [ ] Configure Tailwind CSS and shadcn/ui
- [ ] Setup tRPC and Zod integration
- [ ] Configure Prisma with MariaDB/MySQL
- [ ] Setup ESLint and Prettier

#### 1.2 Database Setup
- [ ] Create database schema with migrations
- [ ] Setup Prisma client
- [ ] Configure database connection pooling
- [ ] Create seed data for testing

#### 1.3 Authentication System
- [ ] Setup Auth.js with JWT
- [ ] Create user registration/login system
- [ ] Implement tenant context middleware
- [ ] Create role-based access control

#### 1.4 Theme System
- [ ] Implement theme context provider
- [ ] Create Light and Dark themes
- [ ] Setup theme switching functionality
- [ ] Create theme variables and CSS custom properties

### Phase 2: Core Features (Days 2-3)
**Goal: Implement multi-tenant management and basic content management**

#### 2.1 Multi-tenant Setup
- [ ] Implement tenant context class
- [ ] Create tenant registration system
- [ ] Setup tenant-scoped database operations
- [ ] Implement resource quota management

#### 2.2 User Management
- [ ] Create user CRUD operations
- [ ] Implement tenant-user association
- [ ] Create user management interface
- [ ] Setup user permissions and roles

#### 2.3 Template System
- [ ] Create template storage system
- [ ] Implement template installation process
- [ ] Create template validation logic
- [ ] Build template preview system

#### 2.4 Basic Page Builder
- [ ] Create page CRUD operations
- [ ] Implement basic component system
- [ ] Build page editor interface
- [ ] Create page preview functionality

### Phase 3: Advanced Features (Day 4)
**Goal: Implement plugin system**

#### 3.1 Plugin System Architecture
- [ ] Create hook system implementation
- [ ] Define SEO-specific hooks
- [ ] Implement plugin lifecycle management
- [ ] Create plugin configuration system

#### 3.2 SEO Features
- [ ] Implement meta tag management
- [ ] Create Open Graph and Twitter Cards support
- [ ] Build structured data system
- [ ] Implement sitemap generation

#### 3.3 Core SEO Plugins
- [ ] Google Analytics plugin
- [ ] SEO Tools plugin (meta optimization)
- [ ] Rich Snippet plugin
- [ ] Sitemap Generator plugin

#### 3.4 Plugin Management
- [ ] Create plugin marketplace interface
- [ ] Implement plugin activation/deactivation
- [ ] Build plugin configuration UI
- [ ] Create plugin dependency management

## Plugin System Details

### Hook Types
```typescript
// Action Hooks (for events)
'before_page_render'
'after_page_render'
'page_view_tracked'
'seo_score_calculated'

// Filter Hooks (for data modification)
'page_title'
'page_meta_description'
'page_meta_keywords'
'page_og_data'
'page_structured_data'
'content_before_render'
'page_content'
'sitemap_urls'
```

### Plugin Structure
```typescript
interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  category: 'seo' | 'analytics' | 'marketing' | 'utility';
  requiredPlan: 'free' | 'starter' | 'professional' | 'business';
  dependencies: string[];
  settings: Record<string, any>;
  hooks: {
    actions: string[];
    filters: string[];
  };
}
```

### Hook System Implementation
```typescript
class HookSystem {
  // Action methods
  addAction(name: string, callback: Function, priority?: number): void;
  doAction(name: string, ...args: any[]): void;
  
  // Filter methods
  addFilter(name: string, callback: Function, priority?: number): void;
  applyFilters(name: string, value: any, ...args: any[]): any;
  
  // Utility methods
  removeAction(name: string, callback: Function): void;
  removeFilter(name: string, callback: Function): void;
  hasHook(name: string): boolean;
}
```

## Business Model

### Subscription Plans
1. **Free Plan**
   - Single page website
   - Custom domain support (via NS)
   - Basic SEO features
   - 1 website limit

2. **Starter Plan - $3/bulan**
   - Multi-page website (up to 10 pages)
   - Blog functionality
   - All SEO plugins active
   - SSL included
   - Free domain with yearly subscription

3. **Professional Plan - $12/bulan**
   - Unlimited pages
   - Advanced SEO tools
   - Custom integrations (API access)
   - Priority support
   - Team collaboration (3 users)

4. **Business Plan - $29/bulan**
   - All Professional features
   - Advanced analytics
   - White-label ready
   - Phone support
   - Custom branding options

### White Label Options
1. **White Label Basic - $149/bulan**
   - 10 websites
   - Full white-label (your branding)
   - Custom domain for dashboard
   - Reseller pricing structure

2. **White Label Pro - $299/bulan**
   - 25 websites
   - Custom feature requests
   - API access for integrations
   - Training for your team

## Security Considerations

### Data Isolation
- **Tenant ID filtering** di setiap database query
- **Row-level security** untuk data access
- **File system isolation** untuk asset storage
- **Session-based tenant context**

### Authentication & Authorization
- **JWT-based authentication**
- **Role-based access control**
- **Tenant-scoped sessions**
- **API rate limiting**

### Data Validation
- **Zod schemas** untuk input validation
- **Prisma-level validation**
- **File upload validation**
- **SQL injection prevention**

## Performance Optimization

### Database Optimization
- **Connection pooling** untuk efisiensi koneksi
- **Proper indexing** untuk query performance
- **Query optimization** dengan selective loading
- **Database caching** untuk frequent queries

### Frontend Optimization
- **Dynamic imports** untuk code splitting
- **Lazy loading** untuk components
- **Image optimization** dengan Next.js Image
- **Bundle analysis** untuk size optimization

### Caching Strategy
- **Redis caching** untuk frequent data
- **CDN integration** untuk static assets
- **Browser caching** untuk improved UX
- **API response caching** untuk reduced load

## Deployment Strategy

### Development Environment
- **Local development** dengan Docker
- **Database migrations** dengan Prisma
- **Hot reloading** untuk development speed
- **Local asset storage** untuk testing

### Production Deployment
- **Cloud hosting** (AWS/GCP/Azure)
- **Container orchestration** dengan Kubernetes
- **Database clustering** untuk high availability
- **CDN integration** untuk global performance

### Monitoring & Logging
- **Application monitoring** dengan Sentry
- **Performance monitoring** dengan New Relic
- **Database monitoring** dengan native tools
- **Log aggregation** dengan ELK stack

## Prioritas Development (Revised)

### Priority 1: Admin Panel Themes 
**Mengapa ini dulu?**
- Visual feedback cepat untuk user
- Bisa jadi foundation untuk UI consistency
- Theme system akan digunakan di semua bagian

#### Implementation Plan:
```typescript
// Theme System Structure
interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  components: {
    button: ComponentStyle;
    card: ComponentStyle;
    input: ComponentStyle;
  };
}

// Theme Context Implementation
import { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true); // Default: Dark theme
  const [theme, setThemeState] = useState<Theme>(defaultDarkTheme);

  const toggleTheme = () => {
    setIsDark(!isDark);
    setThemeState(isDark ? defaultLightTheme : defaultDarkTheme);
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
      setThemeState(savedTheme === 'dark' ? defaultDarkTheme : defaultLightTheme);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Default Themes
const defaultDarkTheme: Theme = {
  id: 'dark',
  name: 'Dark Theme',
  colors: {
    primary: '#3b82f6',
    secondary: '#64748b',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
    },
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
  },
  components: {
    button: {
      padding: '0.5rem 1rem',
      borderRadius: '0.375rem',
      fontWeight: '500',
    },
    card: {
      padding: '1.5rem',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    input: {
      padding: '0.5rem',
      borderRadius: '0.375rem',
      border: '1px solid #374151',
    },
  },
};

const defaultLightTheme: Theme = {
  id: 'light',
  name: 'Light Theme',
  colors: {
    primary: '#2563eb',
    secondary: '#6b7280',
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#111827',
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
    },
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
  },
  components: {
    button: {
      padding: '0.5rem 1rem',
      borderRadius: '0.375rem',
      fontWeight: '500',
    },
    card: {
      padding: '1.5rem',
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    },
    input: {
      padding: '0.5rem',
      borderRadius: '0.375rem',
      border: '1px solid #d1d5db',
    },
  },
};
```

### Priority 2: Multi-tenant Setup
**Mengapa ini penting?**
- Foundation untuk seluruh sistem
- Security dan data isolation
- Scalability untuk banyak user

#### Implementation Plan:
```typescript
// Multi-tenant Architecture
class MultiTenantManager {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createTenant(data: {
    name: string;
    domain?: string;
    plan: 'free' | 'starter' | 'professional' | 'business';
    adminEmail: string;
    adminPassword: string;
  }) {
    const { name, domain, plan, adminEmail, adminPassword } = data;

    // Create tenant
    const tenant = await this.prisma.tenant.create({
      data: {
        name,
        domain,
        plan,
        settings: {},
      },
    });

    // Create admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminUser = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: adminEmail,
        passwordHash: hashedPassword,
        role: 'admin',
      },
    });

    return { tenant, adminUser };
  }

  async getTenantContext(tenantId: string) {
    return new TenantContext(tenantId, this.prisma);
  }

  async validateTenantAccess(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: tenantId,
      },
    });

    return !!user;
  }

  async checkResourceLimit(tenantId: string, resource: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const limits = this.getPlanLimits(tenant.plan);
    const usage = await this.getResourceUsage(tenantId);

    switch (resource) {
      case 'websites':
        return usage.websites < limits.maxWebsites;
      case 'pages':
        return usage.pages < limits.maxPages;
      case 'storage':
        return usage.storage < limits.maxStorage;
      case 'users':
        return usage.users < limits.maxUsers;
      default:
        return false;
    }
  }

  private getPlanLimits(plan: string) {
    const limits = {
      free: {
        maxWebsites: 1,
        maxPages: 1,
        maxStorage: 100 * 1024 * 1024, // 100MB
        maxUsers: 1,
      },
      starter: {
        maxWebsites: 3,
        maxPages: 10,
        maxStorage: 1024 * 1024 * 1024, // 1GB
        maxUsers: 3,
      },
      professional: {
        maxWebsites: 10,
        maxPages: 100,
        maxStorage: 10 * 1024 * 1024 * 1024, // 10GB
        maxUsers: 5,
      },
      business: {
        maxWebsites: 50,
        maxPages: 1000,
        maxStorage: 100 * 1024 * 1024 * 1024, // 100GB
        maxUsers: 20,
      },
    };

    return limits[plan as keyof typeof limits] || limits.free;
  }

  private async getResourceUsage(tenantId: string) {
    const [websites, pages, assets, users] = await Promise.all([
      this.prisma.website.count({ where: { tenantId } }),
      this.prisma.page.count({ where: { tenantId } }),
      this.prisma.asset.aggregate({
        where: { tenantId },
        _sum: { size: true },
      }),
      this.prisma.user.count({ where: { tenantId } }),
    ]);

    return {
      websites,
      pages,
      storage: assets._sum.size || 0,
      users,
    };
  }
}

// Tenant Context for Scoped Operations
class TenantContext {
  constructor(
    private tenantId: string,
    private prisma: PrismaClient
  ) {}

  async getWebsites() {
    return this.prisma.website.findMany({
      where: { tenantId: this.tenantId },
      include: {
        _count: {
          select: { pages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createWebsite(data: { name: string; slug: string }) {
    return this.prisma.website.create({
      data: {
        ...data,
        tenantId: this.tenantId,
      },
    });
  }

  async getPages(websiteId?: string) {
    return this.prisma.page.findMany({
      where: {
        tenantId: this.tenantId,
        ...(websiteId && { websiteId }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPage(data: {
    websiteId: string;
    name: string;
    slug: string;
    content: any;
  }) {
    return this.prisma.page.create({
      data: {
        ...data,
        tenantId: this.tenantId,
      },
    });
  }

  async getAssets() {
    return this.prisma.asset.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async uploadAsset(data: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
    url: string;
    uploadedBy: string;
  }) {
    return this.prisma.asset.create({
      data: {
        ...data,
        tenantId: this.tenantId,
      },
    });
  }

  async getTenantInfo() {
    return this.prisma.tenant.findUnique({
      where: { id: this.tenantId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
        websites: true,
        _count: {
          select: {
            users: true,
            websites: true,
            pages: true,
            assets: true,
          },
        },
      },
    });
  }
}
```

### Priority 3: User Management
#### Implementation Plan:
```typescript
// User Management with Auth.js
import { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import { prisma } from "~/lib/prisma";
import { MultiTenantManager } from "~/lib/multi-tenant";

export const authOptions: NextAuthOptions = {
  providers: [
    // Email/password provider
    {
      id: "credentials",
      name: "Credentials",
      type: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            tenant: true,
          },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
        };
      },
    },
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.tenantId = user.tenantId;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.tenantId = token.tenantId as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
  },
};

// User Management Service
class UserService {
  private tenantManager: MultiTenantManager;

  constructor(tenantManager: MultiTenantManager) {
    this.tenantManager = tenantManager;
  }

  async createUser(data: {
    email: string;
    password: string;
    role: 'admin' | 'editor' | 'user';
    tenantId: string;
  }) {
    const { email, password, role, tenantId } = data;

    // Check if user already exists in tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        tenantId,
      },
    });

    if (existingUser) {
      throw new Error('User already exists in this tenant');
    }

    // Check resource limit
    const canCreateUser = await this.tenantManager.checkResourceLimit(tenantId, 'users');
    if (!canCreateUser) {
      throw new Error('User limit reached for this tenant');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role,
        tenantId,
      },
    });
  }

  async getUsers(tenantId: string) {
    return prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        role: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUser(userId: string, data: {
    email?: string;
    role?: 'admin' | 'editor' | 'user';
    password?: string;
  }) {
    const updateData: any = { ...data };

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
      delete updateData.password;
    }

    return prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  async deleteUser(userId: string) {
    return prisma.user.delete({
      where: { id: userId },
    });
  }
}
```

### Priority 4: Template System
#### Implementation Plan:
```typescript
// Template System
interface Template {
  id: string;
  name: string;
  category: 'landing' | 'blog' | 'business' | 'portfolio';
  description: string;
  previewUrl: string;
  templateData: {
    pages: TemplatePage[];
    globalSettings: GlobalSettings;
    components: ComponentDefinition[];
  };
  requiredPlan: 'free' | 'starter' | 'professional';
}

interface TemplatePage {
  name: string;
  slug: string;
  components: Component[];
}

interface GlobalSettings {
  colors: string[];
  fonts: string[];
  spacing: Record<string, string>;
}

interface ComponentDefinition {
  type: string;
  name: string;
  props: Record<string, any>;
  defaultProps: Record<string, any>;
  category: string;
}

class TemplateManager {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async installTemplate(templateId: string, tenantId: string) {
    // Get template
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Check if tenant can use this template
    if (template.requiredPlan !== 'free') {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant || tenant.plan !== template.requiredPlan) {
        throw new Error('Template not available for current plan');
      }
    }

    // Install template to tenant
    const templateData = template.templateData as any;
    
    // Create website from template
    const website = await this.prisma.website.create({
      data: {
        tenantId,
        name: template.name,
        slug: template.name.toLowerCase().replace(/\s+/g, '-'),
        settings: templateData.globalSettings,
      },
    });

    // Create pages from template
    for (const pageData of templateData.pages) {
      await this.prisma.page.create({
        data: {
          tenantId,
          websiteId: website.id,
          name: pageData.name,
          slug: pageData.slug,
          content: pageData.components,
          status: 'published',
        },
      });
    }

    // Record template installation
    await this.prisma.tenantTemplate.create({
      data: {
        tenantId,
        templateId,
      },
    });

    return { website, template };
  }

  async getTemplates(tenantPlan: string) {
    return this.prisma.template.findMany({
      where: {
        isActive: true,
        requiredPlan: {
          in: ['free', tenantPlan],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInstalledTemplates(tenantId: string) {
    return this.prisma.tenantTemplate.findMany({
      where: { tenantId },
      include: {
        template: true,
      },
    });
  }

  async validateTemplate(template: Template) {
    const errors: string[] = [];

    // Validate template structure
    if (!template.name || template.name.trim() === '') {
      errors.push('Template name is required');
    }

    if (!template.category || !['landing', 'blog', 'business', 'portfolio'].includes(template.category)) {
      errors.push('Invalid template category');
    }

    if (!template.templateData.pages || template.templateData.pages.length === 0) {
      errors.push('Template must have at least one page');
    }

    // Validate pages
    for (const page of template.templateData.pages) {
      if (!page.name || page.name.trim() === '') {
        errors.push(`Page name is required for page: ${page.name || 'unnamed'}`);
      }

      if (!page.slug || page.slug.trim() === '') {
        errors.push(`Page slug is required for page: ${page.name}`);
      }

      if (!page.components || !Array.isArray(page.components)) {
        errors.push(`Page components must be an array for page: ${page.name}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
```

### Priority 5: Basic Page Builder
#### Implementation Plan:
```typescript
// Basic Page Builder
interface PageBuilderProps {
  tenantId: string;
  pageId?: string;
  templateId?: string;
}

interface Component {
  id: string;
  type: string;
  props: Record<string, any>;
  styles: Record<string, any>;
  children: Component[];
}

class PageBuilder {
  private tenantContext: TenantContext;

  constructor(tenantContext: TenantContext) {
    this.tenantContext = tenantContext;
  }

  async createPage(data: {
    websiteId: string;
    name: string;
    slug: string;
    content?: Component[];
  }) {
    const { websiteId, name, slug, content = [] } = data;

    return this.tenantContext.createPage({
      websiteId,
      name,
      slug,
      content,
    });
  }

  async updatePage(pageId: string, updates: {
    name?: string;
    slug?: string;
    content?: Component[];
    seoData?: any;
  }) {
    return prisma.page.update({
      where: { id: pageId },
      data: updates,
    });
  }

  async publishPage(pageId: string) {
    return prisma.page.update({
      where: { id: pageId },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
    });
  }

  async unpublishPage(pageId: string) {
    return prisma.page.update({
      where: { id: pageId },
      data: {
        status: 'draft',
        publishedAt: null,
      },
    });
  }

  async deletePage(pageId: string) {
    return prisma.page.delete({
      where: { id: pageId },
    });
  }

  async duplicatePage(pageId: string, newName?: string) {
    const originalPage = await prisma.page.findUnique({
      where: { id: pageId },
    });

    if (!originalPage) {
      throw new Error('Page not found');
    }

    const newName = newName || `${originalPage.name} (Copy)`;
    const newSlug = `${originalPage.slug}-copy`;

    return prisma.page.create({
      data: {
        tenantId: originalPage.tenantId,
        websiteId: originalPage.websiteId,
        name: newName,
        slug: newSlug,
        content: originalPage.content,
        seoData: originalPage.seoData,
        status: 'draft',
      },
    });
  }

  // Component manipulation
  addComponent(pageId: string, component: Component, parentId?: string) {
    // Implementation for adding components to page
  }

  updateComponent(pageId: string, componentId: string, updates: Partial<Component>) {
    // Implementation for updating components
  }

  deleteComponent(pageId: string, componentId: string) {
    // Implementation for deleting components
  }

  moveComponent(pageId: string, componentId: string, newParentId?: string, index?: number) {
    // Implementation for moving components
  }
}

// Component Registry
class ComponentRegistry {
  private components: Map<string, ComponentDefinition> = new Map();

  registerComponent(definition: ComponentDefinition) {
    this.components.set(definition.type, definition);
  }

  getComponent(type: string) {
    return this.components.get(type);
  }

  getAllComponents() {
    return Array.from(this.components.values());
  }

  validateComponent(component: Component) {
    const definition = this.getComponent(component.type);
    if (!definition) {
      throw new Error(`Unknown component type: ${component.type}`);
    }

    // Validate props against definition
    const errors: string[] = [];
    
    for (const [key, value] of Object.entries(definition.defaultProps)) {
      if (component.props[key] === undefined) {
        component.props[key] = value;
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}

// Register core components
const componentRegistry = new ComponentRegistry();

componentRegistry.registerComponent({
  type: 'container',
  name: 'Container',
  category: 'layout',
  props: {
    direction: 'column',
    gap: '1rem',
    padding: '1rem',
  },
  defaultProps: {
    direction: 'column',
    gap: '1rem',
    padding: '1rem',
  },
});

componentRegistry.registerComponent({
  type: 'text',
  name: 'Text',
  category: 'content',
  props: {
    text: '',
    fontSize: '1rem',
    fontWeight: 'normal',
    color: 'inherit',
  },
  defaultProps: {
    text: 'Sample text',
    fontSize: '1rem',
    fontWeight: 'normal',
    color: 'inherit',
  },
});

componentRegistry.registerComponent({
  type: 'image',
  name: 'Image',
  category: 'content',
  props: {
    src: '',
    alt: '',
    width: '100%',
    height: 'auto',
  },
  defaultProps: {
    src: '',
    alt: '',
    width: '100%',
    height: 'auto',
  },
});
```

## Database Schema Revisi (MariaDB/MySQL)

### Core Tables dengan tenant_id
```sql
-- Main Database: zadpress_main

-- Tenants Table
CREATE TABLE tenants (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE,
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  plan ENUM('free', 'starter', 'professional', 'business') DEFAULT 'free',
  settings JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_tenant_status (status),
  INDEX idx_tenant_plan (plan)
);

-- Users Table
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'editor', 'user') DEFAULT 'user',
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY idx_user_email_tenant (email, tenant_id),
  INDEX idx_user_tenant (tenant_id),
  INDEX idx_user_role (role),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Websites Table (per tenant)
CREATE TABLE websites (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  status ENUM('active', 'inactive') DEFAULT 'active',
  settings JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY idx_website_slug_tenant (slug, tenant_id),
  INDEX idx_website_tenant (tenant_id),
  INDEX idx_website_status (status),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Pages Table (per tenant)
CREATE TABLE pages (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  website_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  content JSON NOT NULL,
  seo_data JSON,
  status ENUM('draft', 'published') DEFAULT 'draft',
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY idx_page_slug_website_tenant (slug, website_id, tenant_id),
  INDEX idx_page_tenant (tenant_id),
  INDEX idx_page_website (website_id),
  INDEX idx_page_status (status),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE
);

-- Templates Table (global, tapi bisa di-install per tenant)
CREATE TABLE templates (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  preview_url VARCHAR(255),
  template_data JSON NOT NULL,
  required_plan ENUM('free', 'starter', 'professional') DEFAULT 'free',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_template_category (category),
  INDEX idx_template_plan (required_plan),
  INDEX idx_template_active (is_active)
);

-- Tenant Templates (installed templates per tenant)
CREATE TABLE tenant_templates (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  template_id VARCHAR(36) NOT NULL,
  installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY idx_tenant_template (tenant_id, template_id),
  INDEX idx_tenant_template_tenant (tenant_id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
);

-- Assets/Files Table (per tenant)
CREATE TABLE assets (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size BIGINT NOT NULL,
  path VARCHAR(500) NOT NULL,
  url VARCHAR(500) NOT NULL,
  uploaded_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_asset_tenant (tenant_id),
  INDEX idx_asset_uploaded (uploaded_by),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Plugin Configurations (per tenant)
CREATE TABLE tenant_plugins (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  plugin_id VARCHAR(36) NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  settings JSON,
  installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY idx_tenant_plugin (tenant_id, plugin_id),
  INDEX idx_tenant_plugin_tenant (tenant_id),
  INDEX idx_tenant_plugin_active (is_active),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Performance optimization indexes
CREATE INDEX idx_pages_tenant_status ON pages(tenant_id, status);
CREATE INDEX idx_pages_website_status ON pages(website_id, status);
CREATE INDEX idx_websites_tenant_status ON websites(tenant_id, status);
CREATE INDEX idx_assets_tenant_created ON assets(tenant_id, created_at);
CREATE INDEX idx_users_tenant_role ON users(tenant_id, role);
```

### Prisma Schema Revisi
```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model Tenant {
  id        String   @id @default(cuid())
  name      String
  domain    String?  @unique
  status    TenantStatus @default(ACTIVE)
  plan      Plan     @default(FREE)
  settings  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users     User[]
  websites  Website[]
  assets    Asset[]
  plugins   TenantPlugin[]
  templates TenantTemplate[]

  @@map("tenants")
}

model User {
  id            String     @id @default(cuid())
  tenantId      String
  email         String
  passwordHash  String     @map("password_hash")
  role          UserRole   @default(USER)
  lastLogin     DateTime?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  tenant        Tenant     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  websites      Website[]
  pages         Page[]
  assets        Asset[]

  @@unique([email, tenantId])
  @@map("users")
}

model Website {
  id        String      @id @default(cuid())
  tenantId  String
  name      String
  slug      String
  domain    String?
  status    WebsiteStatus @default(ACTIVE)
  settings  Json?
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  tenant    Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user      User?       @relation(fields: [userId], references: [id])
  userId    String?
  pages     Page[]

  @@unique([slug, tenantId])
  @@map("websites")
}

model Page {
  id          String      @id @default(cuid())
  tenantId    String
  websiteId   String
  name        String
  slug        String
  content     Json
  seoData     Json?       @map("seo_data")
  status      PageStatus  @default(DRAFT)
  publishedAt DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  tenant      Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  website     Website     @relation(fields: [websiteId], references: [id], onDelete: Cascade)
  user        User?       @relation(fields: [userId], references: [id])
  userId      String?

  @@unique([slug, websiteId, tenantId])
  @@map("pages")
}

model Template {
  id            String       @id @default(cuid())
  name          String
  category      String
  description   String?
  previewUrl    String?      @map("preview_url")
  templateData  Json         @map("template_data")
  requiredPlan  Plan         @default(FREE)
  isActive      Boolean      @default(true) @map("is_active")
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  tenants       TenantTemplate[]
  
  @@map("templates")
}

model TenantTemplate {
  id          String   @id @default(cuid())
  tenantId    String
  templateId  String
  installedAt DateTime @default(now()) @map("installed_at")

  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  template    Template @relation(fields: [templateId], references: [id], onDelete: Cascade)

  @@unique([tenantId, templateId])
  @@map("tenant_templates")
}

model Asset {
  id           String   @id @default(cuid())
  tenantId     String
  filename     String
  originalName String   @map("original_name")
  mimeType     String   @map("mime_type")
  size         BigInt
  path         String
  url          String
  uploadedBy   String   @map("uploaded_by")
  createdAt    DateTime @default(now())

  tenant       Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user         User     @relation(fields: [uploadedBy], references: [id])

  @@map("assets")
}

model TenantPlugin {
  id          String   @id @default(cuid())
  tenantId    String
  pluginId    String
  isActive    Boolean  @default(false) @map("is_active")
  settings    Json?
  installedAt DateTime @default(now()) @map("installed_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, pluginId])
  @@map("tenant_plugins")
}

enum TenantStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

enum Plan {
  FREE
  STARTER
  PROFESSIONAL
  BUSINESS
}

enum UserRole {
  ADMIN
  EDITOR
  USER
}

enum WebsiteStatus {
  ACTIVE
  INACTIVE
}

enum PageStatus {
  DRAFT
  PUBLISHED
}
```

## Query Optimization

### Database Connection Pooling
```typescript
// Database connection pooling configuration
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    errorFormat: 'pretty',
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

// Connection pool configuration for production
const connectionPoolConfig = {
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '20'),
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  timezone: '+00:00',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
};

// Custom connection pool for specific operations
class TenantConnectionPool {
  private pools: Map<string, any> = new Map();
  
  async getConnection(tenantId: string) {
    if (!this.pools.has(tenantId)) {
      const mysql = require('mysql2/promise');
      const pool = mysql.createPool({
        ...connectionPoolConfig,
        user: connectionPoolConfig.user, // Using same user for all tenants
        database: connectionPoolConfig.database, // Using same database
      });
      
      this.pools.set(tenantId, pool);
    }
    return this.pools.get(tenantId);
  }
  
  async closeAll() {
    for (const [tenantId, pool] of this.pools) {
      await pool.end();
    }
    this.pools.clear();
  }
}

export const tenantPool = new TenantConnectionPool();
```

### Optimized Queries dengan Proper Indexing
```typescript
// Optimized queries for tenant operations
class TenantQueryOptimizer {
  // Get websites with pages count efficiently
  async getWebsitesWithPageCount(tenantId: string) {
    return prisma.website.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            pages: {
              where: { status: 'PUBLISHED' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Get pages with SEO data efficiently
  async getPagesWithSEO(tenantId: string, websiteId?: string) {
    return prisma.page.findMany({
      where: {
        tenantId,
        ...(websiteId && { websiteId }),
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        name: true,
        slug: true,
        seoData: true,
        publishedAt: true,
        website: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: { publishedAt: 'desc' }
    });
  }

  // Get tenant analytics with optimized queries
  async getTenantAnalytics(tenantId: string) {
    const [websites, pages, assets, users] = await Promise.all([
      prisma.website.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.page.count({ where: { tenantId, status: 'PUBLISHED' } }),
      prisma.asset.aggregate({
        where: { tenantId },
        _sum: { size: true },
        _count: true
      }),
      prisma.user.count({ where: { tenantId } })
    ]);

    return {
      websites,
      publishedPages: pages,
      totalAssets: assets._count,
      storageUsed: assets._sum.size || 0,
      users
    };
  }

  // Get recent activity across all tenant resources
  async getRecentActivity(tenantId: string, limit: number = 10) {
    const [recentPages, recentAssets, recentUsers] = await Promise.all([
      prisma.page.findMany({
        where: { tenantId },
        select: {
          id: true,
          name: true,
          status: true,
          updatedAt: true,
          type: 'page' as const
        },
        orderBy: { updatedAt: 'desc' },
        take: limit
      }),
      prisma.asset.findMany({
        where: { tenantId },
        select: {
          id: true,
          originalName: true,
          createdAt: true,
          type: 'asset' as const
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      }),
      prisma.user.findMany({
        where: { tenantId },
        select: {
          id: true,
          email: true,
          createdAt: true,
          type: 'user' as const
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    ]);

    // Combine and sort all activities
    const allActivities = [
      ...recentPages.map(p => ({ ...p, timestamp: p.updatedAt })),
      ...recentAssets.map(a => ({ ...a, timestamp: a.createdAt })),
      ...recentUsers.map(u => ({ ...u, timestamp: u.createdAt }))
    ];

    return allActivities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Search across tenant content
  async searchTenantContent(tenantId: string, query: string) {
    const searchTerm = `%${query}%`;
    
    const [pages, websites] = await Promise.all([
      prisma.page.findMany({
        where: {
          tenantId,
          OR: [
            { name: { contains: searchTerm } },
            { 
              content: {
                path: '$.components[*].props.text',
                string_contains: searchTerm
              }
            }
          ]
        },
        select: {
          id: true,
          name: true,
          slug: true,
          website: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      prisma.website.findMany({
        where: {
          tenantId,
          OR: [
            { name: { contains: searchTerm } },
            { domain: { contains: searchTerm } }
          ]
        },
        select: {
          id: true,
          name: true,
          slug: true
        }
      })
    ]);

    return { pages, websites };
  }

  // Get resource usage statistics
  async getResourceUsage(tenantId: string) {
    const [storage, pageViews, pluginUsage] = await Promise.all([
      prisma.asset.aggregate({
        where: { tenantId },
        _sum: { size: true },
        _count: true
      }),
      prisma.page.findMany({
        where: { tenantId, status: 'PUBLISHED' },
        select: {
          id: true,
          // In real implementation, you'd have analytics data
          // For now, we'll use page count as proxy
        }
      }),
      prisma.tenantPlugin.findMany({
        where: { 
          tenantId,
          isActive: true 
        },
        select: {
          pluginId: true,
          settings: true
        }
      })
    ]);

    return {
      storage: {
        used: storage._sum.size || 0,
        count: storage._count
      },
      pages: {
        published: pageViews.length
      },
      plugins: {
        active: pluginUsage.length,
        list: pluginUsage
      }
    };
  }
}
```

### Query Optimization dengan Caching
```typescript
// Query caching with Redis
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

class CachedTenantQueries {
  private cachePrefix = 'zadpress:';
  private defaultTTL = 300; // 5 minutes

  private getCacheKey(tenantId: string, operation: string, params: any = '') {
    return `${this.cachePrefix}${tenantId}:${operation}:${JSON.stringify(params)}`;
  }

  async getWebsites(tenantId: string, useCache = true) {
    const cacheKey = this.getCacheKey(tenantId, 'websites');
    
    if (useCache) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const websites = await prisma.website.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { pages: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (useCache) {
      await redis.setex(cacheKey, this.defaultTTL, JSON.stringify(websites));
    }

    return websites;
  }

  async invalidateTenantCache(tenantId: string) {
    const keys = await redis.keys(`${this.cachePrefix}${tenantId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  async getTemplates(tenantPlan: string, useCache = true) {
    const cacheKey = this.getCacheKey('global', 'templates', { plan: tenantPlan });
    
    if (useCache) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const templates = await prisma.template.findMany({
      where: {
        isActive: true,
        requiredPlan: {
          in: ['free', tenantPlan]
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (useCache) {
      await redis.setex(cacheKey, this.defaultTTL, JSON.stringify(templates));
    }

    return templates;
  }

  async getAnalytics(tenantId: string, useCache = true) {
    const cacheKey = this.getCacheKey(tenantId, 'analytics');
    
    if (useCache) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const analytics = await prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM websites WHERE tenant_id = ${tenantId} AND status = 'ACTIVE') as websites,
        (SELECT COUNT(*) FROM pages WHERE tenant_id = ${tenantId} AND status = 'PUBLISHED') as pages,
        (SELECT COUNT(*) FROM assets WHERE tenant_id = ${tenantId}) as assets,
        (SELECT COALESCE(SUM(size), 0) FROM assets WHERE tenant_id = ${tenantId}) as storage_used,
        (SELECT COUNT(*) FROM users WHERE tenant_id = ${tenantId}) as users
    ` as Array<{
      websites: number;
      pages: number;
      assets: number;
      storage_used: bigint;
      users: number;
    }>;

    const result = analytics[0];

    if (useCache) {
      await redis.setex(cacheKey, 60, JSON.stringify(result)); // Cache for 1 minute
    }

    return result;
  }
}

export const cachedQueries = new CachedTenantQueries();
```

### Batch Operations untuk Performance
```typescript
// Batch operations for better performance
class BatchOperations {
  // Batch create pages
  async batchCreatePages(tenantId: string, websiteId: string, pages: Array<{
    name: string;
    slug: string;
    content: any;
  }>) {
    const pageData = pages.map(page => ({
      tenantId,
      websiteId,
      name: page.name,
      slug: page.slug,
      content: page.content,
      status: 'draft' as const
    }));

    return prisma.page.createMany({
      data: pageData
    });
  }

  // Batch update pages
  async batchUpdatePages(pageIds: string[], updates: Partial<{
    name: string;
    slug: string;
    content: any;
    seoData: any;
    status: 'draft' | 'published';
  }>) {
    return prisma.page.updateMany({
      where: {
        id: {
          in: pageIds
        }
      },
      data: updates
    });
  }

  // Batch delete pages
  async batchDeletePages(pageIds: string[]) {
    return prisma.page.deleteMany({
      where: {
        id: {
          in: pageIds
        }
      }
    });
  }

  // Batch asset operations
  async batchCreateAssets(tenantId: string, assets: Array<{
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
    url: string;
    uploadedBy: string;
  }>) {
    const assetData = assets.map(asset => ({
      tenantId,
      ...asset
    }));

    return prisma.asset.createMany({
      data: assetData
    });
  }

  // Get multiple resources in single query
  async getTenantResources(tenantId: string) {
    const [websites, pages, assets, templates] = await Promise.all([
      prisma.website.findMany({
        where: { tenantId },
        select: { id: true, name: true, slug: true }
      }),
      prisma.page.findMany({
        where: { tenantId },
        select: { id: true, name: true, slug: true, websiteId: true }
      }),
      prisma.asset.findMany({
        where: { tenantId },
        select: { id: true, filename: true, url: true }
      }),
      prisma.tenantTemplate.findMany({
        where: { tenantId },
        include: {
          template: {
            select: { id: true, name: true, category: true }
          }
        }
      })
    ]);

    return { websites, pages, assets, templates };
  }
}

export const batchOps = new BatchOperations();
```

## Success Metrics

### Technical Metrics
- **Page load time** < 2 seconds
- **Database query time** < 100ms
- **API response time** < 200ms
- **Uptime** 99.9%
- **Connection pool efficiency** > 80%
- **Cache hit rate** > 70%

### Business Metrics
- **User acquisition** cost
- **Customer lifetime** value
- **Monthly recurring** revenue
- **Churn rate** < 5%
- **Plugin activation** rate > 60%
- **Template usage** statistics

### User Experience Metrics
- **Time to first** website < 10 minutes
- **Plugin activation** rate
- **Template usage** statistics
- **Support ticket** resolution time < 24 hours

## Risk Assessment

### Technical Risks
- **Database scalability** with multi-tenant architecture
- **Plugin compatibility** issues
- **Performance degradation** with many plugins
- **Security vulnerabilities** in plugin system

### Business Risks
- **Market competition** from established players
- **Customer acquisition** costs
- **Technical debt** accumulation
- **Regulatory compliance** requirements

### Mitigation Strategies
- **Regular performance** testing
- **Plugin review** process
- **Code quality** standards
- **Security audits** and penetration testing

## Future Roadmap

### Short-term (3-6 months)
- [ ] Real-time collaboration features
- [ ] Advanced analytics dashboard
- [ ] More template options
- [ ] Additional SEO plugins

### Medium-term (6-12 months)
- [ ] Mobile app development
- [ ] AI-powered content optimization
- [ ] Advanced integrations (CRM, Email marketing)
- [ ] Enterprise features

### Long-term (12+ months)
- [ ] Global expansion
- [ ] API marketplace
- [ ] Machine learning features
- [ ] Industry-specific templates

## Conclusion

Hydra Platform aims to become the leading website builder platform with a modular plugin system. The architecture is designed for scalability, security, and performance while maintaining flexibility for future enhancements. The development plan focuses on delivering a minimum viable product quickly while building a solid foundation for future growth.

The combination of modern technologies (Next.js, tRPC, Prisma) with a business model and white-label opportunities positions Hydra Platform for success in the competitive website builder market.