import clsx from 'clsx';
import React, { ComponentProps, JSXElementConstructor, ReactNode } from 'react';
import './styles.scss';

interface PageColumnProps extends ComponentProps<JSXElementConstructor<any>> {
    align?: 'left' | 'center' | 'right';
    title: string | ReactNode;
    footer?: ReactNode;
}
export default function PageColumn(props: PageColumnProps): JSX.Element {
    const { align = 'center', title, footer, children } = props;
    return (
        <div className={clsx('page-column', align, footer && 'has-footer')}>
            <h1 className="page-column-title">
                <div className="container">{title}</div>
            </h1>
            <div className="page-column-container">
                <div className="container" style={props.style}>
                    {children}
                </div>
            </div>
            {footer && <div className="page-column-footer">{footer}</div>}
        </div>
    );
}
