import React from 'react';
import './style.scss';

interface PageHeaderProps {
    title: string;
}

export default function PageHeader(props: PageHeaderProps) {
    return (
        <div className="page-header">
            <h1 className="title">{props.title}</h1>
        </div>
    );
}
