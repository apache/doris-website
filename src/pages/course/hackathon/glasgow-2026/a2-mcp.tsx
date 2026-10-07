import React, { JSX } from 'react';
import { HackathonTaskPage } from '@site/src/components/course/hackathon/HackathonTaskPage';
import { A2_MCP } from '@site/src/components/course/hackathon/tasks/a2Mcp';

export default function McpTask(): JSX.Element {
    return <HackathonTaskPage content={A2_MCP} />;
}
