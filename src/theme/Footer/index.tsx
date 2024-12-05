import React, { useState, useEffect } from 'react';

import { useThemeConfig } from '@docusaurus/theme-common';
import FooterLinks from '@theme/Footer/Links';
import FooterLogo from '@theme/Footer/Logo';
import FooterCopyright from '@theme/Footer/Copyright';
import FooterLayout from '@theme/Footer/Layout';
import './styles.scss';
import { MailIcon } from '@site/src/components/Icons/mail';
import { GithubIcon } from '@site/src/components/Icons/github';
import { TwitterIcon } from '@site/src/components/Icons/twitter';
import { SlackIcon } from '@site/src/components/Icons/slack';
import { BilibiliIcon } from '@site/src/components/Icons/bilibili';
import { WechatIcon } from '@site/src/components/Icons/wechat';
import { YoutubeIcon } from '@site/src/components/Icons/youtube';
import { LinkedinIcon } from '@site/src/components/Icons/linkedin';
import { MediumIcon } from '@site/src/components/Icons/medium';
import Translate from '@docusaurus/Translate';
import Link from '@docusaurus/Link';

function Footer(): JSX.Element | null {
    const { footer } = useThemeConfig();
    if (!footer) {
        return null;
    }
    const { copyright, links, logo, style } = footer;

    const [isDocsPage, setIsDocsPage] = useState(false); // docs page or community page
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const pathname = location.pathname.split('/')[1];
            const docsPage =
                pathname === 'docs' ||
                location.pathname.includes('zh-CN/docs') ||
                location.pathname.includes('community');
            setIsDocsPage(docsPage);
        }
    }, [typeof window !== 'undefined' && location.pathname]);

    const ResourcesItems = (links.find(e => e.title === 'Resources')?.items || []) as any[];
    const CommunityItems = (links.find(e => e.title === 'Community')?.items || []) as any[];
    if (isDocsPage) {
        return (
            <div className="docs-footer flex-col lg:flex-row">
                <p className='docs-footer-p'>
                    The contents of this website are © 2024{' '}
                    <Link href="https://www.apache.org/">Apache Software Foundation</Link> under the terms of the{' '}
                    <Link href="https://www.apache.org/licenses/LICENSE-2.0.html">Apache License v2.</Link> Apache
                    Doris, Doris, and the Doris logo are either registered trademarks or trademarks of The Apache
                    Software Foundation in the United States and other countries.
                </p>
            </div>
        );
    }

    return (
        <div className="footer pt-16 pb-10">
            <div className="container">
                <div className="footer-box">
                    <div className="left">
                        <FooterLogo logo={logo} />
                        <FooterLinks links={links} />
                    </div>
                    <div className="right">
                        <div className="footer__title">
                            <Translate id="footer.follow" description="Footer Follow">
                                Join the community
                            </Translate>
                        </div>
                        <div className="social-list">
                            <div className="social">
                                <a href="mailto:dev@doris.apache.org" target="_blank" title="mail" className="item">
                                    <MailIcon />
                                </a>
                                <a
                                    href="https://github.com/apache/doris"
                                    target="_blank"
                                    title="github"
                                    className="item"
                                >
                                    <GithubIcon />
                                </a>
                                <a
                                    href="https://twitter.com/doris_apache"
                                    target="_blank"
                                    title="twitter"
                                    className="item"
                                >
                                    <TwitterIcon />
                                </a>
                                <a
                                    href="https://join.slack.com/t/apachedoriscommunity/shared_invite/zt-2unfw3a3q-MtjGX4pAd8bCGC1UV0sKcw"
                                    title="slack"
                                    target="_blank"
                                    className="item"
                                >
                                    <SlackIcon />
                                </a>
                            </div>
                            <div className="social">
                                <a
                                    href="https://www.youtube.com/@apachedoris/channels"
                                    title="youtube"
                                    target="_blank"
                                    className="item"
                                >
                                    <YoutubeIcon />
                                </a>
                                <a
                                    href="https://www.linkedin.com/company/doris-apache/"
                                    title="linkedin"
                                    target="_blank"
                                    className="item"
                                >
                                    <LinkedinIcon />
                                </a>
                                <a
                                    href="https://medium.com/@ApacheDoris"
                                    title="medium"
                                    target="_blank"
                                    className="item"
                                >
                                    <MediumIcon />
                                </a>
                                <a className="item wechat">
                                    <WechatIcon />
                                    <div className="wechat-dropdown">
                                        <p className="text-[#4c576c] text-xs">Connect on WeChat</p>
                                        <img src={require('@site/static/images/doris-wechat.png').default} alt="" />
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <FooterCopyright copyright={copyright} />
            </div>
        </div>
    );
}

export default React.memo(Footer);
