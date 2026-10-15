import React, { JSX } from 'react';
import { HackathonTaskPage } from '@site/src/components/course/hackathon/HackathonTaskPage';
import { A3_LOG_SEARCH } from '@site/src/components/course/hackathon/tasks/a3LogSearch';

export default function LogSearchTask(): JSX.Element {
    return <HackathonTaskPage content={A3_LOG_SEARCH} />;
}
