import { GeminiProvider } from "./src/lib/ai/providers/gemini";

async function run() {
  const ai = new GeminiProvider(process.env.GEMINI_API_KEY!);
  const prompt = `Você é um analista financeiro sênior. Responda APENAS com JSON, sem markdown:
        {
          "projectedBars": [
            { "label": "Hoje", "balance": 1000.00, "delta": 0 },
            { "label": "+3d", "balance": 900, "delta": -100 }
          ],
          "insight": "Você deve terminar o período com R$ 900 livre."
        }`;

  try {
    const res = await ai.json(prompt, { temperature: 0.1, maxTokens: 4096 });
    console.log("Success:", res);
  } catch (e: any) {
    console.error("Failed:", e.message);
  }
}
run();
