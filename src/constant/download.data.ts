export type Option = {
    label: string;
    value: string;
    gz?: string;
    asc?: string;
    sha512?: string;
    source?: string;
    children?: (Option & { version?: string })[];
    majorVersion?: string;
};

export enum CPUEnum {
    X64 = 'x64 ( avx2 )',
    X64NoAvx2 = 'x64 ( no avx2 )',
    ARM64 = 'ARM64',
}

export enum SuffixEnum {
    GZ = '.tar.gz',
    ASC = '.tar.gz.asc',
    SHA512 = '.tar.gz.sha512',
}

export const ORIGIN = 'https://apache-doris-releases.oss-accelerate.aliyuncs.com/';
export enum VersionEnum {
    Latest = '2.0.4',
    Prev = '1.2.7',
    // Earlier = '1.1.5',
}
export enum DownloadTypeEnum {
    Binary = 'Binary',
    Source = 'Source',
}
export const DORIS_VERSIONS: Option[] = [
    {
        label: '2.0.4',
        value: '2.0.4',
        majorVersion: '2.0',
        children: [
            {
                label: CPUEnum.X64,
                value: CPUEnum.X64,
                gz: `${ORIGIN}apache-doris-2.0.4-bin-x64.tar.gz`,
                asc: `${ORIGIN}apache-doris-2.0.4-bin-x64.tar.gz.asc`,
                sha512: `${ORIGIN}apache-doris-2.0.4-bin-x64.tar.gz.sha512`,
                source: 'https://downloads.apache.org/doris/2.0/2.0.4/',
                version: '2.0.4',
            },
            {
                label: CPUEnum.X64NoAvx2,
                value: CPUEnum.X64NoAvx2,
                gz: `${ORIGIN}apache-doris-2.0.4-bin-x64-noavx2.tar.gz`,
                asc: `${ORIGIN}apache-doris-2.0.4-bin-x64-noavx2.tar.gz.asc`,
                sha512: `${ORIGIN}apache-doris-2.0.4-bin-x64-noavx2.tar.gz.sha512`,
                source: 'https://downloads.apache.org/doris/2.0/2.0.4/',
                version: '2.0.4',
            },
            {
                label: CPUEnum.ARM64,
                value: CPUEnum.ARM64,
                gz: `${ORIGIN}apache-doris-2.0.4-bin-arm64.tar.gz`,
                asc: `${ORIGIN}apache-doris-2.0.4-bin-arm64.tar.gz.asc`,
                sha512: `${ORIGIN}apache-doris-2.0.4-bin-arm64.tar.gz.sha512`,
                source: 'https://downloads.apache.org/doris/2.0/2.0.4/',
                version: '2.0.4',
            },
        ],
    },
    {
        label: '2.0.3',
        value: '2.0.3',
        majorVersion: '2.0',
        children: [
            {
                label: CPUEnum.X64,
                value: CPUEnum.X64,
                gz: `${ORIGIN}apache-doris-2.0.3-bin-x64.tar.gz`,
                asc: `${ORIGIN}apache-doris-2.0.3-bin-x64.tar.gz.asc`,
                sha512: `${ORIGIN}apache-doris-2.0.3-bin-x64.tar.gz.sha512`,
                source: 'https://downloads.apache.org/doris/2.0/2.0.3/',
                version: '2.0.3',
            },
            {
                label: CPUEnum.X64NoAvx2,
                value: CPUEnum.X64NoAvx2,
                gz: `${ORIGIN}apache-doris-2.0.3-bin-x64-noavx2.tar.gz`,
                asc: `${ORIGIN}apache-doris-2.0.3-bin-x64-noavx2.tar.gz.asc`,
                sha512: `${ORIGIN}apache-doris-2.0.3-bin-x64-noavx2.tar.gz.sha512`,
                source: 'https://downloads.apache.org/doris/2.0/2.0.3/',
                version: '2.0.3',
            },
            {
                label: CPUEnum.ARM64,
                value: CPUEnum.ARM64,
                gz: `${ORIGIN}apache-doris-2.0.3-bin-arm64.tar.gz`,
                asc: `${ORIGIN}apache-doris-2.0.3-bin-arm64.tar.gz.asc`,
                sha512: `${ORIGIN}apache-doris-2.0.3-bin-arm64.tar.gz.sha512`,
                source: 'https://downloads.apache.org/doris/2.0/2.0.3/',
                version: '2.0.3',
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
                gz: `${ORIGIN}apache-doris-2.0.2.1-bin-x64.tar.gz`,
                asc: `${ORIGIN}apache-doris-2.0.2.1-bin-x64.tar.gz.asc`,
                sha512: `${ORIGIN}apache-doris-2.0.2.1-bin-x64.tar.gz.sha512`,
                source: 'https://downloads.apache.org/doris/2.0/2.0.2.1/',
                version: '2.0.2.1',
            },
            {
                label: CPUEnum.X64NoAvx2,
                value: CPUEnum.X64NoAvx2,
                gz: `${ORIGIN}apache-doris-2.0.2.1-bin-x64-noavx2.tar.gz`,
                asc: `${ORIGIN}apache-doris-2.0.2.1-bin-x64-noavx2.tar.gz.asc`,
                sha512: `${ORIGIN}apache-doris-2.0.2.1-bin-x64-noavx2.tar.gz.sha512`,
                source: 'https://downloads.apache.org/doris/2.0/2.0.2.1/',
                version: '2.0.2.1',
            },
            {
                label: CPUEnum.ARM64,
                value: CPUEnum.ARM64,
                gz: `${ORIGIN}apache-doris-2.0.2.1-bin-arm64.tar.gz`,
                asc: `${ORIGIN}apache-doris-2.0.2.1-bin-arm64.tar.gz.asc`,
                sha512: `${ORIGIN}apache-doris-2.0.2.1-bin-arm64.tar.gz.sha512`,
                source: 'https://downloads.apache.org/doris/2.0/2.0.2.1/',
                version: '2.0.2.1',
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
                gz: `${ORIGIN}apache-doris-2.0.1.1-bin-x64.tar.gz`,
                asc: `${ORIGIN}apache-doris-2.0.1.1-bin-x64.tar.gz.asc`,
                sha512: `${ORIGIN}apache-doris-2.0.1.1-bin-x64.tar.gz.sha512`,
                source: 'https://downloads.apache.org/doris/2.0/2.0.1.1/',
                version: '2.0.1.1',
            },
            {
                label: CPUEnum.X64NoAvx2,
                value: CPUEnum.X64NoAvx2,
                gz: `${ORIGIN}apache-doris-2.0.1.1-bin-x64-noavx2.tar.gz`,
                asc: `${ORIGIN}apache-doris-2.0.1.1-bin-x64-noavx2.tar.gz.asc`,
                sha512: `${ORIGIN}apache-doris-2.0.1.1-bin-x64-noavx2.tar.gz.sha512`,
                source: 'https://downloads.apache.org/doris/2.0/2.0.1.1/',
                version: '2.0.1.1',
            },
            {
                label: CPUEnum.ARM64,
                value: CPUEnum.ARM64,
                gz: `${ORIGIN}apache-doris-2.0.1.1-bin-arm64.tar.gz`,
                asc: `${ORIGIN}apache-doris-2.0.1.1-bin-arm64.tar.gz.asc`,
                sha512: `${ORIGIN}apache-doris-2.0.1.1-bin-arm64.tar.gz.sha512`,
                source: 'https://downloads.apache.org/doris/2.0/2.0.1.1/',
                version: '2.0.1.1',
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
                gz: `${ORIGIN}apache-doris-2.0.0-bin-x64.tar.gz`,
                asc: `${ORIGIN}apache-doris-2.0.0-bin-x64.tar.gz.asc`,
                sha512: `${ORIGIN}apache-doris-2.0.0-bin-x64.tar.gz.sha512`,
                source: 'https://downloads.apache.org/doris/2.0/2.0.0/',
                version: '2.0.0',
            },
            {
                label: CPUEnum.X64NoAvx2,
                value: CPUEnum.X64NoAvx2,
                gz: `${ORIGIN}apache-doris-2.0.0-bin-x64-noavx2.tar.gz`,
                asc: `${ORIGIN}apache-doris-2.0.0-bin-x64-noavx2.tar.gz.asc`,
                sha512: `${ORIGIN}apache-doris-2.0.0-bin-x64-noavx2.tar.gz.sha512`,
                source: 'https://downloads.apache.org/doris/2.0/2.0.0/',
                version: '2.0.0',
            },
            {
                label: CPUEnum.ARM64,
                value: CPUEnum.ARM64,
                gz: `${ORIGIN}apache-doris-2.0.0-bin-arm64.tar.gz`,
                asc: `${ORIGIN}apache-doris-2.0.0-bin-arm64.tar.gz.asc`,
                sha512: `${ORIGIN}apache-doris-2.0.0-bin-arm64.tar.gz.sha512`,
                source: 'https://downloads.apache.org/doris/2.0/2.0.0/',
                version: '2.0.0',
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
                gz: `${ORIGIN}apache-doris-1.2.7.1-bin-x64.tar.xz`,
                asc: `${ORIGIN}apache-doris-1.2.7.1-bin-x64.tar.xz.asc`,
                sha512: `${ORIGIN}apache-doris-1.2.7.1-bin-x64.tar.xz.sha512`,
                source: 'https://downloads.apache.org/doris/1.2/1.2.7.1/',
                version: '1.2.7.1',
            },
            {
                label: CPUEnum.X64NoAvx2,
                value: CPUEnum.X64NoAvx2,
                gz: `${ORIGIN}apache-doris-1.2.7.1-bin-x64-noavx2.tar.xz`,
                asc: `${ORIGIN}apache-doris-1.2.7.1-bin-x64-noavx2.tar.xz.asc`,
                sha512: `${ORIGIN}apache-doris-1.2.7.1-bin-x64-noavx2.tar.xz.sha512`,
                source: 'https://downloads.apache.org/doris/1.2/1.2.7.1/',
                version: '1.2.7.1',
            },
            {
                label: CPUEnum.ARM64,
                value: CPUEnum.ARM64,
                gz: `${ORIGIN}apache-doris-1.2.7.1-bin-arm64.tar.xz`,
                asc: `${ORIGIN}apache-doris-1.2.7.1-bin-arm64.tar.xz.asc`,
                sha512: `${ORIGIN}apache-doris-1.2.7.1-bin-arm64.tar.xz.sha512`,
                source: 'https://downloads.apache.org/doris/1.2/1.2.7.1/',
                version: '1.2.7.1',
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
                gz: `${ORIGIN}apache-doris-1.2.6-bin-x64.tar.xz`,
                asc: `${ORIGIN}apache-doris-1.2.6-bin-x64.tar.xz.asc`,
                sha512: `${ORIGIN}apache-doris-1.2.6-bin-x64.tar.xz.sha512`,
                source: 'https://downloads.apache.org/doris/1.2/1.2.6-rc03/',
                version: '1.2.6',
            },
            {
                label: CPUEnum.X64NoAvx2,
                value: CPUEnum.X64NoAvx2,
                gz: `${ORIGIN}apache-doris-1.2.6-bin-x64-noavx2.tar.xz`,
                asc: `${ORIGIN}apache-doris-1.2.6-bin-x64-noavx2.tar.xz.asc`,
                sha512: `${ORIGIN}apache-doris-1.2.6-bin-x64-noavx2.tar.xz.sha512`,
                source: 'https://downloads.apache.org/doris/1.2/1.2.6-rc03/',
                version: '1.2.6',
            },
            {
                label: CPUEnum.ARM64,
                value: CPUEnum.ARM64,
                gz: `${ORIGIN}apache-doris-1.2.6-bin-arm64.tar.xz`,
                asc: `${ORIGIN}apache-doris-1.2.6-bin-arm64.tar.xz.asc`,
                sha512: `${ORIGIN}apache-doris-1.2.6-bin-arm64.tar.xz.sha512`,
                source: 'https://downloads.apache.org/doris/1.2/1.2.6-rc03/',
                version: '1.2.6',
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
                gz: `${ORIGIN}apache-doris-1.2.5-bin-x86_64.tar.xz`,
                asc: `${ORIGIN}apache-doris-1.2.5-bin-x86_64.tar.xz.asc`,
                sha512: `${ORIGIN}apache-doris-1.2.5-bin-x86_64.tar.xz.sha512`,
                source: 'https://downloads.apache.org/doris/1.2/1.2.5-rc01/',
                version: '1.2.5',
            },
            {
                label: CPUEnum.X64NoAvx2,
                value: CPUEnum.X64NoAvx2,
                gz: `${ORIGIN}apache-doris-1.2.5-bin-x86_64-noavx2.tar.xz`,
                asc: `${ORIGIN}apache-doris-1.2.5-bin-x86_64-noavx2.tar.xz.asc`,
                sha512: `${ORIGIN}apache-doris-1.2.5-bin-x86_64-noavx2.tar.xz.sha512`,
                source: 'https://downloads.apache.org/doris/1.2/1.2.5-rc01/',
                version: '1.2.5',
            },
            {
                label: CPUEnum.ARM64,
                value: CPUEnum.ARM64,
                gz: `${ORIGIN}apache-doris-1.2.5-bin-aarch64.tar.xz`,
                asc: `${ORIGIN}apache-doris-1.2.5-bin-aarch64.tar.xz.asc`,
                sha512: `${ORIGIN}apache-doris-1.2.5-bin-aarch64.tar.xz.sha512`,
                source: 'https://downloads.apache.org/doris/1.2/1.2.5-rc01/',
                version: '1.2.5',
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
                gz: `${ORIGIN}apache-doris-1.2.4.1-bin-x86_64.tar.xz`,
                asc: 'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/',
                sha512: 'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/',
                source: 'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/',
                version: '1.2.4',
            },
            {
                label: CPUEnum.X64NoAvx2,
                value: CPUEnum.X64NoAvx2,
                gz: `${ORIGIN}apache-doris-1.2.5-bin-x86_64-noavx2.tar.xz`,
                asc: 'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/',
                sha512: 'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/',
                source: 'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/',
                version: '1.2.4',
            },
            {
                label: CPUEnum.ARM64,
                value: CPUEnum.ARM64,
                gz: `${ORIGIN}apache-doris-1.2.5-bin-aarch64.tar.xz`,
                asc: 'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/',
                sha512: 'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/',
                source: 'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/',
                version: '1.2.4',
            },
        ],
    },
];

export type AllVersionOption = {
    label: string;
    value: string;
    gz?: string;
    asc?: string;
    sha512?: string;
    source?: string;
    children: any[];
    majorVersion?: string;
};

export const ALL_VERSIONS: AllVersionOption[] = [
    {
        label: '2.0',
        value: '2.0',
        children: [
            {
                label: '2.0.4',
                value: '2.0.4',
                majorVersion: '2.0',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-2.0.4-bin-x64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.4-bin-x64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.4-bin-x64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.4/',
                        version: '2.0.4',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-2.0.4-bin-x64-noavx2.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.4-bin-x64-noavx2.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.4-bin-x64-noavx2.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.4/',
                        version: '2.0.4',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-2.0.4-bin-arm64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.4-bin-arm64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.4-bin-arm64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.4/',
                        version: '2.0.4',
                    },
                ],
            },
            {
                label: '2.0.3',
                value: '2.0.3',
                majorVersion: '2.0',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-2.0.3-bin-x64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.3-bin-x64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.3-bin-x64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.3/',
                        version: '2.0.3',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-2.0.3-bin-x64-noavx2.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.3-bin-x64-noavx2.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.3-bin-x64-noavx2.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.3/',
                        version: '2.0.3',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-2.0.3-bin-arm64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.3-bin-arm64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.3-bin-arm64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.3/',
                        version: '2.0.3',
                    },
                ],
            },
            {
                label: '2.0.2',
                value: '2.0.2',
                majorVersion: '2.0',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-2.0.2.1-bin-x64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.2.1-bin-x64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.2.1-bin-x64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.2.1/',
                        version: '2.0.2.1',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-2.0.2.1-bin-x64-noavx2.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.2.1-bin-x64-noavx2.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.2.1-bin-x64-noavx2.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.2.1/',
                        version: '2.0.2.1',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-2.0.2.1-bin-arm64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.2.1-bin-arm64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.2.1-bin-arm64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.2.1/',
                        version: '2.0.2.1',
                    },
                ],
            },
            {
                label: '2.0.1',
                value: '2.0.1',
                majorVersion: '2.0',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-2.0.1.1-bin-x64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.1.1-bin-x64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.1.1-bin-x64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.1.1/',
                        version: '2.0.1.1',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-2.0.1.1-bin-x64-noavx2.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.1.1-bin-x64-noavx2.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.1.1-bin-x64-noavx2.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.1.1/',
                        version: '2.0.1.1',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-2.0.1.1-bin-arm64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.1.1-bin-arm64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.1.1-bin-arm64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.1.1/',
                        version: '2.0.1.1',
                    },
                ],
            },
            {
                label: '2.0.0',
                value: '2.0.0',
                majorVersion: '2.0',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-2.0.0-bin-x64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.0-bin-x64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.0-bin-x64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.0/',
                        version: '2.0.0',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-2.0.0-bin-x64-noavx2.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.0-bin-x64-noavx2.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.0-bin-x64-noavx2.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.0/',
                        version: '2.0.0',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-2.0.0-bin-arm64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.0-bin-arm64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.0-bin-arm64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.0/',
                        version: '2.0.0',
                    },
                ],
            },
        ],
    },
    {
        label: '1.2',
        value: '1.2',
        children: [
            {
                label: '1.2.7',
                value: '1.2.7',
                majorVersion: '1.2',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-1.2.7.1-bin-x64.tar.xz`,
                        asc: `${ORIGIN}apache-doris-1.2.7.1-bin-x64.tar.xz.asc`,
                        sha512: `${ORIGIN}apache-doris-1.2.7.1-bin-x64.tar.xz.sha512`,
                        source: 'https://downloads.apache.org/doris/1.2/1.2.7.1/',
                        version: '1.2.7.1',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-1.2.7.1-bin-x64-noavx2.tar.xz`,
                        asc: `${ORIGIN}apache-doris-1.2.7.1-bin-x64-noavx2.tar.xz.asc`,
                        sha512: `${ORIGIN}apache-doris-1.2.7.1-bin-x64-noavx2.tar.xz.sha512`,
                        source: 'https://downloads.apache.org/doris/1.2/1.2.7.1/',
                        version: '1.2.7.1',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-1.2.7.1-bin-arm64.tar.xz`,
                        asc: `${ORIGIN}apache-doris-1.2.7.1-bin-arm64.tar.xz.asc`,
                        sha512: `${ORIGIN}apache-doris-1.2.7.1-bin-arm64.tar.xz.sha512`,
                        source: 'https://downloads.apache.org/doris/1.2/1.2.7.1/',
                        version: '1.2.7.1',
                    },
                ],
            },
            {
                label: '1.2.6',
                value: '1.2.6',
                majorVersion: '1.2',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-1.2.6-bin-x64.tar.xz`,
                        asc: `${ORIGIN}apache-doris-1.2.6-bin-x64.tar.xz.asc`,
                        sha512: `${ORIGIN}apache-doris-1.2.6-bin-x64.tar.xz.sha512`,
                        source: 'https://downloads.apache.org/doris/1.2/1.2.6-rc03/',
                        version: '1.2.6',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-1.2.6-bin-x64-noavx2.tar.xz`,
                        asc: `${ORIGIN}apache-doris-1.2.6-bin-x64-noavx2.tar.xz.asc`,
                        sha512: `${ORIGIN}apache-doris-1.2.6-bin-x64-noavx2.tar.xz.sha512`,
                        source: 'https://downloads.apache.org/doris/1.2/1.2.6-rc03/',
                        version: '1.2.6',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-1.2.6-bin-arm64.tar.xz`,
                        asc: `${ORIGIN}apache-doris-1.2.6-bin-arm64.tar.xz.asc`,
                        sha512: `${ORIGIN}apache-doris-1.2.6-bin-arm64.tar.xz.sha512`,
                        source: 'https://downloads.apache.org/doris/1.2/1.2.6-rc03/',
                        version: '1.2.6',
                    },
                ],
            },
            {
                label: '1.2.5',
                value: '1.2.5',
                majorVersion: '1.2',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-1.2.5-bin-x86_64.tar.xz`,
                        asc: `${ORIGIN}apache-doris-1.2.5-bin-x86_64.tar.xz.asc`,
                        sha512: `${ORIGIN}apache-doris-1.2.5-bin-x86_64.tar.xz.sha512`,
                        source: 'https://downloads.apache.org/doris/1.2/1.2.5-rc01/',
                        version: '1.2.5',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-1.2.5-bin-x86_64-noavx2.tar.xz`,
                        asc: `${ORIGIN}apache-doris-1.2.5-bin-x86_64-noavx2.tar.xz.asc`,
                        sha512: `${ORIGIN}apache-doris-1.2.5-bin-x86_64-noavx2.tar.xz.sha512`,
                        source: 'https://downloads.apache.org/doris/1.2/1.2.5-rc01/',
                        version: '1.2.5',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-1.2.5-bin-aarch64.tar.xz`,
                        asc: `${ORIGIN}apache-doris-1.2.5-bin-aarch64.tar.xz.asc`,
                        sha512: `${ORIGIN}apache-doris-1.2.5-bin-aarch64.tar.xz.sha512`,
                        source: 'https://downloads.apache.org/doris/1.2/1.2.5-rc01/',
                        version: '1.2.5',
                    },
                ],
            },
            {
                label: '1.2.4',
                value: '1.2.4',
                majorVersion: '1.2',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-1.2.4.1-bin-x86_64.tar.xz`,
                        asc: 'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/',
                        sha512: 'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/',
                        source: 'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/',
                        version: '1.2.4',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-1.2.5-bin-x86_64-noavx2.tar.xz`,
                        asc: 'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/',
                        sha512: 'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/',
                        source: 'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/',
                        version: '1.2.4',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-1.2.5-bin-aarch64.tar.xz`,
                        asc: 'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/',
                        sha512: 'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/',
                        source: 'https://downloads.apache.org/doris/1.2/1.2.4.1-rc01/',
                        version: '1.2.4',
                    },
                ],
            },
            {
                label: '1.2.3',
                value: '1.2.3',
                source: 'https://archive.apache.org/dist/doris/1.2/1.2.3-rc02/',
            },
            {
                label: '1.2.2',
                value: '1.2.2',
                source: 'https://archive.apache.org/dist/doris/1.2/1.2.2-rc01/',
            },
            {
                label: '1.2.1',
                value: '1.2.1',
                source: 'https://archive.apache.org/dist/doris/1.2/1.2.1-rc01/',
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
                source: 'https://archive.apache.org/dist/doris/1.1/1.1.5-rc02/',
            },
            {
                label: '1.1.4',
                value: '1.1.4',
                source: 'https://archive.apache.org/dist/doris/1.1/1.1.4-rc01/',
            },
            {
                label: '1.1.3',
                value: '1.1.3',
                source: 'https://archive.apache.org/dist/doris/1.1/1.1.3-rc02/',
            },
            {
                label: '1.1.2',
                value: '1.1.2',
                source: 'https://archive.apache.org/dist/doris/1.1/1.1.2-rc05/',
            },
            {
                label: '1.1.1',
                value: '1.1.1',
                source: 'https://archive.apache.org/dist/doris/1.1/1.1.1-rc03/',
            },
            {
                label: '1.1.0',
                value: '1.1.0',
                source: 'https://archive.apache.org/dist/doris/1.1/1.1.0-rc05/',
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
                source: 'https://archive.apache.org/dist/doris/0.15.0-incubating/',
            },
            {
                label: '0.14.0',
                value: '0.14.0',
                source: 'https://archive.apache.org/dist/doris/0.14.0-incubating/',
            },
            {
                label: '0.13.0',
                value: '0.13.0',
                source: 'https://archive.apache.org/dist/doris/0.13.0-incubating/',
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
                source: 'https://archive.apache.org/dist/doris/1.2/1.2.3-rc02/',
            },
            {
                label: '1.2.2',
                value: '1.2.2',
                source: 'https://archive.apache.org/dist/doris/1.2/1.2.2-rc01/',
            },
            {
                label: '1.2.1',
                value: '1.2.1',
                source: 'https://archive.apache.org/dist/doris/1.2/1.2.1-rc01/',
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
                source: 'https://archive.apache.org/dist/doris/1.1/1.1.5-rc02/',
            },
            {
                label: '1.1.4',
                value: '1.1.4',
                source: 'https://archive.apache.org/dist/doris/1.1/1.1.4-rc01/',
            },
            {
                label: '1.1.3',
                value: '1.1.3',
                source: 'https://archive.apache.org/dist/doris/1.1/1.1.3-rc02/',
            },
            {
                label: '1.1.2',
                value: '1.1.2',
                source: 'https://archive.apache.org/dist/doris/1.1/1.1.2-rc05/',
            },
            {
                label: '1.1.1',
                value: '1.1.1',
                source: 'https://archive.apache.org/dist/doris/1.1/1.1.1-rc03/',
            },
            {
                label: '1.1.0',
                value: '1.1.0',
                source: 'https://archive.apache.org/dist/doris/1.1/1.1.0-rc05/',
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
                source: 'https://archive.apache.org/dist/doris/0.15.0-incubating/',
            },
            {
                label: '0.14.0',
                value: '0.14.0',
                source: 'https://archive.apache.org/dist/doris/0.14.0-incubating/',
            },
            {
                label: '0.13.0',
                value: '0.13.0',
                source: 'https://archive.apache.org/dist/doris/0.13.0-incubating/',
            },
        ],
    },
];

export const RUN_ANYWHERE = [
    {
        title: 'Doris on bare metal',
        description: 'A platform for visualized cluster deployment on bare metal or VM.',
        link: 'https://doris.apache.org/docs/install/standard-deployment',
    },
    {
        title: 'Doris on Kubernetes',
        description: 'Create, configure and manage Doris clusters on Kubernetes',
        link: 'https://doris.apache.org/docs/install/k8s-deploy/operator-deploy',
    },
    {
        title: 'Doris on AWS',
        description: 'Deploy Doris on AWS with CloudFormation templates',
        link: 'https://doris-cf-template.s3.amazonaws.com/cloudformation_doris.template.yaml',
    },
];
