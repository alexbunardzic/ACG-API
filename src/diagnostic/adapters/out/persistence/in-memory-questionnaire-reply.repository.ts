import { Injectable } from '@nestjs/common';
import { QuestionnaireReply } from '../../../domain/questionnaire-reply';
import { QuestionnaireReplyRepository } from '../../../application/ports/out/questionnaire-reply-repository.port';

@Injectable()
export class InMemoryQuestionnaireReplyRepository implements QuestionnaireReplyRepository {
  private readonly replies: QuestionnaireReply[] = [];

  async save(reply: QuestionnaireReply): Promise<void> {
    this.replies.push(reply);
  }
}
