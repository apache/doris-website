// Run the default branch's tooling against PR data, in a read-only job.
const fs = require('node:fs');
const {execFileSync} = require('node:child_process');
const {buildAiReviewPacket} = require('../../scripts/docs-governance/prepare-ai-review');
const {runChecks} = require('../../scripts/docs-governance/report');
const {renderDocsAiReviewComment} = require('../../scripts/docs-governance/render-ai-review-comment');

const [rootDir, output] = process.argv.slice(2);
const base = process.env.BASE_SHA;
const head = process.env.HEAD_SHA;
if (!rootDir || !output || !/^[a-f0-9]{40}$/.test(base) || !/^[a-f0-9]{40}$/.test(head)) {
    throw new Error('Expected a PR directory, output file, and exact commit SHAs');
}
const changedFiles = execFileSync('git', ['diff', '--no-renames', '--name-only', '-z', `${base}...${head}`],
    {cwd: rootDir, encoding: 'utf8'}).split('\0').filter(Boolean);
// Do not interpolate PR paths into the CLI's comma-separated --files syntax.
const packet = buildAiReviewPacket({rootDir, changedFiles, base});
const report = runChecks({rootDir, changedFiles});
const body = renderDocsAiReviewComment({packet, report, baseSha: base, headSha: head});
fs.writeFileSync(output, JSON.stringify({body}));
