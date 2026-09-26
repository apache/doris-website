import React, { CSSProperties, JSX } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ProfileFlowNode } from './profile-analysis.dag';
import { formatDurationNs } from './profile-analysis.dag';

type HeatStyle = CSSProperties & {
    '--profile-dag-heat-border'?: string;
    '--profile-dag-heat-background'?: string;
    '--profile-dag-wait-width'?: string;
};

export function ProfileDagNode({ data }: NodeProps<ProfileFlowNode>): JSX.Element {
    if (data.kind !== 'operator') {
        return <div />;
    }

    const { node, pipelineLabel, instanceNum } = data;
    const execTime = node.timing?.execTime;
    const waitTime = node.timing?.waitTime;
    const heat = Math.pow(node.analysis?.heat ?? 0, 0.6);
    const waitHeat = node.analysis?.waitHeat ?? 0;
    const style: HeatStyle = {
        '--profile-dag-heat-border': `${Math.round(heat * 70)}%`,
        '--profile-dag-heat-background': `${Math.round(heat * 22)}%`,
        '--profile-dag-wait-width': `${Math.round(waitHeat * 100)}%`,
    };

    return (
        <article
            className={`profile-dag-node${node.analysis?.isBottleneck ? ' profile-dag-node--bottleneck' : ''}`}
            style={style}
            aria-label={`${node.label} operator`}
        >
            <Handle className="profile-dag-node__handle" type="source" position={Position.Top} isConnectable={false} />
            <Handle className="profile-dag-node__handle" type="target" position={Position.Bottom} isConnectable={false} />
            <div className="profile-dag-node__heading">
                <strong title={node.operatorType}>{node.label}</strong>
                {node.analysis?.isBottleneck && <span className="profile-dag-node__bottleneck">Bottleneck</span>}
            </div>
            <div className="profile-dag-node__location">
                <span>{node.fragmentId.replace('fragment:', 'Fragment ')}</span>
                <span>{pipelineLabel}</span>
                {instanceNum !== null && <span>{instanceNum} instances</span>}
            </div>
            <dl className="profile-dag-node__timing">
                <div>
                    <dt>Exec max</dt>
                    <dd>{formatDurationNs(execTime?.maxNs ?? null)}</dd>
                </div>
                <div>
                    <dt>Exec avg</dt>
                    <dd>{formatDurationNs(execTime?.avgNs ?? null)}</dd>
                </div>
                <div>
                    <dt>Wait max</dt>
                    <dd>{formatDurationNs(waitTime?.maxNs ?? null)}</dd>
                </div>
            </dl>
            <div className="profile-dag-node__wait" aria-hidden="true" />
        </article>
    );
}

export function ProfileDagFragmentNode({ data }: NodeProps<ProfileFlowNode>): JSX.Element {
    if (data.kind !== 'fragment') {
        return <div />;
    }

    return (
        <section className="profile-dag-fragment" aria-label={data.label}>
            <span>{data.label}</span>
        </section>
    );
}
