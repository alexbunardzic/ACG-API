import { promises as fs } from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..', '..');

const FORBIDDEN_IMPORTS: readonly string[] = [
  '@nestjs/',
  'express',
  'supertest',
];

async function collectTsFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return collectTsFiles(full);
      return entry.isFile() && full.endsWith('.ts') ? [full] : [];
    }),
  );
  return files.flat();
}

async function findLeaks(folder: string): Promise<string[]> {
  const abs = path.join(ROOT, folder);
  const files = await collectTsFiles(abs);
  const leaks: string[] = [];
  for (const file of files) {
    const source = await fs.readFile(file, 'utf8');
    for (const forbidden of FORBIDDEN_IMPORTS) {
      const pattern = new RegExp(
        `(?:import[\\s\\S]*?from|require\\()\\s*['"]${forbidden.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&',
        )}`,
      );
      if (pattern.test(source)) {
        leaks.push(`${path.relative(ROOT, file)} imports "${forbidden}"`);
      }
    }
  }
  return leaks;
}

describe('Framework isolation — diagnostic module', () => {
  it('domain does not import any web framework', async () => {
    const leaks = await findLeaks('src/diagnostic/domain');
    expect(leaks).toEqual([]);
  });

  it('application does not import any web framework', async () => {
    const leaks = await findLeaks('src/diagnostic/application');
    expect(leaks).toEqual([]);
  });
});
