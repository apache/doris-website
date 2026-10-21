---
{
    "title": "Delta Lake Catalog",
    "language": "ko",
    "description": "Apache Doris Delta Lake Catalog 사용자 가이드: Trino Connector 프레임워크를 통해 Delta Lake 데이터 레이크에 연결하여 Delta Lake 테이블 데이터를 쿼리하고 통합합니다. Hive Metastore, 다양한 데이터 타입 매핑, Delta Lake와 Doris 간의 빠른 통합을 지원합니다."
}
---

## 개요 {#overview}

Delta Lake Catalog는 [Trino Connector](https://doris.apache.org/community/developer-guide/data-source-extension/trino-connector-developer-guide/) 호환성 프레임워크와 Trino Delta Lake Connector를 사용하여 Delta Lake 테이블에 접근합니다.

:::note
- 이 기능은 실험적 기능이며, 버전 3.0.1부터 지원됩니다.
- 이 기능은 Trino 클러스터 환경에 의존하지 않으며, Trino 호환성 플러그인만 사용합니다.
:::

### 활용 사례 {#use-cases}

| 시나리오 | 지원 여부 |
| -------- | -------------- |
| 데이터 통합 | Delta Lake 데이터를 읽어 Doris 내부 테이블에 쓰기 |
| 데이터 다시 쓰기 | 지원하지 않음 |

### 버전 호환성 {#version-compatibility}

- **Doris 버전**: 3.0.1 이상
- **Trino Connector 버전**: 435
- **Delta Lake 버전**: 지원되는 버전은 [Trino 문서](https://trino.io/docs/435/connector/delta-lake.html)를 참조하세요.

## 빠른 시작 {#quick-start}

### 단계 1: Connector 플러그인 준비 {#step-1-prepare-connector-plugin}

다음 방법 중 하나로 Delta Lake Connector 플러그인을 구할 수 있습니다:

**방법 1: 사전 컴파일된 패키지 사용(권장)**

사전 컴파일된 [trino-delta-lake-435-20240724.tar.gz](https://github.com/apache/Doris-thirdparty/releases/download/trino-435-20240724/trino-delta-lake-435-20240724.tar.gz)와 [hdfs.tar.gz](https://github.com/apache/doris-thirdparty/releases/download/trino-435-20240724/trino-hdfs-435-20240724.tar.gz)를 다운로드한 후 압축을 풉니다.

**방법 2: 직접 컴파일**

직접 컴파일해야 하는 경우 다음 단계를 따릅니다(JDK 17 필요):

```shell
git clone https://github.com/apache/doris-thirdparty.git
cd doris-thirdparty
git checkout trino-435
cd plugin/trino-delta-lake
mvn clean install -DskipTests
cd ../../lib/trino-hdfs
mvn clean install -DskipTests
```

컴파일이 완료되면 `trino-delta-lake-435` 디렉터리가 `trino/plugin/trino-delta-lake/target/` 아래에 생성되고, `hdfs` 디렉터리가 `trino/lib/trino-hdfs/target/` 아래에 생성됩니다.

### 단계 2: 플러그인 배포 {#step-2-deploy-plugin}

1. `trino-delta-lake-435/` 디렉터리를 모든 FE 및 BE 배포 경로의 `connectors/` 디렉터리 아래에 배치합니다(디렉터리가 없으면 직접 생성합니다):

   ```text
   ├── bin
   ├── conf
   ├── plugins
   │   ├── connectors
   │       ├── trino-delta-lake-435
   │           ├── hdfs
   ...
   ```

   > `trino_connector_plugin_dir` 설정을 `fe.conf`에서 변경하여 플러그인 경로를 직접 지정할 수도 있습니다. 예: `trino_connector_plugin_dir=/path/to/connectors/`

2. 모든 FE 및 BE 노드를 다시 시작하여 Connector가 올바르게 로드되도록 합니다.

### 단계 3: Catalog 생성 {#step-3-create-catalog}

**기본 구성**

```sql
CREATE CATALOG delta_lake_catalog PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'delta_lake',
    'trino.hive.metastore' = 'thrift',
    'trino.hive.metastore.uri' = 'thrift://ip:port',
    'trino.hive.config.resources' = '/path/to/core-site.xml,/path/to/hdfs-site.xml'
);
```

**구성 설명**

- `trino.hive.metastore`: 메타데이터 서비스 유형. `thrift`(Hive Metastore) 등을 지원합니다.
- `trino.hive.metastore.uri`: Hive Metastore 서비스 주소
- `trino.hive.config.resources`: Hadoop 구성 파일 경로. 여러 파일은 쉼표로 구분합니다.

추가 구성 옵션은 아래의 "구성 설명" 절 또는 [Trino 공식 문서](https://trino.io/docs/435/connector/delta-lake.html)를 참조하세요.

### 단계 4: 데이터 쿼리 {#step-4-query-data}

Catalog를 생성한 후 다음 세 가지 방법 중 하나로 Delta Lake 테이블 데이터를 쿼리할 수 있습니다:

```sql
-- Method 1: Switch to Catalog then query
SWITCH delta_lake_catalog;
USE delta_lake_db;
SELECT * FROM delta_lake_tbl LIMIT 10;

-- Method 2: Use two-level path
USE delta_lake_catalog.delta_lake_db;
SELECT * FROM delta_lake_tbl LIMIT 10;

-- Method 3: Use fully qualified name
SELECT * FROM delta_lake_catalog.delta_lake_db.delta_lake_tbl LIMIT 10;
```

## 구성 설명 {#configuration-description}

### Catalog 구성 매개변수 {#catalog-configuration-parameters}

Delta Lake Catalog를 생성하는 기본 구문은 다음과 같습니다:

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector',            -- Required, fixed value
    'trino.connector.name' = 'delta_lake', -- Required, fixed value
    {TrinoProperties},                     -- Trino Connector related properties
    {CommonProperties}                     -- Common properties
);
```

#### TrinoProperties 매개변수 {#trinoproperties-parameters}

TrinoProperties는 Trino Delta Lake Connector 전용 속성을 구성하는 데 사용되며, 이러한 속성에는 `trino.` 접두사가 붙습니다. 주요 매개변수는 다음과 같습니다:

| 매개변수 이름 | 필수 | 기본값 | 설명 |
| -------------- | -------- | ------------- | ----------- |
| `trino.hive.metastore` | 예 | - | 메타데이터 서비스 유형. 예: `thrift` |
| `trino.hive.metastore.uri` | 예 | - | Hive Metastore 서비스 주소 |
| `trino.hive.config.resources` | 아니요 | - | Hadoop 구성 파일 경로. 여러 파일은 쉼표로 구분합니다. |
| `trino.delta.hide-non-delta-tables` | 아니요 | false | Delta Lake가 아닌 테이블을 숨길지 여부 |

추가 Delta Lake Connector 구성 매개변수는 [Trino 공식 문서](https://trino.io/docs/435/connector/delta-lake.html)를 참조하세요.

#### CommonProperties 매개변수 {#commonproperties-parameters}

CommonProperties는 메타데이터 갱신 정책, 권한 제어 등 Catalog의 공통 속성을 구성하는 데 사용됩니다. 자세한 내용은 [Catalog 개요](../catalog-overview.md)의 "공통 속성" 절을 참조하세요.

## 데이터 타입 매핑 {#data-type-mapping}

Delta Lake Catalog를 사용할 때 데이터 타입은 다음 규칙에 따라 매핑됩니다:

| Delta Lake 타입 | Trino 타입 | Doris 타입 | 비고 |
| --------------- | ---------- | ---------- | ----- |
| boolean | boolean | boolean | |
| int | int | int | |
| byte | tinyint | tinyint | |
| short | smallint | smallint | |
| long | bigint | bigint | |
| float | real | float | |
| double | double | double | |
| decimal(P, S) | decimal(P, S) | decimal(P, S) | |
| string | varchar | string | |
| binary | varbinary | string | |
| date | date | date | |
| timestamp_ntz | timestamp(N) | datetime(N) | |
| timestamp | timestamp with time zone(N) | datetime(N) | |
| array | array | array | |
| map | map | map | |
| struct | row | struct | |
