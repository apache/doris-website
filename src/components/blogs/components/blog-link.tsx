import React from 'react';
import './blog-link.css';

export function BlogLink(props: React.ComponentProps<'a'>) {
    return <a className="blog-item-link" {...props} />;
}