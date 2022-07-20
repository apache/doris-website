export interface DownloadLinkProps {
    label: string;
    id: string;
    links: {
        source: string;
        signature: string;
        sha512: string;
    };
}

export const DOWNLOAD_LINKS: DownloadLinkProps[] = [
    {
        label: 'apache-doris-1.1.0-bin-x64-jdk8.tar.gz',
        id: '1.1-intel-avx2-jdk8',
        links: {
            source: 'https://dist.apache.org/repos/dist/release/doris/1.1/1.1.0-rc05/apache-doris-1.1.0-bin-x86-jdk8.tar.gz',
            signature:
                'https://dist.apache.org/repos/dist/release/doris/1.1/1.1.0-rc05/apache-doris-1.1.0-bin-x86-jdk8.tar.gz.asc',
            sha512: 'https://dist.apache.org/repos/dist/release/doris/1.1/1.1.0-rc05/apache-doris-1.1.0-bin-x86-jdk8.tar.gz.sha512',
        },
    },
    {
        label: 'apache-doris-1.1.0-bin-x64-jdk11.tar.gz',
        id: '1.1-intel-avx2-jdk11',
        links: {
            source: 'https://dist.apache.org/repos/dist/release/doris/1.1/1.1.0-rc05/apache-doris-1.1.0-bin-x86-jdk11.tar.gz',
            signature:
                'https://dist.apache.org/repos/dist/release/doris/1.1/1.1.0-rc05/apache-doris-1.1.0-bin-x86-jdk11.tar.gz.asc',
            sha512: 'https://dist.apache.org/repos/dist/release/doris/1.1/1.1.0-rc05/apache-doris-1.1.0-bin-x86-jdk11.tar.gz.sha512',
        },
    },
    {
        label: 'apache-doris-1.1.0-bin-x64-noavx2-jdk8.tar.gz',
        id: '1.1-intel-noavx2-jdk8',
        links: {
            source: 'https://dist.apache.org/repos/dist/release/doris/1.1/1.1.0-rc05/apache-doris-1.1.0-bin-x86-noavx2-jdk8.tar.gz',
            signature:
                'https://dist.apache.org/repos/dist/release/doris/1.1/1.1.0-rc05/apache-doris-1.1.0-bin-x86-noavx2-jdk8.tar.gz.asc',
            sha512: 'https://dist.apache.org/repos/dist/release/doris/1.1/1.1.0-rc05/apache-doris-1.1.0-bin-x86-noavx2-jdk8.tar.gz.sha512',
        },
    },
    {
        label: 'apache-doris-1.1.0-bin-x64-noavx2-jdk11.tar.gz',
        id: '1.1-intel-noavx2-jdk11',
        links: {
            source: 'https://dist.apache.org/repos/dist/release/doris/1.1/1.1.0-rc05/apache-doris-1.1.0-bin-x86-noavx2-jdk11.tar.gz',
            signature:
                'https://dist.apache.org/repos/dist/release/doris/1.1/1.1.0-rc05/apache-doris-1.1.0-bin-x86-noavx2-jdk11.tar.gz.asc',
            sha512: 'https://dist.apache.org/repos/dist/release/doris/1.1/1.1.0-rc05/apache-doris-1.1.0-bin-x86-noavx2-jdk11.tar.gz.sha512',
        },
    },
    {
        label: 'apache-doris-1.1.0-bin-arm64-jdk8.tar.gz',
        id: '1.1-arm-jdk8',
        links: {
            source: 'https://dist.apache.org/repos/dist/release/doris/1.1/1.1.0-rc05/apache-doris-1.1.0-bin-arm-jdk8.tar.gz',
            signature:
                'https://dist.apache.org/repos/dist/release/doris/1.1/1.1.0-rc05/apache-doris-1.1.0-bin-arm-jdk8.tar.gz.asc',
            sha512: 'https://dist.apache.org/repos/dist/release/doris/1.1/1.1.0-rc05/apache-doris-1.1.0-bin-arm-jdk8.tar.gz.sha512',
        },
    },
    {
        label: 'apache-doris-1.1.0-bin-arm64-jdk11.tar.gz',
        id: '1.1-arm-jdk11',
        links: {
            source: 'https://dist.apache.org/repos/dist/release/doris/1.1/1.1.0-rc05/apache-doris-1.1.0-bin-arm-jdk11.tar.gz',
            signature:
                'https://dist.apache.org/repos/dist/release/doris/1.1/1.1.0-rc05/apache-doris-1.1.0-bin-arm-jdk11.tar.gz.asc',
            sha512: 'https://dist.apache.org/repos/dist/release/doris/1.1/1.1.0-rc05/apache-doris-1.1.0-bin-arm-jdk11.tar.gz.sha512',
        },
    },
    {
        label: 'apache-doris-1.0.0-bin-x64-jdk8.tar.gz',
        id: '1.0-intel-avx2-jdk8',
        links: {
            source: 'https://archive.apache.org/dist/doris/1.0/1.0.0-incubating/apache-doris-1.0.0-incubating-bin.tar.gz',
            signature:
                'https://archive.apache.org/dist/doris/1.0/1.0.0-incubating/apache-doris-1.0.0-incubating-bin.tar.gz.asc',
            sha512: 'https://archive.apache.org/dist/doris/1.0/1.0.0-incubating/apache-doris-1.0.0-incubating-bin.tar.gz.sha512',
        },
    },
];

export enum VersionEnum {
    Latest = '1.1',
    Prev = '1.0',
}

export enum CPUEnum {
    IntelAvx2 = 'intel-avx2',
    IntelNoAvx2 = 'intel-noavx2',
    ARM = 'arm',
}

export enum JDKEnum {
    JDK8 = 'jdk8',
    JDK11 = 'jdk11',
}

export const ALL_RELEASE = [
    {
        version: '1.1.0 ( latest )',
        date: '2022-07-14',
        note: 'https://github.com/apache/doris/issues/9949',
        download: 'https://archive.apache.org/dist/doris/1.1/1.1.0-rc05/',
    },
    {
        version: '1.0.0',
        date: '2022-04-18',
        note: 'https://github.com/apache/doris/issues/8549',
        download: 'https://archive.apache.org/dist/doris/1.0/1.0.0-incubating/',
    },
    {
        version: '0.15.0',
        date: '2021-11-29',
        note: 'https://github.com/apache/doris/issues/6806',
        download: 'https://archive.apache.org/dist/doris/0.15.0-incubating/',
    },
    {
        version: '0.14.0',
        date: '2021-05-26',
        note: 'https://github.com/apache/doris/issues/5374',
        download: 'https://archive.apache.org/dist/incubator/doris/0.14.0-incubating/',
    },
    {
        version: '0.13.0',
        date: '2020-10-24',
        note: 'https://github.com/apache/doris/issues/4370',
        download: 'https://archive.apache.org/dist/incubator/doris/0.13.0-incubating/',
    },
];

export const FLINK_CONNECTOR = [
    {
        version: '1.1.0',
        date: '2022-07-11',
        flink: '1.14',
        scala: '2.12, 2.11',
        doris: '0.15+',
        download: 'https://dist.apache.org/repos/dist/release/doris/flink-connector/1.1.0/',
        github: 'https://github.com/apache/doris-flink-connector',
    },
    {
        version: '1.0.3',
        date: '2021-03-18',
        flink: '1.14, 1.13, 1.12, 1.11',
        scala: '2.12',
        doris: '0.15+',
        download: 'https://dist.apache.org/repos/dist/release/doris/flink-connector/1.0.3/',
        github: 'https://github.com/apache/doris-flink-connector',
    },
];

export const SPARK_CONNECTOR = [
    {
        version: '1.1.0',
        date: '2022-07-11',
        spark: '3.2, 3.1, 2.3',
        scala: '2.12, 2.11',
        doris: '0.15+',
        download: 'https://dist.apache.org/repos/dist/release/doris/spark-connector/1.1.0/',
        github: 'https://github.com/apache/doris-spark-connector',
    },
    {
        version: '1.0.1',
        date: '2021-03-18',
        spark: '3.1, 2.3',
        scala: '2.12, 2.11',
        doris: '0.15+',
        download: 'https://dist.apache.org/repos/dist/release/doris/spark-connector/1.0.1/',
        github: 'https://github.com/apache/doris-spark-connector',
    },
];
