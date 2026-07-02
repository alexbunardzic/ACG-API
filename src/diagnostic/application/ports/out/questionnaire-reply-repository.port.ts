import { QuestionnaireReply } from '../../../domain/questionnaire-reply';

export interface QuestionnaireReplyRepository {
  save(reply: QuestionnaireReply): Promise<void>;
}

export const QUESTIONNAIRE_REPLY_REPOSITORY = Symbol('QuestionnaireReplyRepository');
