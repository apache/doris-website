import React from 'react';
import './style.scss';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    extra?: any;
    [any: string]: any;
}

export default function PageHeader(props: PageHeaderProps) {
    const isBlog = props?.match?.path === '/blog';
    return (
        <div className={`page-header pb-[7.5rem] ${isBlog ? 'white pt-[7.5rem] ' : 'bg-[#F7F9FE] pt-20'}`}>
            <h1 className="title">{props.title}</h1>
            <div className="subtitle mt-6">{props.subtitle}</div>
            {props?.extra && props?.extra}
        </div>
    );
}
