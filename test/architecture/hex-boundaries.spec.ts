import { filesOfProject } from 'tsarch';

const DIAGNOSTIC = 'src/diagnostic';

describe('Hexagonal boundaries — diagnostic module', () => {
  it('domain does not depend on application', async () => {
    const rule = filesOfProject()
      .inFolder(`${DIAGNOSTIC}/domain`)
      .shouldNot()
      .dependOnFiles()
      .inFolder(`${DIAGNOSTIC}/application`);

    await expect(rule).toPassAsync();
  });

  it('domain does not depend on adapters', async () => {
    const rule = filesOfProject()
      .inFolder(`${DIAGNOSTIC}/domain`)
      .shouldNot()
      .dependOnFiles()
      .inFolder(`${DIAGNOSTIC}/adapters`);

    await expect(rule).toPassAsync();
  });

  it('application does not depend on adapters', async () => {
    const rule = filesOfProject()
      .inFolder(`${DIAGNOSTIC}/application`)
      .shouldNot()
      .dependOnFiles()
      .inFolder(`${DIAGNOSTIC}/adapters`);

    await expect(rule).toPassAsync();
  });

  it('inbound adapters do not depend on outbound adapters', async () => {
    const rule = filesOfProject()
      .inFolder(`${DIAGNOSTIC}/adapters/in`)
      .shouldNot()
      .dependOnFiles()
      .inFolder(`${DIAGNOSTIC}/adapters/out`);

    await expect(rule).toPassAsync();
  });

  it('outbound adapters do not depend on inbound adapters', async () => {
    const rule = filesOfProject()
      .inFolder(`${DIAGNOSTIC}/adapters/out`)
      .shouldNot()
      .dependOnFiles()
      .inFolder(`${DIAGNOSTIC}/adapters/in`);

    await expect(rule).toPassAsync();
  });

  it('diagnostic module is free of cyclic dependencies', async () => {
    const rule = filesOfProject()
      .inFolder(DIAGNOSTIC)
      .should()
      .beFreeOfCycles();

    await expect(rule).toPassAsync();
  });
});
