import React from 'react';
import './style.scss';

export function CoreCapabilitiesCard({ title, content, icon }: { title: string; content: string; icon: any }) {
    return (
        <div>
            <div className="core-capabilities-icon">{icon}</div>
            <div className="core-capabilities-card">
                <div className="title">{title}</div>
                <div className="content">{content}</div>
            </div>
        </div>
    );
}
