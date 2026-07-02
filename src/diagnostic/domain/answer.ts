import { DomainValidationError } from './domain-validation.error';

export class Answer {
  readonly question: string;
  readonly answer: string;

  constructor(question: string, answer: string) {
    const q = question?.trim() ?? '';
    const a = answer?.trim() ?? '';
    if (q.length === 0) {
      throw new DomainValidationError('Answer question cannot be blank');
    }
    if (a.length === 0) {
      throw new DomainValidationError('Answer answer cannot be blank');
    }
    this.question = q;
    this.answer = a;
  }
}
