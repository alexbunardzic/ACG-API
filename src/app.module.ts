import { Module } from '@nestjs/common';
import { DiagnosticModule } from './diagnostic/diagnostic.module';

@Module({
  imports: [DiagnosticModule],
})
export class AppModule {}
