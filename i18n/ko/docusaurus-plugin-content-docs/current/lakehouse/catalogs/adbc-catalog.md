---
{
    "title": "ADBC Catalog",
    "language": "ko",
    "description": "ADBC 드라이버를 통해 Arrow Flight SQL 및 기타 외부 소스를 쿼리합니다. Arrow 형식으로 데이터를 전송하고 BE에서 병렬로 읽습니다.",
    "keywords": [
        "ADBC Catalog",
        "Arrow Database Connectivity",
        "Arrow Flight SQL",
        "ADBC 드라이버",
        "driver_url",
        "partitioned_read",
        "병렬 읽기",
        "조건자 푸시다운",
        "클러스터 간 연합 쿼리",
        "Doris 데이터 통합",
        "ADBC와 JDBC 비교"
    ]
}
---

<!-- Knowledge Type: Capability Definition + Configuration Reference -->
<!-- Applicable Scenarios: Cross-cluster federated query / External data source access / Data integration -->

## 개요 {#overview}

ADBC([Arrow Database Connectivity](https://arrow.apache.org/adbc/))는 Arrow 생태계에서 정의한 데이터베이스 액세스 인터페이스입니다. **ADBC Catalog는 ADBC 드라이버를 통해 외부 데이터 소스를 읽습니다. 데이터는 네트워크를 통해 Arrow 형식으로 전송되며, 여러 BE 노드가 병렬로 읽습니다.**

JDBC Catalog와는 다음 두 가지가 다르게 동작합니다.

- Arrow 네이티브 전송. 데이터는 네트워크를 통해 Arrow 형식으로 전송되며 Doris가 직접 읽습니다. JDBC Catalog에서 수행하는 행별, 값별 변환이 필요하지 않습니다.
- 병렬 읽기. 단일 BE 노드가 하나의 연결로 읽는 대신, 드라이버 자체의 결과 파티션을 기준으로 스캔을 분할하여 여러 BE 노드가 동시에 읽습니다.

:::note
- 이 기능은 실험적 기능으로, 버전 5.0.0부터 지원됩니다.
- 읽기 작업만 지원됩니다. 외부 데이터 소스에 쓰는 작업은 지원되지 않습니다.
- Doris에는 ADBC 드라이버가 포함되어 있지 않습니다. 드라이버 라이브러리를 FE와 모든 BE 노드에 직접 배포해야 합니다.
:::

현재 단계에서는 다른 Doris 클러스터를 포함한 Arrow Flight SQL 데이터 소스를 대상으로 하며, [Doris Catalog](./doris-catalog.mdx)를 대체합니다. 다른 데이터 소스를 사용하려면 해당 소스의 ADBC 드라이버 라이브러리만 있으면 됩니다. SQL이 ANSI SQL과 다른 경우에는 해당 SQL 방언 구현도 필요합니다.

### JDBC Catalog와의 차이점 {#differences-from-a-jdbc-catalog}

| 항목 | JDBC Catalog | ADBC Catalog |
| --- | --- | --- |
| 데이터 전송 | 소스 행을 JDBC 객체로 변환한 후 값을 하나씩 Doris 데이터로 변환 | Arrow 형식으로 데이터를 전송하고 값별 변환 없이 직접 읽음 |
| 읽기 병렬성 | 단일 BE 노드가 하나의 연결로 읽음 | 드라이버의 결과 파티션을 기준으로 분할하여 여러 BE 노드가 읽음 |
| 드라이버 형식 | 원격 URL에서 다운로드할 수 있는 JDBC 드라이버 JAR | 로컬 파일로만 참조할 수 있는 ADBC 드라이버 공유 라이브러리(`.so`) |
| 쓰기 지원 | 원본 데이터 소스로 쓰기 지원 | 아직 지원되지 않음 |

## 적용 시나리오 {#applicable-scenarios}

| 시나리오 | 설명 |
| --- | --- |
| 데이터 통합 | 외부 데이터 소스의 데이터를 Doris 내부 테이블로 읽어 들이거나, 내부 테이블과 다른 Catalog의 테이블을 대상으로 연합 쿼리를 실행합니다. 데이터는 Arrow 형식으로 전송되고 여러 BE 노드가 병렬로 읽으므로 JDBC 경로보다 성능이 좋습니다. |
| 원본 데이터 소스로 쓰기 | 지원되지 않습니다. |

## 기능 개요 {#feature-overview}

<!-- Knowledge Type: Capability Matrix -->

| 기능 | 지원 여부 | 설명 |
| --- | --- | --- |
| 메타데이터 액세스 | 지원됨 | `SHOW DATABASES`, `SHOW TABLES`, `DESC`, `SHOW CREATE TABLE` 및 `information_schema` |
| 데이터 쿼리 | 지원됨 | 외부 테이블 쿼리와 내부 테이블 및 다른 Catalog의 테이블을 함께 사용하는 조인, 집계, `ORDER BY`, `UNION`, 서브쿼리 |
| 컬럼 프루닝 | 지원됨 | 쿼리에 필요한 컬럼만 데이터 소스에 요청 |
| 조건자 푸시다운 | 지원됨 | 일부 스칼라 조건자를 원격 `WHERE` 절로 변환 |
| `LIMIT` 푸시다운 | 지원됨 | 전체 `WHERE` 절이 푸시다운된 후 적용 |
| `COUNT(*)` 최적화 | 지원됨 | 컬럼 데이터를 읽지 않음 |
| 병렬 읽기 | 지원됨 | 드라이버의 결과 파티션을 기준으로 스캔을 분할하여 여러 BE 노드가 읽음 |
| 타입 매핑 | 지원됨 | `ARRAY`, `MAP`, `STRUCT`, `DECIMAL`, 날짜, 시간대가 있는 타임스탬프와 없는 타임스탬프를 포함하여 자동 매핑 |
| 메타데이터 캐시 | 지원됨 | 기본적으로 10분 동안 캐싱되며, 모든 `REFRESH` 문으로 삭제 가능 |
| `SELECT INTO OUTFILE` | 지원됨 | 쿼리 결과를 파일로 내보낼 수 있음 |
| 구체화된 뷰(MTMV) | 지원됨 | ADBC 테이블을 기반으로 MTMV를 구축하고 새로 고칠 수 있음 |
| 데이터 소스에 쓰기 | 아직 지원되지 않음 | `INSERT`, `CREATE TABLE`, `DROP TABLE` 및 기타 쓰기 문은 거부됨 |
| 통계 | 아직 지원되지 않음 | 통계를 수집할 수 없음 |
| 집계 푸시다운 | 아직 지원되지 않음 | 집계는 Doris에서 실행됨 |

## ADBC 드라이버 배포 {#deploying-the-adbc-driver}

<!-- Knowledge Type: Deployment Steps -->

Doris에는 ADBC 드라이버가 포함되어 있지 않으므로 Catalog를 생성하기 전에 클러스터 노드에 드라이버 라이브러리를 배포해야 합니다.

### 드라이버 배치 요구 사항 {#driver-placement-requirements}

:::caution
`CREATE CATALOG` 실행 시 FE는 `driver_url`을 절대 경로로 해석하고 해당 경로를 BE에 그대로 전달합니다. 각 BE는 정확히 그 경로에서 드라이버를 로드합니다. 따라서 다음 요구 사항을 충족해야 합니다.

- 드라이버 파일은 FE와 **모든** BE 노드에서 **동일한 절대 경로**에 있어야 합니다.
- FE와 모든 BE는 **동일한 빌드**를 로드해야 합니다. ADBC는 드라이버 전용 형식으로 파티션 정보를 표현하며, 드라이버 구현 간의 상호 운용성은 보장하지 않습니다. 드라이버 버전을 혼용하면 오류가 전혀 발생하지 않고 잘못된 결과만 반환될 수도 있습니다.
:::

빌드 출력에는 다음 두 드라이버 디렉터리가 생성됩니다.

- FE: `<FE_HOME>/plugins/adbc_drivers`
- BE: `<BE_HOME>/plugins/adbc_drivers`

FE와 BE는 일반적으로 서로 다른 배포 디렉터리에 있으므로 이 두 절대 경로는 같지 않습니다. 여러 노드로 배포하는 경우 모든 FE 및 BE 노드에서 같은 절대 경로(예: `/opt/doris/adbc_drivers`)에 드라이버를 배치하고, `drivers_dir`이 해당 디렉터리를 가리키도록 FE의 `adbc.conf`에서 설정합니다.

### adbc.conf {#adbcconf}

ADBC 커넥터 플러그인은 FE의 `<DORIS_HOME>/plugins/connector/adbc/adbc.conf`에서 설정을 읽습니다. 이 파일은 **모든 FE 노드**에 있어야 합니다. Doris는 Catalog 메타데이터를 통해 이 파일을 복제하지 않으며, 수정 사항은 FE를 재시작한 후 적용됩니다.

| 설정 | 기본값 | 설명 |
| --- | --- | --- |
| `drivers_dir` | `<DORIS_HOME>/plugins/adbc_drivers` | 경로 없는 파일 이름으로 지정된 `driver_url`을 해석할 때 기준이 되는 디렉터리입니다. |
| `driver_secure_path` | `*` | 드라이버를 로드할 수 있는 디렉터리로, 세미콜론(`;`)으로 구분합니다. `*` 또는 빈 값이면 모든 디렉터리를 허용합니다. 구체적인 경로를 설정하면 드라이버 경로를 구성 요소별로 비교하므로 경로 순회나 접두사 혼동(`/opt/drv`와 `/opt/drv-evil`의 혼동)으로 제한을 우회할 수 없습니다. |

설정 예시:

```properties
drivers_dir=/opt/doris/adbc_drivers
driver_secure_path=/opt/doris/adbc_drivers
```

## Catalog 구성 {#configuring-catalog}

<!-- Knowledge Type: Configuration Parameters -->

### 구문 {#syntax}

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'adbc',
    'driver_url' = '<driver_url>',
    'uri' = '<connection_uri>',
    {DriverProperties},
    {ConnectionProperties},
    {ReadProperties},
    {DriverOptions},
    {CommonProperties}
);
```

* `<driver_url>`

    필수입니다. ADBC 드라이버 공유 라이브러리를 **로컬 참조로만** 지정합니다. 다음 세 가지 형식을 지원합니다.

    | 형식 | 설명 |
    | --- | --- |
    | 경로 없는 파일 이름 | `drivers_dir` 디렉터리를 기준으로 해석하며, 이 디렉터리는 `adbc.conf`에서 설정합니다. 이름은 `[A-Za-z0-9._-]+.so`와 일치해야 하며, 선택적으로 `.so.1` 같은 버전 접미사를 붙일 수 있습니다. 경로 구분자는 포함할 수 없습니다. |
    | `file://` URL | authority, 쿼리, 프래그먼트가 없어야 합니다. |
    | 절대 경로 | FE와 모든 BE가 해당 경로에서 드라이버 라이브러리를 로드합니다. |

    `http://` 같은 원격 스킴은 거부됩니다. 노드별 다운로드로는 모든 노드에 동일한 드라이버 빌드가 배치된다고 보장할 수 없기 때문입니다.

* `<connection_uri>`

    필수입니다. ADBC 연결 문자열입니다.

    **반드시 하나의 원격 Catalog를 고정해야 합니다**. 예를 들어 `postgresql://host:5432/mydb`처럼 설정합니다. Doris가 ADBC의 세 이름 계층을 자체의 두 계층에 매핑하기 때문입니다. 자세한 내용은 [네임스페이스 매핑](#namespace-mapping)을 참조하세요.

* `{DriverProperties}`

    DriverProperties 섹션에는 드라이버 로드 방식을 제어하는 선택적 속성을 지정합니다.

    | 속성 | 기본값 | 설명 |
    | --- | --- | --- |
    | `driver_checksum` | 검증하지 않음 | 드라이버 라이브러리 파일의 MD5로, `CREATE CATALOG` 시 검증합니다. |
    | `driver_entrypoint` | 빈 값 | 드라이버의 진입점 심볼입니다. 비어 있으면 드라이버가 추론합니다. |

    `driver_checksum`은 잘못된 드라이버 빌드나 특정 노드에 남아 있는 오래된 복사본을 감지합니다. 이런 파일은 대개 아무 문제 없이 로드되지만, 한참 뒤에 드라이버에 관한 단서가 전혀 없는 쿼리 실패로 문제가 드러납니다.

    :::caution
    `driver_checksum`은 FE의 복사본만 검증하며 BE의 복사본은 검증하지 않습니다.
    :::

* `{ConnectionProperties}`

    ConnectionProperties 섹션에는 데이터 소스의 자격 증명과 푸시다운 SQL 생성에 사용할 방언을 지정합니다.

    | 속성 | 기본값 | 설명 |
    | --- | --- | --- |
    | `user` | 없음 | 사용자 이름으로, 작성한 그대로 드라이버에 전달됩니다. 필수 여부는 데이터 소스에 따라 다릅니다. |
    | `password` | 없음 | 비밀번호로, 작성한 그대로 드라이버에 전달됩니다. 필수 여부는 데이터 소스에 따라 다릅니다. |
    | `sql_dialect` | 자동 감지 | 푸시다운 SQL 생성에 사용하는 방언입니다. 기본적으로 드라이버가 데이터 소스의 공급업체 이름을 보고하면 Doris가 이를 바탕으로 방언을 선택합니다. 인식할 수 없는 이름이면 `ansi`를 사용합니다. |

    데이터 소스가 보고하는 공급업체 이름으로 적절한 방언을 판단하기 어렵거나 실제 SQL이 해당 이름에서 예상되는 SQL과 다르면 `sql_dialect`를 명시적으로 설정합니다. 다음 두 방언이 내장되어 있습니다.

    | 값 | 설명 |
    | --- | --- |
    | `ansi` | 표준 SQL입니다. 기본값이며 인식할 수 없는 데이터 소스에도 적용됩니다. |
    | `doris` | `ansi`와 같지만 식별자를 백틱(`` ` ``)으로 감쌉니다. Doris는 큰따옴표로 감싼 이름을 문자열 리터럴로 해석하므로 ANSI 방식의 따옴표 구문은 Doris 데이터 소스에서 파싱되지 않습니다. 데이터 소스가 보고하는 공급업체 이름이 대소문자 구분 없이 `doris`로 시작하면 이 방언이 자동으로 선택됩니다. |

* `{ReadProperties}`

    ReadProperties 섹션은 병렬 읽기를 제어합니다.

    | 속성 | 기본값 | 설명 |
    | --- | --- | --- |
    | `partitioned_read` | `auto` | 병렬 읽기 모드입니다. 잘못된 값을 지정하면 기본값으로 대체하지 않고 오류를 발생시킵니다. |
    | `max_partitions` | `1024` | 하나의 스캔에서 계획할 수 있는 최대 파티션 수입니다. |

    `partitioned_read`는 다음 세 값을 지원합니다.

    | 값 | 설명 |
    | --- | --- |
    | `auto` | 기본값입니다. 드라이버가 스캔을 파티션으로 나눌 수 있으면 분할하고, 그렇지 않으면 단일 문으로 읽습니다. |
    | `disabled` | 파티션을 요청하지 않습니다. 파티션 요청에도 비용이 듭니다. Arrow Flight SQL 데이터 소스에서는 파티션을 반환하는 호출이 쿼리 실행 **그 자체이므로**, 계획 단계에서 원격 왕복 통신이 한 번 더 필요하며 Doris가 쿼리 실행을 확정하기 전에 데이터 소스가 작업을 시작합니다. 이로 인한 데이터 소스의 부담이 크거나 Doris가 반환된 파티션을 읽을 수 없는 경우 이 값을 사용해 단일 문 읽기로 전환하세요. |
    | `required` | 스캔을 반드시 분할해야 합니다. 분할할 수 없으면 쿼리가 실패하고 그 이유가 표시됩니다. 병렬성이 아무런 알림 없이 사라져서는 안 되는 경우에 사용합니다. `auto`에서는 드라이버가 더 이상 파티션을 분할하지 않아도 쿼리가 성공하며, 결과만으로는 대체 경로를 사용했는지 알 수 없습니다. |

    `max_partitions`는 비정상적인 데이터 소스로부터 보호하기 위한 제한이며 성능 조정용 설정이 아닙니다. 각 파티션은 계획 리소스를 소비하므로 파티션이 너무 많으면 FE의 리소스가 고갈됩니다. 한도를 초과하면 단일 문 읽기로 전환하지 않고 쿼리가 실패합니다. 이 시점에는 데이터 소스가 이미 쿼리를 실행했으므로, 대체 경로를 사용하면 쿼리를 다시 실행하게 되기 때문입니다.

* `{DriverOptions}`

    DriverOptions 섹션에는 드라이버에 그대로 전달할 옵션을 `adbc.` 접두사와 함께 지정합니다.

    :::caution
    **접두사는 옵션 이름의 일부이며 제거되지 않습니다.** ADBC 자체의 옵션 이름도 이미 `adbc.`로 시작합니다. 예를 들어 `adbc.snowflake.sql.db`의 경우 `CREATE CATALOG`에서는 `adbc.adbc.snowflake.sql.db`로 작성합니다.
    :::

    ```sql
    'adbc.adbc.snowflake.sql.db' = 'my_database'
    ```

* `{CommonProperties}`

    CommonProperties 섹션에는 공통 속성을 지정합니다. [Catalog 개요](../catalog-overview.md)의 공통 속성 섹션을 참조하세요.

    메타데이터 캐시 속성은 [메타데이터 캐시](#meta-cache)를 참조하세요.

## 예시 {#examples}

<!-- Knowledge Type: Operational Examples -->

### 다른 Doris 클러스터 쿼리 {#querying-another-doris-cluster}

Arrow Flight SQL 드라이버를 통해 다른 Doris 클러스터를 읽습니다. `uri`는 대상 클러스터 FE의 Arrow Flight 포트를 가리킵니다.

```sql
CREATE CATALOG remote_doris PROPERTIES (
    'type' = 'adbc',
    'driver_url' = 'libadbc_driver_flightsql.so',
    'uri' = 'grpc://remote-doris-fe:8070',
    'user' = 'root',
    'password' = '<password>'
);

SELECT id, name FROM remote_doris.some_db.some_table ORDER BY id LIMIT 10;
```

여기서 `driver_url`은 경로 없는 파일 이름이며, `drivers_dir`을 기준으로 해석됩니다. 이 디렉터리는 `adbc.conf`에서 설정합니다.

### 절대 경로 사용 및 드라이버 빌드 고정 {#using-an-absolute-path-and-pinning-the-driver-build}

드라이버를 절대 경로로 참조하고, `driver_checksum`으로 FE의 복사본을 고정합니다.

```sql
CREATE CATALOG remote_source PROPERTIES (
    'type' = 'adbc',
    'driver_url' = '/opt/doris/adbc_drivers/libadbc_driver_flightsql.so',
    'driver_checksum' = 'd41d8cd98f00b204e9800998ecf8427e',
    'uri' = 'grpc+tls://remote-host:8070',
    'user' = 'analyst',
    'password' = '<password>'
);
```

### 방언 설정 및 병렬 읽기 필수 지정 {#setting-the-dialect-and-requiring-parallel-reads}

`doris` 방언을 Doris 데이터 소스에 사용하고 스캔 분할을 필수로 설정하여 병렬성이 아무런 알림 없이 사라지는 일을 방지합니다.

```sql
CREATE CATALOG remote_doris_parallel PROPERTIES (
    'type' = 'adbc',
    'driver_url' = 'libadbc_driver_flightsql.so',
    'uri' = 'grpc://remote-doris-fe:8070',
    'user' = 'root',
    'password' = '<password>',
    'sql_dialect' = 'doris',
    'partitioned_read' = 'required',
    'max_partitions' = '256'
);
```

### 병렬 읽기 비활성화 {#disabling-parallel-reads}

쿼리 실행 전에 이루어지는 파티션 요청이 데이터 소스에 너무 큰 부담을 주는 경우 병렬 읽기를 끕니다.

```sql
CREATE CATALOG remote_source_single PROPERTIES (
    'type' = 'adbc',
    'driver_url' = 'libadbc_driver_flightsql.so',
    'uri' = 'grpc://remote-host:8070',
    'user' = 'root',
    'password' = '<password>',
    'partitioned_read' = 'disabled'
);
```

## 네임스페이스 매핑 {#namespace-mapping}

<!-- Knowledge Type: Behavior Rules -->

ADBC는 객체 이름을 세 계층(catalog / db_schema / table)으로 지정하지만, Doris 외부 테이블의 이름 계층은 두 개(database / table)입니다. 가장 바깥쪽 이름은 이미 생성한 Catalog가 사용하므로 원격 계층 하나를 이름에서 제외해야 합니다.

- `uri`는 하나의 원격 Catalog를 고정해야 합니다. 그러면 두 원격 계층 중 최대 하나만 달라지므로 Doris가 두 이름을 하나의 데이터베이스 이름으로 합칠 필요가 없습니다.
- 원격 `db_schema`가 비어 있지 않으면 Doris 데이터베이스 이름은 해당 `db_schema`입니다. 비어 있으면 원격 Catalog 이름을 사용합니다.

| 원격(catalog, db_schema) | Doris 데이터베이스 이름 |
| --- | --- |
| `mydb`, `public` | `public` |
| `mydb`, 비어 있음 | `mydb` |

데이터 소스가 Catalog 이름과 db_schema 이름이 모두 없는 객체를 보고하면 Doris는 해당 객체를 데이터베이스로 지정할 수 없어 오류를 발생시킵니다.

`uri`가 원격 Catalog를 고정하지 않으면 Doris는 `CREATE CATALOG` 시 이를 알리고, uri에 `postgresql://host:5432/mydb`처럼 원격 Catalog를 지정하거나 드라이버 옵션으로 지정하도록 요청합니다. 일부 드라이버는 Doris가 이 검사에 사용하는 인터페이스를 구현하지 않습니다. 이런 드라이버의 Catalog는 작성된 그대로 허용되며, 문제는 첫 번째 `SHOW DATABASES`에서 드러납니다.

## 컬럼 타입 매핑 {#column-type-mapping}

<!-- Knowledge Type: Type Reference -->

Doris는 데이터 소스가 반환하는 Arrow 타입을 매핑합니다.

| Arrow 타입 | Doris 타입 | 설명 |
| --- | --- | --- |
| `bool` | `BOOLEAN` | |
| `int8` | `TINYINT` | |
| `int16` | `SMALLINT` | |
| `int32` | `INT` | |
| `int64` | `BIGINT` | |
| `uint8` | `SMALLINT` | 부호 없는 정수는 한 단계 큰 타입으로 확장 |
| `uint16` | `INT` | 부호 없는 정수는 한 단계 큰 타입으로 확장 |
| `uint32` | `BIGINT` | 부호 없는 정수는 한 단계 큰 타입으로 확장 |
| `uint64` | `LARGEINT` | 부호 없는 정수는 한 단계 큰 타입으로 확장 |
| `float16`, `float32` | `FLOAT` | |
| `float64` | `DOUBLE` | |
| `decimal128(P,S)` | `DECIMAL(P,S)` | 최대 정밀도는 38이며, 이를 초과하면 해당 컬럼은 거부됨 |
| `decimal256(P,S)` | `DECIMAL(P,S)` | 최대 정밀도는 76이며, 이를 초과하면 해당 컬럼은 거부됨 |
| `date32(day)` | `DATE` | |
| `date64(ms)` | `DATETIME(3)` | `date64`에는 시각 정보가 포함되어 있으며 `DATE`로 변환하면 이 정보가 사라짐 |
| 시간대가 없는 `timestamp(s)` | `DATETIME(0)` | |
| 시간대가 없는 `timestamp(ms)` | `DATETIME(3)` | |
| 시간대가 없는 `timestamp(us)`, `timestamp(ns)` | `DATETIME(6)` | 나노초 정밀도는 마이크로초 단위로 잘림 |
| 시간대가 있는 `timestamp` | `TIMESTAMPTZ(0-6)` | 동일한 정밀도 규칙이 적용됨. 시간대가 있는 Arrow 타임스탬프는 특정 순간을 나타내며, `DATETIME`으로 변환하면 시간대가 사라짐 |
| `utf8`, `large_utf8`, `utf8_view` | `STRING` | |
| `binary`, `large_binary`, `binary_view`, `fixed_size_binary` | `STRING` | Doris는 외부 테이블 경로에서 범용 바이너리 컬럼 타입을 지원하지 않음 |
| `list`, `large_list`, `fixed_size_list`, `list_view`, `large_list_view` | `ARRAY` | 요소 타입을 재귀적으로 매핑 |
| `struct` | `STRUCT` | 필드 타입을 재귀적으로 매핑하며, **필드 이름은 소문자로 변환됨** |
| `map` | `MAP` | 키와 값 타입을 재귀적으로 매핑 |
| `dictionary` | dictionary의 값 타입에 따라 매핑 | |
| `run_end_encoded` | 값 타입에 따라 매핑 | |
| 기타 | 지원되지 않음 | |

:::note
- Doris에는 부호 없는 정수 타입이 없으므로 부호 없는 타입은 한 단계 큰 타입으로 확장됩니다. `uint32`는 `BIGINT`로 매핑되며 `INT`로 매핑되지 않습니다. 더 작은 타입을 사용하면 2^31을 초과하는 모든 값이 오류 없이 음수로 래핑되기 때문입니다.
- 타입을 매핑할 수 없으면 Doris는 정보 손실이 발생하는 타입으로 매핑하는 대신, 테이블 구조를 조회할 때 오류를 발생시키고 컬럼 이름과 해당 Arrow 타입을 표시합니다. 소스 측에서 컬럼을 캐스팅하거나 쿼리에서 해당 컬럼을 제외하세요.
- Doris 데이터 소스를 읽을 때 `IPV4` 컬럼은 `INT`로 전달됩니다. 양쪽이 모두 int32로 인코딩하기 때문입니다. 소스의 `DATETIME` 컬럼은 `TIMESTAMPTZ`로 전달됩니다.
:::

## 쿼리 작업 {#query-operations}

<!-- Knowledge Type: Operational Examples + Behavior Rules -->

### 기본 쿼리 {#basic-query}

Catalog를 구성한 후 다음 방법 중 하나로 테이블을 쿼리할 수 있습니다.

```sql
-- 1. switch to catalog, use database and query
SWITCH adbc_ctl;
USE adbc_db;
SELECT * FROM adbc_tbl LIMIT 10;

-- 2. use adbc database directly
USE adbc_ctl.adbc_db;
SELECT * FROM adbc_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM adbc_ctl.adbc_db.adbc_tbl LIMIT 10;
```

### 메타데이터 작업 {#metadata-operations}

```sql
SHOW DATABASES FROM adbc_ctl;

SHOW TABLES FROM adbc_ctl.adbc_db;

DESC adbc_ctl.adbc_db.adbc_tbl;

SHOW CREATE TABLE adbc_ctl.adbc_db.adbc_tbl;
```

데이터베이스와 테이블 목록은 항상 실시간으로 읽으므로 데이터 소스에서 생성한 테이블은 `REFRESH` 없이도 표시됩니다. 테이블 스키마는 캐싱됩니다. [메타데이터 캐시](#meta-cache)를 참조하세요.

:::note
데이터 소스의 뷰는 테이블 목록에 표시되지 않습니다.
:::

### 데이터 통합 {#data-integration}

외부 소스의 데이터를 Doris 내부 테이블에 쓸 수 있습니다.

```sql
INSERT INTO internal.demo.local_tbl
SELECT * FROM adbc_ctl.adbc_db.adbc_tbl;
```

내부 테이블 및 다른 Catalog의 테이블과 연합 쿼리를 실행할 수 있으며, `SELECT ... INTO OUTFILE`과 ADBC 테이블을 기반으로 구축한 구체화된 뷰(MTMV)도 사용할 수 있습니다.

### 컬럼 프루닝 {#column-pruning}

Doris는 쿼리에 필요한 컬럼만 요청합니다. 사용하지 않는 컬럼은 생성되는 원격 SQL에 포함되지 않습니다.

### 조건자 푸시다운 {#predicate-pushdown}

다음 조건자는 원격 SQL의 `WHERE` 절로 변환됩니다.

| 범주 | 지원 형식 |
| --- | --- |
| 비교 | `=`, `!=`, `<`, `<=`, `>`, `>=` |
| NULL 검사 | `IS NULL`, `IS NOT NULL` |
| 집합 | `IN`, `NOT IN` |
| 논리 연산자 | 위 조건자에 적용되는 `AND`, `OR`, `NOT` |

함수 호출, 산술 표현식, `LIKE`, `BETWEEN`은 푸시다운되지 않고 Doris에서 처리됩니다.

최상위 `AND`의 각 결합 조건은 전체가 푸시다운되거나 전혀 푸시다운되지 않습니다. **Doris는 푸시다운 여부와 관계없이 모든 조건자를 다시 적용하므로**, 푸시다운은 쿼리 속도에만 영향을 주며 반환되는 행은 바뀌지 않습니다.

### LIMIT 푸시다운 {#limit-pushdown}

`LIMIT`는 전체 `WHERE` 절이 푸시다운된 후에만 푸시다운됩니다. 따라서 Doris가 아직 적용해야 하는 필터보다 먼저 데이터 소스에서 결과를 잘라 내는 일은 없습니다.

### COUNT(*) 최적화 {#count-optimization}

`COUNT(*)`는 데이터 소스에서 컬럼 데이터를 읽지 않습니다.

### 생성된 원격 SQL 확인 {#inspecting-the-generated-remote-sql}

`EXPLAIN`은 데이터 소스에 실제로 전송되는 SQL 문을 보여 줍니다.

```sql
EXPLAIN
SELECT id, name
FROM adbc_ctl.adbc_db.adbc_tbl
WHERE id > 100 AND name IS NOT NULL
LIMIT 10;
```

출력의 `QUERY:` 줄은 푸시다운된 원격 SQL 문이며, 여기에 포함된 컬럼은 스캔이 실제로 요청하는 컬럼과 일치합니다.

:::tip
Arrow Flight SQL 데이터 소스에서는 파티션을 요청하는 호출 자체가 쿼리 실행입니다. 따라서 ADBC 테이블에 `EXPLAIN`을 실행할 때 Doris는 데이터 소스에 파티션을 요청하지 않으며, 데이터 소스도 실제 쿼리를 실행하지 않습니다.
:::

### 병렬 읽기 {#parallel-reads}

`partitioned_read`가 `auto`(기본값) 또는 `required`이면 Doris는 드라이버에 하나의 스캔을 여러 결과 파티션으로 분할하도록 요청합니다. 각 파티션은 하나의 BE 노드가 읽으며, 노드들은 병렬로 작업합니다.

데이터 소스가 스캔을 파티션으로 나눌 수 없는 경우:

- `auto`: 하나의 BE 노드에서 단일 문으로 읽는 방식으로 전환합니다.
- `required`: 쿼리가 실패하고 그 이유가 표시됩니다.

파티션 수가 `max_partitions`를 초과하면 쿼리가 실패합니다.

## 메타데이터 캐시 {#meta-cache}

<!-- Knowledge Type: Configuration Parameters + Usage Guidance -->

외부 데이터 소스에 빠르게 액세스할 수 있도록 Doris는 ADBC Catalog 메타데이터 중 데이터베이스 이름 해석, 테이블 이름 해석, 테이블 스키마를 캐싱합니다.

데이터베이스와 테이블 목록은 **캐싱하지 않습니다**. 항상 실시간으로 읽으므로 데이터 소스에서 생성한 테이블은 `REFRESH` 없이도 액세스할 수 있습니다.

### 캐시 속성 구성 {#meta-cache-unified-model}

ADBC Catalog의 메타데이터 캐시는 통합 키 `meta.cache.<engine>.<entry>.{enable,ttl-second,capacity}`를 통해 구성합니다.

| 속성 | 기본값 | 의미 |
| --- | --- | --- |
| `meta.cache.adbc.metadata.enable` | `true` | 메타데이터 캐시의 활성화 여부입니다. |
| `meta.cache.adbc.metadata.ttl-second` | `600` | `0`은 캐시를 비활성화합니다. 즉시 적용되므로 최신 메타데이터를 확인할 때 사용할 수 있습니다. `-1`은 만료되지 않음을 의미합니다. 그 밖의 양의 정수는 액세스 시점을 기준으로 하는 초 단위 TTL입니다. |
| `meta.cache.adbc.metadata.capacity` | `1000` | 최대 캐시 항목 수입니다. `0`은 캐시를 비활성화합니다. |

**적용 조건:** 캐시는 `enable=true`, `ttl-second != 0`, `capacity > 0`인 경우에만 활성화됩니다.

:::tip
기본 TTL인 10분은 다른 Catalog의 기본값보다 훨씬 짧습니다. ADBC 데이터 소스는 별도로 운영 중인 데이터베이스입니다. 테이블은 다른 사용자의 DDL에 의해 언제든 변경될 수 있지만, Doris는 이를 통지받지 못합니다. 이 값은 `REFRESH` 실행을 잊은 사용자가 이전 테이블 스키마를 보게 되는 최대 시간을 정합니다.
:::

### 캐시 모듈 {#meta-cache-unified-modules}

데이터베이스 해석, 테이블 이름 해석, 테이블 스키마는 하나의 설정을 공유합니다. 이들은 함께 읽히고 함께 제거되며, 모두 원격 데이터 소스의 구조를 나타냅니다.

| 모듈(`<entry>`) | 속성 키 접두사 | 캐시되는 내용 및 영향 |
| --- | --- | --- |
| `metadata` | `meta.cache.adbc.metadata.` | 데이터베이스 이름 해석, 테이블 이름 해석, 테이블 스키마를 캐싱합니다. 소스에서 컬럼이 추가 또는 삭제되거나 타입이 변경된 결과가 Doris에 얼마나 빨리 반영되는지에 영향을 줍니다. |

### 수동 새로 고침 {#manual-refresh}

다음 각 문은 해당 범위의 캐시를 삭제합니다.

```sql
REFRESH CATALOG adbc_ctl;
REFRESH DATABASE adbc_ctl.adbc_db;
REFRESH TABLE adbc_ctl.adbc_db.adbc_tbl;
```

### 권장 사용법 {#meta-cache-best-practices}

* **최신 메타데이터에 실시간으로 액세스**: 모든 쿼리가 데이터 소스의 현재 테이블 스키마를 읽도록 하려면 `ttl-second`를 `0`으로 설정합니다.

  ```sql
  ALTER CATALOG adbc_ctl SET PROPERTIES ("meta.cache.adbc.metadata.ttl-second" = "0");
  ```

* **스키마가 자주 변경되는 데이터 소스**: `ttl-second`를 낮추거나 변경이 발생했음을 확인한 후 `REFRESH`를 실행합니다.

### 관측 가능성 {#meta-cache-unified-observability}

캐시 메트릭은 `information_schema.catalog_meta_cache_statistics` 시스템 테이블에서 확인할 수 있습니다.

```sql
SELECT catalog_name, engine_name, entry_name,
       effective_enabled, ttl_second, capacity,
       estimated_size, hit_rate, load_failure_count, last_error
FROM information_schema.catalog_meta_cache_statistics
WHERE catalog_name = 'adbc_ctl' AND engine_name = 'adbc'
ORDER BY entry_name;
```

이 시스템 테이블에 관한 문서는 [catalog_meta_cache_statistics](../../admin-manual/system-tables/information_schema/catalog_meta_cache_statistics.md)를 참조하세요.

:::caution
ADBC 연결은 쿼리를 실행하는 사용자와 관계없이 Catalog에 설정된 단일 계정으로 데이터 소스에 접속합니다. 따라서 모든 사용자가 캐시 항목을 공유합니다.
:::

## 제한 사항 {#limitations}

<!-- Knowledge Type: Limitations -->

- 읽기 전용입니다. 데이터 소스에 대한 `INSERT`, `CREATE TABLE`, `DROP TABLE` 및 기타 쓰기 문은 거부됩니다.
- 통계 수집과 집계 푸시다운은 지원되지 않습니다.
- 데이터 소스의 뷰는 테이블 목록에 표시되지 않습니다.
- `driver_checksum`은 FE의 드라이버 복사본만 검증합니다. BE의 복사본은 검증하지 않으며 FE와 BE의 파일을 서로 비교하지도 않습니다.
- `driver_url`은 로컬 참조만 허용합니다. Doris는 원격 URL에서 드라이버를 다운로드하지 않습니다.
- Doris 데이터 소스를 읽을 때 `IPV4` 컬럼은 `INT`로 전달되며, 소스의 `DATETIME` 컬럼은 `TIMESTAMPTZ`로 전달됩니다.

## 부록 {#appendix}

### 자주 묻는 질문 {#faq}

<!-- Knowledge Type: Troubleshooting -->

| 증상 또는 오류 | 원인 | 해결 방법 |
| --- | --- | --- |
| `Driver file not found` | FE가 해석한 경로에서 드라이버 파일을 찾을 수 없습니다. | `driver_url`에 지정한 경로 없는 파일 이름이 `drivers_dir` 디렉터리에 있는지 확인합니다. 이 디렉터리는 `adbc.conf`에서 설정합니다. 또한 절대 경로 또는 `file://` URL이 가리키는 파일이 FE 노드에 존재하며 읽을 수 있는지 확인합니다. |
| `Driver path does not match any path allowed by driver_secure_path` | 드라이버 경로가 `adbc.conf`의 허용 목록에 포함되지 않습니다. | 드라이버를 허용된 디렉터리로 옮기거나 `driver_secure_path`를 변경하고 FE를 재시작합니다. |
| `scheme 'xxx' is not supported, only a local file is` | `driver_url`에 `http://` 같은 원격 스킴을 사용했습니다. | ADBC 드라이버는 노드별로 다운로드되지 않습니다. FE와 모든 BE에 드라이버 파일을 배치한 다음 경로 없는 이름, 절대 경로 또는 `file://` URL로 참조합니다. |
| `The ADBC source reports no current catalog, so 'uri' does not pin one` | `uri`가 원격 Catalog를 고정하지 않습니다. | uri에 `postgresql://host:5432/mydb`처럼 원격 Catalog를 지정하거나 `adbc.` 접두사가 붙은 드라이버 옵션으로 설정합니다. |
| 컬럼의 Arrow 타입에 해당하는 Doris 타입이 없다는 오류로 쿼리가 실패함 | 해당 컬럼의 타입을 매핑할 수 없습니다. | 데이터 소스에서 매핑 가능한 타입으로 캐스팅하거나, `SELECT *`를 사용하는 대신 쿼리에서 해당 컬럼을 제외합니다. |
| 쿼리 결과가 잘못된 것 같지만 오류가 보고되지 않음 | FE와 모든 BE의 드라이버 파일이 동일한 빌드가 아닐 수 있습니다. ADBC는 드라이버 전용 형식으로 파티션 정보를 표현하므로, 서로 다른 구현은 오류를 발생시키지 않고 서로의 정보를 잘못 읽을 수 있습니다. | `driver_checksum`으로 FE의 빌드를 고정하고 각 BE에서 드라이버 파일의 MD5를 직접 비교합니다. |
| 원격 SQL이 구문 오류로 실패함 | 데이터 소스의 SQL 방언이 사용 중인 방언과 일치하지 않습니다. | `sql_dialect`를 명시적으로 설정합니다. 예를 들어 Doris 데이터 소스에는 `'sql_dialect' = 'doris'`를 사용합니다. |
