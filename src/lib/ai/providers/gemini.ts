import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
    IAIProvider,
    AIMessage,
    AICompletionOptions,
    AICompletionResponse,
} from "../contracts/ai-provider";

export class GeminiProvider implements IAIProvider {
    readonly name = "gemini";
    private client: GoogleGenerativeAI;
    private model: string;

    constructor(apiKey: string, model: string = "gemini-2.5-flash") {
        if (!apiKey) {
            throw new Error("[AI] GEMINI_API_KEY não configurada.");
        }
        this.client = new GoogleGenerativeAI(apiKey);
        this.model = model;
    }

    private async callWithFallback<T>(fn: (modelName: string) => Promise<T>): Promise<T> {
        // Repeated models allow retrying the same fast model if the first attempt generates truncated/bad JSON
        const fallbackModels = [
            this.model,
            this.model,
            "gemini-2.5-flash",
            "gemini-2.0-flash-001",
            "gemini-flash-latest"
        ];
        let lastError: any;

        for (const modelName of fallbackModels) {
            try {
                return await fn(modelName);
            } catch (error: any) {
                lastError = error;
                // If it's an API Key or Quota issue, abort immediately. Otherwise, retry the generation.
                const isAuthError = error.message?.toLowerCase().includes("api key") ||
                    error.message?.toLowerCase().includes("quota") ||
                    error.message?.toLowerCase().includes("unauthenticated");
                if (isAuthError) throw error;

                console.warn(`[AI] Model ${modelName} failed generation/parsing, retrying... (${error.message.substring(0, 100)})`);
            }
        }
        throw lastError;
    }

    async complete(prompt: string, options?: AICompletionOptions): Promise<AICompletionResponse> {
        return this.callWithFallback(async (modelName) => {
            const model = this.client.getGenerativeModel({
                model: modelName,
                systemInstruction: options?.systemPrompt,
                generationConfig: {
                    temperature: options?.temperature ?? 0.7,
                    maxOutputTokens: options?.maxTokens ?? 8192,
                },
            });

            const result = await model.generateContent(prompt);
            const response = result.response;

            return {
                content: response.text(),
                usage: response.usageMetadata
                    ? {
                        promptTokens: response.usageMetadata.promptTokenCount ?? 0,
                        completionTokens: response.usageMetadata.candidatesTokenCount ?? 0,
                        totalTokens: response.usageMetadata.totalTokenCount ?? 0,
                    }
                    : undefined,
            };
        });
    }

    async chat(messages: AIMessage[], options?: AICompletionOptions): Promise<AICompletionResponse> {
        return this.callWithFallback(async (modelName) => {
            const systemMessages = messages.filter(m => m.role === "system");
            const chatMessages = messages.filter(m => m.role !== "system");

            const systemPrompt = options?.systemPrompt
                || systemMessages.map(m => m.content).join("\n")
                || undefined;

            const model = this.client.getGenerativeModel({
                model: modelName,
                systemInstruction: systemPrompt,
                generationConfig: {
                    temperature: options?.temperature ?? 0.7,
                    maxOutputTokens: options?.maxTokens ?? 8192,
                },
            });

            const history = chatMessages.slice(0, -1).map(msg => ({
                role: msg.role === "assistant" ? "model" as const : "user" as const,
                parts: [{ text: msg.content }],
            }));

            const chat = model.startChat({ history });
            const lastMessage = chatMessages[chatMessages.length - 1];
            const result = await chat.sendMessage(lastMessage.content);
            const response = result.response;

            return {
                content: response.text(),
                usage: response.usageMetadata
                    ? {
                        promptTokens: response.usageMetadata.promptTokenCount ?? 0,
                        completionTokens: response.usageMetadata.candidatesTokenCount ?? 0,
                        totalTokens: response.usageMetadata.totalTokenCount ?? 0,
                    }
                    : undefined,
            };
        });
    }

    async json<T = any>(prompt: string, options?: AICompletionOptions): Promise<T> {
        return this.callWithFallback(async (modelName) => {
            const model = this.client.getGenerativeModel({
                model: modelName,
                systemInstruction: options?.systemPrompt,
                generationConfig: {
                    temperature: options?.temperature ?? 0.3,
                    maxOutputTokens: options?.maxTokens ?? 8192,
                },
            });

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            try {
                // Ultra-robust JSON extraction: Find the outermost { } or [ ]
                const textStr = response.text();

                const firstBrace = textStr.indexOf('{');
                const lastBrace = textStr.lastIndexOf('}');
                const firstBracket = textStr.indexOf('[');
                const lastBracket = textStr.lastIndexOf(']');

                let startIndex = -1;
                let endIndex = -1;

                // Determine if the outermost JSON structure is an object or an array
                if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
                    startIndex = firstBrace;
                    endIndex = lastBrace;
                } else if (firstBracket !== -1) {
                    startIndex = firstBracket;
                    endIndex = lastBracket;
                }

                if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
                    throw new Error("Nenhum objeto ou array JSON foi encontrado na resposta.");
                }

                const cleanJsonStr = textStr.substring(startIndex, endIndex + 1);
                return JSON.parse(cleanJsonStr) as T;
            } catch (error: any) {
                console.error("[AI/Gemini] Raw JSON parsing failed:", response.text());
                throw new Error(`[AI/Gemini] Resposta não é JSON válido: ${text.substring(0, 200)}... Erro real: ${error.message}`);
            }
        });
    }
}
