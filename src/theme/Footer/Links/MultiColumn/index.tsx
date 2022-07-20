import React from 'react';
import LinkItem from '@theme/Footer/LinkItem';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Translate from '@docusaurus/Translate';
import { useAlternatePageUtils } from '@docusaurus/theme-common';
import NavbarItem from '@theme/NavbarItem';

function ColumnLinkItem({ item }) {
    return item.html ? (
        <li
            className="footer__item"
            // Developer provided the HTML, so assume it's safe.
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: item.html }}
        />
    ) : (
        <li key={item.href ?? item.to} className="footer__item">
            <LinkItem item={item} />
        </li>
    );
}
function Column({ column }) {
    return (
        <div className="col footer__col">
            <div className="footer__title">{column.title}</div>
            <ul className="footer__items clean-list">
                {column.items.map((item, i) => (
                    <ColumnLinkItem key={i} item={item} />
                ))}
            </ul>
        </div>
    );
}
export default function FooterLinksMultiColumn({ columns }) {
    const {
        i18n: { currentLocale, locales, localeConfigs },
    } = useDocusaurusContext();
    const alternatePageUtils = useAlternatePageUtils();

    const localeItems = locales.map(locale => {
        const to = `pathname://${alternatePageUtils.createUrl({
            locale,
            fullyQualified: false,
        })}`;
        return {
            label: localeConfigs[locale].label === 'EN' ? 'English' : '简体中文',
            to,
            target: '_self',
            autoAddBaseUrl: false,
        };
    });

    return (
        <div className="row footer__links">
            {columns.map((column, i) => (
                <Column key={i} column={column} />
            ))}
            <div className="col footer__col">
                <div className="footer__title">
                    <Translate id="footer.language" description="Footer Language">
                        Language
                    </Translate>
                </div>
                <ul className="footer__items clean-list">
                    {localeItems.map((item, i) => (
                        <li className="footer__item" key={i}>
                            <NavbarItem {...item} className="footer__link-item" />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
