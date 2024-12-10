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
    return (
        <div className={`page-header bg-[#F7F9FE] pt-10 pb-20 ${props.className}`}>
            <h1 className="title text-[2rem] leading-normal lg:text-[2.75rem]">{props.title}</h1>
            <div className="subtitle mt-4">{props.subtitle}</div>
            {props?.extra && props?.extra}
        </div>
    );
}
