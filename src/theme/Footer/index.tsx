import React from 'react';
import {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

import footer from '@site/config/footer';
import FooterLinks from '@theme/Footer/Links';
import FooterLogo from '@theme/Footer/Logo';
import FooterCopyright from '@theme/Footer/Copyright';
import './styles.scss';
import { MailIcon } from '@site/src/components/Icons/mail';
import { GithubIcon } from '@site/src/components/Icons/github';
import { TwitterIcon } from '@site/src/components/Icons/twitter';
import { SlackIcon } from '@site/src/components/Icons/slack';
import { buildCommunityEntryUrl, getCommunityName } from '@site/src/components/slack-redirect/slack-attribution.logic';
import { TelegramIcon } from '@site/src/components/Icons/telegram';
import { DiscordIcon } from '@site/src/components/Icons/discord-icon';
import { YoutubeIcon } from '@site/src/components/Icons/youtube';
import { LinkedinIcon } from '@site/src/components/Icons/linkedin';
import { MediumIcon } from '@site/src/components/Icons/medium';


function footerLabels(): Record<string, string> {
    return {
        'Foundation': translate({id: 'site.footer.1', message: 'Foundation'}),
        'License': translate({id: 'site.footer.2', message: 'License'}),
        'Events': translate({id: 'site.footer.3', message: 'Events'}),
        'Sponsorship': translate({id: 'site.footer.4', message: 'Sponsorship'}),
        'Privacy': translate({id: 'site.footer.5', message: 'Privacy'}),
        'Security': translate({id: 'site.footer.6', message: 'Security'}),
        'Thanks': translate({id: 'site.footer.7', message: 'Thanks'}),
        'Resources': translate({id: 'site.footer.8', message: 'Resources'}),
        'Download': translate({id: 'site.footer.9', message: 'Download'}),
        'Brand Assets': translate({id: 'site.footer.10', message: 'Brand Assets'}),
        'Blog': translate({id: 'site.footer.11', message: 'Blog'}),
        'Community': translate({id: 'site.footer.12', message: 'Community'}),
        'How to contribute': translate({id: 'site.footer.13', message: 'How to contribute'}),
        'Source code': translate({id: 'site.footer.14', message: 'Source code'}),
        'Doris team': translate({id: 'site.footer.15', message: 'Doris team'}),
        'Roadmap': translate({id: 'site.footer.16', message: 'Roadmap'}),
        'Improvement proposal': translate({id: 'site.footer.17', message: 'Improvement proposal'}),
    };
}

function Footer(): React.ReactElement {
    const { copyright, logo } = footer;
    const {i18n: {currentLocale}} = useDocusaurusContext();
    const communityName = getCommunityName(currentLocale);
    const labels = footerLabels();
    const links = footer.links.map(column => ({...column, title: labels[column.title] ?? column.title,
        items: column.items.map(item => ({...item, label: labels[item.label] ?? item.label}))}));

    return (
        <footer className="footer pt-16 pb-10" lang={currentLocale}>
            <div className="container">
                <div className="footer-box">
                    <div className="left">
                        <FooterLogo logo={logo} />
                        <FooterLinks links={links} />
                    </div>
                    <div className="right">
                        <div className="footer__title">
                            {translate({id: 'site.footer.join', message: 'Join the community'})}
                        </div>
                        <div className="social-list">
                            <div className="social">
                                <a href="mailto:dev@doris.apache.org" target="_blank" rel="noopener noreferrer" title="dev@doris.apache.org" aria-label="dev@doris.apache.org" className="item">
                                    <MailIcon />
                                </a>
                                <a
                                    href="https://github.com/apache/doris"
                                    target="_blank" rel="noopener noreferrer"
                                    title="Github" aria-label="Github"
                                    className="item"
                                >
                                    <GithubIcon />
                                </a>
                                <a
                                    href="https://twitter.com/doris_apache"
                                    target="_blank" rel="noopener noreferrer"
                                    title="X (Twitter)" aria-label="X (Twitter)"
                                    className="item"
                                >
                                    <TwitterIcon />
                                </a>
                                <a
                                    href={buildCommunityEntryUrl({ locale: currentLocale, medium: 'website', content: 'footer' })}
                                    title={communityName} aria-label={communityName}
                                    target="_blank" rel="noopener noreferrer"
                                    className="item"
                                >
                                    {communityName === 'Telegram' ? <TelegramIcon /> : <SlackIcon />}
                                </a>
                            </div>
                            <div className="social">
                                <a
                                    href="https://www.youtube.com/hashtag/apachedoris"
                                    title="Youtube" aria-label="Youtube"
                                    target="_blank" rel="noopener noreferrer"
                                    className="item"
                                >
                                    <YoutubeIcon />
                                </a>
                                <a
                                    href="https://www.linkedin.com/company/doris-apache/"
                                    title="Linkedin" aria-label="Linkedin"
                                    target="_blank" rel="noopener noreferrer"
                                    className="item"
                                >
                                    <LinkedinIcon />
                                </a>
                                <a
                                    href="https://medium.com/@ApacheDoris"
                                    title="Medium" aria-label="Medium"
                                    target="_blank" rel="noopener noreferrer"
                                    className="item"
                                >
                                    <MediumIcon />
                                </a>
                                 <a
                                    href="https://discord.gg/ATXQqX8g8F"
                                    title="Discord" aria-label="Discord"
                                    target="_blank" rel="noopener noreferrer"
                                    className="item"
                                >
                                    <DiscordIcon />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <div lang="en"><FooterCopyright copyright={copyright} /></div>
            </div>
        </footer>
    );
}

export default React.memo(Footer);
