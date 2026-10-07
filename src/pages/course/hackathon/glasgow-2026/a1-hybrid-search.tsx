import React, { JSX } from 'react';
import { HackathonTaskPage } from '@site/src/components/course/hackathon/HackathonTaskPage';
import { A1_HYBRID_SEARCH } from '@site/src/components/course/hackathon/tasks/a1HybridSearch';

export default function HybridSearchTask(): JSX.Element {
    return <HackathonTaskPage content={A1_HYBRID_SEARCH} />;
}
