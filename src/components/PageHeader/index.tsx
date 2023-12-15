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
        <div className={`page-header pb-[125px] ${isBlog ? 'white pt-[48px] ' : 'bg-[#F7F9FE] pt-[125px]'}`}>
            <h1 className="title">{props.title}</h1>
            <div className="subtitle mt-6">{props.subtitle}</div>
            {props?.extra && props?.extra}
        </div>
    );
}
