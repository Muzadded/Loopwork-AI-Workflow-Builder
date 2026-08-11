import { AiOptions, AiResponse } from "@repo/shared-types";
export interface IAiProvider {
    complete(prompt: string, options?: AiOptions): Promise<AiResponse>;
}
