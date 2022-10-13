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
                                Follow
                            </Translate>
                        </div>
                        <div className="social-list">
                            <div className="social">
                                <a href="mailto:dev@doris.apache.org" title="mail" className="item">
                                    <MailIcon />
                                </a>
                                <a href="https://github.com/apache/doris" title="github" className="item">
                                    <GithubIcon />
                                </a>
                                <a href="https://twitter.com/doris_apache" title="twitter" className="item">
                                    <TwitterIcon />
                                </a>
                            </div>
                            <div className="social">
                                <a
                                    href="https://join.slack.com/t/apachedoriscommunity/shared_invite/zt-1h153f1ar-sTJB_QahY1SHvZdtPFoIOQ"
                                    title="slack"
                                    className="item"
                                >
                                    <SlackIcon />
                                </a>
                                <a href="https://space.bilibili.com/362350065" title="bilibili" className="item">
                                    <BilibiliIcon />
                                </a>
                                <a className="item wechat">
                                    <WechatIcon />
                                    <div className="wechat-dropdown">
                                        <img src={require('@site/static/images/wechat.png').default} alt="" />
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
