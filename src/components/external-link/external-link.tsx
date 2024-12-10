import Link, { Props } from '@docusaurus/Link';
import React, { ReactNode } from 'react';
import { ExternalLinkIcon } from '../Icons/external-link-icon';
import './external-link.scss';

interface ExternalLinkProps extends Props {
    label: string | ReactNode;
    linkIcon?: boolean | ReactNode;
    className?: string;
}
export default function ExternalLink(props: ExternalLinkProps) {
    const { className = 'primary-btn', label, linkIcon = <ExternalLinkIcon />, ...rest } = props;
    return (
        <Link
            {...rest}
            className={`flex group items-center justify-center hover:no-underline external-link ${className}`}
        >
            <span className="mr-2">{label}</span>
            <span className="transition-slide">{linkIcon}</span>
        </Link>
    );
}
