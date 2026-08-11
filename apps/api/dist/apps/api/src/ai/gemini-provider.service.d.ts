import { ConfigService } from '@nestjs/config';
import { IAiProvider } from './ai-provider.interface';
import { AiOptions, AiResponse } from "@repo/shared-types";
export declare class GeminiProviderService implements IAiProvider {
    private readonly configService;
    private readonly logger;
    private genAI;
    private readonly mockModeEnabled;
    constructor(configService: ConfigService);
    complete(prompt: string, options?: AiOptions): Promise<AiResponse>;
    private callGeminiApi;
    private completeWithMock;
}
