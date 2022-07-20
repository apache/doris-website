import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import React, { ReactNode } from 'react';
import ArrowIcon from '../Icons/arrow';
import './styles.scss';

interface MoreProps {
    link: string;
    text?: ReactNode;
}
export default function More(props: MoreProps) {
    const { link, text = <Translate id="learnmore">Learn More</Translate> } = props;
    return (
        <div className="more">
            <Link to={link}>
                {text}
                <ArrowIcon />
            </Link>
        </div>
    );
}
