import { PreliminaryResponse } from '../../../domain/preliminary-response';

export interface AnswerInput {
  question: string;
  answer: string;
}

export interface SubmitQuestionnaireReplyCommand {
  answers: ReadonlyArray<AnswerInput>;
}

export interface SubmitQuestionnaireReply {
  submit(command: SubmitQuestionnaireReplyCommand): Promise<PreliminaryResponse>;
}

export const SUBMIT_QUESTIONNAIRE_REPLY = Symbol('SubmitQuestionnaireReply');
