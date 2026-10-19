---
{
    "title": "Kudu Catalog",
    "language": "ko",
    "description": "Apache Doris Kudu Catalog 가이드: Trino Connector 프레임워크를 통해 Kudu 데이터베이스에 연결하여 Kudu 테이블 데이터를 쿼리하고 통합합니다. Kerberos 인증과 다양한 데이터 타입 매핑을 지원하며, Kudu와 Doris 간에 데이터를 빠르게 통합할 수 있습니다."
}
---

## 개요 {#overview}

Kudu Catalog는 [Trino Connector](https://doris.apache.org/community/developer-guide/data-source-extension/trino-connector-developer-guide/) 호환성 프레임워크를 통해 Trino Kudu Connector로 Kudu 테이블에 접근합니다.

:::note
- 이 기능은 실험적 기능이며, 버전 3.0.1부터 지원됩니다.
- 이 기능은 Trino 클러스터 환경에 의존하지 않으며 Trino 호환성 플러그인만 사용합니다.
:::

### 사용 사례 {#use-cases}

| 시나리오          | 지원 상태                                    |
| ----------------- | ------------------------------------------------- |
| 데이터 통합  | Kudu 데이터를 읽어 Doris 내부 테이블에 기록 |
| 데이터 쓰기 반영   | 지원하지 않음                                     |

### 버전 호환성 {#version-compatibility}

- **Doris 버전**: 3.0.1 이상
- **Trino Connector 버전**: 435
- **Kudu 버전**: 지원되는 버전은 [Trino 문서](https://trino.io/docs/435/connector/kudu.html)를 참조하세요.

## 빠른 시작 {#quick-start}

### 1단계: Connector 플러그인 준비 {#step-1-prepare-connector-plugin}

다음 방법 중 하나를 선택하여 Kudu Connector 플러그인을 받을 수 있습니다:

**방법 1: 미리 컴파일된 패키지 사용(권장)**

[여기](https://github.com/apache/doris-thirdparty/releases/tag/trino-435-20240724)에서 미리 컴파일된 플러그인 패키지를 다운로드하고 압축을 풉니다.

**방법 2: 직접 컴파일**

사용자 지정 컴파일이 필요한 경우 다음 단계를 따르세요(JDK 17 필요):

```shell
git clone https://github.com/apache/doris-thirdparty.git
cd doris-thirdparty
git checkout trino-435
cd plugin/trino-kudu
mvn clean package -Dmaven.test.skip=true
```

컴파일이 완료되면 `trino-kudu-435/` 디렉터리가 `trino/plugin/trino-kudu/target/` 아래에 생성됩니다.

### 2단계: 플러그인 배포 {#step-2-deploy-plugin}

1. `trino-kudu-435/` 디렉터리를 모든 FE 및 BE 배포 경로의 `connectors/` 디렉터리 아래에 배치합니다(디렉터리가 없으면 직접 생성합니다):

   ```text
   ├── bin
   ├── conf
   ├── plugins
   │   ├── connectors
   │       ├── trino-kudu-435
   ...
   ```

   > 플러그인 경로는 `trino_connector_plugin_dir` 설정을 `fe.conf`에서 수정하여 사용자 지정할 수도 있습니다. 예: `trino_connector_plugin_dir=/path/to/connectors/`

2. Connector가 정상적으로 로드되도록 모든 FE 및 BE 노드를 재시작합니다.

### 3단계: Catalog 생성 {#step-3-create-catalog}

**기본 설정(인증 없음)**

```sql
CREATE CATALOG kudu_catalog PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kudu',
    'trino.kudu.client.master-addresses' = 'ip1:port1,ip2:port2,ip3:port3',
    'trino.kudu.authentication.type' = 'NONE'
);
```

**Kerberos 인증 설정**

```sql
CREATE CATALOG kudu_catalog PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kudu',
    'trino.kudu.client.master-addresses' = 'ip1:port1,ip2:port2,ip3:port3',
    'trino.kudu.authentication.type' = 'KERBEROS',
    'trino.kudu.authentication.client.principal' = 'user@DOMAIN.COM',
    'trino.kudu.authentication.client.keytab' = '/path/to/kudu.keytab',
    'trino.kudu.authentication.config' = '/etc/krb5.conf',
    'trino.kudu.authentication.server.principal.primary' = 'kudu'
);
```

### 4단계: 데이터 쿼리 {#step-4-query-data}

Catalog를 생성한 후에는 다음 세 가지 방법 중 하나로 Kudu 테이블 데이터를 쿼리할 수 있습니다:

```sql
-- Method 1: Query after switching to Catalog
SWITCH kudu_catalog;
USE kudu_db;
SELECT * FROM kudu_tbl LIMIT 10;

-- Method 2: Use two-level path
USE kudu_catalog.kudu_db;
SELECT * FROM kudu_tbl LIMIT 10;

-- Method 3: Use fully qualified name
SELECT * FROM kudu_catalog.kudu_db.kudu_tbl LIMIT 10;
```

## 설정 {#configuration}

### Catalog 설정 매개변수 {#catalog-configuration-parameters}

Kudu Catalog를 생성하는 기본 구문은 다음과 같습니다:

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector',          -- Required, fixed value
    'trino.connector.name' = 'kudu',     -- Required, fixed value
    {TrinoProperties},                   -- Trino Connector related properties
    {CommonProperties}                   -- Common properties
);
```

#### TrinoProperties 매개변수 {#trinoproperties-parameters}

TrinoProperties는 Trino Kudu Connector 전용 속성을 설정하는 데 사용하며, 속성 이름에는 `trino.` 접두사가 붙습니다. 자주 사용하는 매개변수는 다음과 같습니다:

| 매개변수 이름                                        | 필수 여부 | 기본값 | 설명                            |
| ----------------------------------------------------- | -------- | ------- | -------------------------------------- |
| `trino.kudu.client.master-addresses`                  | 예      | -       | Kudu Master 노드 주소 목록     |
| `trino.kudu.authentication.type`                      | 아니요       | NONE    | 인증 유형: NONE 또는 KERBEROS  |
| `trino.kudu.authentication.client.principal`          | 아니요       | -       | Kerberos 클라이언트 principal              |
| `trino.kudu.authentication.client.keytab`             | 아니요       | -       | Kerberos keytab 파일 경로              |
| `trino.kudu.authentication.config`                    | 아니요       | -       | Kerberos 설정 파일 경로       |
| `trino.kudu.authentication.server.principal.primary`  | 아니요       | -       | Kudu 서버 principal 접두사           |

더 많은 Kudu Connector 설정 매개변수는 [Trino 공식 문서](https://trino.io/docs/435/connector/kudu.html)를 참조하세요.

#### CommonProperties 매개변수 {#commonproperties-parameters}

CommonProperties는 메타데이터 새로 고침 정책, 접근 제어 등 Catalog의 공통 속성을 설정하는 데 사용합니다. 자세한 내용은 [Catalog 개요](../catalog-overview.md)의 "공통 속성" 섹션을 참조하세요.

## 데이터 타입 매핑 {#data-type-mapping}

Kudu Catalog를 사용할 때 데이터 타입은 다음 규칙에 따라 매핑됩니다:

| Kudu 타입        | Trino 타입    | Doris 타입    | 참고                                                                                |
| ---------------- | ------------- | ------------- | ------------------------------------------------------------------------------------ |
| boolean          | boolean       | boolean       |                                                                                      |
| int8             | tinyint       | tinyint       |                                                                                      |
| int16            | smallint      | smallint      |                                                                                      |
| int32            | integer       | int           |                                                                                      |
| int64            | bigint        | bigint        |                                                                                      |
| float            | real          | float         |                                                                                      |
| double           | double        | double        |                                                                                      |
| decimal(P, S)    | decimal(P, S) | decimal(P, S) |                                                                                      |
| binary           | varbinary     | string        | `HEX(col)` 함수로 쿼리하면 Trino와 동일한 표시 결과를 얻을 수 있습니다          |
| string           | varchar       | string        |                                                                                      |
| date             | date          | date          |                                                                                      |
| unixtime_micros  | timestamp(3)  | datetime(3)   |                                                                                      |
| 기타            | UNSUPPORTED   | -             | 지원하지 않는 타입                                                                     |

:::tip
`binary` 타입을 십육진수 형식으로 표시하려면 `HEX()` 함수로 열 이름을 감싸세요. 예: `SELECT HEX(binary_col) FROM table`.
:::
