export declare const MODEL_PRICING: Record<string, {
    input: number;
    output: number;
}>;
export declare function estimateCostUsd(model: string, promptTokens: number, candidateTokens: number): number;
