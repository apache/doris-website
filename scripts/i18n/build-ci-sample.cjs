const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {buildLocales} = require('../build-locales.cjs');
async function main() {
    const planFile = path.resolve(process.argv[2] ?? '.i18n-build/ci-plan.json');
    const plan = JSON.parse(fs.readFileSync(planFile));
    assert.equal(plan.mode, 'sample');
    const report = await buildLocales({
        outDir: '.i18n-build/ci-sample/site',
        locales: plan.locales,
        samplePlan: planFile,
    });
    console.log(JSON.stringify(report));
}
if (require.main === module)
    main().catch(e => {
        console.error(e);
        process.exitCode = 1;
    });
