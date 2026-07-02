import { DomainValidationError } from './domain-validation.error';

export class QuestionnaireReplyId {
  readonly value: string;

  constructor(value: string) {
    const trimmed = value?.trim() ?? '';
    if (trimmed.length === 0) {
      throw new DomainValidationError('QuestionnaireReplyId cannot be blank');
    }
    this.value = trimmed;
  }

  equals(other: QuestionnaireReplyId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
