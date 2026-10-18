const assert = require('node:assert/strict');
const {hash} = require('./state.cjs');
const {policy, inspectDocument} = require('./document-checks.cjs');
const {planIncremental} = require('./incremental-document.cjs');

// Three total attempts. Content validation on the last usable response is
// advisory; transport failures with no document cannot produce a candidate.
async function translateCandidate(options, request, metadata = {}) {
    const {source, onAttempt = () => {}} = options;
    const feedback = [], history = [];
    for (let attempt = 1; attempt <= 3; attempt++) {
        let result;
        try {
            const answer = await request(feedback);
            assert(typeof answer?.translation === 'string' && answer.translation.trim(), 'Model returned no translated document');
            result = await inspectDocument({...options, translation: answer.translation});
        } catch (error) {
            const issues = [{check: 'request', message: error.message}];
            history.push({attempt, issues});
            onAttempt({attempt, issues});
            feedback.push({attempt, issues});
            if (attempt === 3) throw new Error(`No usable document after three attempts: ${error.message}`);
            continue;
        }
        history.push({attempt, issues: result.issues});
        onAttempt({attempt, issues: result.issues});
        if (!result.issues.length || attempt === 3) {
            const generation = {policy, ...metadata, attempts: attempt, acceptedWithWarnings: result.issues.length > 0,
                sourceHash: hash(source), targetHash: hash(result.target), warnings: result.issues, history};
            return {target: result.target, requests: attempt, units: 0, reusedUnits: 0,
                targetChanged: result.target !== source, generation};
        }
        feedback.push({attempt, issues: result.issues});
    }
}

async function translateWholeDocument(options, metadata = {mode: 'full'}) {
    return translateCandidate(options, feedback => options.adapter.translateDocument({document: options.source,
        glossary: options.glossary, feedback}), metadata);
}

async function translateManagedDocument(options) {
    const {source, previousSource, previousTarget, adapter, glossary, baselineReason} = options;
    if (!previousSource || !previousTarget || baselineReason)
        return translateWholeDocument(options, {mode: 'full', reason: baselineReason || 'no-previous-translation'});
    const baseline = {previousSourceHash: hash(previousSource), previousTargetHash: hash(previousTarget)};
    const plan = await planIncremental(options);
    const metadata = {...baseline, mode: plan.mode, reason: plan.reason, sourceChange: plan.change};
    if (plan.mode === 'full' || typeof adapter.translateChanges !== 'function')
        return translateWholeDocument(options, {...metadata, mode: 'full',
            reason: plan.mode === 'full' ? plan.reason : 'adapter-does-not-support-incremental'});
    let requests = 0;
    const result = await translateCandidate({...options, preserveFormatting: true}, async feedback => {
        let answer = {translations: []};
        if (plan.changes.length) {
            requests++;
            answer = await adapter.translateChanges({document: source, changes: plan.changes, glossary, feedback});
        }
        return {translation: await plan.assemble(answer)};
    }, metadata);
    return {...result, requests, units: plan.changes.length + plan.reusedBlocks, reusedUnits: plan.reusedBlocks};
}

module.exports = {translateWholeDocument, translateManagedDocument};
