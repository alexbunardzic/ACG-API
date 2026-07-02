import { Injectable } from '@nestjs/common';
import { PreliminaryResponse } from '../../../domain/preliminary-response';
import { QuestionnaireReply } from '../../../domain/questionnaire-reply';
import { ResponseDrafter } from '../../../application/ports/out/response-drafter.port';

/**
 * Placeholder adapter that returns a canned preliminary response body.
 * A Claude-backed adapter will replace this without touching the domain
 * or application layers — only the DiagnosticModule binding changes.
 */
@Injectable()
export class StubResponseDrafter implements ResponseDrafter {
  async draft(reply: QuestionnaireReply): Promise<PreliminaryResponse> {
    const body =
      `Thank you for submitting ${reply.answers.length} answer(s) to the ACG diagnostic questionnaire. ` +
      `A more detailed diagnostic response will be prepared and sent shortly. ` +
      `Reference: ${reply.id.toString()}`;
    return PreliminaryResponse.forReply(reply.id, body);
  }
}
