// TEMPORARY: replace with the team's shared auth middleware once it is merged.
const supabase = require('../config/supabase');

exports.requireAuth = async (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ code: 401, message: 'Unauthorized' });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return res.status(401).json({ code: 401, message: 'Unauthorized' });

  // Role comes from the token's account, never from the request body
  req.user = { id: data.user.id, role: data.user.app_metadata?.role };
  next();
};

exports.requireOrganizer = (req, res, next) => {
  if (req.user?.role !== 'organizer') {
    return res.status(403).json({ code: 403, message: 'Organizers only' });
  }
  next();
};
