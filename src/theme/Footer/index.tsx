import React, { useEffect, useState } from 'react';
import { useThemeConfig } from '@docusaurus/theme-common';
import FooterLinks from '@theme/Footer/Links';
import FooterLogo from '@theme/Footer/Logo';
import FooterCopyright from '@theme/Footer/Copyright';
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

function Footer() {
    const { footer } = useThemeConfig();
    if (!footer) {
        return null;
    }
    const { copyright, links, logo, style } = footer;

    const [isDocsPage, setIsDocsPage] = useState(false);
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const pathname = location.pathname.split('/')[1];
            const docsPage = pathname === 'docs' || location.pathname.includes('zh-CN/docs');
            setIsDocsPage(docsPage);
        }
    }, [typeof window !== 'undefined' && location.pathname]);

    const ResourcesItems = (links.find(e => e.title === 'Resources')?.items || []) as any[];
    const CommunityItems = (links.find(e => e.title === 'Community')?.items || []) as any[];

    if (isDocsPage) {
        return (
            <div className="docs-footer flex-col lg:flex-row">
                <div className="logo w-full lg:w-[var(--doc-sidebar-width)] pt-28 lg:h-auto">
                    <FooterLogo logo={logo} />
                </div>
                <div className="content container">
                    <div className="my-7 text-[#8592A6] text-sm">
                        {/* border-b border-[#F7F9FE] */}
                        <div className="flex flex-col lg:flex-row pb-3 flex-wrap">
                            <div className=" w-40 mb-3 lg:mb-0 font-medium">RESOURCES</div>
                            {ResourcesItems.map(({ label, href }) => (
                                <Link className="w-40 no-underline mb-2" href={href}>
                                    {label}
                                </Link>
                            ))}
                        </div>
                        <div className="flex flex-col lg:flex-row pt-3 flex-wrap">
                            <div className="w-40 mb-3 lg:mb-0 font-medium">COMMUNITY</div>
                            {CommunityItems.map(({ label, href }) => (
                                <Link className="w-40 no-underline mb-2" href={href}>
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
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
