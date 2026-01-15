// User Roles - Role definitions and permissions
export const ROLES = {
  USER: 'user',
  CREATOR: 'creator',
  ADMIN: 'admin',
};

export const ROLE_PERMISSIONS = {
  [ROLES.USER]: [
    'view_content',
    'subscribe',
    'comment',
    'like',
    'report',
  ],
  [ROLES.CREATOR]: [
    'view_content',
    'subscribe',
    'comment',
    'like',
    'report',
    'create_content',
    'manage_subscriptions',
    'view_analytics',
    'withdraw_earnings',
  ],
  [ROLES.ADMIN]: [
    'view_content',
    'manage_users',
    'manage_creators',
    'manage_content',
    'view_reports',
    'resolve_reports',
    'view_platform_analytics',
    'manage_settings',
  ],
};

