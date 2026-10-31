import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import {trackRouteUpdate} from './tracking.cjs';

export default {
    onRouteDidUpdate(event) {
        if (ExecutionEnvironment.canUseDOM) trackRouteUpdate(window,event);
    },
};
