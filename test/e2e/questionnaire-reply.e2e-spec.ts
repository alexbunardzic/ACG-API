import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { CLOCK } from '../../src/diagnostic/application/ports/out/clock.port';
import { ID_GENERATOR } from '../../src/diagnostic/application/ports/out/id-generator.port';

describe('POST /questionnaire-reply (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CLOCK)
      .useValue({ now: () => new Date('2026-07-01T10:00:00Z') })
      .overrideProvider(ID_GENERATOR)
      .useValue({ next: () => 'reply-fixed-id' })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('accepts a questionnaire reply and returns a preliminary response', async () => {
    const response = await request(app.getHttpServer())
      .post('/questionnaire-reply')
      .send({
        answers: [
          { question: 'Do you use AI in development?', answer: 'yes' },
          { question: 'Which tools?', answer: 'Claude Code' },
        ],
      })
      .expect(201);

    expect(response.body.id).toBe('reply-fixed-id');
    expect(typeof response.body.emailBody).toBe('string');
    expect(response.body.emailBody.length).toBeGreaterThan(0);
    expect(response.body.emailBody).toContain('reply-fixed-id');
  });

  it('returns 400 when the reply contains no answers', async () => {
    await request(app.getHttpServer())
      .post('/questionnaire-reply')
      .send({ answers: [] })
      .expect(400);
  });

  it('returns 400 when an answer field is blank', async () => {
    await request(app.getHttpServer())
      .post('/questionnaire-reply')
      .send({ answers: [{ question: '', answer: 'yes' }] })
      .expect(400);
  });
});
