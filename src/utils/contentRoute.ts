import {createContext, useContext} from 'react';
import type {ContentRouteData} from './translation';
import type {RouteGroup} from './localizedRoute';

export const ContentRoutingContext = createContext<{contentRoute?: ContentRouteData; navigationRoutes?: RouteGroup[]}>({});
export const ContentRoutingProvider = ContentRoutingContext.Provider;
export function useContentRouteData(): ContentRouteData | undefined {return useContext(ContentRoutingContext).contentRoute;}
export function useNavigationRoutes(): RouteGroup[] {
    // The same small shared family also serves core-owned search/404 routes,
    // which are rendered outside a native content plugin's route context.
    const navigation = require('@generated/doris-translation-status/default/navigation.json') as RouteGroup[];
    return useContext(ContentRoutingContext).navigationRoutes ?? navigation;
}
