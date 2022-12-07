interface item {
    label: string;
    links: {
        source: string;
        signature: string;
        sha512: string;
    };
}
export interface DownloadLinkProps {
    id: string;
    items: item[];
}

const APACHE_LINK = 'https://www.apache.org/dyn/mirrors/mirrors.cgi?action=download&filename=';
const CHINA_MIRROR_LINK = 'https://mirrors.tuna.tsinghua.edu.cn/apache/';

const FLINK_CONNECTOR_LINK = 'https://dist.apache.org/repos/dist/release/';
const CHINA_FLINK_CONNECTOR_MIRROR_LINK = CHINA_MIRROR_LINK;

const SPARK_CONNECTOR_LINK = 'https://dist.apache.org/repos/dist/release/';
const CHINA_SPARK_CONNECTOR_MIRROR_LINK = CHINA_MIRROR_LINK;

const ALL_RELEASE_LINK = 'https://archive.apache.org/dist/';
const CHINA_ALL_RELEASE_MIRROR_LINK = 'https://mirrors.tuna.tsinghua.edu.cn/apache/';

export function getAllDownloadLinks(locale: string) {
    const sources = locale.toLocaleUpperCase() === 'EN' ? APACHE_LINK : CHINA_MIRROR_LINK;
    return [
        {
            id: '1.2.0-intel-avx2-jdk8',
            items: [
                {
                    label: 'apache-doris-fe-1.2.0-bin.tar.xz',
                    links: {
                        source: `${sources}doris/1.2/1.2.0-rc04/apache-doris-fe-1.2.0-bin-x86_64.tar.xz`,
                        signature: `${APACHE_LINK}doris/1.2/1.2.0-rc04/apache-doris-fe-1.2.0-bin-x86_64.tar.xz.asc`,
                        sha512: `${APACHE_LINK}doris/1.2/1.2.0-rc04/apache-doris-fe-1.2.0-bin-x86_64.tar.xz.sha512`,
                    },
                },
                {
                    label: 'apache-doris-be-1.2.0-bin-x86_64.tar.xz',
                    links: {
                        source: `${sources}doris/1.2/1.2.0-rc04/apache-doris-be-1.2.0-bin-x86_64.tar.xz`,
                        signature: `${APACHE_LINK}doris/1.2/1.2.0-rc04/apache-doris-be-1.2.0-bin-x86_64.tar.xz.asc`,
                        sha512: `${APACHE_LINK}doris/1.2/1.2.0-rc04/apache-doris-be-1.2.0-bin-x86_64.tar.xz.sha512`,
                    },
                },
                {
                    label: 'apache-doris-java-udf-jar-with-dependencies-1.2.0-bin-x86_64.tar.xz',
                    links: {
                        source: `${sources}doris/1.2/1.2.0-rc04/apache-doris-java-udf-jar-with-dependencies-1.2.0-bin-x86_64.tar.xz`,
                        signature: `${APACHE_LINK}doris/1.2/1.2.0-rc04/apache-doris-java-udf-jar-with-dependencies-1.2.0-bin-x86_64.tar.xz.asc`,
                        sha512: `${APACHE_LINK}doris/1.2/1.2.0-rc04/apache-doris-java-udf-jar-with-dependencies-1.2.0-bin-x86_64.tar.xz.sha512`,
                    },
                },
            ],
        },
        {
            id: '1.2.0-intel-noavx2-jdk8',
            items: [
                {
                    label: 'apache-doris-fe-1.2.0-bin.tar.xz',
                    links: {
                        source: `${sources}doris/1.2/1.2.0-rc04/apache-doris-fe-1.2.0-bin-x86_64.tar.xz`,
                        signature: `${APACHE_LINK}doris/1.2/1.2.0-rc04/apache-doris-fe-1.2.0-bin-x86_64.tar.xz.asc`,
                        sha512: `${APACHE_LINK}doris/1.2/1.2.0-rc04/apache-doris-fe-1.2.0-bin-x86_64.tar.xz.sha512`,
                    },
                },
                {
                    label: 'apache-doris-be-1.2.0-bin-x86_64-noavx2.tar.xz',
                    links: {
                        source: `${sources}doris/1.2/1.2.0-rc04/apache-doris-be-1.2.0-bin-x86_64-noavx2.tar.xz`,
                        signature: `${APACHE_LINK}doris/1.2/1.2.0-rc04/apache-doris-be-1.2.0-bin-x86_64-noavx2.tar.xz.asc`,
                        sha512: `${APACHE_LINK}doris/1.2/1.2.0-rc04/apache-doris-be-1.2.0-bin-x86_64-noavx2.tar.xz.sha512`,
                    },
                },
                {
                    label: 'apache-doris-java-udf-jar-with-dependencies-1.2.0-bin-x86_64.tar.xz',
                    links: {
                        source: `${sources}doris/1.2/1.2.0-rc04/apache-doris-java-udf-jar-with-dependencies-1.2.0-bin-x86_64.tar.xz`,
                        signature: `${APACHE_LINK}doris/1.2/1.2.0-rc04/apache-doris-java-udf-jar-with-dependencies-1.2.0-bin-x86_64.tar.xz.asc`,
                        sha512: `${APACHE_LINK}doris/1.2/1.2.0-rc04/apache-doris-java-udf-jar-with-dependencies-1.2.0-bin-x86_64.tar.xz.sha512`,
                    },
                },
            ],
        },
        {
            id: '1.2.0-arm-jdk8',
            items: [
                {
                    label: 'apache-doris-fe-1.2.0-bin-arm.tar.xz',
                    links: {
                        source: `${sources}doris/1.2/1.2.0-rc04/apache-doris-fe-1.2.0-bin-arm.tar.xz`,
                        signature: `${APACHE_LINK}doris/1.2/1.2.0-rc04/apache-doris-fe-1.2.0-bin-arm.tar.xz.asc`,
                        sha512: `${APACHE_LINK}doris/1.2/1.2.0-rc04/apache-doris-fe-1.2.0-bin-arm.tar.xz.sha512`,
                    },
                },
                {
                    label: 'apache-doris-be-1.2.0-bin-arm.tar.xz',
                    links: {
                        source: `${sources}doris/1.2/1.2.0-rc04/apache-doris-be-1.2.0-bin-arm.tar.xz`,
                        signature: `${APACHE_LINK}doris/1.2/1.2.0-rc04/apache-doris-be-1.2.0-bin-arm.tar.xz.asc`,
                        sha512: `${APACHE_LINK}doris/1.2/1.2.0-rc04/apache-doris-be-1.2.0-bin-arm.tar.xz.sha512`,
                    },
                },
                {
                    label: 'apache-doris-java-udf-jar-with-dependencies-1.2.0-bin-arm.tar.xz',
                    links: {
                        source: `${sources}doris/1.2/1.2.0-rc04/apache-doris-java-udf-jar-with-dependencies-1.2.0-bin-arm.tar.xz`,
                        signature: `${APACHE_LINK}doris/1.2/1.2.0-rc04/apache-doris-java-udf-jar-with-dependencies-1.2.0-bin-arm.tar.xz.asc`,
                        sha512: `${APACHE_LINK}doris/1.2/1.2.0-rc04/apache-doris-java-udf-jar-with-dependencies-1.2.0-bin-arm.tar.xz.sha512`,
                    },
                },
            ],
        },

        {
            id: '1.1.4-intel-avx2-jdk8',
            items: [
                {
                    label: 'apache-doris-fe-1.1.4-bin.tar.gz',
                    links: {
                        source: `${sources}doris/1.1/1.1.4-rc01/apache-doris-fe-1.1.4-bin.tar.gz`,
                        signature: `${APACHE_LINK}doris/1.1/1.1.4-rc01/apache-doris-fe-1.1.4-bin.tar.gz.asc`,
                        sha512: `${APACHE_LINK}doris/1.1/1.1.4-rc01/apache-doris-fe-1.1.4-bin.tar.gz.sha512`,
                    },
                },
                {
                    label: 'apache-doris-be-1.1.4-bin-x86_64.tar.gz',
                    links: {
                        source: `${sources}doris/1.1/1.1.4-rc01/apache-doris-be-1.1.4-bin-x86_64.tar.gz`,
                        signature: `${APACHE_LINK}doris/1.1/1.1.4-rc01/apache-doris-be-1.1.4-bin-x86_64.tar.gz.asc`,
                        sha512: `${APACHE_LINK}doris/1.1/1.1.4-rc01/apache-doris-be-1.1.4-bin-x86_64.tar.gz.sha512`,
                    },
                },
            ],
        },
        {
            id: '1.1.4-intel-noavx2-jdk8',
            items: [
                {
                    label: 'apache-doris-fe-1.1.4-bin.tar.gz',
                    links: {
                        source: `${sources}doris/1.1/1.1.4-rc01/apache-doris-fe-1.1.4-bin.tar.gz`,
                        signature: `${APACHE_LINK}doris/1.1/1.1.4-rc01/apache-doris-fe-1.1.4-bin.tar.gz.asc`,
                        sha512: `${APACHE_LINK}doris/1.1/1.1.4-rc01/apache-doris-fe-1.1.4-bin.tar.gz.sha512`,
                    },
                },
                {
                    label: 'apache-doris-be-1.1.4-bin-x86_64-noavx2.tar.gz',
                    links: {
                        source: `${sources}doris/1.1/1.1.4-rc01/apache-doris-be-1.1.4-bin-x86_64-noavx2.tar.gz`,
                        signature: `${APACHE_LINK}doris/1.1/1.1.4-rc01/apache-doris-be-1.1.4-bin-x86_64-noavx2.tar.gz.asc`,
                        sha512: `${APACHE_LINK}doris/1.1/1.1.4-rc01/apache-doris-be-1.1.4-bin-x86_64-noavx2.tar.gz.sha512`,
                    },
                },
            ],
        },
        {
            id: '1.1.4-arm-jdk8',
            items: [
                {
                    label: 'apache-doris-fe-1.1.4-bin.tar.gz',
                    links: {
                        source: `${sources}doris/1.1/1.1.4-rc01/apache-doris-fe-1.1.4-bin.tar.gz`,
                        signature: `${APACHE_LINK}doris/1.1/1.1.4-rc01/apache-doris-fe-1.1.4-bin.tar.gz.asc`,
                        sha512: `${APACHE_LINK}doris/1.1/1.1.4-rc01/apache-doris-fe-1.1.4-bin.tar.gz.sha512`,
                    },
                },
                {
                    label: 'apache-doris-1.1.4-bin-arm.tar.gz ',
                    links: {
                        source: `${sources}doris/1.1/1.1.4-rc01/apache-doris-1.1.4-bin-arm.tar.gz`,
                        signature: `${APACHE_LINK}doris/1.1/1.1.4-rc01/apache-doris-1.1.4-bin-arm.tar.gz.asc`,
                        sha512: `${APACHE_LINK}doris/1.1/1.1.4-rc01/apache-doris-1.1.4-bin-arm.tar.gz.sha512`,
                    },
                },
            ],
        },
    ];
}

export function getAllFlinkConnectorDownloadLinks(locale: string) {
    const sources = locale.toLocaleUpperCase() === 'EN' ? FLINK_CONNECTOR_LINK : CHINA_FLINK_CONNECTOR_MIRROR_LINK;
    return [
        {
            version: '1.3.0',
            date: '2022-12-07',
            flink: '1.16',
            scala: '2.12, 2.11',
            doris: '1.0+',
            download: `${sources}doris/flink-connector/1.3.0/`,
            github: 'https://github.com/apache/doris-flink-connector',
        },
        {
            version: '1.2.1',
            date: '2022-12-07',
            flink: '1.15',
            scala: '2.12, 2.11',
            doris: '1.0+',
            download: `${sources}doris/flink-connector/1.2.1/`,
            github: 'https://github.com/apache/doris-flink-connector',
        },
        {
            version: '1.1.1',
            date: '2021-12-07',
            flink: '1.14',
            scala: '2.12, 2.11',
            doris: '1.0+',
            download: `${sources}doris/flink-connector/1.1.1/`,
            github: 'https://github.com/apache/doris-flink-connector',
        },
        {
            version: '1.2.0',
            date: '2022-08-15',
            flink: '1.15',
            scala: '2.12, 2.11',
            doris: '1.0+',
            download: `${sources}doris/flink-connector/1.2.0/`,
            github: 'https://github.com/apache/doris-flink-connector',
        },
        {
            version: '1.1.0',
            date: '2022-07-11',
            flink: '1.14',
            scala: '2.12, 2.11',
            doris: '0.15+',
            download: `${sources}doris/flink-connector/1.1.0/`,
            github: 'https://github.com/apache/doris-flink-connector',
        },
        {
            version: '1.0.3',
            date: '2021-03-18',
            flink: '1.14, 1.13, 1.12, 1.11',
            scala: '2.12, 2.11',
            doris: '0.15+',
            download: `${sources}doris/flink-connector/1.0.3/`,
            github: 'https://github.com/apache/doris-flink-connector',
        },
    ];
}
export function getAllSparkConnectorDownloadLinks(locale: string) {
    const sources = locale.toLocaleUpperCase() === 'EN' ? SPARK_CONNECTOR_LINK : CHINA_SPARK_CONNECTOR_MIRROR_LINK;
    return [
        {
            version: '1.1.0',
            date: '2022-07-11',
            spark: '3.2, 3.1, 2.3',
            scala: '2.12, 2.11',
            doris: '0.15+',
            download: `${sources}doris/spark-connector/1.1.0/`,
            github: 'https://github.com/apache/doris-spark-connector',
        },
        {
            version: '1.0.1',
            date: '2021-03-18',
            spark: '3.1, 2.3',
            scala: '2.12, 2.11',
            doris: '0.15+',
            download: `${sources}doris/spark-connector/1.0.1/`,
            github: 'https://github.com/apache/doris-spark-connector',
        },
    ];
}

export function getAllRelease(locale: string) {
    const sources = locale.toLocaleUpperCase() === 'EN' ? ALL_RELEASE_LINK : CHINA_ALL_RELEASE_MIRROR_LINK;
    return [
        {
            version: '1.2.0 ( latest )',
            date: '2022-12-07',
            note: '/docs/dev/releasenotes/release-1.2.0',
            download: `${sources}doris/1.2/1.2.0-rc04/`,
        },
        {
            version: '1.1.4',
            date: '2022-11-11',
            note: '/docs/dev/releasenotes/release-1.1.4',
            download: `${sources}doris/1.1/1.1.4-rc01/`,
        },
        {
            version: '1.1.3',
            date: '2022-10-17',
            note: '/docs/dev/releasenotes/release-1.1.3',
            download: `${sources}doris/1.1/1.1.3-rc02/`,
        },
        {
            version: '1.1.2',
            date: '2022-09-13',
            note: '/docs/dev/releasenotes/release-1.1.2',
            download: `${sources}doris/1.1/1.1.2-rc05/`,
        },
        {
            version: '1.1.1',
            date: '2022-07-29',
            note: '/docs/dev/releasenotes/release-1.1.1',
            download: `${sources}doris/1.1/1.1.1-rc03/`,
        },
        {
            version: '1.1.0',
            date: '2022-07-14',
            note: '/docs/dev/releasenotes/release-1.1.0',
            download: `${sources}doris/1.1/1.1.0-rc05/`,
        },
        {
            version: '0.15.0',
            date: '2021-11-29',
            note: 'https://github.com/apache/doris/issues/6806',
            download: `${sources}doris/0.15.0-incubating/`,
        },
        {
            version: '0.14.0',
            date: '2021-05-26',
            note: 'https://github.com/apache/doris/issues/5374',
            download: `${sources}doris/0.14.0-incubating/`,
        },
        {
            version: '0.13.0',
            date: '2020-10-24',
            note: 'https://github.com/apache/doris/issues/4370',
            download: `${sources}doris/0.13.0-incubating/`,
        },
    ];
}

export enum VersionEnum {
    Latest = '1.2.0',
    Prev = '1.1.4',
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
