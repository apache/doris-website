import React from 'react';
import {composeProviders} from '@docusaurus/theme-common';
import {
  ColorModeProvider,
  AnnouncementBarProvider,
  ScrollControllerProvider,
  NavbarProvider,
  PluginHtmlClassNameProvider,
} from '@docusaurus/theme-common/internal';
import {DocsPreferredVersionContextProvider} from '@docusaurus/plugin-content-docs/client';
import type {Props} from '@theme/Layout/Provider';
import {SlackCommunityNudge} from '@site/src/components/home-next/SlackCommunityNudge';

const Provider = composeProviders([
  ColorModeProvider,
  AnnouncementBarProvider,
  ScrollControllerProvider,
  DocsPreferredVersionContextProvider,
  PluginHtmlClassNameProvider,
  NavbarProvider,
]);

export default function LayoutProvider({children}: Props): JSX.Element {
  return (
    <Provider>
      {children}
      <SlackCommunityNudge />
    </Provider>
  );
}
