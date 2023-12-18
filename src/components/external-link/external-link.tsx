import Link, { Props } from '@docusaurus/Link';
import React, { ReactNode } from 'react';
import { ExternalLinkIcon } from '../Icons/external-link-icon';
import './external-link.scss';

interface ExternalLinkProps extends Props {
    label: string | ReactNode;
    linkIcon?: boolean | ReactNode;
}
export default function ExternalLink(props: ExternalLinkProps) {
    const { className = 'primary-btn', label, linkIcon = <ExternalLinkIcon />, ...rest } = props;
    return (
        <Link {...rest} className={`flex items-center justify-center hover:no-underline external-link ${className}`}>
            {label}
            {linkIcon}
        </Link>
    );
}
