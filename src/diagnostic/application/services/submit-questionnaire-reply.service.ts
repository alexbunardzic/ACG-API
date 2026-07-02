import { Answer } from '../../domain/answer';
import { PreliminaryResponse } from '../../domain/preliminary-response';
import { QuestionnaireReply } from '../../domain/questionnaire-reply';
import { QuestionnaireReplyId } from '../../domain/questionnaire-reply-id';
import {
  SubmitQuestionnaireReply,
  SubmitQuestionnaireReplyCommand,
} from '../ports/in/submit-questionnaire-reply.use-case';
import { Clock } from '../ports/out/clock.port';
import { IdGenerator } from '../ports/out/id-generator.port';
import { QuestionnaireReplyRepository } from '../ports/out/questionnaire-reply-repository.port';
import { ResponseDrafter } from '../ports/out/response-drafter.port';

export class SubmitQuestionnaireReplyService implements SubmitQuestionnaireReply {
  constructor(
    private readonly repository: QuestionnaireReplyRepository,
    private readonly drafter: ResponseDrafter,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async submit(command: SubmitQuestionnaireReplyCommand): Promise<PreliminaryResponse> {
    const reply = QuestionnaireReply.submit({
      id: new QuestionnaireReplyId(this.ids.next()),
      submittedAt: this.clock.now(),
      answers: command.answers.map((a) => new Answer(a.question, a.answer)),
    });

    await this.repository.save(reply);
    return this.drafter.draft(reply);
  }
}
