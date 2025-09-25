// Permission types and constants
import * as crypto from 'crypto';
export enum Permission {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  EXECUTE = 'execute',
  ADMIN = 'admin',
  CONFIGURE = 'configure',
  MONITOR = 'monitor',
  AUDIT = 'audit',
}

export enum Role {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
  GUEST = 'guest',
  DEVELOPER = 'developer',
  OPERATOR = 'operator',
}

export enum ResourceType {
  PLUGIN = 'plugin',
  CONFIG = 'config',
  DATABASE = 'database',
  API = 'api',
  FILE = 'file',
  NETWORK = 'network',
  SYSTEM = 'system',
}

// User interface
export interface User {
  id: string;
  username: string;
  email: string;
  roles: Role[];
  permissions: Permission[];
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

// Permission interface
export interface PermissionEntry {
  id: string;
  resourceType: ResourceType;
  resourceId: string;
  permission: Permission;
  grantedTo: string; // User ID or Role name
  grantedBy: string; // User ID of granter
  grantedAt: Date;
  expiresAt?: Date;
  reason?: string;
}

// Role interface
export interface RoleDefinition {
  name: Role;
  permissions: Permission[];
  description: string;
  systemRole: boolean; // Whether this is a built-in system role
}

// Security policy interface
export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  rules: SecurityRule[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityRule {
  id: string;
  resourceType: ResourceType;
  resourceId?: string; // Specific resource or * for all
  permission: Permission;
  effect: 'allow' | 'deny';
  condition?: string; // Condition for when rule applies
  priority: number; // Lower numbers have higher priority
  description?: string;
}

// Security audit log entry
export interface SecurityAuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resourceType: ResourceType;
  resourceId: string;
  permission: Permission;
  result: 'success' | 'denied' | 'error';
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

// Plugin permission interface
export interface PluginPermission {
  pluginName: string;
  permissions: Permission[];
  description: string;
}

// Permission manager interface
export interface PermissionManager {
  checkPermission(userId: string, resourceType: ResourceType, resourceId: string, permission: Permission): Promise<boolean>;
  grantPermission(userId: string, resourceType: ResourceType, resourceId: string, permission: Permission, grantedBy: string, reason?: string): Promise<void>;
  revokePermission(userId: string, resourceType: ResourceType, resourceId: string, permission: Permission): Promise<void>;
  getUserPermissions(userId: string): Promise<Permission[]>;
  getUserRoles(userId: string): Promise<Role[]>;
}

// Role manager interface
export interface RoleManager {
  assignRole(userId: string, role: Role, assignedBy: string): Promise<void>;
  removeRole(userId: string, role: Role): Promise<void>;
  getUserRoles(userId: string): Promise<Role[]>;
  getRolePermissions(role: Role): Promise<Permission[]>;
}

// Security manager interface
export interface SecurityManager {
  authenticate(username: string, password: string): Promise<User | null>;
  authorize(user: User, resourceType: ResourceType, resourceId: string, permission: Permission): Promise<boolean>;
  logSecurityEvent(event: Omit<SecurityAuditLog, 'id' | 'timestamp'>): Promise<void>;
  applySecurityPolicy(userId: string, resourceType: ResourceType, resourceId: string, permission: Permission): Promise<boolean>;
}

// Plugin permission manager
export class PluginPermissionManager implements PermissionManager {
  private permissions: Map<string, PermissionEntry[]> = new Map(); // userId -> permissions
  private userRoles: Map<string, Role[]> = new Map(); // userId -> roles
  private roleDefinitions: Map<Role, RoleDefinition> = new Map();
  private policies: Map<string, SecurityPolicy> = new Map();
  private auditLog: SecurityAuditLog[] = [];
  private maxAuditLogSize: number;

  constructor(maxAuditLogSize: number = 10000) {
    this.maxAuditLogSize = maxAuditLogSize;
    this.initializeDefaultRoles();
  }

  private initializeDefaultRoles(): void {
    // Default admin role with all permissions
    this.roleDefinitions.set(Role.ADMIN, {
      name: Role.ADMIN,
      permissions: Object.values(Permission),
      description: 'Administrator with full access',
      systemRole: true,
    });

    // Moderator role
    this.roleDefinitions.set(Role.MODERATOR, {
      name: Role.MODERATOR,
      permissions: [Permission.READ, Permission.WRITE, Permission.MONITOR],
      description: 'Moderator with read, write and monitoring access',
      systemRole: true,
    });

    // Regular user role
    this.roleDefinitions.set(Role.USER, {
      name: Role.USER,
      permissions: [Permission.READ],
      description: 'Regular user with read access',
      systemRole: true,
    });

    // Guest role
    this.roleDefinitions.set(Role.GUEST, {
      name: Role.GUEST,
      permissions: [Permission.READ],
      description: 'Guest with limited read access',
      systemRole: true,
    });

    // Developer role
    this.roleDefinitions.set(Role.DEVELOPER, {
      name: Role.DEVELOPER,
      permissions: [Permission.READ, Permission.WRITE, Permission.EXECUTE, Permission.CONFIGURE],
      description: 'Developer with development-related permissions',
      systemRole: true,
    });

    // Operator role
    this.roleDefinitions.set(Role.OPERATOR, {
      name: Role.OPERATOR,
      permissions: [Permission.READ, Permission.MONITOR, Permission.AUDIT],
      description: 'System operator with monitoring and audit permissions',
      systemRole: true,
    });
  }

  async checkPermission(userId: string, resourceType: ResourceType, resourceId: string, permission: Permission): Promise<boolean> {
    // Check direct user permissions
    const userPermissions = await this.getUserPermissions(userId);
    if (userPermissions.includes(permission)) {
      return true;
    }

    // Check role-based permissions
    const userRoles = await this.getUserRoles(userId);
    for (const role of userRoles) {
      const roleDef = this.roleDefinitions.get(role);
      if (roleDef && roleDef.permissions.includes(permission)) {
        return true;
      }
    }

    // Check specific permissions for this resource
    const userResourcePermissions = this.permissions.get(userId) || [];
    for (const permEntry of userResourcePermissions) {
      if (
        permEntry.resourceType === resourceType &&
        (permEntry.resourceId === resourceId || permEntry.resourceId === '*') &&
        permEntry.permission === permission
      ) {
        // Check if permission hasn't expired
        if (!permEntry.expiresAt || permEntry.expiresAt > new Date()) {
          return true;
        }
      }
    }

    // Check if any policies deny access (higher priority)
    const policies = Array.from(this.policies.values())
      .filter(policy => policy.enabled)
      .sort((a, b) => a.rules[0]?.priority - b.rules[0]?.priority); // Sort by priority

    for (const policy of policies) {
      for (const rule of policy.rules) {
        if (
          rule.resourceType === resourceType &&
          (rule.resourceId === resourceId || rule.resourceId === '*' || resourceId.startsWith(rule.resourceId)) &&
          rule.permission === permission
        ) {
          return rule.effect === 'allow';
        }
      }
    }

    return false;
  }

  async grantPermission(userId: string, resourceType: ResourceType, resourceId: string, permission: Permission, grantedBy: string, reason?: string): Promise<void> {
    if (!this.permissions.has(userId)) {
      this.permissions.set(userId, []);
    }

    const permissionEntry: PermissionEntry = {
      id: `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      resourceType,
      resourceId,
      permission,
      grantedTo: userId,
      grantedBy,
      grantedAt: new Date(),
      reason,
    };

    this.permissions.get(userId)!.push(permissionEntry);

    // Log the permission grant
    await this.logSecurityEvent({
      userId: grantedBy,
      action: 'GRANT_PERMISSION',
      resourceType,
      resourceId,
      permission,
      result: 'success',
      metadata: { targetUserId: userId, reason },
    });
  }

  async revokePermission(userId: string, resourceType: ResourceType, resourceId: string, permission: Permission): Promise<void> {
    const userPermissions = this.permissions.get(userId) || [];
    const updatedPermissions = userPermissions.filter(
      perm => 
        !(perm.resourceType === resourceType &&
          perm.resourceId === resourceId &&
          perm.permission === permission)
    );

    if (userPermissions.length !== updatedPermissions.length) {
      this.permissions.set(userId, updatedPermissions);
      
      // Log the permission revocation
      await this.logSecurityEvent({
        userId,
        action: 'REVOKE_PERMISSION',
        resourceType,
        resourceId,
        permission,
        result: 'success',
      });
    }
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const permissions: Permission[] = [];

    // Get permissions directly assigned to user
    const userPermissions = this.permissions.get(userId) || [];
    for (const perm of userPermissions) {
      if (!permissions.includes(perm.permission)) {
        permissions.push(perm.permission);
      }
    }

    // Get permissions from roles
    const userRoles = await this.getUserRoles(userId);
    for (const role of userRoles) {
      const roleDef = this.roleDefinitions.get(role);
      if (roleDef) {
        for (const perm of roleDef.permissions) {
          if (!permissions.includes(perm)) {
            permissions.push(perm);
          }
        }
      }
    }

    return permissions;
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    return this.userRoles.get(userId) || [];
  }

  // Role management methods
  async assignRole(userId: string, role: Role, assignedBy: string): Promise<void> {
    if (!this.userRoles.has(userId)) {
      this.userRoles.set(userId, []);
    }

    const userRoles = this.userRoles.get(userId)!;
    if (!userRoles.includes(role)) {
      userRoles.push(role);
      
      // Log the role assignment
      await this.logSecurityEvent({
        userId: assignedBy,
        action: 'ASSIGN_ROLE',
        resourceType: ResourceType.SYSTEM,
        resourceId: userId,
        permission: Permission.ADMIN,
        result: 'success',
        metadata: { role, targetUserId: userId },
      });
    }
  }

  async removeRole(userId: string, role: Role): Promise<void> {
    const userRoles = this.userRoles.get(userId);
    if (userRoles) {
      const index = userRoles.indexOf(role);
      if (index !== -1) {
        userRoles.splice(index, 1);
        
        // Log the role removal
        await this.logSecurityEvent({
          userId,
          action: 'REMOVE_ROLE',
          resourceType: ResourceType.SYSTEM,
          resourceId: userId,
          permission: Permission.ADMIN,
          result: 'success',
          metadata: { role },
        });
      }
    }
  }

  async getRolePermissions(role: Role): Promise<Permission[]> {
    const roleDef = this.roleDefinitions.get(role);
    return roleDef ? [...roleDef.permissions] : [];
  }

  // Security policy methods
  addSecurityPolicy(policy: SecurityPolicy): void {
    this.policies.set(policy.id, policy);
  }

  removeSecurityPolicy(policyId: string): boolean {
    return this.policies.delete(policyId);
  }

  // Security audit methods
  async logSecurityEvent(event: Omit<SecurityAuditLog, 'id' | 'timestamp'>): Promise<void> {
    const auditEntry: SecurityAuditLog = {
      ...event,
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    this.auditLog.push(auditEntry);

    // Keep audit log size manageable
    if (this.auditLog.length > this.maxAuditLogSize) {
      this.auditLog = this.auditLog.slice(-this.maxAuditLogSize);
    }
  }

  getSecurityAuditLog(userId?: string, action?: string, limit: number = 100): SecurityAuditLog[] {
    let filteredLogs = [...this.auditLog];

    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === userId);
    }

    if (action) {
      filteredLogs = filteredLogs.filter(log => log.action === action);
    }

    return filteredLogs.slice(0, limit);
  }

  // Security policy enforcement
  async applySecurityPolicy(userId: string, resourceType: ResourceType, resourceId: string, permission: Permission): Promise<boolean> {
    // Check all active policies
    const activePolicies = Array.from(this.policies.values()).filter(policy => policy.enabled);
    
    // Sort policies by priority (lower number = higher priority)
    activePolicies.sort((a, b) => 
      (a.rules[0]?.priority || 0) - (b.rules[0]?.priority || 0)
    );

    for (const policy of activePolicies) {
      for (const rule of policy.rules) {
        // Check if rule applies to this request
        if (
          rule.resourceType === resourceType &&
          (rule.resourceId === resourceId || rule.resourceId === '*' || resourceId.startsWith(rule.resourceId)) &&
          rule.permission === permission
        ) {
          // Apply condition if present
          if (rule.condition) {
            // In a real implementation, this would evaluate the condition
            // For simplicity, we'll assume conditions are met
          }
          
          return rule.effect === 'allow';
        }
      }
    }

    // If no policy matches, allow by default (in a real system you might want to deny by default)
    return true;
  }
}

// Plugin sandbox implementation
export class PluginSandbox {
  private allowedOperations: Set<string>;
  private allowedResources: Set<ResourceType>;
  private pluginPermissions: Map<string, Permission[]> = new Map(); // pluginName -> permissions
  private securityManager: PluginPermissionManager;

  constructor(securityManager: PluginPermissionManager) {
    this.securityManager = securityManager;
    this.allowedOperations = new Set([
      'read',
      'write',
      'network_request',
      'timer',
      'crypto',
    ]);
    this.allowedResources = new Set([
      ResourceType.PLUGIN,
      ResourceType.CONFIG,
    ]);
  }

  async canAccessResource(pluginName: string, resourceType: ResourceType, resourceId: string, permission: Permission): Promise<boolean> {
    // First check if the resource type is in the allowed list
    if (!this.allowedResources.has(resourceType)) {
      return false;
    }

    // Then check permissions
    const pluginUser = `plugin_${pluginName}`;
    return await this.securityManager.checkPermission(pluginUser, resourceType, resourceId, permission);
  }

  async executeInSandbox<T>(pluginName: string, operation: () => Promise<T>): Promise<T> {
    // Check if this operation is allowed
    const operationName = operation.name || 'anonymous';
    if (!this.allowedOperations.has(operationName.toLowerCase())) {
      throw new Error(`Operation ${operationName} not allowed in sandbox for plugin ${pluginName}`);
    }

    // Execute the operation in a controlled environment
    return await operation();
  }

  async setPluginPermissions(pluginName: string, permissions: Permission[]): Promise<void> {
    this.pluginPermissions.set(pluginName, permissions);
    
    // For each permission, grant it to the plugin user
    for (const permission of permissions) {
      await this.securityManager.grantPermission(
        `plugin_${pluginName}`,
        ResourceType.PLUGIN,
        pluginName,
        permission,
        'system',
        `Permission granted to plugin ${pluginName}`
      );
    }
  }

  async getPluginPermissions(pluginName: string): Promise<Permission[]> {
    return this.pluginPermissions.get(pluginName) || [];
  }

  async validatePlugin(pluginName: string, pluginCode: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Basic validation: check for dangerous patterns
    const dangerousPatterns = [
      /process\.env/g,
      /require\(/g,
      /import\(/g,
      /eval\(/g,
      /new\s+Function/g,
      /__proto__/g,
      /constructor\.prototype/g,
      /child_process/g,
      /fs\./g,
      /exec/g,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(pluginCode)) {
        errors.push(`Potentially dangerous pattern found: ${pattern}`);
      }
    }

    // Note: We removed the requirement for pre-defined permissions in validation
    // This allows for validation of plugin code without requiring permissions to be set first

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Security manager implementation
export class SecurityManagerImpl implements SecurityManager {
  private users: Map<string, User> = new Map();
  private permissionManager: PluginPermissionManager;
  private pluginSandbox: PluginSandbox;

  constructor(permissionManager: PluginPermissionManager) {
    this.permissionManager = permissionManager;
    this.pluginSandbox = new PluginSandbox(permissionManager);
  }

  async authenticate(username: string, password: string): Promise<User | null> {
    // In a real implementation, this would check against a database or auth provider
    // For now, we'll simulate authentication
    for (const [userId, user] of this.users.entries()) {
      if (user.username === username) {
        // In a real system, you'd hash and compare passwords
        if (password === 'valid-password') { // This is just for simulation
          user.lastLoginAt = new Date();
          return { ...user };
        }
      }
    }

    return null;
  }

  async authorize(user: User, resourceType: ResourceType, resourceId: string, permission: Permission): Promise<boolean> {
    if (!user.isActive) {
      return false;
    }

    // Check if the user has the permission directly or through roles
    const hasPermission = await this.permissionManager.checkPermission(user.id, resourceType, resourceId, permission);
    
    // Also check security policies
    const policyResult = await this.permissionManager.applySecurityPolicy(user.id, resourceType, resourceId, permission);
    
    return hasPermission && policyResult;
  }

  async logSecurityEvent(event: Omit<SecurityAuditLog, 'id' | 'timestamp'>): Promise<void> {
    await this.permissionManager.logSecurityEvent(event);
  }

  async applySecurityPolicy(userId: string, resourceType: ResourceType, resourceId: string, permission: Permission): Promise<boolean> {
    return await this.permissionManager.applySecurityPolicy(userId, resourceType, resourceId, permission);
  }

  // User management methods
  async addUser(userData: Omit<User, 'id' | 'createdAt' | 'isActive'>): Promise<User> {
    const user: User = {
      ...userData,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      isActive: true,
    };

    this.users.set(user.id, user);
    return user;
  }

  async getUser(userId: string): Promise<User | undefined> {
    return this.users.get(userId);
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) {
      return null;
    }

    Object.assign(user, updates);
    return { ...user };
  }

  async deactivateUser(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    user.isActive = false;
    return true;
  }

  // Plugin sandbox methods
  async validatePlugin(pluginName: string, pluginCode: string): Promise<{ valid: boolean; errors: string[] }> {
    return await this.pluginSandbox.validatePlugin(pluginName, pluginCode);
  }

  async setPluginPermissions(pluginName: string, permissions: Permission[]): Promise<void> {
    await this.pluginSandbox.setPluginPermissions(pluginName, permissions);
  }

  async canPluginAccessResource(pluginName: string, resourceType: ResourceType, resourceId: string, permission: Permission): Promise<boolean> {
    return await this.pluginSandbox.canAccessResource(pluginName, resourceType, resourceId, permission);
  }

  async executePluginInSandbox<T>(pluginName: string, operation: () => Promise<T>): Promise<T> {
    return await this.pluginSandbox.executeInSandbox(pluginName, operation);
  }

  // Get security dashboard data
  getSecurityDashboardData(): {
    totalUsers: number;
    activeUsers: number;
    securityEvents: number;
    policiesCount: number;
  } {
    const totalUsers = this.users.size;
    const activeUsers = Array.from(this.users.values()).filter(user => user.isActive).length;
    const securityEvents = this.permissionManager.getSecurityAuditLog().length;
    const policiesCount = 0; // Would need to count policies from permission manager

    return {
      totalUsers,
      activeUsers,
      securityEvents,
      policiesCount,
    };
  }
}

// Authentication middleware/utility
export class AuthenticationUtil {
  static async hashPassword(password: string): Promise<string> {
    // In a real implementation, use bcrypt or another secure hashing algorithm
    // For this example, we'll use a simple approach (not secure for production)
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    const hash = await this.hashPassword(password);
    return hash === hashedPassword;
  }

  static generateAuthToken(userId: string): string {
    // In a real implementation, use JWT or another secure token system
    const payload = JSON.stringify({ userId, exp: Date.now() + 3600000 }); // 1 hour
    const crypto = require('crypto');
    const signature = crypto.createHash('sha256').update(payload).digest('hex');
    return `${payload}.${signature}`;
  }

  static verifyAuthToken(token: string): { valid: boolean; userId?: string; expired?: boolean } {
    try {
      const [payloadStr, signature] = token.split('.');
      const payload = JSON.parse(payloadStr);
      
      // Check expiration
      if (payload.exp < Date.now()) {
        return { valid: false, expired: true };
      }

      // Verify signature (simplified)
      const expectedSignature = require('crypto')
        .createHash('sha256')
        .update(payloadStr)
        .digest('hex');
      
      if (signature !== expectedSignature) {
        return { valid: false };
      }

      return { valid: true, userId: payload.userId };
    } catch (error) {
      return { valid: false };
    }
  }
}