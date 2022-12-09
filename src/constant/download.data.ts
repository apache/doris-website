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

export const APACHE_LINK = 'https://www.apache.org/dyn/mirrors/mirrors.cgi?action=download&filename=';
export const CHINA_MIRROR_LINK = 'https://mirrors.tuna.tsinghua.edu.cn/apache/';

export const FLINK_CONNECTOR_LINK = 'https://dist.apache.org/repos/dist/release/';
export const CHINA_FLINK_CONNECTOR_MIRROR_LINK = CHINA_MIRROR_LINK;

export const SPARK_CONNECTOR_LINK = 'https://dist.apache.org/repos/dist/release/';
export const CHINA_SPARK_CONNECTOR_MIRROR_LINK = CHINA_MIRROR_LINK;

export const ALL_RELEASE_LINK = 'https://archive.apache.org/dist/';
export const CHINA_ALL_RELEASE_MIRROR_LINK = 'https://mirrors.tuna.tsinghua.edu.cn/apache/';

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
