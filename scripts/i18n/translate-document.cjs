const assert = require('node:assert/strict');
const {hash} = require('./state.cjs');
const {policy, inspectDocument} = require('./document-checks.cjs');

// Three total attempts. Content validation on the last usable response is
// advisory; transport failures with no document cannot produce a candidate.
async function translateWholeDocument(options) {
    const {source, adapter, onAttempt = () => {}} = options;
    const feedback = [], history = [];
    for (let attempt = 1; attempt <= 3; attempt++) {
        let result;
        try {
            const answer = await adapter.translateDocument({document: source, glossary: options.glossary, feedback});
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
            const generation = {policy, attempts: attempt, acceptedWithWarnings: result.issues.length > 0,
                sourceHash: hash(source), targetHash: hash(result.target), warnings: result.issues, history};
            return {target: result.target, requests: attempt, units: 0, reusedUnits: 0,
                targetChanged: result.target !== source, generation};
        }
        feedback.push({attempt, issues: result.issues});
    }
}

module.exports = {translateWholeDocument};
