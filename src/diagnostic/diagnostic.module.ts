import { Module } from '@nestjs/common';
import { SubmitQuestionnaireReplyService } from './application/services/submit-questionnaire-reply.service';
import { SUBMIT_QUESTIONNAIRE_REPLY } from './application/ports/in/submit-questionnaire-reply.use-case';
import { CLOCK } from './application/ports/out/clock.port';
import { ID_GENERATOR } from './application/ports/out/id-generator.port';
import { QUESTIONNAIRE_REPLY_REPOSITORY } from './application/ports/out/questionnaire-reply-repository.port';
import { RESPONSE_DRAFTER } from './application/ports/out/response-drafter.port';
import { QuestionnaireReplyController } from './adapters/in/http/questionnaire-reply.controller';
import { ClaudeResponseDrafter } from './adapters/out/drafter/claude-response-drafter';
import { StubResponseDrafter } from './adapters/out/drafter/stub-response-drafter';
import { InMemoryQuestionnaireReplyRepository } from './adapters/out/persistence/in-memory-questionnaire-reply.repository';
import { SystemClock } from './adapters/out/system/system-clock';
import { UuidIdGenerator } from './adapters/out/system/uuid-id-generator';

/**
 * Composition root for the Diagnostic service.
 * All ↔ wiring lives here so application + domain stay framework-free.
 */
@Module({
  controllers: [QuestionnaireReplyController],
  providers: [
    { provide: CLOCK, useClass: SystemClock },
    { provide: ID_GENERATOR, useClass: UuidIdGenerator },
    { provide: QUESTIONNAIRE_REPLY_REPOSITORY, useClass: InMemoryQuestionnaireReplyRepository },
    {
      provide: RESPONSE_DRAFTER,
      useFactory: () => {
        const key = process.env.ANTHROPIC_API_KEY;
        if (key && key.trim() && process.env.NODE_ENV !== 'test') {
          return new ClaudeResponseDrafter({
            apiKey: key,
            model: process.env.ACG_DRAFTER_MODEL,
          });
        }
        return new StubResponseDrafter();
      },
    },
    {
      provide: SUBMIT_QUESTIONNAIRE_REPLY,
      useFactory: (repo, drafter, clock, ids) =>
        new SubmitQuestionnaireReplyService(repo, drafter, clock, ids),
      inject: [QUESTIONNAIRE_REPLY_REPOSITORY, RESPONSE_DRAFTER, CLOCK, ID_GENERATOR],
    },
  ],
})
export class DiagnosticModule {}
