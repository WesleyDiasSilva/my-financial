/**
 * AI Provider Contract
 * 
 * Interface que todos os provedores de IA devem implementar.
 * Trocar de provedor (Gemini → OpenAI → Claude → Ollama) requer apenas
 * criar uma nova classe que implemente esta interface e registrá-la no factory.
 */

export interface AIMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface AICompletionOptions {
    /** Temperatura de criatividade (0 = determinístico, 1 = criativo) */
    temperature?: number;
    /** Número máximo de tokens na resposta */
    maxTokens?: number;
    /** Prompt de sistema que define o comportamento da IA */
    systemPrompt?: string;
}

export interface AICompletionResponse {
    content: string;
    /** Tokens usados na requisição (se disponível) */
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export interface IAIProvider {
    /** Nome do provedor (para logs e debug) */
    readonly name: string;

    /**
     * Gera uma resposta a partir de uma mensagem simples.
     * Caso de uso: perguntas diretas, análises rápidas.
     */
    complete(prompt: string, options?: AICompletionOptions): Promise<AICompletionResponse>;

    /**
     * Gera uma resposta a partir de um histórico de mensagens (chat).
     * Caso de uso: conversas multi-turno, assistentes interativos.
     */
    chat(messages: AIMessage[], options?: AICompletionOptions): Promise<AICompletionResponse>;

    /**
     * Gera uma resposta estruturada em JSON.
     * Caso de uso: categorização, extração de dados, análises com formato definido.
     */
    json<T = any>(prompt: string, options?: AICompletionOptions): Promise<T>;
}
