const supabase = require('../lib/supabase');
const { HttpError } = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');

// 1. Who is calling? Verifies the Bearer token with Supabase Auth.
const verifyToken = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new HttpError(401, 'Missing or invalid token');
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data || !data.user) {
    throw new HttpError(401, 'Missing or invalid token');
  }

  const user = data.user;

  // Role comes from app_metadata (users cannot edit it). Never from user_metadata or the request.
  let role = user.app_metadata && user.app_metadata.role;
  if (!role) {
    // Fallback: read from the profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    role = profile ? profile.role : undefined;
  }

  req.user = { id: user.id, email: user.email, role };
  next();
});

// 2. Is this role allowed? Use after verifyToken.
function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user) return next(new HttpError(401, 'Missing or invalid token'));
    if (!allowed.includes(req.user.role)) {
      return next(new HttpError(403, 'Role not allowed'));
    }
    next();
  };
}

module.exports = {
  verifyToken,
  requireAuth: verifyToken, // alias for teammate's routes
  requireRole,
  requireOrganizer: requireRole('organizer'),
  requireAttendee: requireRole('attendee'),
};
