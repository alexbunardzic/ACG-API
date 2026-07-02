import { Module } from '@nestjs/common';

/**
 * Composition root for the Diagnostic service.
 * All wiring (use cases ↔ ports ↔ adapters) lives here so the
 * application and domain layers stay framework-free.
 */
@Module({
  controllers: [],
  providers: [],
})
export class DiagnosticModule {}
