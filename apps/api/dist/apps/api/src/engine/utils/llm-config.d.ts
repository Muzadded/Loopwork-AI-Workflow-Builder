import { LlmNodeConfig } from "@repo/shared-types";
type LlmNodeConfigInput = LlmNodeConfig & {
    systemPrompt?: string;
};
export declare function resolveLlmNodeConfig(config: LlmNodeConfigInput): {
    prompt: string;
    model: string;
    jsonOutput: boolean;
    systemInstruction: string | undefined;
    confidenceThreshold: number | undefined;
};
export {};
