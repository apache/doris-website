import clsx from 'clsx';
import React, { CSSProperties, ComponentProps, JSXElementConstructor, ReactNode } from 'react';
import './styles.scss';

interface PageColumnProps extends ComponentProps<JSXElementConstructor<any>> {
    align?: 'left' | 'center' | 'right';
    title: string | ReactNode;
    footer?: ReactNode;
    subTitle?: string | ReactNode;
    wrapperStyle?: CSSProperties;
}
export default function PageColumn(props: PageColumnProps): JSX.Element {
    const { align = 'center', title, footer, children, subTitle, wrapperStyle, className } = props;
    return (
        <div style={wrapperStyle} className={clsx('page-column', className, align, footer && 'has-footer')}>
            <h1 className="page-column-title">
                <div className="container">{title}</div>
            </h1>
            {subTitle && (
                <p className="sub-title">
                    <div className="container">{subTitle}</div>
                </p>
            )}
            <div className="page-column-container">
                <div className="container" style={props.style}>
                    {children}
                </div>
            </div>
            {footer && <div className="page-column-footer">{footer}</div>}
        </div>
    );
}
