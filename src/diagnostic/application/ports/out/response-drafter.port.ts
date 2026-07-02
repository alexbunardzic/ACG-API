import { PreliminaryResponse } from '../../../domain/preliminary-response';
import { QuestionnaireReply } from '../../../domain/questionnaire-reply';

export interface ResponseDrafter {
  draft(reply: QuestionnaireReply): Promise<PreliminaryResponse>;
}

export const RESPONSE_DRAFTER = Symbol('ResponseDrafter');
