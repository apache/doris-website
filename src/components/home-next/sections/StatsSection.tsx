import React, { JSX } from 'react';
import './StatsSection.scss';

interface UserLogo {
    name: string;
    file: string;
    href: string;
}

const USER_LOGOS: UserLogo[] = [
    { name: 'ByteDance',     file: 'Technology/ByteDance.jpg',            href: '' },
    { name: 'Xiaomi',        file: 'Technology/Xiaomi.jpg',               href: '' },
    { name: 'Baidu',         file: 'Technology/Baidu.jpg',                href: '' },
    { name: 'JD.com',        file: 'Technology/JD.com.jpg',               href: '' },
    { name: 'Tencent',       file: 'Technology/Tencent.jpg',              href: '' },
    { name: 'NIO',           file: 'Telecom & Manufacturing/NIO.jpg',     href: '' },
    { name: 'Lenovo',        file: 'Telecom & Manufacturing/Lenovo.jpg',  href: '' },
    { name: 'Bank of China', file: 'Finance/Bank of China.jpg',           href: '' },
    { name: 'Ping An',       file: 'Finance/Ping An Insurance Group.jpg', href: '' },
    { name: 'Meituan',       file: 'Media & Entertainment/Meituan.jpg',   href: '' },
    { name: 'TikTok',        file: 'Media & Entertainment/TikTok.jpg',    href: '' },
    { name: 'NetEase',       file: 'Media & Entertainment/NetEase.jpg',   href: '' },
];

function UserLogoItem({ logo }: { logo: UserLogo }): JSX.Element {
    const src = `/images/user-logo/${encodeURI(logo.file)}`;
    const content = (
        <img
            src={src}
            alt={logo.name}
            title={logo.name}
            loading="lazy"
            draggable={false}
        />
    );

    if (logo.href) {
        return (
            <a className="stats-next__user-logo" href={logo.href} aria-label={logo.name}>
                {content}
            </a>
        );
    }

    return (
        <span className="stats-next__user-logo stats-next__user-logo--placeholder">
            {content}
        </span>
    );
}

export function StatsSection(): JSX.Element {
    return (
        <section className="stats-next" aria-label="Companies using Apache Doris">
            <div className="stats-next__marquee">
                <div className="stats-next__track">
                    {[0, 1].map(copyIndex => (
                        <div className="stats-next__logo-set" key={copyIndex} aria-hidden={copyIndex === 1}>
                            {USER_LOGOS.map((logo, logoIndex) => (
                                <UserLogoItem key={`${copyIndex}-${logoIndex}`} logo={logo} />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
