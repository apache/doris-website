import React from 'react';
import './style.scss';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    extra?: any;
    [any: string]: any;
    className?: string;
}

export default function PageHeader(props: PageHeaderProps) {
    const isBlog = props?.match?.path === '/blog';
    return (
        <div className={`page-header bg-[#F7F9FE] py-20 ${props.className}`}>
            <h1 className="title">{props.title}</h1>
            <div className="subtitle mt-6">{props.subtitle}</div>
            {props?.extra && props?.extra}
        </div>
    );
}
