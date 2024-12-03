const roleMiddleware = (requiredPermissions) => {
    return async (req, res, next) => {
      const { rolePermission } = req.users;  // Assuming `req.user` has the role permissions array.
  
      const [featureName, permissions] = requiredPermissions; // Extract the feature name and permissions
  
      // Find the first rolePermissions object in rolePermission
      const rolePermissions = rolePermission[0]?.rolePermissions;
  
      if (!rolePermissions) {
        return res.status(403).json({ message: "No role permissions found" });
      }
  
      // Find the feature permission object matching the featureName
      const featurePermission = rolePermissions.find(
        (rolePerm) => rolePerm.featureName === featureName
      );
  
  
      if (!featurePermission) {
        return res.status(403).json({ message: `Feature ${featureName} not found in role permissions` });
      }
  
      // Check if the requested permissions are included in the user's permissions for that feature
      const hasPermission = permissions.every((permission) =>
        featurePermission.permissions.some((perm) => perm.permissionName === permission)
      );
  
  
      if (!hasPermission) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
  
      // If permissions match, proceed to the route handler
      next();
    };
  };
  
  

module.exports = roleMiddleware;
