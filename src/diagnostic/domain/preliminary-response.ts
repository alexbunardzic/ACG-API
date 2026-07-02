import { QuestionnaireReplyId } from './questionnaire-reply-id';

export class PreliminaryResponse {
  private constructor(
    readonly replyId: QuestionnaireReplyId,
    readonly emailBody: string,
  ) {}

  static forReply(replyId: QuestionnaireReplyId, emailBody: string): PreliminaryResponse {
    const body = emailBody?.trim() ?? '';
    if (body.length === 0) {
      throw new Error('PreliminaryResponse email body cannot be blank');
    }
    return new PreliminaryResponse(replyId, body);
  }
}
