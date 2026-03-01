import type { IAIProvider } from "./contracts/ai-provider";
import { GeminiProvider } from "./providers/gemini";

/**
 * Provedores suportados.
 * Para adicionar um novo provedor:
 * 1. Crie a classe em ./providers/novo-provider.ts implementando IAIProvider
 * 2. Adicione a string ao tipo AIProviderName
 * 3. Adicione o case no switch do createAIProvider
 */
export type AIProviderName = "gemini" | "openai" | "claude" | "ollama";

let instance: IAIProvider | null = null;

/**
 * Factory que cria o provedor de IA correto baseado na variável de ambiente AI_PROVIDER.
 * 
 * Uso:
 * ```ts
 * import { getAIProvider } from "@/lib/ai";
 * const ai = getAIProvider();
 * const response = await ai.complete("Analise meus gastos");
 * ```
 */
export function createAIProvider(provider?: AIProviderName): IAIProvider {
    const providerName = provider || (process.env.AI_PROVIDER as AIProviderName) || "gemini";

    switch (providerName) {
        case "gemini":
            return new GeminiProvider(
                process.env.GEMINI_API_KEY || "",
                process.env.GEMINI_MODEL || "gemini-2.0-flash"
            );

        case "openai":
            throw new Error("[AI] Provider 'openai' ainda não implementado. Crie OpenAIProvider em ./providers/openai.ts");

        case "claude":
            throw new Error("[AI] Provider 'claude' ainda não implementado. Crie ClaudeProvider em ./providers/claude.ts");

        case "ollama":
            throw new Error("[AI] Provider 'ollama' ainda não implementado. Crie OllamaProvider em ./providers/ollama.ts");

        default:
            throw new Error(`[AI] Provider '${providerName}' não reconhecido. Use: gemini, openai, claude, ollama`);
    }
}

/**
 * Retorna uma instância singleton do provedor de IA.
 * Reutiliza a mesma instância para evitar recriação desnecessária.
 */
export function getAIProvider(): IAIProvider {
    if (!instance) {
        instance = createAIProvider();
    }
    return instance;
}

// Re-export types for convenience
export type { IAIProvider, AIMessage, AICompletionOptions, AICompletionResponse } from "./contracts/ai-provider";
