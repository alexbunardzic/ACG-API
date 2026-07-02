import { Answer } from './answer';
import { PreliminaryResponse } from './preliminary-response';
import { QuestionnaireReply } from './questionnaire-reply';
import { QuestionnaireReplyId } from './questionnaire-reply-id';

describe('QuestionnaireReplyId', () => {
  it('rejects blank ids', () => {
    expect(() => new QuestionnaireReplyId('')).toThrow(/blank/i);
    expect(() => new QuestionnaireReplyId('   ')).toThrow(/blank/i);
  });

  it('is equal to another id with the same value', () => {
    const a = new QuestionnaireReplyId('abc-123');
    const b = new QuestionnaireReplyId('abc-123');
    expect(a.equals(b)).toBe(true);
  });

  it('is not equal to an id with a different value', () => {
    expect(new QuestionnaireReplyId('a').equals(new QuestionnaireReplyId('b'))).toBe(false);
  });
});

describe('Answer', () => {
  it('rejects a blank question', () => {
    expect(() => new Answer('', 'yes')).toThrow(/question/i);
  });

  it('rejects a blank answer', () => {
    expect(() => new Answer('Do you use AI?', '   ')).toThrow(/answer/i);
  });

  it('trims surrounding whitespace on construction', () => {
    const a = new Answer('  Do you use AI?  ', '  yes  ');
    expect(a.question).toBe('Do you use AI?');
    expect(a.answer).toBe('yes');
  });
});

describe('QuestionnaireReply', () => {
  const id = new QuestionnaireReplyId('reply-1');
  const submittedAt = new Date('2026-07-01T10:00:00Z');
  const answers = [new Answer('Do you use AI?', 'yes')];

  it('is submitted with id, timestamp, and answers', () => {
    const reply = QuestionnaireReply.submit({ id, submittedAt, answers });

    expect(reply.id.equals(id)).toBe(true);
    expect(reply.submittedAt).toEqual(submittedAt);
    expect(reply.answers).toEqual(answers);
  });

  it('requires at least one answer', () => {
    expect(() =>
      QuestionnaireReply.submit({ id, submittedAt, answers: [] }),
    ).toThrow(/at least one answer/i);
  });

  it('exposes answers as a defensive copy', () => {
    const original = [new Answer('Q1', 'A1')];
    const reply = QuestionnaireReply.submit({ id, submittedAt, answers: original });

    original.push(new Answer('Q2', 'A2'));

    expect(reply.answers).toHaveLength(1);
  });
});

describe('PreliminaryResponse', () => {
  const replyId = new QuestionnaireReplyId('reply-1');

  it('binds an email body to the reply it answers', () => {
    const response = PreliminaryResponse.forReply(replyId, 'Thank you for your reply...');
    expect(response.replyId.equals(replyId)).toBe(true);
    expect(response.emailBody).toBe('Thank you for your reply...');
  });

  it('rejects an empty email body', () => {
    expect(() => PreliminaryResponse.forReply(replyId, '')).toThrow(/email body/i);
    expect(() => PreliminaryResponse.forReply(replyId, '   ')).toThrow(/email body/i);
  });
});
