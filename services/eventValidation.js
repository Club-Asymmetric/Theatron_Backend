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

  if (event === 'stage-play' || event === 'debate' || event === 'adaptune') {
    const teamSize = Number(body.teamSize);
    let validTeamSize = false;
    let errorMessage = '';

    if (event === 'stage-play') {
      validTeamSize = Number.isInteger(teamSize) && teamSize >= 2 && teamSize <= 10;
      errorMessage = 'teamSize must be between 2 and 10';
    } else if (event === 'debate') {
      validTeamSize = [2, 3, 4].includes(teamSize);
      errorMessage = 'teamSize must be 2, 3, or 4';
    } else if (event === 'adaptune') {
      validTeamSize = [1, 2].includes(teamSize);
      errorMessage = 'teamSize must be 1 or 2';
    }

    if (!validTeamSize) return errorMessage;

    // For solo adaptune, we might not need extra participant fields since main contact suffices,
    // but if the frontend sends participant1, we validate it. We only strictly require if teamSize > 1.
    // Actually, following the existing logic, frontend sends participant1..teamSize.
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

function getRegistrationAmount(event, body) {
  switch (event) {
    case 'adaptune':
      return Number(body.teamSize) === 2 ? 15000 : 12000;
    case 'brainstorm':
    case 'graphics-grid':
    case 'stills-of-soul':
    case 'quizcorn':
      return 8900;
    case 'cineplus':
      return 14900;
    case 'stage-play':
      return (Number(body.teamSize) || 1) * 9900;
    case 'debate':
    case 'photography':
      return 9900;
    case 'vfx-and-editing':
    case 'script-writing':
      return 12000;
    case 'dance':
      return 15000;
    case 'storyboard':
      return 8900;
    default:
      return 9900;
  }
}

module.exports = {
  COMPETITIONS,
  WORKSHOPS,
  EVENTS,
  validateCommonFields,
  validateEventDetails,
  getRegistrationAmount,
};
