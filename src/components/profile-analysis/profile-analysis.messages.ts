import {translate} from '@docusaurus/Translate';

// Present known client/service diagnostics in the page language. Keep parser,
// upload and recovery utilities independent of the site translation runtime.
export function localizeProfileMessage(message: string): string {
    const messages: Record<string, string> = {
        'Select a .txt file. Other file types are not supported.': translate({id: 'landing.profile.error.fileType', message: 'Select a .txt file. Other file types are not supported.'}),
        'Select only one Profile file at a time.': translate({id: 'landing.profile.error.oneFile', message: 'Select only one Profile file at a time.'}),
        'The selected file is larger than 100 MiB. Please provide a merged Profile.': translate({id: 'landing.profile.error.tooLarge', message: 'The selected file is larger than 100 MiB. Please provide a merged Profile.'}),
        'The Profile is still larger than 10 MiB after removing per-instance execution profiles. Please provide a merged Profile.': translate({id: 'landing.profile.error.mergedTooLarge', message: 'The Profile is still larger than 10 MiB after removing per-instance execution profiles. Please provide a merged Profile.'}),
        'The Profile could not be prepared for upload.': translate({id: 'landing.profile.error.prepare', message: 'The Profile could not be prepared for upload.'}),
        'This analysis cannot be restored after a page refresh in this browser.': translate({id: 'landing.profile.error.storage', message: 'This analysis cannot be restored after a page refresh in this browser.'}),
        'Complete the human verification before analyzing the Profile.': translate({id: 'landing.profile.error.captchaMissing', message: 'Complete the human verification before analyzing the Profile.'}),
        'Human verification failed or expired. Complete it again and retry.': translate({id: 'landing.profile.error.captchaInvalid', message: 'Human verification failed or expired. Complete it again and retry.'}),
        'Human verification is temporarily unavailable. Please try again later.': translate({id: 'landing.profile.error.captchaUnavailable', message: 'Human verification is temporarily unavailable. Please try again later.'}),
        'Verification expired. Complete it again.': translate({id: 'landing.profile.error.captchaExpired', message: 'Verification expired. Complete it again.'}),
        'Human verification could not load. Check your connection and try again.': translate({id: 'landing.profile.error.captchaLoad', message: 'Human verification could not load. Check your connection and try again.'}),
        'Unable to reach the profile analysis service. Please try again.': translate({id: 'landing.profile.error.network', message: 'Unable to reach the profile analysis service. Please try again.'}),
        'The profile analysis service returned an invalid response.': translate({id: 'landing.profile.error.response', message: 'The profile analysis service returned an invalid response.'}),
        'The previous analysis could not be recovered. Please select the file and try again.': translate({id: 'landing.profile.error.recover', message: 'The previous analysis could not be recovered. Please select the file and try again.'}),
        'Profile analysis failed. Please try again.': translate({id: 'landing.profile.error.failed', message: 'Profile analysis failed. Please try again.'}),
        'This execution graph is too large to display.': translate({id: 'landing.profile.error.graphTooLarge', message: 'This execution graph is too large to display.'}),
        'An execution graph is not available for this Profile.': translate({id: 'landing.profile.error.graphUnavailable', message: 'An execution graph is not available for this Profile.'}),
        'The execution graph could not be generated.': translate({id: 'landing.profile.error.graphFailed', message: 'The execution graph could not be generated.'}),
        'The execution graph parser timed out.': translate({id: 'landing.profile.error.graphTimeout', message: 'The execution graph parser timed out.'}),
        "The execution graph could not be laid out.": translate({id: "landing.profile.error.graphLayout", message: "The execution graph could not be laid out."}),
        "This browser cannot create a secure analysis request identifier.": translate({id: "landing.profile.error.secureId", message: "This browser cannot create a secure analysis request identifier."}),
        "The Profile contains a metric outside the supported numeric range.": translate({id: "landing.profile.error.metricRange", message: "The Profile contains a metric outside the supported numeric range."}),
        "The execution graph contains duplicate node IDs.": translate({id: "landing.profile.error.duplicateNodes", message: "The execution graph contains duplicate node IDs."}),
        "The execution graph contains an invalid edge.": translate({id: "landing.profile.error.invalidEdge", message: "The execution graph contains an invalid edge."}),
        "The execution graph contains a duplicate edge.": translate({id: "landing.profile.error.duplicateEdge", message: "The execution graph contains a duplicate edge."}),
        "The execution graph contains a cycle.": translate({id: "landing.profile.error.graphCycle", message: "The execution graph contains a cycle."}),
        "The prepared Profile is larger than 10 MiB.": translate({id: "landing.profile.error.preparedTooLarge", message: "The prepared Profile is larger than 10 MiB."}),
        "The Profile contains too many lines.": translate({id: "landing.profile.error.tooManyLines", message: "The Profile contains too many lines."}),
        "The Profile contains a line larger than 64 KiB.": translate({id: "landing.profile.error.longLine", message: "The Profile contains a line larger than 64 KiB."}),
        "The Profile contains too many Fragments.": translate({id: "landing.profile.error.tooManyFragments", message: "The Profile contains too many Fragments."}),
        "The Profile contains too many Pipelines.": translate({id: "landing.profile.error.tooManyPipelines", message: "The Profile contains too many Pipelines."}),
        "The execution graph contains too many nodes.": translate({id: "landing.profile.error.tooManyNodes", message: "The execution graph contains too many nodes."}),
        "The Profile has no usable MergedProfile operators.": translate({id: "landing.profile.error.noOperators", message: "The Profile has no usable MergedProfile operators."}),
        "The execution graph contains too many edges.": translate({id: "landing.profile.error.tooManyEdges", message: "The execution graph contains too many edges."}),
    };
    const known = messages[message];
    if (known) return known;
    const failure = /^Profile analysis failed \((.+)\)\. Please try again\.$/.exec(message);
    if (failure) return translate({id: 'landing.profile.error.serviceCode', message: 'Profile analysis failed ({code}). Please try again.'}, {code: failure[1]});
    return /[\u3400-\u9fff]/.test(message) ? message
        : translate({id: 'landing.profile.error.details', message: 'Details: {message}'}, {message});
}
