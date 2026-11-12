import React from 'react';
import ContentMetadata from '@site/src/components/ContentMetadata';
import useRouteContext from '@docusaurus/useRouteContext';
import {ContentRoutingProvider} from '@site/src/utils/contentRoute';
export default function ContentRoute({__nativeContent: Component, ...props}: {__nativeContent: React.ComponentType<any>; [key: string]: any}) {
    const route = useRouteContext();
    return <ContentRoutingProvider value={route.data ?? {}}><ContentMetadata /><Component {...props} /></ContentRoutingProvider>;
}
