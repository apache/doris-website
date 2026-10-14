// Print the locales whose translation state this checkout manages and whose
// build is enabled, so a workflow can verify every one of them without naming
// a language. The site configuration decides what a build serves; the
// translation configuration decides what state exists.
const {enabledLocales} = require('../../config/i18n');
const {managedLocales} = require('./state.cjs');

process.stdout.write(managedLocales(process.cwd(), enabledLocales()).join(' '));
