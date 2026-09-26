import React, { useMemo, useState } from 'react';
import { AllVersionOption, Option } from '@site/src/constant/download.data';
import FormSelect from '../form-select/form-select';
import DownloadFormAllRelease from './download-form-all-release';
import DownloadFormTools from './download-form-tools';

const CORE_PROJECT = 'Doris Core';
const ARCHIVE_POPUP_CLASS = 'form-select-select--archive';

interface DownloadFormArchiveProps {
    /** Core branches that are no longer maintained. */
    coreVersions: AllVersionOption[];
    /** Ecosystem tools, each already reduced to its retired versions. */
    toolVersions: Option[];
}

/**
 * One card for everything Apache Doris no longer maintains.
 *
 * A single Project picker sits on top; the rest of the form is the existing
 * core / tool download form running in `bare` mode, so the archive reuses the
 * same link-building logic as the maintained sections rather than repeating it.
 */
export default function DownloadFormArchive({ coreVersions, toolVersions }: DownloadFormArchiveProps) {
    const projects = useMemo(
        () => [
            ...(coreVersions.length > 0 ? [{ label: CORE_PROJECT, value: CORE_PROJECT }] : []),
            ...toolVersions.map(tool => ({ label: tool.label, value: tool.value })),
        ],
        [coreVersions, toolVersions],
    );

    const [project, setProject] = useState<string>(projects[0]?.value ?? CORE_PROJECT);
    const selectedTool = toolVersions.find(tool => tool.value === project);

    if (projects.length === 0) return null;

    return (
        <div className="download-next__archive-card">
            <div className="download-next__archive-card-title">Archived download</div>
            <div className="download-next__archive-project">
                <FormSelect
                    placeholder="Project"
                    label="Project"
                    isCascader={false}
                    popupExtraClass={ARCHIVE_POPUP_CLASS}
                    options={projects}
                    value={project}
                    onChange={value => setProject(value as string)}
                />
            </div>
            {selectedTool ? (
                <DownloadFormTools key={project} bare tone="archive" data={[selectedTool]} />
            ) : (
                <DownloadFormAllRelease key={project} bare tone="archive" versions={coreVersions} />
            )}
        </div>
    );
}
