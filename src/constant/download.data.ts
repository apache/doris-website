export interface Option {
    label: string;
    value: string;
    link?: string;
    sourceLink?: string;
    children?: Option[];
    majorVersion?: string;
}

export enum CPUEnum {
    X64 = 'x64 (avx2)',
    X64NoAvx2 = 'x64 (no avx2)',
    ARM64 = 'arm64',
}

export enum SuffixEnum {
    GZ = '.tar.gz',
    ASC = '.tar.gz.asc',
    SHA512 = '.tar.gz.sha512',
}

const ORIGIN = 'https://apache-doris-releases.oss-accelerate.aliyuncs.com/';

export const DORIS_VERSIONS: Option[] = [
    {
        label: '2.0.3',
        value: '2.0.3',
        majorVersion: '2.0',
        children: [
            {
                label: CPUEnum.X64,
                value: CPUEnum.X64,
                children: [
                    {
                        label: SuffixEnum.GZ,
                        value: SuffixEnum.GZ,
                        link: `${ORIGIN}apache-doris-2.0.3-bin-x64.tar.gz`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.3/apache-doris-2.0.3-src.tar.gz',
                    },
                    {
                        label: SuffixEnum.ASC,
                        value: SuffixEnum.ASC,
                        link: `${ORIGIN}apache-doris-2.0.3-bin-x64.tar.gz.asc`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.3/apache-doris-2.0.3-src.tar.gz.asc',
                    },
                    {
                        label: SuffixEnum.SHA512,
                        value: SuffixEnum.SHA512,
                        link: `${ORIGIN}apache-doris-2.0.3-bin-x64.tar.gz.sha512`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.3/apache-doris-2.0.3-src.tar.gz.sha512',
                    },
                ],
            },
            {
                label: CPUEnum.X64NoAvx2,
                value: CPUEnum.X64NoAvx2,
                children: [
                    {
                        label: SuffixEnum.GZ,
                        value: SuffixEnum.GZ,
                        link: `${ORIGIN}apache-doris-2.0.3-bin-x64-noavx2.tar.gz`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.3/apache-doris-2.0.3-src.tar.gz',
                    },
                    {
                        label: SuffixEnum.ASC,
                        value: SuffixEnum.ASC,
                        link: `${ORIGIN}apache-doris-2.0.3-bin-x64-noavx2.tar.gz.asc`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.3/apache-doris-2.0.3-src.tar.gz.asc',
                    },
                    {
                        label: SuffixEnum.SHA512,
                        value: SuffixEnum.SHA512,
                        link: `${ORIGIN}apache-doris-2.0.3-bin-x64-noavx2.tar.gz.sha512`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.3/apache-doris-2.0.3-src.tar.gz.sha512',
                    },
                ],
            },
            {
                label: CPUEnum.ARM64,
                value: CPUEnum.ARM64,
                children: [
                    {
                        label: SuffixEnum.GZ,
                        value: SuffixEnum.GZ,
                        link: `${ORIGIN}apache-doris-2.0.3-bin-arm64.tar.gz`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.3/apache-doris-2.0.3-src.tar.gz',
                    },
                    {
                        label: SuffixEnum.ASC,
                        value: SuffixEnum.ASC,
                        link: `${ORIGIN}apache-doris-2.0.3-bin-arm64.tar.gz.asc`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.3/apache-doris-2.0.3-src.tar.gz.asc',
                    },
                    {
                        label: SuffixEnum.SHA512,
                        value: SuffixEnum.SHA512,
                        link: `${ORIGIN}apache-doris-2.0.3-bin-arm64.tar.gz.sha512`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.3/apache-doris-2.0.3-src.tar.gz.sha512',
                    },
                ],
            },
        ],
    },
    {
        label: '2.0.2',
        value: '2.0.2',
        majorVersion: '2.0',
        children: [
            {
                label: CPUEnum.X64,
                value: CPUEnum.X64,
                children: [
                    {
                        label: SuffixEnum.GZ,
                        value: SuffixEnum.GZ,
                        link: `${ORIGIN}apache-doris-2.0.2-bin-x64.tar.gz`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.2/apache-doris-2.0.2-src.tar.gz',
                    },
                    {
                        label: SuffixEnum.ASC,
                        value: SuffixEnum.ASC,
                        link: `${ORIGIN}apache-doris-2.0.3-bin-x64.tar.gz.asc`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.2/apache-doris-2.0.2-src.tar.gz.asc',
                    },
                    {
                        label: SuffixEnum.SHA512,
                        value: SuffixEnum.SHA512,
                        link: `${ORIGIN}apache-doris-2.0.2-bin-x64.tar.gz.sha512`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.2/apache-doris-2.0.2-src.tar.gz.sha512',
                    },
                ],
            },
            {
                label: CPUEnum.X64NoAvx2,
                value: CPUEnum.X64NoAvx2,
                children: [
                    {
                        label: SuffixEnum.GZ,
                        value: SuffixEnum.GZ,
                        link: `${ORIGIN}apache-doris-2.0.2-bin-x64-noavx2.tar.gz`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.2/apache-doris-2.0.2-src.tar.gz',
                    },
                    {
                        label: SuffixEnum.ASC,
                        value: SuffixEnum.ASC,
                        link: `${ORIGIN}apache-doris-2.0.2-bin-x64-noavx2.tar.gz.asc`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.2/apache-doris-2.0.2-src.tar.gz.asc',
                    },
                    {
                        label: SuffixEnum.SHA512,
                        value: SuffixEnum.SHA512,
                        link: `${ORIGIN}apache-doris-2.0.2-bin-x64-noavx2.tar.gz.sha512`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.2/apache-doris-2.0.2-src.tar.gz.sha512',
                    },
                ],
            },
            {
                label: CPUEnum.ARM64,
                value: CPUEnum.ARM64,
                children: [
                    {
                        label: SuffixEnum.GZ,
                        value: SuffixEnum.GZ,
                        link: `${ORIGIN}apache-doris-2.0.2-bin-arm64.tar.gz`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.2/apache-doris-2.0.2-src.tar.gz',
                    },
                    {
                        label: SuffixEnum.ASC,
                        value: SuffixEnum.ASC,
                        link: `${ORIGIN}apache-doris-2.0.2-bin-arm64.tar.gz.asc`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.2/apache-doris-2.0.2-src.tar.gz.asc',
                    },
                    {
                        label: SuffixEnum.SHA512,
                        value: SuffixEnum.SHA512,
                        link: `${ORIGIN}apache-doris-2.0.2-bin-arm64.tar.gz.sha512`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.2/apache-doris-2.0.2-src.tar.gz.sha512',
                    },
                ],
            },
        ],
    },
    {
        label: '2.0.1',
        value: '2.0.1',
        majorVersion: '2.0',
        children: [
            {
                label: CPUEnum.X64,
                value: CPUEnum.X64,
                children: [
                    {
                        label: SuffixEnum.GZ,
                        value: SuffixEnum.GZ,
                        link: `${ORIGIN}apache-doris-2.0.1.1-bin-x64.tar.gz`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.1.1/apache-doris-2.0.1.1-src.tar.gz',
                    },
                    {
                        label: SuffixEnum.ASC,
                        value: SuffixEnum.ASC,
                        link: `${ORIGIN}apache-doris-2.0.1.1-bin-x64.tar.gz.asc`,
                        sourceLink:
                            'https://downloads.apache.org/doris/2.0/2.0.1.1/apache-doris-2.0.1.1-src.tar.gz.asc',
                    },
                    {
                        label: SuffixEnum.SHA512,
                        value: SuffixEnum.SHA512,
                        link: `${ORIGIN}apache-doris-2.0.1.1-bin-x64.tar.gz.sha512`,
                        sourceLink:
                            'https://downloads.apache.org/doris/2.0/2.0.1.1/apache-doris-2.0.1.1-src.tar.gz.sha512',
                    },
                ],
            },
            {
                label: CPUEnum.X64NoAvx2,
                value: CPUEnum.X64NoAvx2,
                children: [
                    {
                        label: SuffixEnum.GZ,
                        value: SuffixEnum.GZ,
                        link: `${ORIGIN}apache-doris-2.0.1.1-bin-x64-noavx2.tar.gz`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.1.1/apache-doris-2.0.1.1-src.tar.gz',
                    },
                    {
                        label: SuffixEnum.ASC,
                        value: SuffixEnum.ASC,
                        link: `${ORIGIN}apache-doris-2.0.1.1-bin-x64-noavx2.tar.gz.asc`,
                        sourceLink:
                            'https://downloads.apache.org/doris/2.0/2.0.1.1/apache-doris-2.0.1.1-src.tar.gz.asc',
                    },
                    {
                        label: SuffixEnum.SHA512,
                        value: SuffixEnum.SHA512,
                        link: `${ORIGIN}apache-doris-2.0.1.1-bin-x64-noavx2.tar.gz.sha512`,
                        sourceLink:
                            'https://downloads.apache.org/doris/2.0/2.0.1.1/apache-doris-2.0.1.1-src.tar.gz.sha512',
                    },
                ],
            },
            {
                label: CPUEnum.ARM64,
                value: CPUEnum.ARM64,
                children: [
                    {
                        label: SuffixEnum.GZ,
                        value: SuffixEnum.GZ,
                        link: `${ORIGIN}apache-doris-2.0.1.1-bin-arm64.tar.gz`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.1.1/apache-doris-2.0.1.1-src.tar.gz',
                    },
                    {
                        label: SuffixEnum.ASC,
                        value: SuffixEnum.ASC,
                        link: `${ORIGIN}apache-doris-2.0.1.1-bin-arm64.tar.gz.asc`,
                        sourceLink:
                            'https://downloads.apache.org/doris/2.0/2.0.1.1/apache-doris-2.0.1.1-src.tar.gz.asc',
                    },
                    {
                        label: SuffixEnum.SHA512,
                        value: SuffixEnum.SHA512,
                        link: `${ORIGIN}apache-doris-2.0.1.1-bin-arm64.tar.gz.sha512`,
                        sourceLink:
                            'https://downloads.apache.org/doris/2.0/2.0.1.1/apache-doris-2.0.1.1-src.tar.gz.sha512',
                    },
                ],
            },
        ],
    },
    {
        label: '2.0.0',
        value: '2.0.0',
        majorVersion: '2.0',
        children: [
            {
                label: CPUEnum.X64,
                value: CPUEnum.X64,
                children: [
                    {
                        label: SuffixEnum.GZ,
                        value: SuffixEnum.GZ,
                        link: `${ORIGIN}apache-doris-2.0.0-bin-x64.tar.gz`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.0/apache-doris-2.0.0-src.tar.gz',
                    },
                    {
                        label: SuffixEnum.ASC,
                        value: SuffixEnum.ASC,
                        link: `${ORIGIN}apache-doris-2.0.0-bin-x64.tar.gz.asc`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.0/apache-doris-2.0.0-src.tar.gz.asc',
                    },
                    {
                        label: SuffixEnum.SHA512,
                        value: SuffixEnum.SHA512,
                        link: `${ORIGIN}apache-doris-2.0.0-bin-x64.tar.gz.sha512`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.0/apache-doris-2.0.0-src.tar.gz.sha512',
                    },
                ],
            },
            {
                label: CPUEnum.X64NoAvx2,
                value: CPUEnum.X64NoAvx2,
                children: [
                    {
                        label: SuffixEnum.GZ,
                        value: SuffixEnum.GZ,
                        link: `${ORIGIN}apache-doris-2.0.0-bin-x64-noavx2.tar.gz`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.0/apache-doris-2.0.0-src.tar.gz',
                    },
                    {
                        label: SuffixEnum.ASC,
                        value: SuffixEnum.ASC,
                        link: `${ORIGIN}apache-doris-2.0.0-bin-x64-noavx2.tar.gz.asc`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.0/apache-doris-2.0.0-src.tar.gz.asc',
                    },
                    {
                        label: SuffixEnum.SHA512,
                        value: SuffixEnum.SHA512,
                        link: `${ORIGIN}apache-doris-2.0.0-bin-x64-noavx2.tar.gz.sha512`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.0/apache-doris-2.0.0-src.tar.gz.sha512',
                    },
                ],
            },
            {
                label: CPUEnum.ARM64,
                value: CPUEnum.ARM64,
                children: [
                    {
                        label: SuffixEnum.GZ,
                        value: SuffixEnum.GZ,
                        link: `${ORIGIN}apache-doris-2.0.0-bin-arm64.tar.gz`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.0/apache-doris-2.0.0-src.tar.gz',
                    },
                    {
                        label: SuffixEnum.ASC,
                        value: SuffixEnum.ASC,
                        link: `${ORIGIN}apache-doris-2.0.0-bin-arm64.tar.gz.asc`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.0/apache-doris-2.0.0-src.tar.gz.asc',
                    },
                    {
                        label: SuffixEnum.SHA512,
                        value: SuffixEnum.SHA512,
                        link: `${ORIGIN}apache-doris-2.0.0-bin-arm64.tar.gz.sha512`,
                        sourceLink: 'https://downloads.apache.org/doris/2.0/2.0.0/apache-doris-2.0.0-src.tar.gz.sha512',
                    },
                ],
            },
        ],
    },
    {
        label: '1.2.7',
        value: '1.2.7',
        majorVersion: '1.2',
        children: [
            {
                label: CPUEnum.X64,
                value: CPUEnum.X64,
                children: [
                    {
                        label: SuffixEnum.GZ,
                        value: SuffixEnum.GZ,
                        link: `${ORIGIN}apache-doris-1.2.7.1-bin-x64.tar.gz`,
                        sourceLink: 'https://downloads.apache.org/doris/1.2/1.2.7.1/apache-doris-1.2.7.1-src.tar.gz',
                    },
                    {
                        label: SuffixEnum.ASC,
                        value: SuffixEnum.ASC,
                        link: `${ORIGIN}apache-doris-1.2.7.1-bin-x64.tar.gz.asc`,
                        sourceLink:
                            'https://downloads.apache.org/doris/1.2/1.2.7.1/apache-doris-1.2.7.1-src.tar.gz.asc',
                    },
                    {
                        label: SuffixEnum.SHA512,
                        value: SuffixEnum.SHA512,
                        link: `${ORIGIN}apache-doris-1.2.7.1-bin-x64.tar.gz.sha512`,
                        sourceLink:
                            'https://downloads.apache.org/doris/1.2/1.2.7.1/apache-doris-1.2.7.1-src.tar.gz.sha512',
                    },
                ],
            },
            {
                label: CPUEnum.X64NoAvx2,
                value: CPUEnum.X64NoAvx2,
                children: [
                    {
                        label: SuffixEnum.GZ,
                        value: SuffixEnum.GZ,
                        link: `${ORIGIN}apache-doris-1.2.7.1-bin-x64-noavx2.tar.gz`,
                        sourceLink: 'https://downloads.apache.org/doris/1.2/1.2.7.1/apache-doris-1.2.7.1-src.tar.gz',
                    },
                    {
                        label: SuffixEnum.ASC,
                        value: SuffixEnum.ASC,
                        link: `${ORIGIN}apache-doris-1.2.7.1-bin-x64-noavx2.tar.gz.asc`,
                        sourceLink:
                            'https://downloads.apache.org/doris/1.2/1.2.7.1/apache-doris-1.2.7.1-src.tar.gz.asc',
                    },
                    {
                        label: SuffixEnum.SHA512,
                        value: SuffixEnum.SHA512,
                        link: `${ORIGIN}apache-doris-1.2.7.1-bin-x64-noavx2.tar.gz.sha512`,
                        sourceLink:
                            'https://downloads.apache.org/doris/1.2/1.2.7.1/apache-doris-1.2.7.1-src.tar.gz.sha512',
                    },
                ],
            },
            {
                label: CPUEnum.ARM64,
                value: CPUEnum.ARM64,
                children: [
                    {
                        label: SuffixEnum.GZ,
                        value: SuffixEnum.GZ,
                        link: `${ORIGIN}apache-doris-1.2.7.1-bin-arm64.tar.gz`,
                        sourceLink: 'https://downloads.apache.org/doris/1.2/1.2.7.1/apache-doris-1.2.7.1-src.tar.gz',
                    },
                    {
                        label: SuffixEnum.ASC,
                        value: SuffixEnum.ASC,
                        link: `${ORIGIN}apache-doris-1.2.7.1-bin-arm64.tar.gz.asc`,
                        sourceLink:
                            'https://downloads.apache.org/doris/1.2/1.2.7.1/apache-doris-1.2.7.1-src.tar.gz.asc',
                    },
                    {
                        label: SuffixEnum.SHA512,
                        value: SuffixEnum.SHA512,
                        link: `${ORIGIN}apache-doris-1.2.7.1-bin-arm64.tar.gz.sha512`,
                        sourceLink:
                            'https://downloads.apache.org/doris/1.2/1.2.7.1/apache-doris-1.2.7.1-src.tar.gz.sha512',
                    },
                ],
            },
        ],
    },
    {
        label: '1.2.6',
        value: '1.2.6',
        majorVersion: '1.2',
        children: [
            {
                label: CPUEnum.X64,
                value: CPUEnum.X64,
                children: [
                    {
                        label: SuffixEnum.GZ,
                        value: SuffixEnum.GZ,
                        link: `${ORIGIN}apache-doris-1.2.6-bin-x64.tar.gz`,
                        sourceLink: 'https://downloads.apache.org/doris/1.2/1.2.6-rc03/apache-doris-1.2.6-src.tar.gz',
                    },
                    {
                        label: SuffixEnum.ASC,
                        value: SuffixEnum.ASC,
                        link: `${ORIGIN}apache-doris-1.2.6-bin-x64.tar.gz.asc`,
                        sourceLink:
                            'https://downloads.apache.org/doris/1.2/1.2.6-rc03/apache-doris-1.2.6-src.tar.gz.asc',
                    },
                    {
                        label: SuffixEnum.SHA512,
                        value: SuffixEnum.SHA512,
                        link: `${ORIGIN}apache-doris-1.2.6-bin-x64.tar.gz.sha512`,
                        sourceLink:
                            'https://downloads.apache.org/doris/1.2/1.2.6-rc03/apache-doris-1.2.6-src.tar.gz.sha512',
                    },
                ],
            },
            {
                label: CPUEnum.X64NoAvx2,
                value: CPUEnum.X64NoAvx2,
                children: [
                    {
                        label: SuffixEnum.GZ,
                        value: SuffixEnum.GZ,
                        link: `${ORIGIN}apache-doris-1.2.6-bin-x64-noavx2.tar.gz`,
                        sourceLink: 'https://downloads.apache.org/doris/1.2/1.2.6-rc03/apache-doris-1.2.6-src.tar.gz',
                    },
                    {
                        label: SuffixEnum.ASC,
                        value: SuffixEnum.ASC,
                        link: `${ORIGIN}apache-doris-1.2.6-bin-x64-noavx2.tar.gz.asc`,
                        sourceLink:
                            'https://downloads.apache.org/doris/1.2/1.2.6-rc03/apache-doris-1.2.6-src.tar.gz.asc',
                    },
                    {
                        label: SuffixEnum.SHA512,
                        value: SuffixEnum.SHA512,
                        link: `${ORIGIN}apache-doris-1.2.6-bin-x64-noavx2.tar.gz.sha512`,
                        sourceLink:
                            'https://downloads.apache.org/doris/1.2/1.2.6-rc03/apache-doris-1.2.6-src.tar.gz.sha512',
                    },
                ],
            },
            {
                label: CPUEnum.ARM64,
                value: CPUEnum.ARM64,
                children: [
                    {
                        label: SuffixEnum.GZ,
                        value: SuffixEnum.GZ,
                        link: `${ORIGIN}apache-doris-1.2.6-bin-arm64.tar.gz`,
                        sourceLink: 'https://downloads.apache.org/doris/1.2/1.2.6-rc03/apache-doris-1.2.6-src.tar.gz',
                    },
                    {
                        label: SuffixEnum.ASC,
                        value: SuffixEnum.ASC,
                        link: `${ORIGIN}apache-doris-1.2.6-bin-arm64.tar.gz.asc`,
                        sourceLink:
                            'https://downloads.apache.org/doris/1.2/1.2.6-rc03/apache-doris-1.2.6-src.tar.gz.asc',
                    },
                    {
                        label: SuffixEnum.SHA512,
                        value: SuffixEnum.SHA512,
                        link: `${ORIGIN}apache-doris-1.2.6-bin-arm64.tar.gz.sha512`,
                        sourceLink:
                            'https://downloads.apache.org/doris/1.2/1.2.6-rc03/apache-doris-1.2.6-src.tar.gz.sha512',
                    },
                ],
            },
        ],
    },
    {
        label: '1.2.5',
        value: '1.2.5',
        majorVersion: '1.2',
        children: [
            {
                label: CPUEnum.X64,
                value: CPUEnum.X64,
                children: [
                    {
                        label: SuffixEnum.GZ,
                        value: SuffixEnum.GZ,
                        link: `${ORIGIN}apache-doris-1.2.5-bin-x86_64.tar.gz`,
                        sourceLink: 'https://downloads.apache.org/doris/1.2/1.2.5-rc01/apache-doris-1.2.5-src.tar.gz',
                    },
                    {
                        label: SuffixEnum.ASC,
                        value: SuffixEnum.ASC,
                        link: `${ORIGIN}apache-doris-1.2.5-bin-x86_64.tar.gz.asc`,
                        sourceLink:
                            'https://downloads.apache.org/doris/1.2/1.2.5-rc01/apache-doris-1.2.5-src.tar.gz.asc',
                    },
                    {
                        label: SuffixEnum.SHA512,
                        value: SuffixEnum.SHA512,
                        link: `${ORIGIN}apache-doris-1.2.5-bin-x86_64.tar.gz.sha512`,
                        sourceLink:
                            'https://downloads.apache.org/doris/1.2/1.2.5-rc01/apache-doris-1.2.5-src.tar.gz.sha512',
                    },
                ],
            },
            {
                label: CPUEnum.X64NoAvx2,
                value: CPUEnum.X64NoAvx2,
                children: [
                    {
                        label: SuffixEnum.GZ,
                        value: SuffixEnum.GZ,
                        link: `${ORIGIN}apache-doris-1.2.5-bin-x86_64-noavx2.tar.gz`,
                        sourceLink: 'https://downloads.apache.org/doris/1.2/1.2.5-rc01/apache-doris-1.2.5-src.tar.gz',
                    },
                    {
                        label: SuffixEnum.ASC,
                        value: SuffixEnum.ASC,
                        link: `${ORIGIN}apache-doris-1.2.5-bin-x86_64-noavx2.tar.gz.asc`,
                        sourceLink:
                            'https://downloads.apache.org/doris/1.2/1.2.5-rc01/apache-doris-1.2.5-src.tar.gz.asc',
                    },
                    {
                        label: SuffixEnum.SHA512,
                        value: SuffixEnum.SHA512,
                        link: `${ORIGIN}apache-doris-1.2.5-bin-x86_64-noavx2.tar.gz.sha512`,
                        sourceLink:
                            'https://downloads.apache.org/doris/1.2/1.2.5-rc01/apache-doris-1.2.5-src.tar.gz.sha512',
                    },
                ],
            },
            {
                label: CPUEnum.ARM64,
                value: CPUEnum.ARM64,
                children: [
                    {
                        label: SuffixEnum.GZ,
                        value: SuffixEnum.GZ,
                        link: `${ORIGIN}apache-doris-1.2.5-bin-aarch64.tar.gz`,
                        sourceLink: 'https://downloads.apache.org/doris/1.2/1.2.5-rc01/apache-doris-1.2.5-src.tar.gz',
                    },
                    {
                        label: SuffixEnum.ASC,
                        value: SuffixEnum.ASC,
                        link: `${ORIGIN}apache-doris-1.2.5-bin-aarch64.tar.gz.asc`,
                        sourceLink:
                            'https://downloads.apache.org/doris/1.2/1.2.5-rc01/apache-doris-1.2.5-src.tar.gz.asc',
                    },
                    {
                        label: SuffixEnum.SHA512,
                        value: SuffixEnum.SHA512,
                        link: `${ORIGIN}apache-doris-1.2.5-bin-aarch64.tar.gz.sha512`,
                        sourceLink:
                            'https://downloads.apache.org/doris/1.2/1.2.5-rc01/apache-doris-1.2.5-src.tar.gz.sha512',
                    },
                ],
            },
        ],
    },
    {
        label: '1.2.4',
        value: '1.2.4',
        majorVersion: '1.2',
        children: [
            {
                label: CPUEnum.X64,
                value: CPUEnum.X64,
                children: [
                    {
                        label: SuffixEnum.GZ,
                        value: SuffixEnum.GZ,
                        link: `${ORIGIN}apache-doris-1.2.4.1-bin-x86_64.tar.xz`,
                        sourceLink:
                            'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/apache-doris-1.2.4.1-src.tar.gz',
                    },
                    {
                        label: SuffixEnum.ASC,
                        value: SuffixEnum.ASC,
                        link: 'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/apache-doris-1.2.4.1-src.tar.gz.asc',
                        sourceLink:
                            'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/apache-doris-1.2.4.1-src.tar.gz.asc',
                    },
                    {
                        label: SuffixEnum.SHA512,
                        value: SuffixEnum.SHA512,
                        link: 'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/apache-doris-1.2.4.1-src.tar.gz.sha512',
                        sourceLink:
                            'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/apache-doris-1.2.4.1-src.tar.gz.sha512',
                    },
                ],
            },
            {
                label: CPUEnum.X64NoAvx2,
                value: CPUEnum.X64NoAvx2,
                children: [
                    {
                        label: SuffixEnum.GZ,
                        value: SuffixEnum.GZ,
                        link: `${ORIGIN}apache-doris-1.2.5-bin-x86_64-noavx2.tar.gz`,
                        sourceLink:
                            'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/apache-doris-1.2.4.1-src.tar.gz',
                    },
                    {
                        label: SuffixEnum.ASC,
                        value: SuffixEnum.ASC,
                        link: 'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/apache-doris-1.2.4.1-src.tar.gz.asc',
                        sourceLink:
                            'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/apache-doris-1.2.4.1-src.tar.gz.asc',
                    },
                    {
                        label: SuffixEnum.SHA512,
                        value: SuffixEnum.SHA512,
                        link: 'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/apache-doris-1.2.4.1-src.tar.gz.sha512',
                        sourceLink:
                            'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/apache-doris-1.2.4.1-src.tar.gz.sha512',
                    },
                ],
            },
            {
                label: CPUEnum.ARM64,
                value: CPUEnum.ARM64,
                children: [
                    {
                        label: SuffixEnum.GZ,
                        value: SuffixEnum.GZ,
                        link: `${ORIGIN}apache-doris-1.2.5-bin-aarch64.tar.gz`,
                        sourceLink:
                            'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/apache-doris-1.2.4.1-src.tar.gz',
                    },
                    {
                        label: SuffixEnum.ASC,
                        value: SuffixEnum.ASC,
                        link: 'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/apache-doris-1.2.4.1-src.tar.gz.asc',
                        sourceLink:
                            'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/apache-doris-1.2.4.1-src.tar.gz.asc',
                    },
                    {
                        label: SuffixEnum.SHA512,
                        value: SuffixEnum.SHA512,
                        link: 'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/apache-doris-1.2.4.1-src.tar.gz.sha512',
                        sourceLink:
                            'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/apache-doris-1.2.4.1-src.tar.gz.sha512',
                    },
                ],
            },
        ],
    },
];

export const OLD_VERSIONS: Option[] = [
    {
        label: '1.2',
        value: '1.2',
        children: [
            {
                label: '1.2.3',
                value: '1.2.3',
                link: 'https://archive.apache.org/dist/doris/1.2/1.2.3-rc02/apache-doris-1.2.3-src.tar.gz',
            },
            {
                label: '1.2.2',
                value: '1.2.2',
                link: 'https://archive.apache.org/dist/doris/1.2/1.2.2-rc01/apache-doris-1.2.2-src.tar.gz',
            },
            {
                label: '1.2.1',
                value: '1.2.1',
                link: 'https://archive.apache.org/dist/doris/1.2/1.2.1-rc01/apache-doris-1.2.1-src.tar.gz',
            },
        ],
    },
    {
        label: '1.1',
        value: '1.1',
        children: [
            {
                label: '1.1.5',
                value: '1.1.5',
                link: 'https://archive.apache.org/dist/doris/1.1/1.1.5-rc02/apache-doris-1.1.5-src.tar.gz',
            },
            {
                label: '1.1.4',
                value: '1.1.4',
                link: 'https://archive.apache.org/dist/doris/1.1/1.1.4-rc01/apache-doris-1.1.4-src.tar.gz',
            },
            {
                label: '1.1.3',
                value: '1.1.3',
                link: 'https://archive.apache.org/dist/doris/1.1/1.1.3-rc02/apache-doris-1.1.3-src.tar.gz',
            },
            {
                label: '1.1.2',
                value: '1.1.2',
                link: 'https://archive.apache.org/dist/doris/1.1/1.1.2-rc05/apache-doris-1.1.2-src.tar.gz',
            },
            {
                label: '1.1.1',
                value: '1.1.1',
                link: 'https://archive.apache.org/dist/doris/1.1/1.1.1/apache-doris-1.1.1-src.tar.gz',
            },
            {
                label: '1.1.0',
                value: '1.1.0',
                link: 'https://archive.apache.org/dist/doris/1.1/1.1.0/apache-doris-1.0.0-incubating-src.tar.gz',
            },
        ],
    },
    {
        label: '0.x',
        value: '0.x',
        children: [
            {
                label: '0.15.0',
                value: '0.15.0',
                link: 'https://archive.apache.org/dist/doris/0.15.0-incubating/apache-doris-0.15.0-incubating-src.tar.gz',
            },
            {
                label: '0.14.0',
                value: '0.14.0',
                link: 'https://archive.apache.org/dist/doris/0.14.0-incubating/apache-doris-0.14.0-incubating-src.tar.gz',
            },
            {
                label: '0.13.0',
                value: '0.13.0',
                link: 'https://archive.apache.org/dist/doris/0.13.0-incubating/apache-doris-0.13.0-incubating-src.tar.gz',
            },
        ],
    },
];

export const RUN_ANYWHERE = [
    {
        title: 'Doris on bare metal',
        description: 'A platform for visualized cluster deployment on bare metal or VM.',
        link: '/',
    },
    {
        title: 'Doris on K8s',
        description: 'Create, configure and manage Doris clusters on Kubernetes',
        link: '/',
    },
    {
        title: 'Doris on AWS',
        description: 'Deploy Doris on AWS with CloudFormation templates',
        link: 'https://doris-cf-template.s3.amazonaws.com/cloudformation_doris.template.yaml',
    },
];
