import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const genkitApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

export const isGenkitConfigured = Boolean(genkitApiKey);

export const ai = genkitApiKey
  ? genkit({
      plugins: [googleAI({apiKey: genkitApiKey})],
      model: 'googleai/gemini-2.5-flash',
    })
  : null;
