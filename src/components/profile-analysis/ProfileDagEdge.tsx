import React, { JSX } from 'react';
import { BaseEdge, StepEdge, type EdgeProps } from '@xyflow/react';
import type { ProfileFlowEdge } from './profile-analysis.dag';

export function ProfileDagEdge(props: EdgeProps<ProfileFlowEdge>): JSX.Element {
    const { data, id, interactionWidth, markerEnd, markerStart, style } = props;

    if (!data?.elkPath) {
        return <StepEdge {...props} />;
    }

    return (
        <BaseEdge
            id={id}
            path={data.elkPath}
            markerStart={markerStart}
            markerEnd={markerEnd}
            interactionWidth={interactionWidth}
            style={style}
        />
    );
}
