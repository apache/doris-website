import {translate} from '@docusaurus/Translate';
import {DownloadTypeEnum, Option} from '@site/src/constant/download.data';

// Localize presentation labels only. Values and download metadata stay canonical.
export const DOWNLOAD_TYPE_LABELS = {
    [DownloadTypeEnum.Binary]: translate({id: 'landing.download.binary', message: 'Binary'}),
    [DownloadTypeEnum.Source]: translate({id: 'landing.download.source', message: 'Source'}),
};

export const DOWNLOAD_UNAVAILABLE_LABEL = translate({id: 'landing.download.unavailable', message: 'Unavailable'});
export const DOWNLOAD_UNAVAILABLE_NOTE = translate({id: 'landing.download.unavailableNote',
    message: 'This file is currently unavailable. Choose another download option.'});
export const DOWNLOAD_DOCUMENT_UNAVAILABLE_NOTE = translate({id: 'landing.download.documentUnavailableNote',
    message: 'Some package downloads in this document are currently unavailable. The related download commands may not work until the files are restored.'});

export function localizeDownloadOptions(options: Option[]): Option[] {
    return options.map(option => {
        const compatibility = /^For (Flink|Spark) (.+)$/.exec(option.label);
        return {
            ...option,
            label: compatibility ? translate({id: 'landing.download.compatibility', message: 'For {engine} {version}'},
                {engine: compatibility[1], version: compatibility[2]}) : option.label,
            ...(option.children ? {children: localizeDownloadOptions(option.children)} : {}),
        };
    });
}
