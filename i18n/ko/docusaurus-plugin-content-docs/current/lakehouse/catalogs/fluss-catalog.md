---
{
    "title": "Fluss Catalog",
    "language": "ko",
    "description": "Doris에서 Apache Fluss 테이블을 쿼리합니다. 로그 및 기본 키 테이블과 함께 Paimon으로 티어링된 데이터와 Fluss 로그의 Union Read를 지원합니다.",
    "keywords": [
        "Fluss Catalog",
        "Apache Fluss",
        "Doris에서 Fluss 쿼리",
        "Union Read",
        "레이크와 로그의 Union Read",
        "티어링된 레이크 테이블",
        "Fluss Paimon",
        "Tiering Service",
        "tbl$lake",
        "tbl$log",
        "fluss.union_read.mode",
        "fluss.bootstrap.servers",
        "fluss.lake.paimon",
        "Fluss 로그 테이블",
        "Fluss 기본 키 테이블",
        "Fluss 타입 매핑",
        "스트리밍 스토리지",
        "has no readable lake snapshot yet",
        "enable_jni_heap_admission",
        "Java heap space"
    ]
}
---

<!-- Knowledge Type: Capability Definition + Configuration Parameters + Performance Tuning + Troubleshooting -->
<!-- Use Case: Real-time queries on Fluss tables / Lake and log Union Read / Data integration and federated queries -->

Doris는 Fluss Catalog를 통해 [Apache Fluss](https://fluss.apache.org/)의 테이블을 읽습니다. Fluss는 실시간 분석을 위한 스트리밍 스토리지 시스템이며, 티어링 서비스를 통해 테이블 데이터를 Paimon 데이터 레이크에 지속적으로 기록할 수 있습니다. Doris는 Fluss의 실시간 데이터를 직접 읽을 수 있습니다. 또한 이미 Paimon으로 티어링된 과거 데이터와 아직 Fluss 로그에 남아 있는 최신 행을 병합하여 하나의 테이블로 쿼리할 수 있습니다. 이 두 번째 읽기 방식을 Union Read라고 합니다.

:::note
- 이 기능은 실험적 기능이며, 버전 5.0.0부터 사용할 수 있습니다.
- 읽기만 지원합니다. 쓰기와 데이터베이스 또는 테이블 관리 구문은 지원하지 않습니다.
- 티어링된 레이크 테이블의 레이크 포맷으로는 Paimon만 지원합니다.
:::

## 사용 사례 {#use-cases}

| 시나리오 | 설명 |
| --- | --- |
| 실시간 쿼리 | Fluss 로그 테이블과 기본 키 테이블의 최신 데이터를 직접 쿼리합니다. |
| Union Read | 레이크 티어링이 활성화된 테이블에서는 하나의 쿼리로 Paimon 레이크에 티어링된 과거 데이터와 아직 티어링되지 않은 Fluss 로그의 행을 함께 읽습니다. 이것이 레이크와 로그의 Union Read입니다. |
| 데이터 통합 | Fluss 데이터를 읽어 Doris 내부 테이블에 넣거나, 연합 쿼리에서 내부 테이블 및 다른 Catalog의 테이블과 조인합니다. |
| 다시 쓰기 | 지원하지 않습니다. |

## 동작 방식 {#how-it-works}

<!-- Knowledge Type: Architecture Principles -->

Fluss 테이블에는 세 가지 형태가 있으며, 각각 읽는 방식이 다릅니다.

| 테이블 타입 | Doris의 읽기 방식 |
| --- | --- |
| 로그 테이블 | Fluss 로그를 읽습니다. 각 버킷이 하나의 스캔 범위가 됩니다. |
| 기본 키 테이블 | 각 버킷의 최신 KV 스냅샷을 읽고, 스냅샷 이후에 기록된 변경 로그를 적용한 다음 기본 키로 병합하여 최신 상태를 구합니다. |
| 티어링된 레이크 테이블 (`table.datalake.enabled = true`) | Paimon 레이크에 티어링된 데이터를 읽고, 티어링 오프셋 이후의 Fluss 로그를 적용하여 한 번의 스캔으로 두 데이터를 병합합니다. 이것이 Union Read입니다. |

레이크 측 데이터는 Doris에 내장된 Paimon Connector가 읽으며, Fluss Catalog 자체에는 레이크 리더가 없습니다. Fluss는 티어링된 각 테이블에 대해 읽을 수 있는 Paimon 스냅샷을 기록하고, Doris는 해당 스냅샷의 Paimon 데이터를 읽습니다. 따라서 네이티브 ORC/Parquet 리더와 파일 캐시를 모두 사용할 수 있습니다.

티어링된 기본 키 테이블에서 Union Read를 수행하면 기본 키를 기준으로 양쪽 데이터를 병합합니다. 계획 단계에서 FE는 각 버킷의 레이크 스플릿에 해당 버킷의 로그 테일 오프셋 범위를 첨부합니다. BE는 레이크 데이터를 읽을 때 로그 테일에서 이후에 업데이트하거나 삭제한 행을 제외한 다음, 로그 테일 자체의 최신 상태를 별도의 스캔 범위로 한 번 더 출력합니다. 모든 행은 정확히 한 번씩 출력되며, 결과는 Fluss에서만 전체 테이블을 읽은 결과와 일치합니다.

## Catalog 구성 {#configuring-catalog}

<!-- Knowledge Type: Configuration Parameters -->
<!-- Use Case: Creating a Fluss Catalog / Configuring SASL authentication / Configuring the Paimon lake connection -->

### 구문 {#syntax}

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'fluss',
    'fluss.bootstrap.servers' = '<bootstrap_servers>',
    {FlussProperties},
    {LakeProperties},
    {CommonProperties}
);
```

* `<bootstrap_servers>`

    필수 항목입니다. Fluss 클러스터의 부트스트랩 주소이며, `host:port`를 쉼표로 구분한 목록입니다. 일반적으로 CoordinatorServer 주소를 사용합니다. 예: `'fluss.bootstrap.servers' = '10.0.0.1:9123,10.0.0.2:9123'`.

* `{FlussProperties}`

    FlussProperties 영역에는 Fluss Catalog 전용 매개변수를 지정합니다.

    | 매개변수 | 필수 여부 | 기본값 | 설명 |
    | --- | --- | --- | --- |
    | `fluss.union_read.mode` | 아니요 | `auto` | 티어링된 레이크 테이블의 Union Read 모드입니다. `auto`, `required`, `disabled` 중 하나입니다. Union Read 모드를 참조하세요. |
    | `fluss.union_read.max_tail_rows` | 아니요 | `2000000` | 기본 키 테이블에서 Union Read를 수행할 때 단일 버킷의 로그 테일에 허용되는 최대 행 수입니다. Union Read 모드를 참조하세요. |
    | `fluss.union_read.max_total_tail_rows` | 아니요 | `20000000` | 기본 키 테이블에서 Union Read를 수행할 때 한 번의 스캔에서 모든 버킷의 로그 테일에 허용되는 총 최대 행 수입니다. `fluss.union_read.max_tail_rows`보다 작을 수 없습니다. |
    | `enable.mapping.varbinary` | 아니요 | `false` | Fluss의 `BINARY`/`BYTES` 타입을 Doris의 `varbinary`로 매핑할지 여부입니다. 기본적으로는 `string`으로 매핑합니다. |
    | `enable.mapping.timestamp_tz` | 아니요 | `false` | Fluss의 `TIMESTAMP_LTZ` 타입을 Doris의 `timestamptz`로 매핑할지 여부입니다. 기본적으로는 `datetime`으로 매핑합니다. |

    위의 Doris 전용 매개변수와 `fluss.lake.paimon.*`를 제외하고, `fluss.` 접두사가 붙은 나머지 속성은 모두 접두사만 제거한 채 Fluss 클라이언트에 그대로 전달됩니다. FE와 BE는 동일한 설정 집합을 사용합니다. Doris는 매개변수 이름을 제한하지 않으므로 Fluss 클라이언트가 인식하는 모든 설정 항목을 이 방식으로 전달할 수 있습니다. 예를 들어 Fluss 클러스터에서 SASL 인증이 활성화되어 있다면 다음과 같이 설정합니다.

    ```sql
    'fluss.client.security.protocol' = 'sasl',
    'fluss.client.security.sasl.mechanism' = 'PLAIN',
    'fluss.client.security.sasl.username' = '<username>',
    'fluss.client.security.sasl.password' = '<password>'
    ```

    전체 목록은 [Fluss 설정 참조](https://fluss.apache.org/docs/maintenance/configuration/)와 [Fluss 인증 가이드](https://fluss.apache.org/docs/security/authentication/)를 참조하세요.

    FE와 BE의 Fluss 클라이언트 설정에서 유일하게 다른 부분은 네트워크 스레드 수입니다. BE의 각 Fluss 연결은 한 번에 하나의 스캔 범위를 처리합니다. 따라서 Catalog에서 `fluss.netty.client.num-network-threads`를 설정하지 않으면, BE는 스레드와 파일 디스크립터를 절약하기 위해 네트워크 스레드 하나로 연결을 열고 FE 연결은 Fluss 클라이언트 기본값을 유지합니다. 일반적으로 이 매개변수를 설정할 필요는 없습니다. 설정하면 FE와 BE 모두 해당 값을 사용합니다.

* `{LakeProperties}`

    LakeProperties 영역에는 티어링된 레이크 테이블이 사용하는 Paimon 레이크의 연결 설정을 지정하며, `fluss.lake.paimon.` 접두사를 사용합니다. 접두사 뒤의 내용은 Fluss 클러스터의 `server.yaml`에 있는 `datalake.paimon.*`와 정확히 같은 형식으로 작성하므로 값을 그대로 복사할 수 있습니다. 레이크 연결 설정을 참조하세요.

* `{CommonProperties}`

    CommonProperties 영역에는 공통 속성을 지정합니다. [Catalog 개요](../catalog-overview.md)의 공통 속성 절을 참조하세요.

### 예제 {#examples}

다음은 최소 구성입니다. Fluss 자체 데이터만 읽거나 레이크의 스토리지에 인증 정보가 필요하지 않다면 이 설정만으로 충분합니다.

```sql
CREATE CATALOG fluss PROPERTIES (
    'type' = 'fluss',
    'fluss.bootstrap.servers' = '10.0.0.1:9123'
);
```

Paimon 레이크가 객체 스토리지에 있는 경우입니다. 이 예제에서는 S3 호환 스토리지를 사용합니다.

```sql
CREATE CATALOG fluss_lake PROPERTIES (
    'type' = 'fluss',
    'fluss.bootstrap.servers' = '10.0.0.1:9123',
    'fluss.lake.paimon.s3.endpoint' = 'http://minio:9000',
    'fluss.lake.paimon.s3.access-key' = '<ak>',
    'fluss.lake.paimon.s3.secret-key' = '<sk>'
);
```

Fluss 클러스터에서 SASL 인증이 활성화된 경우입니다.

```sql
CREATE CATALOG fluss_sasl PROPERTIES (
    'type' = 'fluss',
    'fluss.bootstrap.servers' = '10.0.0.1:9123',
    'fluss.client.security.protocol' = 'sasl',
    'fluss.client.security.sasl.mechanism' = 'PLAIN',
    'fluss.client.security.sasl.username' = '<username>',
    'fluss.client.security.sasl.password' = '<password>'
);
```

### 배포 요구 사항 {#deployment-requirements}

- FE는 Fluss 클라이언트를 사용하여 메타데이터를 읽고 쿼리를 계획하며, BE는 이를 사용하여 데이터를 읽습니다. 둘 다 Fluss 클러스터의 CoordinatorServer와 TabletServer에 접근할 수 있어야 합니다.
- BE는 Fluss 클러스터 연결을 재사용합니다. 스캔 범위를 읽은 후에도 연결은 이후의 스캔 범위와 쿼리를 위해 열린 상태로 유지되며, 유휴 시간이 60초를 초과해야 닫힙니다. 따라서 쿼리가 끝난 후에도 Fluss 측에 BE의 연결이 표시될 수 있습니다. 연결은 클라이언트 설정별로 분리됩니다. Catalog 속성(예: SASL 사용자 이름과 비밀번호)을 변경하면 BE는 새 설정으로 새 연결을 엽니다.
- 기본 키 테이블의 KV 스냅샷과 보관된 로그 세그먼트는 Fluss에 설정된 원격 스토리지(`remote.data.dir`)에 저장됩니다. BE는 해당 파일을 직접 읽으므로 이 원격 스토리지에도 접근할 수 있어야 합니다.
- 티어링된 레이크 테이블을 읽으려면 FE와 BE 모두 Paimon 레이크가 저장된 스토리지에 접근할 수 있어야 합니다.
- 레이크 데이터는 Doris에 내장된 Paimon Connector 플러그인이 읽습니다. 이 플러그인은 Doris와 함께 제공되므로 별도로 설치할 필요가 없습니다.

## 지원되는 Fluss 버전 {#supported-fluss-versions}

<!-- Knowledge Type: Version Compatibility -->

| Doris 버전 | Fluss 클라이언트 버전 |
| --- | --- |
| 5.0 | 1.0 |

1.0보다 이전 버전의 Fluss 클러스터는 지원하지 않습니다. Doris가 사용하는 클라이언트 API는 Fluss 1.0에서 처음 도입되었습니다.

## 메타데이터 매핑 {#metadata-mapping}

<!-- Knowledge Type: Behavior Rules -->

Fluss의 메타데이터 계층은 데이터베이스 -> 테이블이며, Doris에 일대일로 매핑됩니다. 추가적인 이름 매핑은 없습니다.

레이크 티어링이 활성화된 테이블의 경우 `SHOW TABLES`에는 테이블 자체만 표시됩니다. `tbl$lake`와 `tbl$log`는 같은 테이블을 읽는 두 가지 방식이므로 별도 항목으로 표시되지 않습니다.

`SHOW CREATE TABLE`은 Fluss 테이블의 컬럼과 주석을 표시하지만 테이블 속성은 표시하지 않습니다. 테이블의 레이크 티어링 활성화 여부(`table.datalake.enabled`)와 사용하는 레이크 포맷(`table.datalake.format`)을 확인하려면 Flink SQL 등에서 Fluss 측 테이블 정의를 확인하세요. Doris에서는 레이크 티어링이 활성화된 테이블에만 `tbl$lake`와 `tbl$log`가 있습니다.

## 컬럼 타입 매핑 {#column-type-mapping}

<!-- Knowledge Type: Type Reference -->

| Fluss 타입 | Doris 타입 | 설명 |
| --- | --- | --- |
| BOOLEAN | boolean | |
| TINYINT | tinyint | |
| SMALLINT | smallint | |
| INT | int | |
| BIGINT | bigint | |
| FLOAT | float | |
| DOUBLE | double | |
| DECIMAL(P, S) | decimal(P, S) | |
| CHAR(N) | char(N) | N이 255보다 크면 string으로 매핑됩니다 |
| STRING | string | |
| BINARY(N) | string / varbinary(N) | `enable.mapping.varbinary`로 제어합니다. 기본값인 `false`이면 `string`으로, `true`이면 `varbinary`로 매핑됩니다 |
| BYTES | string / varbinary | 위와 동일합니다 |
| DATE | date | |
| TIME | UNSUPPORTED | Doris에는 같은 의미를 갖는 타입이 없습니다. 테이블의 다른 컬럼은 계속 쿼리할 수 있으며, 이 컬럼을 사용하는 쿼리만 실패합니다 |
| TIMESTAMP(P) | datetime(P) | 정밀도가 6보다 크면 datetime(6)으로 매핑되므로 정밀도가 손실될 수 있습니다 |
| TIMESTAMP_LTZ(P) | datetime(P) / timestamptz(P) | 정밀도가 6보다 크면 6으로 매핑됩니다. `enable.mapping.timestamp_tz`로 제어합니다. 기본값인 `false`이면 `datetime`으로, `true`이면 `timestamptz`로 매핑됩니다 |
| ARRAY | array | |
| MAP | map | |
| ROW | struct | |

> 참고:
>
> `TIMESTAMP_LTZ` 컬럼의 경우 `WITH_TIMEZONE`이 `DESCRIBE`의 Extra 컬럼에 표시됩니다. 이 컬럼이 `datetime`으로 매핑되면 Doris는 값을 현재 세션 시간대(`SET time_zone = <tz>`)로 변환한 후 반환합니다.
>
> 레이크 티어링이 활성화된 테이블에서는 `tbl`과 `tbl$lake`의 컬럼 타입이 같습니다. 위 매핑은 Fluss가 Paimon에 기록할 때 적용하는 타입 변환 및 Paimon Catalog의 타입 매핑과 일치합니다.

## 파티션 테이블 {#partitioned-tables}

<!-- Knowledge Type: Behavior Rules + Limitations -->

Doris에서 파티션 컬럼은 일반 컬럼입니다. `SHOW PARTITIONS`는 파티션을 `k1=v1/k2=v2` 형식으로 나열합니다. 파티션 컬럼에 대한 조건자는 파티션 프루닝에 사용되므로 읽는 버킷 수가 줄어듭니다.

Fluss는 파티션 값을 파티션 이름에만 저장하며, 파티션 이름에 사용할 수 없는 문자(예: `.`과 `:`)는 `_`로 대체합니다. Doris는 이러한 변환을 거쳐도 값이 바뀌지 않는 파티션 컬럼만 읽을 수 있습니다.

- 지원: `CHAR`, `STRING`, `BOOLEAN`, `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `DATE`, 그리고 `BINARY`/`BYTES` 타입은 `enable.mapping.varbinary`가 꺼져 있을 때 지원합니다(파티션 값은 바이트를 십육진수로 나타낸 텍스트입니다).
- 미지원: `FLOAT`, `DOUBLE`, `TIME`, `TIMESTAMP`, `TIMESTAMP_LTZ`. 이러한 테이블도 `DESCRIBE`로 정의를 확인할 수 있지만, 쿼리와 `SHOW PARTITIONS`는 실패하며 오류 메시지에 원인이 된 파티션 컬럼 이름이 표시됩니다.

## 쿼리 작업 {#query-operations}

<!-- Knowledge Type: Operational Examples + Behavior Rules -->
<!-- Use Case: Querying Fluss tables / Reading only the lake or only the log / Controlling the Union Read mode -->

### 기본 쿼리 {#basic-query}

```sql
-- Switch to the catalog, then query
SWITCH fluss;
USE db;
SELECT * FROM tbl LIMIT 10;

-- Use the fully qualified name
SELECT * FROM fluss.db.tbl WHERE dt = '20260101';
```

로그 테이블은 쿼리 계획 시점까지의 모든 로그 레코드를 반환합니다. 같은 파티션의 버킷은 동일한 시점에 가져온 오프셋을 사용하므로 하나의 쿼리는 일관된 뷰를 보게 됩니다. 기본 키 테이블은 각 키의 최신 상태를 반환하며, 삭제된 키는 결과에 나타나지 않습니다.

### 티어링된 레이크 테이블과 Union Read {#tiered-lake-tables-and-union-read}

`table.datalake.enabled = true`인 테이블에 대해 Doris는 세 가지 읽기 방식을 제공합니다. 기본적으로 레이크와 로그를 함께 읽으며, 이것이 Union Read입니다.

```sql
SELECT * FROM fluss.db.tbl;         -- Union Read: lake + log merged into the full data set (default)
SELECT * FROM fluss.db.`tbl$lake`;  -- Only the tiered data in the Paimon lake
SELECT * FROM fluss.db.`tbl$log`;   -- Only the data in the Fluss log that has not been tiered yet
```

`tbl$lake`와 `tbl$log`는 저장 위치에 따라 데이터를 나눕니다. 서로 겹치지 않으며, 둘을 합치면 `tbl` 전체가 됩니다. 이 이름은 데이터의 최신성이 아니라 저장 위치를 나타냅니다. 티어링 서비스가 중지되더라도 `tbl$log`는 여전히 로그에 남아 있는 데이터를 의미합니다.

**`tbl$lake`**

- Paimon Connector가 티어링 서비스에서 기록한 Paimon 테이블을 직접 읽습니다. Fluss 1.0에서 티어링된 테이블의 경우 `tbl$lake`의 컬럼은 `tbl`과 정확히 같습니다. 이전 Fluss 릴리스에서 레이크 테이블에 추가하던 시스템 컬럼인 `__bucket`, `__offset`, `__timestamp`는 더 이상 존재하지 않습니다.
- Fluss가 기록한 읽기 가능한 레이크 스냅샷을 읽으며, 아직 그런 스냅샷이 없으면 레이크의 최신 상태를 읽습니다. Fluss는 Fluss 테이블과 함께 Paimon 테이블을 생성하므로, 티어링 서비스가 아직 아무것도 커밋하지 않았더라도 `tbl$lake`는 오류 대신 빈 결과를 반환합니다.
- 현재 레이크 연결 설정으로 Doris가 레이크 테이블을 찾을 수 없으면 쿼리가 `nothing has been tiered` 오류로 실패합니다. 일반적으로 `fluss.lake.paimon.warehouse` 등의 설정이 Fluss 클러스터가 기록하는 웨어하우스를 가리키지 않는다는 의미입니다. 레이크 연결 설정을 참조하세요.
- Paimon Catalog의 시간 여행 쿼리와 증분 쿼리는 지원하지 않습니다.

**`tbl$log`**

- 레이크 스냅샷에 해당하는 로그 오프셋부터 읽기 시작하며, 해당 오프셋 이후에 기록된 데이터만 반환합니다.
- 로그 테이블만 지원합니다. 기본 키 테이블에서는 레이크 스냅샷 이후의 로그가 이미 레이크에 존재하는 키의 업데이트와 삭제를 담은 변경 스트림이므로, 독립적인 행 집합으로 반환할 수 없습니다. 기본 키 테이블에서 `$log`를 쿼리하면 실패합니다.
- 테이블에 읽기 가능한 레이크 스냅샷이 이미 있어야 하며, 그렇지 않으면 쿼리가 실패합니다.
- 레이크 티어링을 사용하지 않는 테이블에는 `$lake`나 `$log`가 없습니다.

### Union Read 모드 {#union-read-modes}

<!-- Knowledge Type: Configuration Parameters + Behavior Rules -->
<!-- Use Case: Controlling whether Union Read happens / Finding out why auto mode fell back -->

티어링된 레이크 테이블 자체에 대한 쿼리(`SELECT * FROM tbl`)에서 Union Read를 수행할지는 Catalog 속성 `fluss.union_read.mode`로 제어합니다.

| 값 | 동작 |
| --- | --- |
| `auto` (기본값) | 읽기 가능한 레이크 스냅샷이 있으면 Union Read를 수행합니다. 조건을 충족하지 않으면 실패하는 대신 Fluss에서 데이터를 읽는 방식으로 대체합니다. 아래 사례를 참조하세요. |
| `required` | Union Read를 반드시 수행합니다. 조건을 충족하지 않으면 다른 방식으로 대체하지 않고 실패합니다. |
| `disabled` | Union Read를 수행하지 않습니다. 현재 Fluss에 있는 데이터만 읽고, 레이크에만 존재하는 파티션을 포함하여 레이크를 무시합니다. |

세션 변수 `fluss_union_read_mode`는 현재 세션에서 Catalog 설정보다 우선합니다.

```sql
SET fluss_union_read_mode = 'required';  -- No fallback to a Fluss-only read; fail instead
SET fluss_union_read_mode = 'disabled';  -- Read from Fluss only
SET fluss_union_read_mode = '';          -- Default: follow the catalog setting
```

단일 구문에 대해서만 모드를 변경하려면 `SET_VAR` 힌트를 사용합니다.

```sql
SELECT /*+ SET_VAR(fluss_union_read_mode='required') */ * FROM fluss.db.tbl;
```

Union Read 모드는 데이터를 읽는 경로를 결정합니다. Fluss가 테이블의 모든 데이터를 보유하고 있다면, 즉 TTL로 만료된 로그가 없고 레이크에는 남아 있지만 Fluss에서는 삭제된 파티션이 없다면 세 모드 모두 같은 행을 반환합니다. `required`는 예상한 읽기 경로를 사용하지 못할 때 조용히 다른 경로를 택하는 대신 실패하므로 회귀 테스트와 문제 해결에 유용합니다.

**`auto`가 대체 읽기로 전환되는 경우**

| 사례 | 설명 |
| --- | --- |
| 읽기 가능한 레이크 스냅샷 없음 | 티어링 서비스가 아직 아무것도 커밋하지 않아 모든 데이터가 Fluss에 있습니다. Fluss에서만 테이블을 읽습니다. |
| `key-type` | 기본 키 테이블에서 파티션 컬럼을 제외한 기본 키 컬럼이 레이크 측과 로그 측의 값을 정확하게 비교할 수 없는 타입입니다. 해당 타입은 `FLOAT`, `DOUBLE`, `TIME`, 정밀도가 6보다 큰 `TIMESTAMP`, 그리고 `TIMESTAMP_LTZ`입니다. `enable.mapping.timestamp_tz`가 `false`(기본값)이면 정밀도에 관계없이 `TIMESTAMP_LTZ` 컬럼이 여기에 해당합니다. 일광 절약 시간제 전환으로 시간이 겹치는 구간에서는 서로 다른 두 시점의 현지 시간이 같을 수 있기 때문입니다. 이 설정이 `true`이면 정밀도가 6보다 큰 경우만 해당합니다. |
| `partition-type` | 기본 키 테이블의 파티션 컬럼이 `STRING`이 아닙니다. 레이크 스플릿은 파티션 값의 텍스트 표현을 기준으로 Fluss 파티션과 연결되며, 양쪽에서 같은 방식으로 기록됨을 보장하는 타입은 `STRING`뿐입니다. |
| `tail-truncated` | 기본 키 테이블의 레이크 스냅샷 이후 로그 중 일부가 Fluss TTL에 의해 이미 삭제되어 로그 테일 전체를 읽을 수 없습니다. |
| `tail-too-large` | 기본 키 테이블의 로그 테일 행 수가 `fluss.union_read.max_tail_rows` 또는 `fluss.union_read.max_total_tail_rows`에서 허용하는 수를 초과합니다. |

마지막 네 가지 사례는 기본 키 테이블에만 적용되며, `EXPLAIN`은 이를 `degraded` 필드에 표시합니다. 기본 키 테이블이 대체 읽기로 전환되면 Fluss에 여전히 존재하는 파티션은 Fluss에서 전체를 읽습니다. Fluss가 해당 파티션의 완전한 상태를 유지하므로 데이터가 손실되지는 않습니다. 다만 해당 파티션에 대해 레이크의 컬럼형 파일을 사용할 수 없어 쿼리가 느려집니다. 파티션 만료 등의 이유로 Fluss에서는 삭제되었지만 레이크에는 남아 있는 파티션은 계속 레이크에서 읽습니다. 파티션이 없는 테이블은 Fluss에서만 읽습니다.

`partition-type`의 경우 Doris는 레이크 스플릿이 어느 Fluss 파티션에 속하는지 확실하게 판단할 수 없습니다. 레이크에 Fluss에는 더 이상 없는 파티션이 있거나, 양쪽에서 다르게 기록된 파티션 값이 있으면 쿼리는 대체 읽기로 전환되지 않고 `cannot be matched safely to a live fluss partition` 오류로 실패합니다. Fluss의 데이터만 읽으려면 Union Read 모드를 `disabled`로 설정하세요.

로그 테이블은 다르게 동작합니다. Fluss에서만 읽으면 Fluss 로그에 아직 보관된 데이터만 반환하므로, 초기 로그가 TTL로 만료되고 나면 Union Read보다 적은 행을 반환합니다. 티어링된 로그 테이블에는 `disabled`를 권장하지 않습니다. 또한 로그 테이블은 로그 테일이 불완전할 때 대체 읽기로 전환할 수 없습니다. 레이크 스냅샷 이후 로그의 일부가 이미 만료되었다면 Union Read는 `Part of the log tail has expired` 오류로 `auto`와 `required` 모드 모두에서 실패하며, `tbl$log` 쿼리도 모든 모드에서 실패합니다. Fluss가 더 새로운 읽기 가능한 레이크 스냅샷을 게시할 때까지 기다리세요.

**로그 테일의 행 수 제한**

기본 키 테이블에서 Union Read를 수행할 때 BE는 각 버킷의 로그 테일을 메모리에 유지합니다. 하나는 레이크 데이터를 필터링하는 데 사용하는 기본 키 집합이고, 다른 하나는 테일 자체가 출력해야 하는 행입니다. 메모리 사용량을 제한하기 위해 `fluss.union_read.max_tail_rows`는 단일 버킷의 테일 행 수를 제한하고(기본값 2백만 행), `fluss.union_read.max_total_tail_rows`는 한 번의 스캔에서 모든 버킷의 총 테일 행 수를 제한합니다(기본값 20백만 행). 두 제한 모두 Fluss가 보고한 오프셋을 기준으로 계획 단계에서 확인합니다. 일반적으로 로그 테일에는 한 번의 `table.datalake.freshness` 기간에 기록된 데이터만 있으므로 기본 제한보다 훨씬 적습니다. 제한에 도달했다면 대개 티어링 서비스가 중지되었거나 처리가 크게 지연되고 있다는 뜻입니다. 테일이 출력할 행은 BE의 JVM 힙에 보관되므로, 어느 제한이든 높이기 전에 JVM 힙에 이를 수용할 여유가 있는지 확인하세요. BE JVM 힙 메모리를 참조하세요.

**EXPLAIN으로 읽기 경로 확인**

`EXPLAIN` 출력의 `flussScan` 행은 쿼리가 실제로 테이블을 읽는 방식을 보여 줍니다.

```text
flussScan: readMode=default, unionRead=yes, lakeSplits=3, suppressedLakeSplits=1, logRanges=0, pkRanges=0, pkTailRanges=1, mode=auto
```

| 필드 | 의미 |
| --- | --- |
| `readMode` | `default`는 전체 테이블을 읽고, `log`는 `tbl$log`를 읽습니다. |
| `unionRead` | Union Read 수행 여부입니다. `yes`는 시작 오프셋을 레이크 스냅샷에서 가져오는 `tbl$log`에도 표시되며, 이 경우 `lakeSplits`는 0입니다. |
| `lakeSplits` | 레이크 스플릿 수입니다. |
| `suppressedLakeSplits` | 로그 테일로 필터링해야 하는 레이크 스플릿 수입니다. 기본 키 테이블에만 해당합니다. |
| `logRanges` | 로그 테이블의 로그 스캔 범위 수입니다. |
| `pkRanges` | Fluss에서 전체를 읽는 기본 키 테이블의 버킷 수입니다(KV 스냅샷 + 변경 로그). |
| `pkTailRanges` | 기본 키 테이블의 Union Read에서 로그 테일 스캔 범위 수입니다. |
| `mode` | 실제 적용된 Union Read 모드입니다. 세션 변수에서 가져온 값이면 `(session)` 접미사가 붙습니다. |
| `degraded` | 기본 키 테이블이 `auto` 모드에서 대체 읽기로 전환될 때만 표시됩니다. 값은 위 표의 `key-type`, `partition-type`, `tail-truncated`, `tail-too-large` 중 하나입니다. 읽기 가능한 레이크 스냅샷이 없는 경우는 여기에 표시하지 않으며, `unionRead=no`로만 나타납니다. 레이크에만 존재하는 파티션을 여전히 레이크에서 읽는 경우에는 `unionRead=yes`와 `degraded`가 함께 표시됩니다. |

### 레이크 연결 설정 {#lake-connection-settings}

<!-- Knowledge Type: Configuration Parameters -->
<!-- Use Case: Paimon lake on object storage that needs credentials / Overriding the lake settings reported by the Fluss cluster -->

Fluss 클러스터는 `datalake.paimon.*` 설정을 자신의 `server.yaml`에서 가져와 티어링된 각 테이블의 속성에 기록하고, Doris는 이를 바탕으로 Paimon 레이크 연결을 구성합니다. 대부분의 경우 Catalog에 별도의 레이크 연결 설정이 필요하지 않습니다.

다만 Fluss는 테이블 속성을 클라이언트에 반환하기 전에 이름에 `key`, `secret`, `password`가 포함된 모든 설정 항목을 제거합니다. Paimon 레이크가 인증 정보가 필요한 객체 스토리지에 있으면 Doris는 Fluss에서 해당 정보를 얻을 수 없으므로, Catalog에서 `fluss.lake.paimon.` 접두사를 사용하여 제공해야 합니다.

```sql
CREATE CATALOG fluss PROPERTIES (
    'type' = 'fluss',
    'fluss.bootstrap.servers' = '10.0.0.1:9123',
    'fluss.lake.paimon.s3.endpoint' = 'http://minio:9000',
    'fluss.lake.paimon.s3.access-key' = '<ak>',
    'fluss.lake.paimon.s3.secret-key' = '<sk>'
);
```

접두사 뒤에는 Paimon 자체 매개변수 이름을 사용합니다. 이는 `datalake.paimon.` 뒤에 오는 이름과 같으며, Fluss의 `server.yaml`에서 그대로 복사하면 됩니다.

| Fluss server.yaml | Doris Catalog 속성 |
| --- | --- |
| `datalake.paimon.warehouse: s3://bucket/lake` | `'fluss.lake.paimon.warehouse' = 's3://bucket/lake'` |
| `datalake.paimon.metastore: filesystem` | `'fluss.lake.paimon.metastore' = 'filesystem'` |
| `datalake.paimon.s3.endpoint: http://minio:9000` | `'fluss.lake.paimon.s3.endpoint' = 'http://minio:9000'` |

재정의는 전체 설정이 아니라 키별로 적용됩니다. Catalog에 설정한 키는 Fluss 클러스터가 보고한 동일한 키보다 우선하며, 설정하지 않은 키는 계속 클러스터에서 가져옵니다. 인증 정보만 제공하면 `warehouse`, `metastore` 및 나머지 설정은 계속 클러스터에서 가져옵니다.

스토리지 매개변수(인증 정보, 세션 토큰, 엔드포인트, 리전, 주소 지정 방식, Hadoop 설정)는 Paimon Catalog에 전달되지 않습니다. 대신 Doris 자체 스토리지 매개변수 이름으로 변환되어 Doris 스토리지 계층에서 적용됩니다. 이 설정은 FE의 매니페스트 읽기와 BE의 데이터 파일 읽기에 모두 사용되며, 스토리지 계층을 통해야 양쪽에 동일한 설정을 제공할 수 있기 때문입니다. 매핑은 다음과 같습니다.

| Paimon 매개변수 | Doris 스토리지 매개변수 |
| --- | --- |
| `s3.access-key` / `s3.access.key` / `fs.s3a.access.key` | `s3.access_key` |
| `s3.secret-key` / `s3.secret.key` / `fs.s3a.secret.key` | `s3.secret_key` |
| `s3.session-token` / `s3.session.token` / `fs.s3a.session.token` | `s3.session_token` |
| `s3.endpoint` / `fs.s3a.endpoint` | `s3.endpoint` |
| `s3.region` / `fs.s3a.endpoint.region` | `s3.region` |
| `s3.path-style-access` / `s3.path.style.access` / `fs.s3a.path.style.access` | `use_path_style` |
| `fs.oss.accessKeyId` | `oss.access_key` |
| `fs.oss.accessKeySecret` | `oss.secret_key` |
| `fs.oss.endpoint` | `oss.endpoint` |
| `fs.obs.access.key` / `fs.obs.access-key` | `obs.access_key` |
| `fs.obs.secret.key` / `fs.obs.secret-key` | `obs.secret_key` |
| `fs.obs.endpoint` | `obs.endpoint` |

HDFS HA 및 Kerberos 설정 등 `fs.`, `dfs.`, `hadoop.`으로 시작하는 다른 매개변수도 원래 이름 그대로 Doris 스토리지 계층에 전달됩니다.

`fluss.lake.paimon.metastore`에는 `filesystem`(기본값), `hive`, `rest`를 사용할 수 있습니다. Hive Metastore 주소나 REST 인증 설정 등의 다른 매개변수는 [Paimon Catalog](./paimon-catalog.mdx)와 같은 방식으로 작성합니다.

`ALTER CATALOG`는 속성을 설정할 수만 있으며 제거할 수는 없습니다. `fluss.lake.paimon.*` 재정의를 해제하려면 빈 문자열로 설정하세요. 그러면 Doris가 Fluss 클러스터에서 보고한 설정을 다시 사용합니다.

```sql
ALTER CATALOG fluss SET PROPERTIES ('fluss.lake.paimon.warehouse' = '');
```

하나의 Fluss Catalog는 단일 레이크 설정 집합으로 레이크 테이블을 읽습니다. Fluss 클러스터에서 `datalake.paimon.*`를 변경한 후에는 Doris가 새 설정을 불러오도록 Catalog를 삭제하고 다시 생성하세요. `REFRESH CATALOG`는 메타데이터 캐시만 지우며 레이크 설정은 다시 불러오지 않습니다.

### 쿼리 프로파일 {#query-profile}

<!-- Knowledge Type: Performance Diagnostics -->

하나의 Fluss 스캔에서 Fluss 로그, Paimon 레이크, 레이크 데이터를 덮어쓰는 로그 테일을 읽을 수 있으며, 필터링도 수행해야 합니다. 따라서 프로파일은 읽기 경로별, 범위 타입별로 시간과 행 수를 보고하여 어느 작업에 시간이 소요되는지 보여 줍니다.

```text
TableReader
├── FlussLogReadTime            8s25ms      Total time on the Fluss side (JNI)
│   ├── FlussPkTailRangeNum          2      Only the range types actually read in this scan are registered
│   ├── FlussPkTailRangeReadTime  6s2ms
│   └── FlussLogRowsReturned         2
├── FlussLakeReadTime           8s25ms      Total time on the Paimon side, including tail reads and filtering
│   ├── FlussLakeRangeNum            1
│   ├── FlussLakeSuppressRangeNum    2
│   └── FlussLakeRowsReturned        7      Rows after filtering; add FlussUnionSuppressedRows to get the count before filtering
├── FlussUnionTailReadTime      5s20ms      One round trip to Fluss per bucket
└── FlussUnionSuppressTime      16.1us      Filtering per block, grows with the number of lake rows
```

각 측의 총 시간에서 해당 범위 타입별 시간을 빼면 리더 초기화 비용(JNI 클래스 로딩 또는 Paimon 읽기 스택 설정)을 알 수 있습니다. 로그 테이블만 읽는 쿼리의 프로파일에는 레이크나 기본 키 카운터가 없습니다.

레이크 스플릿을 읽는 스캔에는 `TableReader` 아래에 다음 카운터도 있습니다. 기본 키 테이블에서 Union Read를 수행하면 이 카운터에 값이 기록됩니다.

| 카운터 | 의미 |
| --- | --- |
| `FlussUnionSuppressedRows` | 로그 테일에서 업데이트하거나 삭제하여 제외된 레이크 행 수입니다. |
| `FlussUnionTailKeysRead` | 로그 테일에서 읽은 변경 로그 레코드 수입니다. |
| `FlussUnionTailKeysRetained` | 레이크 행을 필터링하기 위해 메모리에 유지한 고유 기본 키 수입니다. |
| `FlussUnionTailCacheHitCount` | 이미 읽은 로그 테일을 재사용한 레이크 스플릿 수입니다. 하나의 BE에서는 같은 버킷의 레이크 스플릿들이 한 번 읽은 로그 테일을 공유합니다. |

Fluss에서 읽는 부분은 JNI 리더를 거치며, 해당 카운터는 `fluss` 노드에 있습니다. 이 노드는 `TableReader` 아래에 있으며 프로파일의 DetailProfile 부분에만 표시됩니다. 다음 카운터는 연결 및 JVM 힙과 관련이 있습니다.

| 카운터 | 의미 |
| --- | --- |
| `FlussJniConnectionsOpened` | 읽기를 위해 연 Fluss 연결 수입니다. BE는 유휴 연결을 재사용하므로, 쿼리를 곧바로 다시 실행하면 대개 0으로 표시됩니다. |
| `JvmHeapDeclaredBytes` | JNI heap admission이 켜져 있을 때 리더가 점유하겠다고 신고한 JVM 힙 용량입니다. 기본 키 테이블 전체 읽기와 기본 키 테이블의 Union Read 로그 테일만 신고하며, 다른 읽기는 0으로 표시됩니다. BE JVM 힙 메모리를 참조하세요. |
| `JvmHeapWaitTime` | JNI heap admission이 켜져 있을 때 리더가 JVM 힙을 확보하기 위해 대기열에서 기다린 시간입니다. BE JVM 힙 메모리를 참조하세요. |

Paimon JNI를 통해 레이크 스플릿을 읽으면 같은 이름의 JVM 힙 카운터가 `paimon` 노드 아래에 표시됩니다.

## 쿼리 성능 {#query-performance}

<!-- Knowledge Type: Architecture Principles + Performance Tuning -->
<!-- Use Case: Performance tuning / Checking whether a query uses the native reader or JNI -->

BE에는 Fluss 테이블을 읽는 두 가지 경로가 있으며, 비용 차이가 큽니다.

- C++ 네이티브 리더. BE가 Paimon Catalog와 동일한 리더를 사용하여 Paimon 레이크의 ORC/Parquet 파일을 직접 읽습니다. JVM을 거치지 않으며 Doris [파일 캐시](../data-cache.md)를 사용할 수 있습니다.
- JNI 리더. BE가 JNI를 통해 Fluss Java SDK를 호출하여 Fluss 자체 데이터를 읽습니다. 로그, KV 스냅샷, 변경 로그는 이 방식으로만 읽을 수 있습니다. 배치마다 Java 객체를 Doris 컬럼형 블록으로 변환해야 하므로 네이티브 리더보다 훨씬 느립니다. 이러한 읽기 중 일부는 JVM 힙도 많이 점유합니다. BE JVM 힙 메모리를 참조하세요.

어떤 경로를 사용하는지는 스캔 범위의 타입에 따라 결정되며, 이는 `flussScan` 행의 카운터에 해당합니다. 이 행은 `EXPLAIN`에서 확인할 수 있습니다.

| 읽는 데이터 | EXPLAIN 카운터 | 읽기 경로 |
| --- | --- | --- |
| 로그 테이블의 로그 | `logRanges` | JNI |
| 기본 키 테이블 전체 읽기(KV 스냅샷 + 변경 로그) | `pkRanges` | JNI |
| Union Read에서 기본 키 테이블의 로그 테일 | `pkTailRanges` | JNI |
| Union Read에서 로그 테이블의 레이크 스플릿 | `lakeSplits` | C++ 네이티브 리더 |
| Union Read에서 기본 키 테이블의 레이크 스플릿 | `lakeSplits`, `suppressedLakeSplits` | Paimon Catalog 규칙에 따라 결정됩니다. 아래를 참조하세요. 로그 테일의 기본 키로 레이크 행을 필터링하는 작업은 BE의 C++에서 수행합니다 |

`tbl$lake`는 Paimon Connector가 직접 계획하므로 해당 `EXPLAIN`에는 `flussScan` 행이 없습니다. 대신 `paimonNativeReadSplits=N/M`이 표시되며, 이는 M개의 스플릿 중 N개가 네이티브 리더를 사용한다는 의미입니다. 프로파일에도 Fluss 카운터가 없습니다.

레이크 스플릿은 Paimon Connector가 계획하며, 네이티브 리더 사용 여부는 일반 Paimon 테이블과 같은 규칙을 따릅니다.

- 로그 테이블은 Paimon append 테이블로 티어링됩니다. 모든 스플릿이 파일을 직접 읽으므로 전부 네이티브 리더를 사용합니다.
- 기본 키 테이블은 Paimon 기본 키 테이블로 티어링됩니다. 이미 컴팩션되었고 다른 파일과 병합할 필요가 없는 스플릿은 네이티브 리더를 사용합니다. 방금 기록되어 아직 컴팩션되지 않은 파일과, 파일 간 키 범위가 겹쳐 merge-on-read가 필요한 스플릿은 Paimon JNI 리더를 사용합니다.
- 세션 변수 `force_jni_scanner = true`는 모든 레이크 스플릿을 JNI로 읽게 합니다. 문제 해결 시에만 사용하세요.

티어링된 테이블에서 Union Read를 사용하면 레이크에 있는 부분(일반적으로 데이터의 대부분)은 네이티브 리더를 거치고, 티어링 오프셋 이후의 적은 로그만 JNI를 거칩니다. 티어링이 더 신속하게 수행될수록(`table.datalake.freshness`가 작을수록) JNI를 거치는 데이터가 줄어듭니다. 이러한 이유로 티어링된 테이블은 기본적으로 Union Read를 사용합니다. 다음 사항을 권장합니다.

- 과거 데이터를 분석하고 최신성이 크게 중요하지 않다면 `tbl$lake`를 직접 쿼리하세요. Fluss 로그를 완전히 건너뜁니다. 이 경우 로그 테이블은 전부 네이티브 리더로 읽고, 기본 키 테이블은 위의 Paimon 규칙을 따릅니다.
- `fluss.union_read.mode = disabled`는 테이블 전체를 JNI로 읽게 합니다. 문제 해결 목적 외에는 권장하지 않습니다.
- `auto` 모드가 대체 읽기로 전환되면(`degraded=`가 `EXPLAIN`에 표시됨) Fluss에서 읽는 모든 데이터도 JNI를 거칩니다. 레이크에만 존재하는 파티션만 계속 레이크에서 읽습니다. `key-type`과 `partition-type` 사례에 주의하세요. 이들은 테이블 스키마에 의해 결정되므로 테이블 정의를 변경해야만 해결할 수 있습니다.
- 기본 키 테이블의 Union Read는 각 BE에서 버킷마다 로그 테일의 기본 키를 한 번 더 읽습니다(프로파일의 `FlussUnionTailReadTime`). 같은 BE에서 해당 버킷의 다른 레이크 스플릿은 이를 재사용합니다. 테일이 길수록 비용이 커집니다.

쿼리가 사용한 경로를 확인하려면 `lakeSplits`와 `logRanges`, `pkRanges`, `pkTailRanges`를 `EXPLAIN`에서 비교하고, 프로파일에서 `FlussLakeReadTime`과 `FlussLogReadTime`을 비교하세요.

## BE JVM 힙 메모리 {#be-jvm-heap-memory}

<!-- Knowledge Type: Capacity Planning + Configuration Parameters + Troubleshooting -->
<!-- Use Case: OutOfMemoryError when querying primary-key tables / Sizing the BE JVM heap / Turning on JNI heap admission -->

BE는 JNI를 통해 Fluss 자체 데이터를 읽으며, 병합이 필요한 레이크 Paimon 스플릿도 JNI를 거칩니다(쿼리 성능 참조). 이 리더들은 모두 BE에 내장된 JVM에서 실행되며, 다른 Catalog의 JNI 읽기 및 Java UDF와 하나의 힙을 공유합니다. 힙 크기는 `-Xmx`로 설정하며, 이는 `JAVA_OPTS_FOR_JDK_17`에 지정합니다. 해당 옵션은 `be.conf`에 있으며 기본값은 2 GB(`-Xmx2048m`)입니다.

로그 테이블의 로그 읽기처럼 대부분의 읽기는 데이터를 스트리밍하며 몇 MB의 힙만 점유합니다. 아래 세 가지 읽기는 다릅니다. 첫 번째 배치를 반환하기 전에 데이터 일부를 힙에 올리고 읽기가 끝날 때까지 유지합니다.

| 읽는 데이터 | 점유하는 힙 |
| --- | --- |
| Fluss에서 기본 키 테이블 전체 읽기(`pkRanges`, `EXPLAIN`에 표시) | 버킷의 최신 KV 스냅샷 이후 변경 로그를 메모리에 올리고 기본 키로 병합합니다. 스냅샷 이후 변경이 많을수록 더 많은 힙이 필요합니다. |
| 기본 키 테이블의 Union Read 로그 테일(`pkTailRanges`) | 테일에 있는 각 기본 키의 최신 행입니다. 테일이 길수록 더 많은 힙이 필요합니다. |
| 병합이 필요한 레이크 Paimon 스플릿(아직 컴팩션되지 않은 Paimon 기본 키 테이블) | 병합 중인 각 파일의 행 그룹 하나입니다. 단일 스플릿이 수백 MB를 사용할 수 있습니다. |

쿼리는 여러 스캔 범위를 병렬로 읽습니다. 각 스캔 인스턴스는 `max_file_scanners_concurrency`(기본값 16)개까지 리더를 동시에 실행하며, 하나의 BE에서 여러 인스턴스와 여러 쿼리가 동시에 읽을 수 있습니다. 이처럼 힙을 많이 사용하는 리더가 몇 개만 함께 열려도 힙이 가득 차 쿼리가 실패할 수 있습니다. 오류 메시지에는 힙 크기와 해결 방법이 표시됩니다.

```text
errCode = 2, detailMessage = (10.0.0.3)[JNI_ERROR]OutOfMemoryError: Java heap space. BE's JVM is out of heap. Its maximum is 2048 MB, the -Xmx in JAVA_OPTS_FOR_JDK_17 of be.conf: raise it and restart the BE, or have the statement hold less of the heap at once - read with fewer scanners by setting max_file_scanners_concurrency below its default of 16, or set enable_jni_heap_admission = true to have JNI readers wait for room by the heap they declare. A statement that ran out of heap frees it only once its scanners have exited
```

### 힙 부족 해결 {#handling-insufficient-heap}

다음과 같은 방법으로 해결할 수 있습니다.

1. JVM에 더 많은 힙을 할당합니다. `-Xmx`를 변경하세요. 이 옵션은 `JAVA_OPTS_FOR_JDK_17`에 있으며, `be.conf`에서 수정하고 BE를 재시작하면 적용됩니다. 기본 키 테이블을 자주 쿼리하는 클러스터라면 이 방법을 먼저 고려하세요. JVM 힙도 BE가 실행되는 머신의 메모리를 사용하므로 늘리기 전에 머신에 충분한 메모리가 있는지 확인하세요.
2. 동시에 여는 리더 수를 줄입니다. `max_file_scanners_concurrency`를 낮추면 동시에 열리는 리더가 줄어 힙 점유량이 감소하지만 읽기 속도가 느려집니다.

    ```sql
    SET max_file_scanners_concurrency = 4;
    -- For a single statement only
    SELECT /*+ SET_VAR(max_file_scanners_concurrency=4) */ * FROM fluss.db.tbl;
    ```

3. JNI heap admission을 켜서 이러한 리더가 점유할 힙에 따라 대기열에서 기다리도록 합니다. 아래를 참조하세요.
4. 힙에 올려야 하는 데이터를 줄입니다. Fluss가 KV 스냅샷을 더 자주 생성할수록(Fluss 클러스터의 `kv.snapshot.interval`) 스냅샷 이후 변경 로그가 짧아집니다. 티어링이 더 신속하게 수행될수록(`table.datalake.freshness`) 로그 테일이 짧아집니다. 레이크 Paimon 기본 키 테이블의 컴팩션이 끝나면 해당 스플릿은 병합이 필요 없어 네이티브 리더를 거치며 JVM 힙을 사용하지 않습니다.

### JNI Heap Admission {#jni-heap-admission}

세션 변수 `enable_jni_heap_admission`(기본값 `false`)을 켜면, FE는 계획 단계에서 위의 세 가지 리더가 각각 점유할 힙을 추정하고 스캔 범위와 함께 BE에 전달합니다. BE는 열어 둔 리더가 신고한 힙의 총량을 추적합니다. 이 총량에 새 리더의 신고량을 더한 값이 최대 JVM 힙의 `jni_scanner_heap_budget_ratio` 비율 이내일 때만 새 리더를 엽니다. 여기서 최대 JVM 힙은 `-Xmx`입니다. 그렇지 않으면 앞선 리더가 작업을 마치고 닫혀 자신의 할당분을 반환할 때까지 해당 리더가 대기열에서 기다립니다.

```sql
SET enable_jni_heap_admission = true;
-- For a single statement only
SELECT /*+ SET_VAR(enable_jni_heap_admission=true) */ * FROM fluss.db.tbl;
```

이 변수를 켜면 다음과 같이 동작합니다.

- 위의 세 가지 리더만 힙을 신고하고 대기합니다. 로그 테이블의 로그와 네이티브 리더가 읽는 레이크 스플릿은 아무것도 신고하지 않으며, 변수의 활성화 여부에 관계없이 속도가 같습니다.
- 리더에 대기 시간만 추가될 수 있습니다. 쿼리 결과는 바뀌지 않습니다.
- 리더는 도착 순서대로 기다리므로, 신고량이 큰 리더가 나중에 도착한 작은 리더들에 계속 밀리지 않습니다. 할당분을 점유한 리더가 없으면 다음 리더는 항상 통과시킵니다. 따라서 전체 예산보다 많은 양을 신고한 리더도 열릴 수 있으며, 이 경우 단독으로 실행됩니다.
- 리더는 최대 `jni_scanner_heap_max_wait_ms`(기본값 60초) 동안 기다립니다. 이 시간이 지나면 대기를 중단하고 열립니다.
- 예산은 BE별로 관리되며, 해당 BE에서 이 변수를 켠 모든 쿼리가 공유합니다. 변수를 켜지 않은 쿼리는 신고하거나 기다리지 않으며 예산에도 포함되지 않습니다. 여러 쿼리가 동시에 기본 키 테이블을 읽을 때는 `SET GLOBAL enable_jni_heap_admission = true`를 사용하여 모든 세션에서 켜세요.
- 이 변수는 [Paimon Catalog](./paimon-catalog.mdx)에서 JNI를 통해 읽는 스플릿에도 적용됩니다.

관련된 두 BE 설정 항목은 모두 런타임에 변경할 수 있습니다. 변경 방법은 [BE 설정](../../admin-manual/config/be-config.md)을 참조하세요.

| 설정 항목 | 기본값 | 설명 |
| --- | --- | --- |
| `jni_scanner_heap_budget_ratio` | `0.5` | 열린 리더가 합계로 신고할 수 있는 최대 JVM 힙의 비율입니다. 나머지 힙은 신고하지 않는 리더, Java UDF처럼 JVM을 사용하는 다른 BE 기능, 읽기 중의 일시적인 사용량 급증에 필요하므로 너무 높게 설정하지 마세요. |
| `jni_scanner_heap_max_wait_ms` | `60000` | 리더가 대기열에서 기다리는 최대 시간(밀리초)입니다. 이 시간이 지나면 조건에 관계없이 열립니다. |

프로파일의 `JvmHeapDeclaredBytes`와 `JvmHeapWaitTime`(쿼리 프로파일 참조)은 리더가 신고한 힙 용량과 대기 시간을 기록합니다. `JvmHeapWaitTime`이 자주 높게 나타난다면 예산이 너무 작은 것이므로 `-Xmx`를 늘리는 것을 고려하세요.

신고량은 추정치이므로 이 변수는 기본적으로 꺼져 있습니다.

- 문자열, 바이너리, 중첩 타입의 값은 모두 64바이트로 추정합니다. 문자열 컬럼의 JSON이나 긴 문자열 기본 키처럼 값이 더 긴 테이블에서는 리더가 신고량보다 많은 힙을 점유합니다. Admission은 이를 막을 수 없으므로 쿼리가 여전히 `OutOfMemoryError`로 실패할 수 있습니다.
- Paimon 병합 읽기에서는 짧은 순간에 사용량이 신고량의 몇 배까지 치솟을 수 있습니다. 예산 외의 힙 공간이 이러한 순간적인 사용량을 수용할 수 있어야 합니다.
- 로그에서 같은 기본 키가 여러 번 업데이트되면 신고량이 리더의 실제 점유량보다 커지므로, 리더가 필요 이상으로 오래 기다려 쿼리가 느려질 수 있습니다.

### 힙이 고갈된 후 {#after-the-heap-runs-out}

- `OutOfMemoryError`가 발생한 쿼리는 실패하고 BE 프로세스는 계속 실행됩니다.
- 해당 쿼리가 점유한 힙은 모든 리더가 종료된 후에야 해제됩니다. 그 전에 실행한 쿼리는 `Failed to attach the current thread to the JVM, code=-1` 오류로 실패할 수 있으며, 뒤에 위와 같은 해결 안내가 표시됩니다. 잠시 기다린 후 다시 시도하세요.
- 힙이 고갈되면 Fluss 클라이언트의 일부 백그라운드 스레드가 함께 종료되고 다시 시작되지 않을 수 있어, 일부 Fluss 읽기가 무기한 멈출 수 있습니다. 이 스레드와 해당 스레드가 점유한 메모리는 BE를 재시작해야 해제됩니다. JVM 힙이 고갈된 후에는 적절한 시점에 BE를 재시작하세요.
- JVM 힙이 고갈되는 즉시 BE를 종료하고 외부 프로세스 관리자가 다시 시작하게 하려면 `-XX:+ExitOnOutOfMemoryError`를 `JAVA_OPTS_FOR_JDK_17`에 추가하세요. 이 경우 해당 BE에서 실행 중인 모든 쿼리와 데이터 적재 작업이 실패합니다.

## 제한 사항 {#limitations}

<!-- Knowledge Type: Limitations -->

- 읽기 전용입니다. `INSERT`, `UPDATE`, `DELETE`를 지원하지 않으며, `CREATE TABLE`, `DROP TABLE` 같은 데이터베이스 및 테이블 관리 구문도 지원하지 않습니다.
- 레이크 포맷은 Paimon만 지원합니다. 테이블의 `table.datalake.format`이 다른 값이면 `tbl$lake`가 실패합니다. 이러한 테이블에 읽기 가능한 레이크 스냅샷이 생기면 테이블 자체에 대한 쿼리도 `auto`와 `required` 모드에서 실패합니다. Fluss의 데이터를 읽으려면 Union Read 모드를 `disabled`로 설정하세요.
- Fluss의 `TIME` 타입은 `UNSUPPORTED`로 매핑되며, 해당 컬럼은 쿼리할 수 없습니다.
- 조건자는 Fluss로 푸시다운되지 않습니다. 파티션 프루닝을 제외하면 Doris는 Fluss에서 데이터를 읽은 후 필터링합니다. 레이크의 경우 스플릿 계획 시 필터를 Paimon에 전달하며, Paimon은 이를 사용하여 파티션과 데이터 파일을 건너뜁니다. 컬럼 프루닝과 중첩 타입의 하위 컬럼 프루닝을 모두 지원합니다.
- `tbl$lake`를 포함하여 시간 여행 쿼리와 증분 쿼리는 지원하지 않습니다.
- Fluss는 테이블 수준 행 수만 제공하며, 컬럼 수준 통계는 제공하지 않습니다.

## 자주 묻는 질문 {#faq}

<!-- Knowledge Type: Troubleshooting -->
<!-- Use Case: Missing Paimon plugin / Object storage credentials / Lake snapshot not ready / Lake table not found / Lake configuration changed / Expired log tail / Unsupported partition column type / Partition matching failure / Insufficient JVM heap -->

1. 티어링된 레이크 테이블을 쿼리하면 `the paimon connector plugin is not available` 오류로 실패합니다

    레이크 데이터는 Paimon Connector 플러그인이 읽습니다. FE 배포 디렉터리 아래의 `plugins/connector/paimon` 디렉터리에 필요한 파일이 모두 있는지 확인하세요.

2. `tbl$lake` 쿼리 또는 Union Read가 객체 스토리지 접근 오류로 실패합니다

    Fluss는 스토리지 인증 정보를 전달하지 않습니다. Catalog에서 `fluss.lake.paimon.*`를 사용하여 설정하세요. 레이크 연결 설정을 참조하세요.

3. `has no readable lake snapshot yet` 오류가 발생합니다

    티어링 서비스가 아직 레이크에 데이터를 커밋하지 않았습니다. 테이블 자체에 대한 쿼리는 `required` 모드에서만 이 오류를 보고합니다. 티어링 서비스가 커밋할 때까지 기다리거나 `auto`로 전환하세요. `tbl$log` 쿼리는 모든 모드에서 이 오류를 보고합니다. `tbl$log`는 레이크 스냅샷부터 시작하기 때문입니다. 대신 테이블 자체를 쿼리하세요.

4. `tbl$lake`가 `nothing has been tiered` 오류로 실패합니다

    Doris가 현재 레이크 연결 설정으로 레이크 테이블을 찾을 수 없습니다. Fluss 1.0은 Fluss 테이블과 함께 레이크 테이블을 생성하므로, 일반적으로 `fluss.lake.paimon.warehouse` 등의 설정이 Fluss 클러스터가 기록하는 웨어하우스를 가리키지 않는다는 의미입니다. 레이크 연결 설정을 참조하세요.

5. `is already serving lake tables with a different paimon configuration` 오류가 발생합니다

    Catalog가 레이크 테이블을 읽기 시작한 후 Fluss 클러스터의 `datalake.paimon.*` 설정이 변경되었습니다. Catalog를 삭제하고 다시 생성하세요. `REFRESH CATALOG`는 레이크 설정을 다시 불러오지 않습니다.

6. `Part of the log tail has expired` 오류가 발생합니다

    로그 테이블의 Union Read 또는 `tbl$log` 쿼리에는 레이크 스냅샷 이후의 로그가 필요하지만, 그중 일부가 Fluss TTL에 의해 이미 삭제되었습니다. Fluss가 더 새로운 읽기 가능한 레이크 스냅샷을 게시할 때까지 기다리세요. Union Read 모드를 참조하세요.

7. `cannot be read: its partition column 'xx' has fluss type TIMESTAMP(3)` 오류가 발생합니다

    Doris는 해당 타입의 파티션 컬럼을 읽을 수 없습니다. 파티션 테이블을 참조하세요.

8. `cannot be matched safely to a live fluss partition` 오류가 발생합니다

    기본 키 테이블이 `STRING`이 아닌 컬럼으로 파티션되어 있으며, 레이크에 Doris가 Fluss 파티션과 연결할 수 없는 파티션이 있습니다. 예를 들어 Fluss에서 이미 삭제한 파티션일 수 있습니다. Union Read 모드의 `partition-type` 사례를 참조하세요. Fluss에 남아 있는 데이터를 읽으려면 Union Read 모드를 `disabled`로 설정하세요.

9. `OutOfMemoryError: Java heap space` 오류가 발생하며 메시지에 `BE's JVM is out of heap`이 표시됩니다

    BE의 JVM 힙이 가득 찼습니다. 주로 기본 키 테이블 읽기, 기본 키 테이블의 Union Read, 또는 병합이 필요한 많은 레이크 Paimon 스플릿을 읽을 때 발생합니다. `-Xmx`를 늘리거나, `max_file_scanners_concurrency`를 낮추거나, `enable_jni_heap_admission`을 켜세요. BE JVM 힙 메모리를 참조하세요. 힙이 고갈된 후에는 적절한 시점에 BE를 재시작하세요.

10. `Failed to attach the current thread to the JVM, code=-1` 오류가 발생합니다

    일반적으로 JVM 힙이 고갈된 직후에 발생합니다. `OutOfMemoryError`로 실패한 쿼리의 리더가 아직 모두 종료되지 않아 해당 쿼리의 힙이 해제되지 않은 상태입니다. 잠시 기다린 후 다시 시도하세요. BE JVM 힙 메모리를 참조하세요.

## 디버깅 {#debugging}

<!-- Knowledge Type: Debugging Environment -->

Doris 코드베이스의 `docker/thirdparties/docker-compose/fluss` 디렉터리에는 회귀 테스트에서 사용하는 Fluss 환경이 있으며, Fluss, Flink, Paimon 티어링 서비스, MinIO로 구성됩니다. 해당 디렉터리의 README에 따라 환경을 구성하고 기능을 검증하세요.

## 참고 자료 {#references}

- [Apache Fluss 문서](https://fluss.apache.org/docs/)
- [Fluss Lakehouse Storage](https://fluss.apache.org/docs/maintenance/tiered-storage/lakehouse-storage/)
- [Paimon Catalog](./paimon-catalog.mdx)
