import React, { JSX } from 'react';
import CommunityRedirect from '@site/src/components/slack-redirect/SlackRedirect';

// Stable public entry point; rotate customFields.telegramInviteUrl in config.
export default function TelegramPage(): JSX.Element {
    return <CommunityRedirect channel="Telegram" />;
}
