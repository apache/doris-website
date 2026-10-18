// Publication verifies enabled locales; PR admission must also check state for
// disabled locales. --all selects the translation configuration alone.
const {enabledLocales} = require('../../config/i18n');
const {managedLocales} = require('./state.cjs');

process.stdout.write(managedLocales(process.cwd(), process.argv.includes('--all') ? undefined : enabledLocales()).join(' '));
