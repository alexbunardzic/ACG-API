# ACG-API

REST service layer for the [AI Craftspeople Guild](https://aicraftspeopleguild.github.io/acg-services.html) services (Diagnostic, Audit, Optimization, Continuous Security Assurance).

Built with **Hexagonal Architecture (Ports & Adapters)** and delivered under a **Test-Driven Navigation (TDN)** loop — a variant of TDD in which the human engineer is *on* the loop rather than *in* it: work is landed in reviewable checkpoints, each ending green across three test suites (unit, architecture, e2e).

## Status

Walking skeleton. One vertical slice is live end-to-end:

- `POST /questionnaire-reply` — accepts answers to the Diagnostic questionnaire, persists the reply, and returns a preliminary free-text email body produced by a `ResponseDrafter` port. Two adapters exist: `StubResponseDrafter` (canned body, always bound under test) and `ClaudeResponseDrafter` (real drafts via the Anthropic API, bound when `ANTHROPIC_API_KEY` is set — see [Where the Claude adapter plugs in](#where-the-claude-adapter-plugs-in)).

## Requirements

- Node 20+ (developed against 22)
- npm 10+

## Commands

```bash
npm install
npm test              # all three projects: unit + arch + e2e
npm run test:unit
npm run test:arch
npm run test:e2e
npm run build         # nest build → dist/
npm run start         # start the server (default :3000)
npm run start:dev     # watch mode
```

## Try the endpoint

```bash
curl -sX POST localhost:3000/questionnaire-reply \
  -H 'Content-Type: application/json' \
  -d '{"answers":[{"question":"Do you use AI in development?","answer":"yes"}]}'
```

Returns `201 { id, emailBody }`. Missing/empty answers return `400`.

## Architecture

One NestJS module per ACG service. Currently only `diagnostic/`. The layout inside each module is the same:

```
src/diagnostic/
  domain/                       # pure TS. No framework, no I/O.
  application/
    ports/in/                   # use-case interfaces + DI tokens
    ports/out/                  # repository/gateway interfaces + DI tokens
    services/                   # use-case implementations (pure TS)
  adapters/
    in/http/                    # NestJS controller + DTOs
    out/persistence/            # repositories
    out/drafter/                # response drafter (Claude adapter goes here)
    out/system/                 # clock, id generator
  diagnostic.module.ts          # composition root — the ONLY file that wires ports to adapters
```

The application service (`SubmitQuestionnaireReplyService`) is a plain class. It is *not* decorated with `@Injectable`. The composition root builds it via a `useFactory` provider that injects the four out-ports. This is what keeps the domain and application layers framework-free.

### Enforced architecture rules

All rules are executed as Jest specs under `test/architecture/`. They fail the build if violated.

Layer-boundary rules (via [`tsarch`](https://github.com/ts-arch/ts-arch), in `hex-boundaries.spec.ts`):

1. `domain/**` does not depend on `application/**`.
2. `domain/**` does not depend on `adapters/**`.
3. `application/**` does not depend on `adapters/**`.
4. `adapters/in/**` does not depend on `adapters/out/**`.
5. `adapters/out/**` does not depend on `adapters/in/**`.
6. The `diagnostic` module is free of cyclic dependencies.

Framework-isolation rule (custom scanner, in `no-framework-leak.spec.ts`):

7. Files under `domain/**` and `application/**` do not import `@nestjs/*`, `express`, or `supertest`.

Rule 7 is what makes the "application layer is framework-free" claim testable — tsarch's dependency graph does not reach external packages, so it is enforced by a small AST-free string scan over the layer's `.ts` files.

## Where the Claude adapter plugs in

The out-port `ResponseDrafter` (`src/diagnostic/application/ports/out/response-drafter.port.ts`) is the abstraction:

```ts
export interface ResponseDrafter {
  draft(reply: QuestionnaireReply): Promise<PreliminaryResponse>;
}
```

Two adapters implement it, both under `src/diagnostic/adapters/out/drafter/`:

- `StubResponseDrafter` — canned body, no I/O.
- `ClaudeResponseDrafter` — drafts the email with Claude via the Anthropic Messages API, using the `fetch` built into Node 20+ (no new dependency).

The binding is selected by `responseDrafterFromEnv` (`drafter.factory.ts`) in the composition root:

```bash
export ANTHROPIC_API_KEY=sk-ant-...     # enables the Claude adapter
export ACG_DRAFTER_MODEL=claude-sonnet-4-6   # optional override (default: claude-haiku-4-5)
npm run start
```

The default model is Haiku (`claude-haiku-4-5`): the draft is short and templated, the endpoint returns it synchronously (so drafting latency is user-facing), and Haiku is roughly 3x cheaper per token than Sonnet ($1/$5 vs $3/$15 per million input/output tokens). If the Diagnostic response later grows into deeper analysis, switching to Sonnet is a one-variable change, no deploy of new code.

Without the key the stub is bound, and under Jest (`NODE_ENV=test`) the stub is **always** bound — so `npm test` stays hermetic and key-free on any machine, exactly as the TDN loop requires.

Two properties of the Claude adapter worth knowing:

- **Untrusted input stays data.** Questionnaire answers are end-user text. The adapter passes them to the model as a fenced JSON payload with a system prompt that forbids treating their content as instructions, so a submitted answer like "ignore previous instructions" is summarised, not obeyed. A unit test pins this boundary.
- **No secrets in errors.** Provider failures surface as `status + statusText` only; the API key never appears in error messages or logs.

No domain, application, or controller code changed to add the second adapter. The arch tests and unit tests continue to run against the port; e2e tests exercise the module with the stub bound. This is the payoff of the ports-and-adapters shape.

## TDN loop

Each checkpoint ends in a state where:

- `npm test` is green across unit, arch, and e2e.
- `npm run build` produces a clean `dist/`.
- The next checkpoint's scope is a small, reviewable delta.

Checkpoints delivered so far:

1. Scaffold + architecture-test harness.
2. Domain (`QuestionnaireReply`, `PreliminaryResponse`, value objects, `DomainValidationError`) + application use case.
3. HTTP controller + in-memory persistence + system adapters + stub drafter, wired via `DiagnosticModule`.
4. CI-ready + README (this checkpoint).

## Diagrams

### ACG API Walking Skeleton Diagram

![ACG API Walking Skeleton](https://github.com/alexbunardzic/ACG-API/blob/main/acg-api-walking-skeleton.png)

All bindings above live in one file — DiagnosticModule.
       Swap StubResponseDrafter → ClaudeResponseDrafter there,
       and nothing else in the diagram changes.

**How to read this**

- Arrows point in the direction of source-code dependency.
- The double-lined box is the framework-free core. Everything inside it can be compiled and unit-tested without NestJS, Express, HTTP, or a database.
- Every outer-ring box (controllers, repositories, drafter, clock, id generator) depends inward on a port; the core never reaches out.
- DiagnosticModule (not drawn — it lives alongside all this) is the only file that knows about both a port and its adapter simultaneously. That's the composition root.

**What the arch tests actually check — the same arrows, in code:**

- No arrow ever crosses from an outer ring back into the core (rules 1–3).
- No arrow crosses between adapters/in and adapters/out (rules 4–5).
- No cycles (rule 6).
- Nothing inside the double-lined box imports @nestjs/*, express, or supertest (rule 7).

### ACG API Walking Skeleton Driver-Driven Diagram

![ACG API Walking Skeleton Driver-Driven Diagram](https://github.com/alexbunardzic/ACG-API/blob/main/acg-api-walking-skeleton-driver-driven.png)

**Reading the diagram**

- Runtime: control flows left-to-right. An HTTP request enters through a driving adapter, the driving port is invoked, the application calls out through driven ports, driven adapters do the I/O.
- Compile time: dependencies flow inward from both sides toward the core. The core doesn't know either side exists — it just publishes port interfaces. That's why swapping StubResponseDrafter for a Claude-backed one changes nothing on the driver side.

**ACG API Walking Skeleton Naming the Sides**

![ACG API Walking Skeleton Driver-Driven Diagram](https://github.com/alexbunardzic/ACG-API/blob/main/acg-api-walking-skeleton-naming-the-sides.png)

