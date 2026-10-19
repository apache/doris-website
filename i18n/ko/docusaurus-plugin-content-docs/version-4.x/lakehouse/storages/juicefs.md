---
{
    "title": "JuiceFS | 스토리지",
    "language": "ko",
    "description": "이 문서는 JuiceFS에 액세스하는 데 필요한 매개변수를 설명합니다. 이 매개변수는 다음에 적용됩니다:",
    "sidebar_label": "JuiceFS"
}
---

# JuiceFS {#juicefs}

:::tip 지원 시작 버전
Doris 4.0.2
:::

[JuiceFS](https://juicefs.com)는 클라우드용으로 설계된 오픈 소스 고성능 분산 파일 시스템입니다. HDFS API와 완전히 호환됩니다. Doris는 `jfs://` 스킴을 HDFS와 호환되는 것으로 처리하므로 HDFS와 동일한 방식으로 JuiceFS에 저장된 데이터에 액세스할 수 있습니다.

이 문서는 JuiceFS에 액세스하는 데 필요한 매개변수를 설명합니다. 이 매개변수는 다음에 적용됩니다:

* Catalog 속성
* Table Valued Function 속성
* Broker Load 속성
* Export 속성
* Outfile 속성

## 사전 준비 사항 {#prerequisites}

JuiceFS에 액세스하려면 `juicefs-hadoop` 클라이언트 jar가 필요합니다. Doris 4.0.2부터 빌드 시스템이 이 jar를 자동으로 다운로드하여 패키징합니다. jar는 다음 경로에 배치됩니다:

- FE: `fe/lib/juicefs/`
- BE: `be/lib/java_extensions/juicefs/`

수동으로 배포하는 경우 `juicefs-hadoop-<version>.jar`를 [Maven Central](https://repo1.maven.org/maven2/io/juicefs/juicefs-hadoop/)에서 다운로드하여 위에 나열된 디렉터리에 배치하세요.

## 매개변수 개요 {#parameter-overview}

JuiceFS는 HDFS와 호환되므로 HDFS와 동일한 인증 매개변수를 사용합니다. 또한 다음과 같은 JuiceFS 전용 매개변수를 사용할 수 있습니다:

| 속성 이름 | 설명 | 필수 여부 |
| --- | --- | --- |
| fs.defaultFS | 기본 파일 시스템 URI입니다. 예: `jfs://cluster`. | 예 |
| fs.jfs.impl | Hadoop FileSystem 구현 클래스입니다. `io.juicefs.JuiceFileSystem`으로 설정해야 합니다. | 예 |
| juicefs.\<cluster\>.meta | JuiceFS 메타데이터 엔진 엔드포인트입니다. 예: `redis://127.0.0.1:6379/1` 또는 `mysql://user:pwd@(host:port)/db`. `<cluster>`를 `fs.defaultFS` URI의 클러스터 이름으로 바꾸세요. | 예 |

HDFS 인증 매개변수(Simple 또는 Kerberos)는 [HDFS](./hdfs.md) 문서를 참조하세요.

접두사가 `juicefs.`인 모든 속성은 하위 JuiceFS Hadoop 클라이언트에 그대로 전달됩니다.

## 구성 예제 {#example-configurations}

### Hive Metastore를 사용하는 Catalog {#catalog-with-hive-metastore}

```sql
CREATE CATALOG jfs_hive PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://<hms_host>:9083',
    'fs.defaultFS' = 'jfs://cluster',
    'fs.jfs.impl' = 'io.juicefs.JuiceFileSystem',
    'juicefs.cluster.meta' = 'redis://127.0.0.1:6379/1',
    'hadoop.username' = 'doris'
);
```

### Broker Load {#broker-load}

```sql
LOAD LABEL example_db.label1
(
    DATA INFILE("jfs://cluster/path/to/data/*")
    INTO TABLE `my_table`
)
WITH BROKER
(
    "fs.defaultFS" = "jfs://cluster",
    "fs.jfs.impl" = "io.juicefs.JuiceFileSystem",
    "juicefs.cluster.meta" = "redis://127.0.0.1:6379/1",
    "hadoop.username" = "doris"
);
```

### Table Valued Function {#table-valued-function}

```sql
SELECT * FROM TABLE(
    "uri" = "jfs://cluster/path/to/file.parquet",
    "format" = "parquet",
    "fs.jfs.impl" = "io.juicefs.JuiceFileSystem",
    "juicefs.cluster.meta" = "redis://127.0.0.1:6379/1"
);
```

## 권장 사항 {#best-practices}

* `juicefs-hadoop` jar가 **모든** FE 및 BE 노드에 배포되어 있는지 확인하세요.
* `juicefs.<cluster>.meta` 속성은 `jfs://` URI의 클러스터 이름과 일치해야 합니다. 예를 들어 `fs.defaultFS = jfs://mycluster`인 경우 메타데이터 속성은 `juicefs.mycluster.meta`여야 합니다.
* JuiceFS는 여러 메타데이터 엔진(Redis, MySQL, TiKV, SQLite 등)을 지원합니다. 규모와 가용성 요구 사항에 따라 선택하세요.
* Kerberos 인증, HA nameservice 설정, Hadoop 구성 파일과 같은 HDFS 구성은 모두 JuiceFS와 호환됩니다.
