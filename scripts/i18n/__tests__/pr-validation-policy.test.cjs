const test=require('node:test'),assert=require('node:assert/strict');
const {policy}=require('../ci-plan.cjs');
test('mixed PDF/download PR #4691 selects framework samples and only its native contract fixture',()=>{
    const files=['doc-tools/skills/add-release/scripts/validate-release.mjs','.github/workflows/manual-generate-pdf.yml',
        '.github/workflows/cron-deploy-website.yml','scripts/docs-pdf/generate.cjs','config/archived-docs.json',
        'scripts/i18n/docs-plugin.cjs','src/components/download-form-next/DownloadFormNext.tsx','i18n/ja/code.json','translations/pages/state.json'];
    const p=policy(files);
    assert.equal(p.mode,'sample');assert.equal(p.selection,'representative');assert.equal(p.publicationAllowed,false);
    assert.equal(p.runContentFixture,true);
    for(const flag of ['runBlogAutomationFixture','runSourceRevisionsFixture','runReleasePolicyFixture','runDocDatesFixture']) assert.equal(p[flag],false,flag);
});
test('framework and dependency changes sample; document changes select affected owners; tooling does not render docs',()=>{
    for(const file of ['src/scss/_variables.scss','docusaurus.config.js','package.json','yarn.lock','versions.json']){
        assert.equal(policy([file]).mode,'sample',file);assert.equal(policy([file]).selection,'representative',file);
    }
    for(const file of ['docs/topic.md','versioned_docs/version-4.x/topic.mdx','i18n/ja/docusaurus-plugin-content-docs/current/topic.md']){
        assert.equal(policy([file]).mode,'sample');assert.equal(policy([file]).selection,'changed');
    }
    for(const file of ['doc-tools/skills/release/script.mjs','.github/workflows/manual-generate-pdf.yml','scripts/docs-pdf/generate.cjs']) assert.equal(policy([file]).mode,'fixtures');
    assert.equal(policy(['docs/topic.md'],{forceFull:true}).mode,'full');
});
test('long regression suites are selected independently by their implementations',()=>{
    const cases=[['source-revisions','runSourceRevisionsFixture'],['automated-blog','runBlogAutomationFixture'],['release-policy','runReleasePolicyFixture']];
    for(const [file,flag]of cases){const p=policy([`scripts/i18n/${file}.cjs`]);assert.equal(p[flag],true);for(const [,other]of cases)if(other!==flag)assert.equal(p[other],false);}
});
