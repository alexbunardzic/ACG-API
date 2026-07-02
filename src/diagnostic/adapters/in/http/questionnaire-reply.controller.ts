import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import { DomainValidationError } from '../../../domain/domain-validation.error';
import {
  AnswerInput,
  SUBMIT_QUESTIONNAIRE_REPLY,
  SubmitQuestionnaireReply,
} from '../../../application/ports/in/submit-questionnaire-reply.use-case';
import {
  AnswerRequest,
  SubmitQuestionnaireReplyRequest,
} from './dto/submit-questionnaire-reply.request';
import { SubmitQuestionnaireReplyResponse } from './dto/submit-questionnaire-reply.response';

@Controller('questionnaire-reply')
export class QuestionnaireReplyController {
  constructor(
    @Inject(SUBMIT_QUESTIONNAIRE_REPLY)
    private readonly useCase: SubmitQuestionnaireReply,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async submit(
    @Body() body: SubmitQuestionnaireReplyRequest,
  ): Promise<SubmitQuestionnaireReplyResponse> {
    const answers = this.parseAnswers(body?.answers);

    try {
      const response = await this.useCase.submit({ answers });
      return { id: response.replyId.value, emailBody: response.emailBody };
    } catch (err) {
      if (err instanceof DomainValidationError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }

  private parseAnswers(raw: unknown): ReadonlyArray<AnswerInput> {
    if (!Array.isArray(raw)) {
      throw new BadRequestException('`answers` must be an array');
    }
    return raw.map((item: AnswerRequest, index) => {
      if (typeof item !== 'object' || item === null) {
        throw new BadRequestException(`answers[${index}] must be an object`);
      }
      const question = item.question;
      const answer = item.answer;
      if (typeof question !== 'string' || typeof answer !== 'string') {
        throw new BadRequestException(
          `answers[${index}] must have string \`question\` and \`answer\``,
        );
      }
      return { question, answer };
    });
  }
}
