import Link, { Props } from '@docusaurus/Link';
import React, { ReactNode } from 'react';
import { ExternalLinkIcon } from '../Icons/external-link-icon';
import './external-link.scss';

interface ExternalLinkProps extends Props {
    label: string | ReactNode;
    linkIcon?: boolean | ReactNode;
    className?: string;
    disabled?: boolean;
}
export default function ExternalLink(props: ExternalLinkProps) {
    const { className = 'primary-btn', label, linkIcon = <ExternalLinkIcon />, disabled = false, ...rest } = props;

    const disabledProps = disabled
        ? {
              'aria-disabled': true,
              tabIndex: -1,
              onClick: (event: React.MouseEvent) => event.preventDefault(),
          }
        : {};

    return (
        <Link
            {...rest}
            {...disabledProps}
            className={`flex group items-center justify-center hover:no-underline external-link ${className} ${
                disabled ? 'is-disabled' : ''
            }`}
        >
            <span className="mr-2">{label}</span>
            <span className="transition-slide">{linkIcon}</span>
        </Link>
    );
}
