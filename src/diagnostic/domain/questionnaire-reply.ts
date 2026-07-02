import { Answer } from './answer';
import { DomainValidationError } from './domain-validation.error';
import { QuestionnaireReplyId } from './questionnaire-reply-id';

export interface SubmitQuestionnaireReplyInput {
  id: QuestionnaireReplyId;
  submittedAt: Date;
  answers: ReadonlyArray<Answer>;
}

export class QuestionnaireReply {
  readonly id: QuestionnaireReplyId;
  readonly submittedAt: Date;
  readonly answers: ReadonlyArray<Answer>;

  private constructor(input: SubmitQuestionnaireReplyInput) {
    this.id = input.id;
    this.submittedAt = new Date(input.submittedAt.getTime());
    this.answers = [...input.answers];
  }

  static submit(input: SubmitQuestionnaireReplyInput): QuestionnaireReply {
    if (input.answers.length === 0) {
      throw new DomainValidationError('A reply must contain at least one answer');
    }
    return new QuestionnaireReply(input);
  }
}
