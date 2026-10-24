import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useLocalizedRoute} from '@site/src/utils/useLocalizedRoute';
import {localePath, rootBaseUrl} from '@site/src/utils/localizedRoute';

type Props = React.ComponentPropsWithoutRef<typeof Link> & {preserveLocale?: boolean};
const LocalizedLink = React.forwardRef<HTMLAnchorElement, Props>(function LocalizedLink(
    {to, href, preserveLocale, autoAddBaseUrl: _auto, ...props}, ref,
) {
    const resolve = useLocalizedRoute();
    const {i18n, siteConfig} = useDocusaurusContext();
    const resolved = resolve(to ?? href ?? '', {preserveLocale});
    const destination = resolved.href;
    const plain = destination.replace(/^pathname:\/\//, '');
    const info = localePath(plain.split(/[?#]/)[0], {url: siteConfig.url,
        baseUrl: rootBaseUrl(siteConfig.baseUrl, i18n.currentLocale, i18n.defaultLocale),
        defaultLocale: i18n.defaultLocale, locales: i18n.locales});
    const crossLocale = plain.startsWith('/') && info && info.locale !== i18n.currentLocale;
    const fullNavigation = crossLocale || resolved.reason === 'resource';
    return <Link {...props} {...(to !== undefined ? {to: fullNavigation ? `pathname://${plain}` : destination}
        : {href: fullNavigation ? `pathname://${plain}` : destination})} ref={ref} autoAddBaseUrl={false}
        {...(fullNavigation && {target: props.target ?? '_self'})} />;
});
export default LocalizedLink;
