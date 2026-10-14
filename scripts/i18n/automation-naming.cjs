// The names the translation automation uses to recognise its own work. They
// follow the locale and the language name declared in translations/config.json,
// and they must stay stable: an open draft pull request is matched by its branch
// prefix and its body marker, so renaming either orphans every run already in
// flight. A new language gets its own names automatically.
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const botBranchFor = locale => `i18n/${locale}-automated-`;

function botBranchPattern(locale) {
    return new RegExp(`^${escapeRegExp(botBranchFor(locale))}[0-9]+$`);
}

// The ownership marker a generated PR body carries, with the head commit that
// generation produced. `bot-head=PENDING` is replaced once the branch exists.
const markerPrefixFor = language => `<!-- ${language.toLowerCase()}-translation-automation:v1 bot-head=`;

function ownershipMarker(language, head) {
    return new RegExp(`${escapeRegExp(markerPrefixFor(language))}([a-f0-9]{40}) -->`);
}

module.exports = {botBranchFor, botBranchPattern, markerPrefixFor, ownershipMarker};
