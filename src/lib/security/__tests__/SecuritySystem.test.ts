import { 
  PluginPermissionManager, 
  SecurityManagerImpl, 
  Permission, 
  Role, 
  ResourceType,
  AuthenticationUtil 
} from '../PluginSecurityManager';

describe('Security System', () => {
  describe('PluginPermissionManager', () => {
    let permissionManager: PluginPermissionManager;

    beforeEach(() => {
      permissionManager = new PluginPermissionManager();
    });

    it('should initialize with default roles', async () => {
      const adminPermissions = await permissionManager.getRolePermissions(Role.ADMIN);
      expect(adminPermissions).toContain(Permission.ADMIN);
      
      const userPermissions = await permissionManager.getRolePermissions(Role.USER);
      expect(userPermissions).toContain(Permission.READ);
      expect(userPermissions).not.toContain(Permission.ADMIN);
    });

    it('should check user permissions', async () => {
      // Assign a role to a user
      await permissionManager.assignRole('user123', Role.USER, 'admin123');
      
      // Check if user has a permission
      const hasReadPermission = await permissionManager.checkPermission(
        'user123', 
        ResourceType.PLUGIN, 
        'test-plugin', 
        Permission.READ
      );
      
      expect(hasReadPermission).toBe(true);
    });

    it('should grant and revoke specific permissions', async () => {
      // Initially user should not have write permission
      const hasWritePermissionBefore = await permissionManager.checkPermission(
        'user123', 
        ResourceType.PLUGIN, 
        'test-plugin', 
        Permission.WRITE
      );
      
      expect(hasWritePermissionBefore).toBe(false);
      
      // Grant write permission
      await permissionManager.grantPermission(
        'user123',
        ResourceType.PLUGIN,
        'test-plugin',
        Permission.WRITE,
        'admin123'
      );
      
      // Now user should have write permission
      const hasWritePermissionAfter = await permissionManager.checkPermission(
        'user123', 
        ResourceType.PLUGIN, 
        'test-plugin', 
        Permission.WRITE
      );
      
      expect(hasWritePermissionAfter).toBe(true);
      
      // Revoke the permission
      await permissionManager.revokePermission(
        'user123',
        ResourceType.PLUGIN,
        'test-plugin',
        Permission.WRITE
      );
      
      // User should no longer have write permission
      const hasWritePermissionAfterRevoke = await permissionManager.checkPermission(
        'user123', 
        ResourceType.PLUGIN, 
        'test-plugin', 
        Permission.WRITE
      );
      
      expect(hasWritePermissionAfterRevoke).toBe(false);
    });

    it('should manage user roles', async () => {
      // User should start with no roles
      const initialRoles = await permissionManager.getUserRoles('user123');
      expect(initialRoles).toHaveLength(0);
      
      // Assign a role
      await permissionManager.assignRole('user123', Role.MODERATOR, 'admin123');
      
      // User should now have the role
      const rolesAfterAssignment = await permissionManager.getUserRoles('user123');
      expect(rolesAfterAssignment).toContain(Role.MODERATOR);
      
      // Remove the role
      await permissionManager.removeRole('user123', Role.MODERATOR);
      
      // User should no longer have the role
      const rolesAfterRemoval = await permissionManager.getUserRoles('user123');
      expect(rolesAfterRemoval).not.toContain(Role.MODERATOR);
    });

    it('should get user permissions', async () => {
      // Assign a role with specific permissions
      await permissionManager.assignRole('user123', Role.MODERATOR, 'admin123');
      
      // Get user permissions
      const permissions = await permissionManager.getUserPermissions('user123');
      
      // Moderator role should include READ and WRITE permissions
      expect(permissions).toContain(Permission.READ);
      expect(permissions).toContain(Permission.WRITE);
      expect(permissions).toContain(Permission.MONITOR);
    });

    it('should apply security policies', async () => {
      // Grant permission initially
      await permissionManager.grantPermission(
        'user123',
        ResourceType.PLUGIN,
        'test-plugin',
        Permission.WRITE,
        'admin123'
      );
      
      // By default, with no restrictive policies, user should have permission
      let hasPermission = await permissionManager.applySecurityPolicy(
        'user123',
        ResourceType.PLUGIN,
        'test-plugin',
        Permission.WRITE
      );
      
      expect(hasPermission).toBe(true);
    });

    it('should maintain audit logs', async () => {
      // Perform an action that should be logged
      await permissionManager.grantPermission(
        'user123',
        ResourceType.PLUGIN,
        'test-plugin',
        Permission.READ,
        'admin123',
        'Testing permissions'
      );
      
      // Check audit log
      const logs = permissionManager.getSecurityAuditLog('admin123', 'GRANT_PERMISSION');
      expect(logs).toHaveLength(1);
      expect(logs[0].userId).toBe('admin123');
      expect(logs[0].action).toBe('GRANT_PERMISSION');
      expect(logs[0].result).toBe('success');
      expect(logs[0].metadata?.reason).toBe('Testing permissions');
    });
  });

  describe('SecurityManagerImpl', () => {
    let securityManager: SecurityManagerImpl;
    let permissionManager: PluginPermissionManager;

    beforeEach(async () => {
      permissionManager = new PluginPermissionManager();
      securityManager = new SecurityManagerImpl(permissionManager);
      
      // Add a test user
      await securityManager.addUser({
        username: 'testuser',
        email: 'test@example.com',
        roles: [Role.USER],
        permissions: [],
      });
    });

    it('should add and get users', async () => {
      const user = await securityManager.addUser({
        username: 'newuser',
        email: 'newuser@example.com',
        roles: [Role.USER],
        permissions: [],
      });
      
      expect(user.username).toBe('newuser');
      expect(user.email).toBe('newuser@example.com');
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      
      const retrievedUser = await securityManager.getUser(user.id);
      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.username).toBe('newuser');
    });

    it('should authenticate users', async () => {
      // Note: In our mock implementation, 'valid-password' is the only valid password
      const authenticatedUser = await securityManager.authenticate('testuser', 'valid-password');
      
      expect(authenticatedUser).toBeDefined();
      expect(authenticatedUser?.username).toBe('testuser');
      
      // Invalid password should return null
      const invalidAuth = await securityManager.authenticate('testuser', 'invalid-password');
      expect(invalidAuth).toBeNull();
      
      // Invalid username should return null
      const invalidUser = await securityManager.authenticate('nonexistent', 'valid-password');
      expect(invalidUser).toBeNull();
    });

    it('should authorize users based on permissions', async () => {
      const user = await securityManager.addUser({
        username: 'authuser',
        email: 'auth@example.com',
        roles: [Role.USER],
        permissions: [],
      });
      
      // User should not be authorized without proper permissions
      const notAuthorized = await securityManager.authorize(
        user,
        ResourceType.PLUGIN,
        'test-plugin',
        Permission.WRITE
      );
      
      expect(notAuthorized).toBe(false);
      
      // Grant permission to user
      await permissionManager.grantPermission(
        user.id,
        ResourceType.PLUGIN,
        'test-plugin',
        Permission.WRITE,
        'admin123'
      );
      
      // Now user should be authorized
      const authorized = await securityManager.authorize(
        user,
        ResourceType.PLUGIN,
        'test-plugin',
        Permission.WRITE
      );
      
      expect(authorized).toBe(true);
    });

    it('should handle inactive users', async () => {
      const user = await securityManager.addUser({
        username: 'inactiveuser',
        email: 'inactive@example.com',
        roles: [Role.USER],
        permissions: [],
      });
      
      // Deactivate the user
      const deactivated = await securityManager.deactivateUser(user.id);
      expect(deactivated).toBe(true);
      
      // Verify the user is now inactive
      const retrievedUser = await securityManager.getUser(user.id);
      expect(retrievedUser?.isActive).toBe(false);
      
      // Inactive user should not be authorized
      const authorized = await securityManager.authorize(
        retrievedUser!,
        ResourceType.PLUGIN,
        'test-plugin',
        Permission.READ
      );
      
      expect(authorized).toBe(false);
    });

    it('should validate plugins', async () => {
      // First set up permissions for the plugin
      await securityManager.setPluginPermissions('test-plugin', [Permission.READ]);
      
      // Valid plugin code (without dangerous patterns)
      const validPluginCode = `
        function myPlugin() {
          return "Hello, World!";
        }
      `;
      
      const validResult = await securityManager.validatePlugin('test-plugin', validPluginCode);
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toHaveLength(0);
      
      // Invalid plugin code (with dangerous patterns)
      const invalidPluginCode = `
        const fs = require('fs');
        fs.writeFileSync('/etc/passwd', 'hacked');
      `;
      
      const invalidResult = await securityManager.validatePlugin('bad-plugin', invalidPluginCode);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toContainEqual(
        expect.stringContaining('dangerous pattern found')
      );
    });

    it('should manage plugin permissions', async () => {
      // Set permissions for a plugin
      await securityManager.setPluginPermissions('test-plugin', [Permission.READ, Permission.EXECUTE]);
      
      // Check if plugin sandbox respects these permissions
      const canAccess = await securityManager.canPluginAccessResource(
        'test-plugin',
        ResourceType.PLUGIN,
        'test-plugin',
        Permission.READ
      );
      
      expect(canAccess).toBe(true);
      
      // Plugin should not be able to access resources it doesn't have permission for
      const cannotAccess = await securityManager.canPluginAccessResource(
        'test-plugin',
        ResourceType.DATABASE,
        'some-db',
        Permission.WRITE
      );
      
      expect(cannotAccess).toBe(false);
    });

    it('should get security dashboard data', () => {
      const dashboardData = securityManager.getSecurityDashboardData();
      
      expect(dashboardData).toHaveProperty('totalUsers');
      expect(dashboardData).toHaveProperty('activeUsers');
      expect(dashboardData).toHaveProperty('securityEvents');
      expect(dashboardData).toHaveProperty('policiesCount');
    });
  });

  describe('AuthenticationUtil', () => {
    it('should hash and verify passwords', async () => {
      const password = 'mySecretPassword123!';
      const hashed = await AuthenticationUtil.hashPassword(password);
      
      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe('string');
      expect(hashed).not.toBe(password); // Should be different from original
      
      // Verify the password
      const isValid = await AuthenticationUtil.verifyPassword(password, hashed);
      expect(isValid).toBe(true);
      
      // Invalid password should fail
      const isInvalid = await AuthenticationUtil.verifyPassword('wrongPassword', hashed);
      expect(isInvalid).toBe(false);
    });

    it('should generate and verify auth tokens', () => {
      const userId = 'user123';
      const token = AuthenticationUtil.generateAuthToken(userId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Verify the token
      const verification = AuthenticationUtil.verifyAuthToken(token);
      expect(verification.valid).toBe(true);
      expect(verification.userId).toBe(userId);
      expect(verification.expired).toBeUndefined(); // Should not be expired yet
    });

    it('should detect expired tokens', () => {
      // Create a token manually with an expired time
      const expiredPayload = JSON.stringify({ userId: 'user123', exp: Date.now() - 1000 }); // Expired 1 second ago
      const crypto = require('crypto');
      const signature = crypto.createHash('sha256').update(expiredPayload).digest('hex');
      const expiredToken = `${expiredPayload}.${signature}`;
      
      const verification = AuthenticationUtil.verifyAuthToken(expiredToken);
      expect(verification.valid).toBe(false);
      expect(verification.expired).toBe(true);
    });
  });
});