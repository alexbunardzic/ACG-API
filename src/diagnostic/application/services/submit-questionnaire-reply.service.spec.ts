import { PreliminaryResponse } from '../../domain/preliminary-response';
import { QuestionnaireReply } from '../../domain/questionnaire-reply';
import { QuestionnaireReplyId } from '../../domain/questionnaire-reply-id';
import { Clock } from '../ports/out/clock.port';
import { IdGenerator } from '../ports/out/id-generator.port';
import { QuestionnaireReplyRepository } from '../ports/out/questionnaire-reply-repository.port';
import { ResponseDrafter } from '../ports/out/response-drafter.port';
import { SubmitQuestionnaireReplyService } from './submit-questionnaire-reply.service';

class FixedClock implements Clock {
  constructor(private readonly date: Date) {}
  now(): Date {
    return this.date;
  }
}

class SequentialIdGenerator implements IdGenerator {
  constructor(private readonly ids: string[]) {}
  next(): string {
    const id = this.ids.shift();
    if (!id) throw new Error('SequentialIdGenerator exhausted');
    return id;
  }
}

class InMemoryRepository implements QuestionnaireReplyRepository {
  readonly saved: QuestionnaireReply[] = [];
  async save(reply: QuestionnaireReply): Promise<void> {
    this.saved.push(reply);
  }
}

class RecordingDrafter implements ResponseDrafter {
  readonly seen: QuestionnaireReply[] = [];
  constructor(private readonly body: string) {}
  async draft(reply: QuestionnaireReply): Promise<PreliminaryResponse> {
    this.seen.push(reply);
    return PreliminaryResponse.forReply(reply.id, this.body);
  }
}

describe('SubmitQuestionnaireReplyService', () => {
  const submittedAt = new Date('2026-07-01T10:00:00Z');
  const command = {
    answers: [
      { question: 'Do you use AI in development?', answer: 'yes' },
      { question: 'Which tools?', answer: 'Claude Code' },
    ],
  };

  function build(bodyFromDrafter = 'Thanks for your reply — here is your preliminary summary.') {
    const repo = new InMemoryRepository();
    const drafter = new RecordingDrafter(bodyFromDrafter);
    const clock = new FixedClock(submittedAt);
    const ids = new SequentialIdGenerator(['reply-42']);
    const service = new SubmitQuestionnaireReplyService(repo, drafter, clock, ids);
    return { service, repo, drafter, clock, ids };
  }

  it('persists a reply with an id, timestamp, and answers before drafting', async () => {
    const { service, repo, drafter } = build();

    await service.submit(command);

    expect(repo.saved).toHaveLength(1);
    const saved = repo.saved[0];
    expect(saved.id.equals(new QuestionnaireReplyId('reply-42'))).toBe(true);
    expect(saved.submittedAt).toEqual(submittedAt);
    expect(saved.answers.map((a) => a.question)).toEqual([
      'Do you use AI in development?',
      'Which tools?',
    ]);
    expect(drafter.seen[0]).toBe(saved);
  });

  it('returns the preliminary response produced by the drafter', async () => {
    const { service } = build('Custom drafter body');

    const response = await service.submit(command);

    expect(response.emailBody).toBe('Custom drafter body');
    expect(response.replyId.equals(new QuestionnaireReplyId('reply-42'))).toBe(true);
  });

  it('does not call the drafter when persistence fails', async () => {
    const failingRepo: QuestionnaireReplyRepository = {
      save: () => Promise.reject(new Error('db down')),
    };
    const drafter = new RecordingDrafter('unused');
    const service = new SubmitQuestionnaireReplyService(
      failingRepo,
      drafter,
      new FixedClock(submittedAt),
      new SequentialIdGenerator(['reply-99']),
    );

    await expect(service.submit(command)).rejects.toThrow(/db down/);
    expect(drafter.seen).toHaveLength(0);
  });

  it('rejects a command with no answers', async () => {
    const { service } = build();
    await expect(service.submit({ answers: [] })).rejects.toThrow(/at least one answer/i);
  });
});
