import React from 'react';

import footer from '@site/config/footer';
import FooterLinks from '@theme/Footer/Links';
import FooterLogo from '@theme/Footer/Logo';
import FooterCopyright from '@theme/Footer/Copyright';
import './styles.scss';
import { MailIcon } from '@site/src/components/Icons/mail';
import { GithubIcon } from '@site/src/components/Icons/github';
import { TwitterIcon } from '@site/src/components/Icons/twitter';
import { SlackIcon } from '@site/src/components/Icons/slack';
import { buildSlackEntryUrl } from '@site/src/components/slack-redirect/slack-attribution.logic';
import { DiscordIcon } from '@site/src/components/Icons/discord-icon';
import { YoutubeIcon } from '@site/src/components/Icons/youtube';
import { LinkedinIcon } from '@site/src/components/Icons/linkedin';
import { MediumIcon } from '@site/src/components/Icons/medium';

function Footer(): React.ReactElement {
    const { copyright, links, logo } = footer;

    return (
        <footer className="footer pt-16 pb-10" lang="en">
            <div className="container">
                <div className="footer-box">
                    <div className="left">
                        <FooterLogo logo={logo} />
                        <FooterLinks links={links} />
                    </div>
                    <div className="right">
                        <div className="footer__title">
                            Join the community
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
                                    href={buildSlackEntryUrl({ medium: 'website', content: 'footer' })}
                                    title="slack"
                                    target="_blank"
                                    className="item"
                                >
                                    <SlackIcon />
                                </a>
                            </div>
                            <div className="social">
                                <a
                                    href="https://www.youtube.com/hashtag/apachedoris"
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
                                 <a
                                    href="https://discord.gg/ATXQqX8g8F"
                                    title="discord"
                                    target="_blank"
                                    className="item"
                                >
                                    <DiscordIcon />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <FooterCopyright copyright={copyright} />
            </div>
        </footer>
    );
}

export default React.memo(Footer);
