const adminMiddleware = (req, res, next) => {
  try {
    // Check if user exists and is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required',
          code: 'ADMIN_REQUIRED'
        }
      });
    }

    // Check if admin is active
    if (!req.user.isActive) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Admin account is deactivated',
          code: 'ADMIN_DEACTIVATED'
        }
      });
    }

    // Log admin action
    console.log(`Admin action by ${req.user.email}: ${req.method} ${req.originalUrl}`);

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Admin authorization error',
        code: 'ADMIN_ERROR'
      }
    });
  }
};

const superAdminMiddleware = (req, res, next) => {
  try {
    // Check if user exists and is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }
      });
    }

    // Check if user has superadmin role
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Super admin access required',
          code: 'SUPERADMIN_REQUIRED'
        }
      });
    }

    // Log super admin action
    console.log(`Super Admin action by ${req.user.email}: ${req.method} ${req.originalUrl}`);

    next();
  } catch (error) {
    console.error('Super admin middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Super admin authorization error',
        code: 'SUPERADMIN_ERROR'
      }
    });
  }
};

module.exports = {
  adminMiddleware,
  superAdminMiddleware
};
