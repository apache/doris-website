import React from 'react';
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

import Translate from '@docusaurus/Translate';

function Footer() {
    const { footer } = useThemeConfig();
    if (!footer) {
        return null;
    }
    const { copyright, links, logo, style } = footer;
    return (
        <div className="footer">
            <div className="container">
                <div className="footer-box">
                    <div className="left">
                        <FooterLogo logo={logo} />
                        <FooterLinks links={links} />
                    </div>
                    <div className="right">
                        <div className="footer__title">
                            <Translate id="footer.follow" description="Footer Follow">
                                Connect with Us
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
                            </div>
                            <div className="social">
                                <a
                                    href="https://join.slack.com/t/apachedoriscommunity/shared_invite/zt-28il1o2wk-DD6LsLOz3v4aD92Mu0S0aQ"
                                    title="slack"
                                    target="_blank"
                                    className="item"
                                >
                                    <SlackIcon />
                                </a>
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
