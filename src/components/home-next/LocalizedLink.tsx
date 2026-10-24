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
    const destination = resolve(to ?? href ?? '', {preserveLocale}).href;
    const plain = destination.replace(/^pathname:\/\//, '');
    const info = localePath(plain.split(/[?#]/)[0], {url: siteConfig.url,
        baseUrl: rootBaseUrl(siteConfig.baseUrl, i18n.currentLocale, i18n.defaultLocale),
        defaultLocale: i18n.defaultLocale, locales: i18n.locales});
    const crossLocale = plain.startsWith('/') && info && info.locale !== i18n.currentLocale;
    return <Link {...props} {...(to !== undefined ? {to: crossLocale ? `pathname://${plain}` : destination}
        : {href: crossLocale ? `pathname://${plain}` : destination})} ref={ref} autoAddBaseUrl={false}
        {...(crossLocale && {target: props.target ?? '_self'})} />;
});
export default LocalizedLink;
