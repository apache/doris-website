import React, { JSX } from 'react';
import SlackRedirect from '@site/src/components/slack-redirect/SlackRedirect';

// https://doris.apache.org/slack is the single public entry point to the
// community Slack. The page records the click (UTM + referrer) in the ASF
// Matomo instance and then forwards to the real invite link configured in
// docusaurus.config.js (customFields.slackInviteUrl).
export default function SlackPage(): JSX.Element {
    return <SlackRedirect />;
}
