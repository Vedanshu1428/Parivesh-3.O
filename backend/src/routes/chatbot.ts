import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Initialize Gemini SDK
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. Chatbot will be unavailable.");
  } else {
    ai = new GoogleGenAI({ apiKey });
    console.log("✅ Gemini AI initialized successfully.");
  }
} catch (e) {
  console.warn("GoogleGenAI initialization failed:", e);
}

const SYSTEM_INSTRUCTION = `You are the official AI Navigation Assistant for the Parivesh 3.0 platform (Chhattisgarh Environment Conservation Board).
Your primary goal is to help Proponents navigate the site, understand the processes, and clear their doubts accurately.

PLATFORM LINKS (use as markdown links):
- Apply for clearance: [Click here to Apply](/dashboard/proponent/new)
- View dashboard: [Go to your Dashboard](/dashboard/proponent)

DOCUMENT REQUIREMENTS:
- COMMON (all projects): Processing Fee, Pre-feasibility Report, EMP, Form 1/CAF, Land Documents, CER Details, Affidavits.
- SAND MINING: District Survey Report, Sand Replenishment Study, Gram Panchayat NOC, 200m/500m Certificate, Mining Plan, KML File.
- LIMESTONE MINING: Lease Deed, Mining Plan, Forest NOC, Water NOC, Compliance Report.
- BRICK KILN: Panchnama, Chimney Distance Certificate, Coal Usage Declaration.
- INFRASTRUCTURE: Building Plan, Traffic Impact Study, Groundwater Clearance, Fire NOC.
- INDUSTRY: CTE, ETP, Air Pollution Control Plan, Boiler Details, Hazardous Waste Docs.

RULES: Be concise, polite. Use bullet points. Always link to the right page when navigation is needed.`;

router.post('/', asyncHandler(async (req: any, res: any) => {
  if (!ai) {
    throw new AppError(500, 'CHATBOT_UNAVAILABLE', 'The Chatbot is currently unavailable (Missing API Credentials).');
  }

  const { message, history = [] } = req.body;

  if (!message) {
    throw new AppError(400, 'BAD_REQUEST', 'Message is required.');
  }

  try {
    // Build the full conversation as a prompt
    let fullPrompt = SYSTEM_INSTRUCTION + '\n\n';
    if (history.length > 0) {
      history.forEach((msg: any) => {
        const role = msg.role === 'assistant' ? 'Assistant' : 'User';
        fullPrompt += `${role}: ${msg.content}\n`;
      });
    }
    fullPrompt += `User: ${message}\nAssistant:`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents: fullPrompt,
    });

    res.json({
      role: 'assistant',
      content: response.text,
    });

  } catch (error: any) {
    console.error("Gemini Chatbot Error:", error.message || error);
    const msg = error.message || '';
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
      throw new AppError(503, 'RATE_LIMITED', 'The AI service is temporarily rate-limited. Please wait a moment and try again.');
    }
    throw new AppError(500, 'AI_ERROR', `AI Assistant Error: ${msg}`);
  }
}));

export default router;
