const express = require('express');
const OpenAI = require('openai');
const { requireAuth } = require('../middleware/auth');
const env = require('../config/env');

const router = express.Router();
router.use(requireAuth);

const client = env.gemini.enabled
  ? new OpenAI({ apiKey: env.gemini.apiKey, baseURL: env.gemini.baseUrl })
  : null;

// POST /api/translate  { texts: string[] }  →  { translations: string[] }
router.post('/', async (req, res, next) => {
  try {
    const { texts = [] } = req.body;
    if (!Array.isArray(texts) || texts.length === 0) return res.json({ translations: [] });
    if (!client) return res.json({ translations: texts });

    const capped = texts.slice(0, 80).map((t) => String(t).slice(0, 600));

    const response = await client.chat.completions.create({
      model: env.gemini.model,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content:
            'You are a translation engine. Translate English fitness/nutrition text to Arabic. ' +
            'Reply with ONLY a JSON array, same length as input. ' +
            'Preserve emoji, numbers, and units (g, kg, kcal, ml, reps, sets). ' +
            'Keep proper nouns (people names) unchanged. ' +
            'If a string is already Arabic or empty, return it as-is.',
        },
        {
          role: 'user',
          content: JSON.stringify(capped),
        },
      ],
    });

    const raw = (response.choices[0]?.message?.content || '[]').trim()
      .replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/,'').trim();

    let translations;
    try {
      translations = JSON.parse(raw);
      if (!Array.isArray(translations)) throw new Error();
    } catch {
      translations = capped;
    }

    while (translations.length < capped.length) translations.push(capped[translations.length]);
    return res.json({ translations: translations.slice(0, capped.length) });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
