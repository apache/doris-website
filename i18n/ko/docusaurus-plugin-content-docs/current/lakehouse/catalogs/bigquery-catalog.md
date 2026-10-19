---
{
    "title": "BigQuery Catalog",
    "language": "ko",
    "description": "Apache Doris에서 BigQuery Catalog를 구성하고 사용하여 Google BigQuery 데이터 웨어하우스에 연결하는 방법을 알아봅니다. Trino Connector 프레임워크를 통해 BigQuery 테이블 데이터 쿼리, 데이터 통합, 실시간 분석을 구현합니다. Google Cloud ADC 인증과 다양한 데이터 타입 매핑(ARRAY, MAP, STRUCT와 같은 복합 타입 포함)을 지원합니다. BigQuery와 Doris 간의 데이터 상호 운용성을 빠르게 확보할 수 있도록 설치, 배포, 구성 매개변수, 사용 예제를 자세히 제공합니다."
}
---

## 개요 {#overview}

BigQuery Catalog는 [Trino Connector](https://doris.apache.org/community/developer-guide/data-source-extension/trino-connector-developer-guide/) 호환성 프레임워크를 통해 Trino BigQuery Connector를 사용하여 BigQuery 테이블에 접근합니다.

:::note
- 이 기능은 실험적 기능이며 3.0.1 버전부터 지원됩니다.
- 이 기능은 Trino 클러스터 환경에 의존하지 않으며 Trino 호환성 플러그인만 사용합니다.
:::

### 활용 사례 {#use-cases}

| 시나리오         | 지원 상태                                    |
| ---------------- | ------------------------------------------------- |
| 데이터 통합 | BigQuery 데이터를 읽어 Doris 내부 테이블에 쓰기 |
| 원본에 데이터 쓰기  | 지원하지 않음                                     |

### 버전 호환성 {#version-compatibility}

- **Doris 버전**: 3.0.1 이상
- **Trino Connector 버전**: 435
- **BigQuery 버전**: 지원되는 버전은 [Trino 문서](https://trino.io/docs/435/connector/bigquery.html)를 참조하세요.

## 빠른 시작 {#quick-start}

### 1단계: Connector 플러그인 준비 {#step-1-prepare-connector-plugin}

다음 방법 중 하나를 선택하여 BigQuery Connector 플러그인을 얻을 수 있습니다:

**방법 1: 사전 컴파일된 패키지 사용(권장)**

[여기](https://github.com/apache/doris-thirdparty/releases/tag/trino-435-20240724)에서 사전 컴파일된 플러그인 패키지를 직접 다운로드하여 압축을 풉니다.

**방법 2: 수동 컴파일**

직접 컴파일해야 하는 경우 다음 단계를 따르세요(JDK 17 필요):

```shell
git clone https://github.com/apache/doris-thirdparty.git
cd doris-thirdparty
git checkout trino-435
cd plugin/trino-bigquery
mvn clean install -DskipTests
```

컴파일이 완료되면 `trino-bigquery-435/` 디렉터리가 `trino/plugin/trino-bigquery/target/` 아래에 생성됩니다.

### 2단계: 플러그인 배포 {#step-2-deploy-plugin}

1. `trino-bigquery-435/` 디렉터리를 모든 FE 및 BE 노드의 배포 경로 아래에 있는 `connectors/` 디렉터리에 배치합니다(디렉터리가 없으면 수동으로 생성합니다):

   ```text
   ├── bin
   ├── conf
   ├── plugins
   │   ├── connectors
   │       ├── trino-bigquery-435
   ...
   ```

   > `trino_connector_plugin_dir` 구성을 `fe.conf`에서 수정하여 플러그인 경로를 사용자 지정할 수도 있습니다. 예: `trino_connector_plugin_dir=/path/to/connectors/`

2. 모든 FE 및 BE 노드를 재시작하여 Connector가 정상적으로 로드되도록 합니다.

### 3단계: Google Cloud 인증 준비 {#step-3-prepare-google-cloud-authentication}

Catalog를 생성하기 전에 Google Cloud 인증을 구성해야 합니다. 권장 방식은 Application Default Credentials (ADC)입니다:

1. gcloud CLI를 설치합니다: <https://cloud.google.com/sdk/docs/install>

2. 다음 명령을 실행하여 초기화 및 인증을 수행합니다:

    ```shell
    gcloud init --console-only --skip-diagnostics
    gcloud auth login
    gcloud auth application-default login
    ```

3. 인증에 성공하면 ADC 자격 증명 파일이 `~/.config/gcloud/application_default_credentials.json`에 생성됩니다.

### 4단계: Catalog 생성 {#step-4-create-catalog}

**기본 구성 예제**

```sql
CREATE CATALOG bigquery_catalog PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'bigquery',
    'trino.bigquery.project-id' = 'your-bigquery-project-id',
    'trino.bigquery.credentials-file' = '/path/to/application_default_credentials.json'
);
```

### 5단계: 데이터 쿼리 {#step-5-query-data}

Catalog를 생성한 후에는 다음 세 가지 방법으로 BigQuery 테이블 데이터를 쿼리할 수 있습니다:

```sql
-- Method 1: Query after switching to Catalog
SWITCH bigquery_catalog;
USE bigquery_db;
SELECT * FROM bigquery_tbl LIMIT 10;

-- Method 2: Use two-level path
USE bigquery_catalog.bigquery_db;
SELECT * FROM bigquery_tbl LIMIT 10;

-- Method 3: Use fully qualified name
SELECT * FROM bigquery_catalog.bigquery_db.bigquery_tbl LIMIT 10;
```

## 구성 {#configuration}

### Catalog 구성 매개변수 {#catalog-configuration-parameters}

BigQuery Catalog를 생성하는 기본 구문은 다음과 같습니다:

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector',             -- Required, fixed value
    'trino.connector.name' = 'bigquery',    -- Required, fixed value
    {TrinoProperties},                      -- Trino Connector related properties
    {CommonProperties}                      -- Common properties
);
```

#### TrinoProperties 매개변수 {#trinoproperties-parameters}

TrinoProperties는 Trino BigQuery Connector 전용 속성을 구성하는 데 사용하며, 속성 이름에는 `trino.` 접두사가 붙습니다. 주요 매개변수는 다음과 같습니다:

| 매개변수 이름                        | 필수 여부 | 기본값 | 설명                                    |
| ------------------------------------- | -------- | ------- | ---------------------------------------------- |
| `trino.bigquery.project-id`           | 예      | -       | BigQuery 프로젝트 ID                            |
| `trino.bigquery.credentials-file`     | 예      | -       | Google Cloud 자격 증명 파일 경로             |
| `trino.bigquery.views-enabled`        | 아니요       | false   | 뷰 지원 활성화 여부                 |
| `trino.bigquery.arrow-serialization.enabled` | 아니요       | true    | 성능 향상을 위한 Arrow 직렬화 활성화 여부 |

BigQuery Connector의 추가 구성 매개변수는 [Trino 공식 문서](https://trino.io/docs/435/connector/bigquery.html)를 참조하세요.

#### CommonProperties 매개변수 {#commonproperties-parameters}

CommonProperties는 메타데이터 새로 고침 정책, 접근 제어 등 Catalog의 공통 속성을 구성하는 데 사용합니다. 자세한 내용은 [Catalog 개요](../catalog-overview.md)의 "공통 속성" 섹션을 참조하세요.

## 데이터 타입 매핑 {#data-type-mapping}

BigQuery Catalog를 사용할 때 데이터 타입은 다음 규칙에 따라 매핑됩니다:

| BigQuery 타입 | Trino 타입                      | Doris 타입    |
| ------------- | ------------------------------- | ------------- |
| boolean       | boolean                         | boolean       |
| int64         | bigint                          | bigint        |
| float64       | double                          | double        |
| numeric       | decimal(P, S)                   | decimal(P, S) |
| bignumeric    | decimal(P, S)                   | decimal(P, S) |
| string        | varchar                         | string        |
| bytes         | varbinary                       | string        |
| date          | date                            | date          |
| datetime      | timestamp(6)                    | datetime(6)   |
| time          | time(6)                         | string        |
| timestamp     | timestamp with time zone(6)     | datetime(6)   |
| geography     | varchar                         | string        |
| array         | array                           | array         |
| map           | map                             | map           |
| struct        | row                             | struct        |
