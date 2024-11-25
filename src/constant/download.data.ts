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

export enum ToolsEnum {
    Kafka = 'Kafka Doris Connector',
    Flink = 'Flink Doris Connector',
    Spark = 'Spark Doris Connector',
    StreamLoader = 'Doris Streamloader',
}

export const ORIGIN = 'https://apache-doris-releases.oss-accelerate.aliyuncs.com/';
export enum VersionEnum {
    Latest = '3.0.2',
    Prev = '2.1.7',
    Earlier = '2.0.15',
}
export enum DownloadTypeEnum {
    Binary = 'Binary',
    Source = 'Source',
}
export const DORIS_VERSIONS: Option[] = [
    {
        label: '3.0.2',
        value: '3.0.2',
        majorVersion: '3.0',
        children: [
            {
                label: CPUEnum.X64,
                value: CPUEnum.X64,
                gz: `${ORIGIN}apache-doris-3.0.2-bin-x64.tar.gz`,
                asc: `${ORIGIN}apache-doris-3.0.2-bin-x64.tar.gz.asc`,
                sha512: `${ORIGIN}apache-doris-3.0.2-bin-x64.tar.gz.sha512`,
                source: 'https://downloads.apache.org/doris/3.0/3.0.2-rc03/',
                version: '3.0.2',
            },
            {
                label: CPUEnum.X64NoAvx2,
                value: CPUEnum.X64NoAvx2,
                gz: `${ORIGIN}apache-doris-3.0.2-bin-x64-noavx2.tar.gz`,
                asc: `${ORIGIN}apache-doris-3.0.2-bin-x64-noavx2.tar.gz.asc`,
                sha512: `${ORIGIN}apache-doris-3.0.2-bin-x64-noavx2.tar.gz.sha512`,
                source: 'https://downloads.apache.org/doris/3.0/3.0.2-rc03/',
                version: '3.0.2',
            },
            {
                label: CPUEnum.ARM64,
                value: CPUEnum.ARM64,
                gz: `${ORIGIN}apache-doris-3.0.2-bin-arm64.tar.gz`,
                asc: `${ORIGIN}apache-doris-3.0.2-bin-arm64.tar.gz.asc`,
                sha512: `${ORIGIN}apache-doris-3.0.2-bin-arm64.tar.gz.sha512`,
                source: 'https://downloads.apache.org/doris/3.0/3.0.2-rc03/',
                version: '3.0.2',
            },
        ],
    },
    {
        label: '2.1.7',
        value: '2.1.7',
        majorVersion: '2.1',
        children: [
            {
                label: CPUEnum.X64,
                value: CPUEnum.X64,
                gz: `${ORIGIN}apache-doris-2.1.7-bin-x64.tar.gz`,
                asc: `${ORIGIN}apache-doris-2.1.7-bin-x64.tar.gz.asc`,
                sha512: `${ORIGIN}apache-doris-2.1.7-bin-x64.tar.gz.sha512`,
                source: 'https://downloads.apache.org/doris/2.1/2.1.7/',
                version: '2.1.7-rc03',
            },
            {
                label: CPUEnum.X64NoAvx2,
                value: CPUEnum.X64NoAvx2,
                gz: `${ORIGIN}apache-doris-2.1.7-bin-x64-noavx2.tar.gz`,
                asc: `${ORIGIN}apache-doris-2.1.7-bin-x64-noavx2.tar.gz.asc`,
                sha512: `${ORIGIN}apache-doris-2.1.7-bin-x64-noavx2.tar.gz.sha512`,
                source: 'https://downloads.apache.org/doris/2.1/2.1.7/',
                version: '2.1.7-rc03',
            },
            {
                label: CPUEnum.ARM64,
                value: CPUEnum.ARM64,
                gz: `${ORIGIN}apache-doris-2.1.7-bin-arm64.tar.gz`,
                asc: `${ORIGIN}apache-doris-2.1.7-bin-arm64.tar.gz.asc`,
                sha512: `${ORIGIN}apache-doris-2.1.7-bin-arm64.tar.gz.sha512`,
                source: 'https://downloads.apache.org/doris/2.1/2.1.7/',
                version: '2.1.7-rc03',
            },
        ],
    },
    {
        label: '2.0.15',
        value: '2.0.15',
        majorVersion: '2.0',
        children: [
            {
                label: CPUEnum.X64,
                value: CPUEnum.X64,
                gz: `${ORIGIN}apache-doris-2.0.15.1-bin-x64.tar.gz`,
                asc: `${ORIGIN}apache-doris-2.0.15.1-bin-x64.tar.gz.asc`,
                sha512: `${ORIGIN}apache-doris-2.0.15.1-bin-x64.tar.gz.sha512`,
                source: 'https://downloads.apache.org/doris/2.0/2.0.15.1/',
                version: '2.0.15.1',
            },
            {
                label: CPUEnum.X64NoAvx2,
                value: CPUEnum.X64NoAvx2,
                gz: `${ORIGIN}apache-doris-2.0.15.1-bin-x64-noavx2.tar.gz`,
                asc: `${ORIGIN}apache-doris-2.0.15.1-bin-x64-noavx2.tar.gz.asc`,
                sha512: `${ORIGIN}apache-doris-2.0.15.1-bin-x64-noavx2.tar.gz.sha512`,
                source: 'https://downloads.apache.org/doris/2.0/2.0.15.1/',
                version: '2.0.15.1',
            },
            {
                label: CPUEnum.ARM64,
                value: CPUEnum.ARM64,
                gz: `${ORIGIN}apache-doris-2.0.15.1-bin-arm64.tar.gz`,
                asc: `${ORIGIN}apache-doris-2.0.15.1-bin-arm64.tar.gz.asc`,
                sha512: `${ORIGIN}apache-doris-2.0.15.1-bin-arm64.tar.gz.sha512`,
                source: 'https://downloads.apache.org/doris/2.0/2.0.15.1/',
                version: '2.0.15.1',
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
        label: '3.0',
        value: '3.0',
        children: [
            {
                label: '3.0.0',
                value: '3.0.0',
                majorVersion: '3.0',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-3.0.0-bin-x64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-3.0.0-bin-x64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-3.0.0-bin-x64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/3.0/3.0.0-rc11/',
                        version: '3.0.0',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-3.0.0-bin-x64-noavx2.tar.gz`,
                        asc: `${ORIGIN}apache-doris-3.0.0-bin-x64-noavx2.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-3.0.0-bin-x64-noavx2.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/3.0/3.0.0-rc11/',
                        version: '3.0.0',
                    },
                ],
            },
            {
                label: '3.0.1',
                value: '3.0.1',
                majorVersion: '3.0',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-3.0.1-bin-x64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-3.0.1-bin-x64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-3.0.1-bin-x64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/3.0/3.0.1-rc04/',
                        version: '3.0.1',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-3.0.1-bin-x64-noavx2.tar.gz`,
                        asc: `${ORIGIN}apache-doris-3.0.1-bin-x64-noavx2.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-3.0.1-bin-x64-noavx2.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/3.0/3.0.1-rc04/',
                        version: '3.0.1',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-3.0.1-bin-arm64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-3.0.1-bin-arm64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-3.0.1-bin-arm64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/3.0/3.0.1-rc04/',
                        version: '3.0.1',
                    },
                ],
            },
            {
                label: '3.0.2',
                value: '3.0.2',
                majorVersion: '3.0',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-3.0.2-bin-x64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-3.0.2-bin-x64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-3.0.2-bin-x64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/3.0/3.0.2-rc03/',
                        version: '3.0.2',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-3.0.2-bin-x64-noavx2.tar.gz`,
                        asc: `${ORIGIN}apache-doris-3.0.2-bin-x64-noavx2.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-3.0.2-bin-x64-noavx2.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/3.0/3.0.2-rc03/',
                        version: '3.0.2',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-3.0.2-bin-arm64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-3.0.2-bin-arm64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-3.0.2-bin-arm64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/3.0/3.0.2-rc03/',
                        version: '3.0.2',
                    },
                ],
            },
        ]
    },
    {
        label: '2.1',
        value: '2.1',
        children: [
            {
                label: '2.1.7',
                value: '2.1.7',
                majorVersion: '2.1',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-2.1.7-bin-x64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.1.7-bin-x64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.1.7-bin-x64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.1/2.1.7/',
                        version: '2.1.7-rc03',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-2.1.7-bin-x64-noavx2.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.1.7-bin-x64-noavx2.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.1.7-bin-x64-noavx2.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.1/2.1.7/',
                        version: '2.1.7-rc03',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-2.1.7-bin-arm64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.1.7-bin-arm64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.1.7-bin-arm64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.1/2.1.7/',
                        version: '2.1.7-rc03',
                    },
                ],
            },
            {
                label: '2.1.6',
                value: '2.1.6',
                majorVersion: '2.1',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-2.1.6-bin-x64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.1.6-bin-x64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.1.6-bin-x64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.1/2.1.6/',
                        version: '2.1.6-rc04',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-2.1.6-bin-x64-noavx2.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.1.6-bin-x64-noavx2.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.1.6-bin-x64-noavx2.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.1/2.1.6/',
                        version: '2.1.6-rc04',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-2.1.6-bin-arm64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.1.6-bin-arm64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.1.6-bin-arm64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.1/2.1.6/',
                        version: '2.1.6-rc04',
                    },
                ],
            },
            {
                label: '2.1.5',
                value: '2.1.5',
                majorVersion: '2.1',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-2.1.5-bin-x64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.1.5-bin-x64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.1.5-bin-x64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.1/2.1.5/',
                        version: '2.1.5',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-2.1.5-bin-x64-noavx2.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.1.5-bin-x64-noavx2.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.1.5-bin-x64-noavx2.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.1/2.1.5/',
                        version: '2.1.5',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-2.1.5-bin-arm64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.1.5-bin-arm64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.1.5-bin-arm64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.1/2.1.5/',
                        version: '2.1.5',
                    },
                ],
            },
            {
                label: '2.1.4',
                value: '2.1.4',
                majorVersion: '2.1',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-2.1.4-bin-x64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.1.4-bin-x64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.1.4-bin-x64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.1/2.1.4/',
                        version: '2.1.4',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-2.1.4-bin-x64-noavx2.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.1.4-bin-x64-noavx2.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.1.4-bin-x64-noavx2.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.1/2.1.4/',
                        version: '2.1.4',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-2.1.4-bin-arm64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.1.4-bin-arm64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.1.4-bin-arm64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.1/2.1.4/',
                        version: '2.1.4',
                    },
                ],
            },
            {
                label: '2.1.3',
                value: '2.1.3',
                majorVersion: '2.1',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-2.1.3-bin-x64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.1.3-bin-x64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.1.3-bin-x64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.1/2.1.3/',
                        version: '2.1.3-rc09',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-2.1.3-bin-x64-noavx2.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.1.3-bin-x64-noavx2.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.1.3-bin-x64-noavx2.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.1/2.1.3/',
                        version: '2.1.3-rc09',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-2.1.3-bin-arm64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.1.3-bin-arm64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.1.3-bin-arm64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.1/2.1.3/',
                        version: '2.1.3-rc09',
                    },
                ],
            },
            {
                label: '2.1.2',
                value: '2.1.2',
                majorVersion: '2.1',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-2.1.2-bin-x64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.1.2-bin-x64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.1.2-bin-x64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.1/2.1.2/',
                        version: '2.1.2-rc04',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-2.1.2-bin-x64-noavx2.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.1.2-bin-x64-noavx2.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.1.2-bin-x64-noavx2.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.1/2.1.2/',
                        version: '2.1.2-rc04',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-2.1.2-bin-arm64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.1.2-bin-arm64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.1.2-bin-arm64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.1/2.1.2/',
                        version: '2.1.2-rc04',
                    },
                ],
            },
            {
                label: '2.1.1',
                value: '2.1.1',
                majorVersion: '2.1',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-2.1.1-bin-x64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.1.1-bin-x64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.1.1-bin-x64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.1/2.1.1/',
                        version: '2.1.1-rc05',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-2.1.1-bin-x64-noavx2.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.1.1-bin-x64-noavx2.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.1.1-bin-x64-noavx2.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.1/2.1.1/',
                        version: '2.1.1-rc05',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-2.1.1-bin-arm64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.1.1-bin-arm64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.1.1-bin-arm64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.1/2.1.1/',
                        version: '2.1.1-rc05',
                    },
                ],
            },
            {
                label: '2.1.0',
                value: '2.1.0',
                majorVersion: '2.1',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-2.1.0-bin-x64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.1.0-bin-x64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.1.0-bin-x64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.1/2.1.0/',
                        version: '2.1.0',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-2.1.0-bin-x64-noavx2.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.1.0-bin-x64-noavx2.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.1.0-bin-x64-noavx2.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.1/2.1.0/',
                        version: '2.1.0',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-2.1.0-bin-arm64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.1.0-bin-arm64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.1.0-bin-arm64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.1/2.1.0/',
                        version: '2.1.0',
                    },
                ],
            },
        ],
    },
    {
        label: '2.0',
        value: '2.0',
        children: [
            {
                label: '2.0.15',
                value: '2.0.15',
                majorVersion: '2.0',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-2.0.15.1-bin-x64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.15.1-bin-x64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.15.1-bin-x64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.15.1/',
                        version: '2.0.15.1',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-2.0.15.1-bin-x64-noavx2.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.15.1-bin-x64-noavx2.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.15.1-bin-x64-noavx2.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.15.1/',
                        version: '2.0.15.1',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-2.0.15.1-bin-arm64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.15.1-bin-arm64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.15.1-bin-arm64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.15.1/',
                        version: '2.0.15.1',
                    },
                ],
            },
            {
                label: '2.0.14',
                value: '2.0.14',
                majorVersion: '2.0',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-2.0.14-bin-x64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.14-bin-x64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.14-bin-x64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.14/',
                        version: '2.0.14',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-2.0.14-bin-x64-noavx2.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.14-bin-x64-noavx2.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.14-bin-x64-noavx2.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.14/',
                        version: '2.0.14',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-2.0.14-bin-arm64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.14-bin-arm64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.14-bin-arm64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.14/',
                        version: '2.0.14',
                    },
                ],
            },
            {
                label: '2.0.13',
                value: '2.0.13',
                majorVersion: '2.0',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-2.0.13-bin-x64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.13-bin-x64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.13-bin-x64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.13/',
                        version: '2.0.13',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-2.0.13-bin-x64-noavx2.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.13-bin-x64-noavx2.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.13-bin-x64-noavx2.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.13/',
                        version: '2.0.13',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-2.0.13-bin-arm64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.13-bin-arm64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.13-bin-arm64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.13/',
                        version: '2.0.13',
                    },
                ],
            },
            {
                label: '2.0.12',
                value: '2.0.12',
                majorVersion: '2.0',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-2.0.12-bin-x64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.12-bin-x64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.12-bin-x64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.12/',
                        version: '2.0.12',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-2.0.12-bin-x64-noavx2.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.12-bin-x64-noavx2.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.12-bin-x64-noavx2.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.12/',
                        version: '2.0.12',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-2.0.12-bin-arm64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.12-bin-arm64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.12-bin-arm64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.12/',
                        version: '2.0.12',
                    },
                ],
            },
            {
                label: '2.0.11',
                value: '2.0.11',
                majorVersion: '2.0',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-2.0.11-bin-x64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.11-bin-x64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.11-bin-x64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.11/',
                        version: '2.0.11',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-2.0.11-bin-x64-noavx2.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.11-bin-x64-noavx2.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.11-bin-x64-noavx2.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.11/',
                        version: '2.0.11',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-2.0.11-bin-arm64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.11-bin-arm64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.11-bin-arm64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.11/',
                        version: '2.0.11',
                    },
                ],
            },
            {
                label: '2.0.10',
                value: '2.0.10',
                majorVersion: '2.0',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-2.0.10-bin-x64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.10-bin-x64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.10-bin-x64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.10/',
                        version: '2.0.10',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-2.0.10-bin-x64-noavx2.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.10-bin-x64-noavx2.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.10-bin-x64-noavx2.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.10/',
                        version: '2.0.10',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-2.0.10-bin-arm64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.10-bin-arm64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.10-bin-arm64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.10/',
                        version: '2.0.10',
                    },
                ],
            },
            {
                label: '2.0.9',
                value: '2.0.9',
                majorVersion: '2.0',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-2.0.9-bin-x64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.9-bin-x64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.9-bin-x64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.9/',
                        version: '2.0.9',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-2.0.9-bin-x64-noavx2.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.9-bin-x64-noavx2.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.9-bin-x64-noavx2.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.9/',
                        version: '2.0.9',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-2.0.9-bin-arm64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.9-bin-arm64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.9-bin-arm64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.9/',
                        version: '2.0.9',
                    },
                ],
            },
            {
                label: '2.0.8',
                value: '2.0.8',
                majorVersion: '2.0',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-2.0.8-bin-x64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.8-bin-x64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.8-bin-x64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.8/',
                        version: '2.0.8',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-2.0.8-bin-x64-noavx2.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.8-bin-x64-noavx2.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.8-bin-x64-noavx2.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.8/',
                        version: '2.0.8',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-2.0.8-bin-arm64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.8-bin-arm64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.8-bin-arm64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.8/',
                        version: '2.0.8',
                    },
                ],
            },
            {
                label: '2.0.7',
                value: '2.0.7',
                majorVersion: '2.0',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-2.0.7-bin-x64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.7-bin-x64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.7-bin-x64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.7/',
                        version: '2.0.7',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-2.0.7-bin-x64-noavx2.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.7-bin-x64-noavx2.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.7-bin-x64-noavx2.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.7/',
                        version: '2.0.7',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-2.0.7-bin-arm64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.7-bin-arm64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.7-bin-arm64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.7/',
                        version: '2.0.7',
                    },
                ],
            },
            {
                label: '2.0.6',
                value: '2.0.6',
                majorVersion: '2.0',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-2.0.6-bin-x64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.6-bin-x64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.6-bin-x64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.6/',
                        version: '2.0.6',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-2.0.6-bin-x64-noavx2.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.6-bin-x64-noavx2.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.6-bin-x64-noavx2.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.6/',
                        version: '2.0.6',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-2.0.6-bin-arm64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.6-bin-arm64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.6-bin-arm64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.6/',
                        version: '2.0.6',
                    },
                ],
            },
            {
                label: '2.0.5',
                value: '2.0.5',
                majorVersion: '2.0',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-2.0.5-bin-x64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.5-bin-x64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.5-bin-x64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.5/',
                        version: '2.0.5',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-2.0.5-bin-x64-noavx2.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.5-bin-x64-noavx2.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.5-bin-x64-noavx2.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.5/',
                        version: '2.0.5',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-2.0.5-bin-arm64.tar.gz`,
                        asc: `${ORIGIN}apache-doris-2.0.5-bin-arm64.tar.gz.asc`,
                        sha512: `${ORIGIN}apache-doris-2.0.5-bin-arm64.tar.gz.sha512`,
                        source: 'https://downloads.apache.org/doris/2.0/2.0.5/',
                        version: '2.0.5',
                    },
                ],
            },
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
                label: '1.2.8',
                value: '1.2.8',
                majorVersion: '1.2',
                items: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: `${ORIGIN}apache-doris-1.2.8-bin-x64.tar.xz`,
                        asc: `${ORIGIN}apache-doris-1.2.8-bin-x64.tar.xz.asc`,
                        sha512: `${ORIGIN}apache-doris-1.2.8-bin-x64.tar.xz.sha512`,
                        source: 'https://archive.apache.org/dist/doris/1.2/1.2.8-rc01/',
                        version: '1.2.8',
                    },
                    {
                        label: CPUEnum.X64NoAvx2,
                        value: CPUEnum.X64NoAvx2,
                        gz: `${ORIGIN}apache-doris-1.2.8-bin-x64-noavx2.tar.xz`,
                        asc: `${ORIGIN}apache-doris-1.2.8-bin-x64-noavx2.tar.xz.asc`,
                        sha512: `${ORIGIN}apache-doris-1.2.8-bin-x64-noavx2.tar.xz.sha512`,
                        source: 'https://archive.apache.org/dist/doris/1.2/1.2.8-rc01/',
                        version: '1.2.8',
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: `${ORIGIN}apache-doris-1.2.8-bin-arm64.tar.xz`,
                        asc: `${ORIGIN}apache-doris-1.2.8-bin-arm64.tar.xz.asc`,
                        sha512: `${ORIGIN}apache-doris-1.2.8-bin-arm64.tar.xz.sha512`,
                        source: 'https://archive.apache.org/dist/doris/1.2/1.2.8-rc01/',
                        version: '1.2.8',
                    },
                ],
            },
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

export const TOOL_VERSIONS = [
    {
        label: ToolsEnum.Kafka,
        value: ToolsEnum.Kafka,
        children: [
            {
                label: '1.0.0',
                value: '1.0.0',
                gz: 'https://downloads.apache.org/doris/kafka-connector/1.0.0-rc01/apache-doris-kafka-connector-1.0.0-src.tar.gz',
                Source: 'https://downloads.apache.org/doris/kafka-connector/1.0.0-rc01/apache-doris-kafka-connector-1.0.0-src.tar.gz',
                Binary: 'https://repository.apache.org/content/repositories/releases/org/apache/doris/doris-kafka-connector/1.0.0/doris-kafka-connector-1.0.0.jar'
            },
        ],
    },
    {
        label: ToolsEnum.Flink,
        value: ToolsEnum.Flink,
        children: [
            {
                label: '1.6.1',
                value: '1.6.1',
                gz: 'https://downloads.apache.org/doris/flink-connector/1.6.1/apache-doris-flink-connector-1.6.1-src.tar.gz',
                Source: 'https://downloads.apache.org/doris/flink-connector/1.6.1/apache-doris-flink-connector-1.6.1-src.tar.gz',
                Binary: 'https://repository.apache.org/content/repositories/releases/org/apache/doris/flink-doris-connector-1.19/1.6.1/flink-doris-connector-1.19-1.6.1.jar'
            },
            {
                label: '1.5.2',
                value: '1.5.2',
                gz: 'https://downloads.apache.org/doris/flink-connector/1.5.2/apache-doris-flink-connector-1.5.2-src.tar.gz',
                Source: 'https://downloads.apache.org/doris/flink-connector/1.5.2/apache-doris-flink-connector-1.5.2-src.tar.gz',
                Binary: 'https://repository.apache.org/content/repositories/releases/org/apache/doris/flink-doris-connector-1.18/1.5.2/flink-doris-connector-1.18-1.5.2.jar'
            },
            {
                label: '1.4.0',
                value: '1.4.0',
                gz: 'https://downloads.apache.org/doris/flink-connector/1.4.0/apache-doris-flink-connector-1.4.0-src.tar.gz',
                Source: 'https://downloads.apache.org/doris/flink-connector/1.4.0/apache-doris-flink-connector-1.4.0-src.tar.gz',
                Binary: 'https://repository.apache.org/content/repositories/releases/org/apache/doris/flink-doris-connector-1.17/1.4.0/flink-doris-connector-1.17-1.4.0.jar'
            },
            {
                label: '1.3.0',
                value: '1.3.0',
                gz: 'https://downloads.apache.org/doris/flink-connector/1.3.0/apache-doris-flink-connector-1.16-1.3.0-src.tar.gz',
                Source: 'https://downloads.apache.org/doris/flink-connector/1.3.0/apache-doris-flink-connector-1.16-1.3.0-src.tar.gz',
                Binary: 'https://repository.apache.org/content/repositories/releases/org/apache/doris/flink-doris-connector-1.16/1.3.0/flink-doris-connector-1.16-1.3.0.jar'
            },
            {
                label: '1.2.1',
                value: '1.2.1',
                gz: 'https://downloads.apache.org/doris/flink-connector/1.2.1/apache-doris-flink-connector-1.15-1.2.1-src.tar.gz',
                Source: 'https://downloads.apache.org/doris/flink-connector/1.2.1/apache-doris-flink-connector-1.15-1.2.1-src.tar.gz',
                Binary: 'https://repository.apache.org/content/repositories/releases/org/apache/doris/flink-doris-connector-1.15/1.2.1/flink-doris-connector-1.15-1.2.1.jar'
            },
            {
                label: '1.1.1',
                value: '1.1.1',
                gz: 'https://downloads.apache.org/doris/flink-connector/1.1.1/apache-doris-flink-connector-1.14_2.11-1.1.1-src.tar.gz',
                Source: 'https://downloads.apache.org/doris/flink-connector/1.1.1/apache-doris-flink-connector-1.14_2.11-1.1.1-src.tar.gz',
                Binary: 'https://repository.apache.org/content/repositories/releases/org/apache/doris/flink-doris-connector-1.14_2.12/1.1.1/flink-doris-connector-1.14_2.12-1.1.1.jar'
            },
            {
                label: '1.0.3',
                value: '1.0.3',
                gz: 'https://downloads.apache.org/doris/flink-connector/1.0.3/apache-doris-flink-connector-1.12_2.11-1.0.3-src.tar.gz',
                Source: 'https://downloads.apache.org/doris/flink-connector/1.0.3/apache-doris-flink-connector-1.12_2.11-1.0.3-src.tar.gz',
                Binary: 'https://repository.apache.org/content/repositories/releases/org/apache/doris/flink-doris-connector-1.14_2.12/1.0.3/flink-doris-connector-1.14_2.12-1.0.3.jar'
            },
        ],
    },
    {
        label: ToolsEnum.Spark,
        value: ToolsEnum.Spark,
        children: [
            {
                label: '1.3.2',
                value: '1.3.2',
                gz: 'https://downloads.apache.org/doris/spark-connector/1.3.2/apache-doris-spark-connector-1.3.2-src.tar.gz',
                Source: 'https://downloads.apache.org/doris/spark-connector/1.3.2/apache-doris-spark-connector-1.3.2-src.tar.gz',
                Binary: 'https://repository.apache.org/content/repositories/releases/org/apache/doris/spark-doris-connector-3.4_2.12/1.3.2/spark-doris-connector-3.4_2.12-1.3.2.jar'
            },
            {
                label: '1.2.0',
                value: '1.2.0',
                gz: 'https://downloads.apache.org/doris/spark-connector/1.2.0/apache-doris-spark-connector-1.2.0-src.tar.gz',
                Source: 'https://downloads.apache.org/doris/spark-connector/1.2.0/apache-doris-spark-connector-1.2.0-src.tar.gz',
                Binary: 'https://repository.apache.org/content/repositories/releases/org/apache/doris/spark-doris-connector-3.2_2.12/1.2.0/spark-doris-connector-3.2_2.12-1.2.0.jar'
            },
            {
                label: '1.1.0',
                value: '3.2_2.12-1.1.0',
                gz: 'https://downloads.apache.org/doris/spark-connector/1.1.0/apache-doris-spark-connector-3.2_2.12-1.1.0-src.tar.gz',
                Source: 'https://downloads.apache.org/doris/spark-connector/1.1.0/apache-doris-spark-connector-3.2_2.12-1.1.0-src.tar.gz',
                Binary: 'https://repository.apache.org/content/repositories/releases/org/apache/doris/spark-doris-connector-3.2_2.12/1.1.0/spark-doris-connector-3.2_2.12-1.1.0.jar'
            },
            {
                label: '1.0.1 (For Spark 3.1)',
                value: '3.1_2.12-1.0.1',
                gz: 'https://downloads.apache.org/doris/spark-connector/1.0.1/apache-doris-spark-connector-3.1_2.12-1.0.1-incubating-src.tar.gz',
                Source: 'https://downloads.apache.org/doris/spark-connector/1.0.1/apache-doris-spark-connector-3.1_2.12-1.0.1-incubating-src.tar.gz',
                Binary: 'https://repository.apache.org/content/repositories/releases/org/apache/doris/spark-doris-connector-3.1_2.12/1.0.1/spark-doris-connector-3.1_2.12-1.0.1.jar'
            },
            {
                label: '1.0.1 (For Spark 2.x)',
                value: '2.3_2.11-1.0.1',
                gz: 'https://downloads.apache.org/doris/spark-connector/1.0.1/apache-doris-spark-connector-2.3_2.11-1.0.1-incubating-src.tar.gz',
                Source: 'https://downloads.apache.org/doris/spark-connector/1.0.1/apache-doris-spark-connector-2.3_2.11-1.0.1-incubating-src.tar.gz',
                Binary: 'https://repository.apache.org/content/repositories/releases//org/apache/doris/spark-doris-connector-2.3_2.11/1.0.1/spark-doris-connector-2.3_2.11-1.0.1.jar'
            },
        ],
    },
    {
        label: ToolsEnum.StreamLoader,
        value: ToolsEnum.StreamLoader,
        children: [
            {
                label: '1.0.2',
                value: '1.0.2',
                children: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: 'https://apache-doris-releases.oss-accelerate.aliyuncs.com/apache-doris-streamloader-1.0.2-bin-x64.tar.gz',
                        Binary: 'https://apache-doris-releases.oss-accelerate.aliyuncs.com/apache-doris-streamloader-1.0.2-bin-x64.tar.gz'
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: 'https://apache-doris-releases.oss-accelerate.aliyuncs.com/apache-doris-streamloader-1.0.2-bin-arm64.tar.gz',
                        Binary: 'https://apache-doris-releases.oss-accelerate.aliyuncs.com/apache-doris-streamloader-1.0.2-bin-arm64.tar.gz'
                    },
                ],
                source: 'https://downloads.apache.org/doris/doris-streamloader/1.0.2/apache-doris-streamloader-1.0.2-src.tar.gz',
            },
            {
                label: '1.0.1',
                value: '1.0.1',
                children: [
                    {
                        label: CPUEnum.X64,
                        value: CPUEnum.X64,
                        gz: 'https://apache-doris-releases.oss-accelerate.aliyuncs.com/apache-doris-streamloader-1.0.1-bin-x64.tar.xz',
                        Binary: 'https://apache-doris-releases.oss-accelerate.aliyuncs.com/apache-doris-streamloader-1.0.1-bin-x64.tar.xz'
                    },
                    {
                        label: CPUEnum.ARM64,
                        value: CPUEnum.ARM64,
                        gz: 'https://apache-doris-releases.oss-accelerate.aliyuncs.com/apache-doris-streamloader-1.0.1-bin-arm64.tar.xz',
                        Binary: 'https://apache-doris-releases.oss-accelerate.aliyuncs.com/apache-doris-streamloader-1.0.1-bin-arm64.tar.xz'
                    },
                ],
                source: 'https://downloads.apache.org/doris/doris-streamloader/1.0.1/apache-doris-streamloader-1.0.1-src.tar.gz',
            },
        ],
    },
];

export const RUN_ANYWHERE = [
    {
        title: 'Doris on bare metal',
        description: 'A platform for visualized cluster deployment on bare metal or VM.',
        link: 'https://doris.apache.org/docs/install/cluster-deployment/standard-deployment',
    },
    {
        title: 'Doris on Kubernetes',
        description: 'Create, configure and manage Doris clusters on Kubernetes',
        link: 'https://doris.apache.org/docs/install/cluster-deployment/k8s-deploy/install-env',
    },
    {
        title: 'Doris on AWS',
        description: 'Deploy Doris on AWS with CloudFormation templates',
        link: 'https://doris.apache.org/docs/install/cluster-deployment/doris-on-aws',
    },
];


export const DOWNLOAD_PDFS = [{
    version: '3.0',
    filename: 'Apache Doris 中文手册（v3.0）.pdf',
    link: 'https://cdn.selectdb.com/static/Apache_Doris_v3_0_4412376f6e.pdf'
}, {
    version: '2.1',
    filename: 'Apache Doris 中文手册（v2.1）.pdf',
    link: 'https://cdn.selectdb.com/static/Apache_Doris_v2_1_c8bc030188.pdf'
}, {
    version: '2.0',
    filename: 'Apache Doris 中文手册（v2.0）.pdf',
    link: 'https://cdn.selectdb.com/static/Apache_Doris_v2_0_0b89998444.pdf'
}];