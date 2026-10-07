const COMPETITIONS = new Set([
  'quizcorn',
  'stills-of-soul',
  'graphics-grid',
  'cineplus',
  'stage-play',
  'adaptune',
  'brainstorm',
  'debate',
]);

const WORKSHOPS = new Set([
  'photography',
  'vfx-and-editing',
  'dance',
  'script-writing',
  'storyboard',
]);

const EVENTS = new Set([...COMPETITIONS, ...WORKSHOPS]);

function validateCommonFields(body) {
  const required = ['name', 'email', 'phone', 'college', 'department', 'year'];
  const missing = required.filter((field) => typeof body[field] !== 'string' || !body[field].trim());
  if (missing.length) return `Missing required field(s): ${missing.join(', ')}`;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) return 'Invalid email';
  if (!/^\+?[0-9\s().-]{7,20}$/.test(body.phone.trim())) return 'Invalid phone';
  return null;
}

function validateEventDetails(event, body) {
  if (!EVENTS.has(event)) return 'Invalid event';

  const commonError = validateCommonFields(body);
  if (commonError) return commonError;

  if (event === 'stills-of-soul') {
    if (!body.submissionLink) return 'submissionLink is required';
    if (!/^https:\/\/(drive\.google\.com|docs\.google\.com)\//i.test(body.submissionLink)) {
      return 'submissionLink must be a Google Drive URL';
    }
  }

  if (event === 'graphics-grid' && !isHttpUrl(body.submissionLink)) {
    return 'submissionLink must be a poster submission URL (JPG, JPEG, PNG, or PDF)';
  }

  if (event === 'cineplus' && !isHttpUrl(body.submissionLink)) {
    return 'submissionLink must be a video submission URL (maximum 3 minutes)';
  }

  if (event === 'stage-play' || event === 'debate') {
    const teamSize = Number(body.teamSize);
    const validTeamSize = event === 'stage-play'
      ? Number.isInteger(teamSize) && teamSize >= 2 && teamSize <= 10
      : [2, 3, 4].includes(teamSize);
    if (!validTeamSize) return event === 'stage-play'
      ? 'teamSize must be between 2 and 10'
      : 'teamSize must be 2, 3, or 4';

    for (let index = 1; index <= teamSize; index += 1) {
      if (!String(body[`participant${index}Name`] || '').trim()
        || !String(body[`participant${index}Phone`] || '').trim()) {
        return `participant${index}Name and participant${index}Phone are required`;
      }
    }
  }

  return null;
}

function isHttpUrl(value) {
  return typeof value === 'string' && /^https?:\/\/\S+$/i.test(value);
}

module.exports = {
  COMPETITIONS,
  WORKSHOPS,
  EVENTS,
  validateCommonFields,
  validateEventDetails,
};
