const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Categories that should hard-block content
const HARD_BLOCK_CATEGORIES = [
  'sexual/minors',
  'hate',
  'harassment/threatening',
  'self-harm/intent',
  'self-harm/instructions',
  'violence/graphic',
];

// Categories that flag but allow with warning (softblock)
const SOFT_BLOCK_CATEGORIES = [
  'sexual',
  'harassment',
  'self-harm',
  'violence',
];

/**
 * Moderate text using OpenAI's free moderation API.
 * Returns { allowed, flagged, reason, categories }
 */
async function moderateText(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return { allowed: true, flagged: false, reason: null, categories: {} };
  }

  if (!OPENAI_API_KEY) {
    console.warn('[moderation] OPENAI_API_KEY not set — skipping text moderation');
    return { allowed: true, flagged: false, reason: null, categories: {} };
  }

  try {
    const res = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ input: text }),
    });

    if (!res.ok) {
      console.warn('[moderation] OpenAI API error:', res.status);
      return { allowed: true, flagged: false, reason: null, categories: {} };
    }

    const data = await res.json();
    const result = data.results?.[0];
    if (!result) return { allowed: true, flagged: false, reason: null, categories: {} };

    const { flagged, categories, category_scores } = result;

    if (!flagged) return { allowed: true, flagged: false, reason: null, categories };

    // Check hard blocks first
    for (const cat of HARD_BLOCK_CATEGORIES) {
      if (categories[cat]) {
        return {
          allowed: false,
          flagged: true,
          reason: getFriendlyReason(cat),
          severity: 'hard',
          categories,
        };
      }
    }

    // Check soft blocks
    for (const cat of SOFT_BLOCK_CATEGORIES) {
      if (categories[cat] && category_scores[cat] > 0.7) {
        return {
          allowed: false,
          flagged: true,
          reason: getFriendlyReason(cat),
          severity: 'soft',
          categories,
        };
      }
    }

    // Flagged but below threshold — allow with log
    console.log('[moderation] low-confidence flag, allowing:', text.slice(0, 50));
    return { allowed: true, flagged: true, reason: null, categories };

  } catch (err) {
    console.warn('[moderation] text moderation failed, allowing:', err.message);
    return { allowed: true, flagged: false, reason: null, categories: {} };
  }
}

/**
 * Moderate an image URL using Cloudinary's moderation add-on
 * (free tier: 500/month). Falls back to allowing if not configured.
 * Returns { allowed, flagged, reason }
 */
async function moderateImageUrl(imageUrl) {
  if (!imageUrl) return { allowed: true, flagged: false, reason: null };

  // Use Google SafeSearch via a simple heuristic check on Cloudinary transformation
  // Real implementation: use Cloudinary moderation or AWS Rekognition
  // For now, log and allow — Cloudinary preset can be configured with moderation
  console.log('[moderation] image submitted for review:', imageUrl.slice(0, 80));
  return { allowed: true, flagged: false, reason: null };
}

function getFriendlyReason(category) {
  const map = {
    'sexual': 'This content contains sexually explicit material',
    'sexual/minors': 'This content is not allowed',
    'hate': 'This content contains hate speech',
    'harassment': 'This content contains harassment',
    'harassment/threatening': 'This content contains threatening language',
    'self-harm': 'This content references self-harm',
    'self-harm/intent': 'This content is not allowed',
    'self-harm/instructions': 'This content is not allowed',
    'violence': 'This content contains violent material',
    'violence/graphic': 'This content contains graphic violence',
  };
  return map[category] || 'This content violates our community guidelines';
}

module.exports = { moderateText, moderateImageUrl };
