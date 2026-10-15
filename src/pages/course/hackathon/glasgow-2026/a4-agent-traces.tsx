import React, { JSX } from 'react';
import { HackathonTaskPage } from '@site/src/components/course/hackathon/HackathonTaskPage';
import { A4_AGENT_TRACES } from '@site/src/components/course/hackathon/tasks/a4AgentTraces';

export default function AgentTracesTask(): JSX.Element {
    return <HackathonTaskPage content={A4_AGENT_TRACES} />;
}
