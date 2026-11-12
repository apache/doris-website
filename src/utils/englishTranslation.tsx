// A build-time English body variant. This module never changes site translations.
import React from 'react';
import {interpolate} from '@docusaurus/Interpolate';
type Message = {id?: string; message?: string; description?: string};
export function translate({id, message}: Message, values?: Record<string, React.ReactNode>): any {
    return interpolate(message ?? id ?? '', values);
}
export default function Translate({children, id, values}: {children?: string; id?: string;
    description?: string; values?: Record<string, React.ReactNode>}) {
    return <>{interpolate(children ?? id ?? '', values)}</>;
}
