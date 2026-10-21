---
{
    "title": "설정 디렉터리",
    "language": "ko",
    "description": "FE와 BE의 설정 파일 디렉터리는 conf/입니다. 기본 fe.conf, be.conf 등의 파일을 저장하는 것 외에도,"
}
---

# 설정 디렉터리 {#config-dir}

FE와 BE의 설정 파일 디렉터리는 `conf/`입니다. 이 디렉터리는 기본 fe.conf, be.conf 등의 파일뿐 아니라 공통 설정 파일을 저장하는 데도 사용됩니다.

사용자가 이 디렉터리에 설정 파일을 저장하면 시스템이 자동으로 읽어 들입니다.

컴퓨팅과 스토리지가 분리된 모드에서는 Meta Service가 별도의 `doris_cloud.conf`를 사용합니다. [Meta Service 설정](./ms-config.md)을 참조하세요.

## hdfs-site.xml 및 hive-site.xml {#hdfs-sitexml-and-hive-sitexml}

Doris의 일부 기능에서는 HDFS의 데이터나 Hive metastore에 접근해야 합니다.

각 기능에 해당하는 구문에서 다양한 HDFS/Hive 매개변수를 직접 지정할 수 있습니다.

하지만 매개변수가 매우 많아 모두 직접 지정하기는 번거롭습니다.

따라서 HDFS 또는 Hive 설정 파일인 hdfs-site.xml/hive-site.xml을 `conf/` 디렉터리에 직접 저장하면 됩니다. Doris가 이 설정 파일을 자동으로 읽어 들입니다.

사용자가 명령에 지정한 설정은 설정 파일의 해당 설정 항목을 덮어씁니다.

이렇게 하면 몇 가지 설정만 지정하여 HDFS/Hive에 접근할 수 있습니다.
