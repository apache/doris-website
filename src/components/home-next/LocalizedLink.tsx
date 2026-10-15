import React from 'react';
import Link from '@docusaurus/Link';
import { localizedHomeLink } from '@site/src/utils/localization';

type Props = React.ComponentPropsWithoutRef<typeof Link>;

// pathname:// prevents SPA navigation, but Link still adds the locale base URL
// unless autoAddBaseUrl is disabled. English targets must opt out of both.
const LocalizedLink = React.forwardRef<HTMLAnchorElement, Props>(function LocalizedLink(
    { to, href, autoAddBaseUrl, ...props }, ref,
) {
    const destination = localizedHomeLink(to || href || '');
    const isEnglishTarget = destination.startsWith('pathname://');
    return (
        <Link
            {...props}
            {...(to ? { to: destination } : { href: destination })}
            ref={ref}
            autoAddBaseUrl={isEnglishTarget ? false : autoAddBaseUrl}
            target={isEnglishTarget ? props.target ?? '_self' : props.target}
            hrefLang={isEnglishTarget ? 'en' : props.hrefLang}
        />
    );
});

export default LocalizedLink;
