const { getPrimaryRole, normalizeRoles } = require('../middlewares/rbac.middleware');

const PRIVILEGED_ROLES = new Set(['admin', 'moderator']);
const AUTHENTICATED_VISIBILITIES = new Set([
  'authenticated',
  'members_only',
  'premium_only',
  'program_enrolled',
  'track_enrolled',
  'session_registered',
]);

function normalizeUser(user) {
  if (!user) {
    return null;
  }

  const roles = normalizeRoles(user.roles || (user.role ? [user.role] : []), {
    fallback: 'member',
  });

  return {
    ...user,
    roles,
    role: getPrimaryRole(roles, { fallback: 'member' }),
  };
}

function hasPrivilegedRole(user) {
  return !!user?.roles?.some((role) => PRIVILEGED_ROLES.has(role));
}

function hasAllowedRoles(context, user) {
  const allowedRoles = Array.isArray(context?.membership_rule?.allowed_roles)
    ? context.membership_rule.allowed_roles
    : [];

  if (allowedRoles.length === 0) {
    return true;
  }

  if (!user) {
    return false;
  }

  const normalizedAllowedRoles = normalizeRoles(allowedRoles);
  return user.roles.some((role) => normalizedAllowedRoles.includes(role));
}

function isContextReadable(context, user) {
  if (!context || !context.is_active) {
    return false;
  }

  if (context.visibility === 'public') {
    return hasAllowedRoles(context, user);
  }

  if (AUTHENTICATED_VISIBILITIES.has(context.visibility)) {
    return !!user && hasAllowedRoles(context, user);
  }

  return !!user && hasAllowedRoles(context, user);
}

function isContextWritable(context, user, intent = 'post') {
  if (!context || !user || !context.is_active) {
    return false;
  }

  if (!isContextReadable(context, user)) {
    return false;
  }

  const readOnly = Boolean(context?.metadata?.read_only);
  if (readOnly) {
    return false;
  }

  const roleKey = intent === 'question' ? 'question_roles' : 'posting_roles';
  const requiredRoles = Array.isArray(context?.membership_rule?.[roleKey])
    ? context.membership_rule[roleKey]
    : [];

  if (requiredRoles.length === 0) {
    return true;
  }

  const normalizedRequiredRoles = normalizeRoles(requiredRoles);
  return user.roles.some((role) => normalizedRequiredRoles.includes(role));
}

function canManageSessionQuestion(context, question, user) {
  if (!user) {
    return false;
  }

  if (hasPrivilegedRole(user)) {
    return true;
  }

  const hostIds = Array.isArray(context?.metadata?.host_user_ids)
    ? context.metadata.host_user_ids
    : [];
  const speakerIds = Array.isArray(context?.metadata?.speaker_user_ids)
    ? context.metadata.speaker_user_ids
    : [];

  if (hostIds.includes(user.id) || speakerIds.includes(user.id)) {
    return true;
  }

  return question?.addressed_to_id === user.id;
}

module.exports = {
  hasPrivilegedRole,
  isContextReadable,
  isContextWritable,
  canManageSessionQuestion,
  normalizeUser,
};
