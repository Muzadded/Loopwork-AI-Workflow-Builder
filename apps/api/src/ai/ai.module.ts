import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeminiProviderService } from './gemini-provider.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    GeminiProviderService,
    {
      provide: 'IAiProvider',
      useClass: GeminiProviderService,
    },
  ],
  exports: [GeminiProviderService, 'IAiProvider'],
})
export class AiModule {}
