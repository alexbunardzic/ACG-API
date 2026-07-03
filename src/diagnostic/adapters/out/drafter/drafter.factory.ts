import { ResponseDrafter } from '../../../application/ports/out/response-drafter.port';
import { ClaudeResponseDrafter, claudeDrafterEnabled } from './claude-response-drafter';
import { StubResponseDrafter } from './stub-response-drafter';

/**
 * Environment-driven drafter selection, kept beside the adapters so the
 * composition root never handles credentials directly. Claude when
 * ANTHROPIC_API_KEY is set (and not under test — Jest sets NODE_ENV=test,
 * so `npm test` stays hermetic even with a key exported); stub otherwise.
 */
export function responseDrafterFromEnv(env: NodeJS.ProcessEnv): ResponseDrafter {
  if (!claudeDrafterEnabled(env)) {
    return new StubResponseDrafter();
  }
  return new ClaudeResponseDrafter({
    apiKey: env.ANTHROPIC_API_KEY as string,
    model: env.ACG_DRAFTER_MODEL,
  });
}
