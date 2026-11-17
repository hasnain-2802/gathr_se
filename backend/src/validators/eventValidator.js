const CATEGORIES = require('../constants/categories');

const blank = (v) => typeof v !== 'string' || v.trim() === '';
const parseDate = (v) => (typeof v === 'string' ? new Date(v) : new Date(NaN));

// Returns a list of error messages (empty list = valid).
// requireFutureStart=false lets the edit endpoint skip the check when start_time is unchanged.
function validateEvent(body, { requireFutureStart = true } = {}) {
  const errors = [];
  const { title, description, start_time, end_time, venue, location, capacity, category } = body || {};

  if (blank(title)) errors.push('title is required');
  else if (title.trim().length > 120) errors.push('title must be 120 characters or less');

  if (blank(description)) errors.push('description is required');
  if (blank(venue)) errors.push('venue is required');
  if (blank(location)) errors.push('location is required');

  if (blank(category)) errors.push('category is required');
  else if (!CATEGORIES.includes(category.trim().toLowerCase())) {
    errors.push(`category must be one of: ${CATEGORIES.join(', ')}`);
  }

  if (!Number.isInteger(capacity)) errors.push('capacity must be an integer');
  else if (capacity <= 0) errors.push('capacity must be greater than 0');

  const start = parseDate(start_time);
  const end = parseDate(end_time);
  if (isNaN(start)) errors.push('start_time must be a valid ISO-8601 date');
  else if (requireFutureStart && start <= new Date()) errors.push('start_time must be in the future');

  if (isNaN(end)) errors.push('end_time must be a valid ISO-8601 date');
  else if (!isNaN(start) && end <= start) errors.push('end_time must be after start_time');

  return errors;
}

module.exports = { validateEvent };
