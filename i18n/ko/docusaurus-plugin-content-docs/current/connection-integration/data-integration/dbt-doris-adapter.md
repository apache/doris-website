---
{
    "title": "dbt 어댑터",
    "sidebar_label": "dbt 어댑터",
    "language": "ko",
    "description": "dbt-for-apache-doris 1.1.1을 설치하고 모델, External Catalog 소스, Iceberg 대상, 비동기 구체화된 뷰를 구성합니다.",
    "keywords": [
        "Apache Doris dbt",
        "dbt Doris 어댑터",
        "dbt-for-apache-doris",
        "dbt Doris 프로필",
        "Doris 데이터 변환",
        "Doris 증분 모델",
        "Doris insert_overwrite",
        "Doris microbatch",
        "Doris 소스 최신성",
        "Doris 비동기 구체화된 뷰",
        "dbt External Catalog",
        "dbt debug 연결 오류"
    ]
}
---

<!-- Knowledge Type: Integration Guide / Capability Definition -->
<!-- Use Case: Apache Doris data transformation with dbt / ELT modeling -->

[dbt](https://docs.getdbt.com/docs/introduction)는 ELT(추출, 데이터 적재, 변환) 워크플로의 변환 단계를 관리합니다. `dbt-for-apache-doris` 어댑터는 dbt 모델을 Doris SQL로 컴파일하고, Doris Frontend(FE)의 MySQL 쿼리 포트를 통해 테이블 생성, 변환, 테스트, 문서화 작업을 실행합니다.

소스 데이터는 Internal Catalog 테이블이나 구성된 External Catalog를 통해 Doris에서 이미 쿼리할 수 있어야 합니다. 어댑터는 변환을 수행하며, 소스 데이터를 수집하거나 동기화하지 않습니다.

:::caution

`dbt-for-apache-doris`는 VeloDB에서 제공하고 유지 관리합니다. Apache Doris 프로젝트의 일부가 아니며, Apache Doris 커뮤니티에서 릴리스하거나 보증하지 않습니다. 프로덕션에서 사용하기 전에 어댑터를 평가하고, 패키지의 무결성과 릴리스 정보를 확인하며, 타사 프로젝트의 라이선스를 준수하세요. 어댑터 관련 문제는 [`dbt-for-apache-doris` 프로젝트](https://github.com/velodb/dbt-for-apache-doris/issues)에 보고하세요.

:::

<!-- Knowledge Type: Version Requirements / Environment Requirements / Released Versions -->
<!-- Use Case: Pre-installation version check / Environment preparation / Release lookup -->

## 환경 요구 사항 {#environment-requirements}

| 구성 요소 | 요구 사항 |
| --- | --- |
| Python | 3.10 이상 |
| dbt Core | 1.12.x(어댑터와 함께 설치됨) |

## 릴리스 버전 {#released-versions}

| 버전 |
| --- |
| [1.1.1](https://github.com/velodb/dbt-for-apache-doris/releases/tag/v1.1.1) |
| [1.1.0](https://github.com/velodb/dbt-for-apache-doris/releases/tag/v1.1.0) |

<!-- Knowledge Type: Operational Steps -->
<!-- Use Case: Adapter installation / Installation verification -->

## 설치 {#installation}

다음 명령은 공개된 [`v1.1.1` 릴리스](https://github.com/velodb/dbt-for-apache-doris/releases/tag/v1.1.1)를 설치 예제로 사용합니다. 다른 릴리스를 설치하려면 `pip` 요구 사항의 버전을 바꾸세요.

격리된 Python 환경에서 PyPI의 어댑터를 설치합니다.

```shell
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install "dbt-for-apache-doris==1.1.1"
dbt --version
```

Windows PowerShell에서는 다음 명령을 사용합니다.

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install "dbt-for-apache-doris==1.1.1"
dbt --version
```

이 예제에서는 `Plugins` 섹션을 `dbt --version` 출력에서 확인하면 `doris: 1.1.1`이 포함되어 있어야 합니다. dbt Core와 MySQL Connector/Python은 종속성으로 설치됩니다.

<!-- Knowledge Type: Operational Steps / Minimal Example -->
<!-- Use Case: Connect dbt to Doris / Validate an end-to-end model build -->

## 연결 구성 {#configure-the-connection}

dbt 프로젝트를 생성합니다.

```shell
dbt init doris_demo
cd doris_demo
```

`~/.dbt/profiles.yml`에 Doris 출력을 추가합니다. 자격 증명은 버전 관리 대상에 포함하지 마세요. 이 예제는 환경 변수에서 비밀번호를 읽습니다.

```yaml
doris_demo:
  target: dev
  outputs:
    dev:
      type: doris
      host: 127.0.0.1
      port: 9030
      username: dbt_user
      password: "{{ env_var('DORIS_PASSWORD') }}"
      schema: analytics
      threads: 4
```

| 설정 | 권장 값 | 동작 |
| --- | --- | --- |
| `type` | 반드시 `doris`로 설정 | Doris 어댑터 선택 |
| `host` | Doris FE 주소를 명시적으로 설정 | 생략하면 내부 자격 증명에서 `127.0.0.1`을 사용합니다. `dbt init`에는 기본 입력값이 없습니다 |
| `port` | 일반적으로 `9030` | 생략하면 기본값은 `9030`입니다. HTTP 포트가 아닌 FE 쿼리 포트입니다 |
| `username` | 전용 Doris 사용자를 명시적으로 설정 | 생략하면 내부 자격 증명에서 `root`를 사용합니다. `dbt init`에는 기본 입력값이 없습니다 |
| `password` | 환경 변수에서 읽기 | 기본값은 빈 문자열입니다 |
| `schema` | 대상 Doris 데이터베이스 설정 | `dbt init` 프롬프트의 기본값은 `dbt`이며, 내부 자격 증명의 기본값은 `None`입니다 |
| `threads` | FE와 워크로드의 처리 용량에 맞게 설정 | `dbt init` 프롬프트의 기본값은 `1`입니다 |
| `database` | Internal Catalog에서는 생략하고, 외부 대상에서는 기존 Doris Catalog로 설정 | v1.1.1에서는 Doris Catalog에 매핑됩니다 |

v1.1.1에서 dbt의 `database.schema.identifier`는 Doris의 `catalog.database.table`에 매핑됩니다. Internal Catalog에서는 `database`를 생략하고 `schema`를 Doris 데이터베이스로 설정합니다. 외부 대상에서는 `database`를 기존 Doris Catalog로, `schema`를 해당 Catalog의 데이터베이스로 설정합니다. 대상 데이터베이스가 없으면 어댑터는 Catalog에서 지원하는 경우 생성을 시도할 수 있습니다. dbt 계정에는 소스 읽기 권한과 대상 객체 생성, 변경, 삭제, 쓰기 권한이 필요합니다. External Catalog의 쓰기 지원 여부는 Doris 커넥터에도 달려 있습니다.

`dbt_project.yml`이 동일한 프로필을 참조하는지 확인합니다.

```yaml
name: doris_demo
version: "1.0.0"
config-version: 2
profile: doris_demo

model-paths: ["models"]

models:
  doris_demo:
    +materialized: view
```

macOS 또는 Linux에서는 다음 명령으로 연결을 확인합니다.

```shell
export DORIS_PASSWORD='your_password'
dbt debug
```

Windows PowerShell에서는 다음 명령을 사용합니다.

```powershell
$env:DORIS_PASSWORD = 'your_password'
dbt debug
```

<!-- Knowledge Type: Operational Steps / Minimal Example -->
<!-- Use Case: Validate an end-to-end model build -->

## 첫 번째 모델 빌드 {#build-the-first-model}

다음 SQL은 이 예제의 소스 테이블을 생성합니다. 복제본 수 `1`은 BE가 하나인 개발 클러스터에만 적합합니다.

```sql
CREATE DATABASE IF NOT EXISTS raw;

CREATE TABLE IF NOT EXISTS raw.orders (
    order_id BIGINT,
    customer_id BIGINT,
    order_time DATETIME,
    amount DECIMAL(18, 2),
    status VARCHAR(20),
    updated_at DATETIME,
    is_valid BOOLEAN
)
DUPLICATE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO raw.orders VALUES
    (1, 101, '2026-08-01 10:00:00', 20.00, 'PAID', '2026-08-01 10:05:00', true),
    (2, 102, '2026-08-01 11:00:00', 35.00, 'PAID', '2026-08-01 11:05:00', true);
```

`models/sources.yml`에 소스를 선언합니다.

```yaml
version: 2

sources:
  - name: raw
    schema: raw
    tables:
      - name: orders
```

`models/fct_daily_sales.sql`을 생성합니다.

```sql
{{
  config(
    materialized='table',
    duplicate_key=['order_date'],
    distributed_by=['order_date'],
    buckets=1,
    properties={'replication_num': '1'}
  )
}}

select
    cast(order_time as date) as order_date,
    sum(amount) as sales_amount
from {{ source('raw', 'orders') }}
group by cast(order_time as date)
```

`models/schema.yml`에 데이터 테스트를 추가합니다.

```yaml
version: 2

models:
  - name: fct_daily_sales
    description: Daily sales summary
    columns:
      - name: order_date
        description: Order date
        data_tests:
          - not_null
          - unique
      - name: sales_amount
        description: Daily sales amount
        data_tests:
          - not_null
```

모델과 테스트를 실행합니다.

```shell
dbt build --select fct_daily_sales
```

빌드가 성공하면 `analytics.fct_daily_sales`가 생성됩니다. 프로덕션의 복제본 수와 버킷 수는 클러스터 배포 구성에 맞게 설정하세요.

소스가 다른 Doris 데이터베이스에 있으면 `schema`를 직접 설정하는 것이 좋습니다.

```yaml
sources:
  - name: finance
    schema: finance_raw
    tables:
      - name: payments
```

v1.1.1에서 소스의 `database`는 Doris Catalog 이름을 지정합니다. Internal Catalog의 다른 데이터베이스에서 읽으려면 위와 같이 `schema`만 설정합니다. v1.1.0에서 데이터베이스 간 소스 참조에 `database: finance_raw`를 사용한 프로젝트는 업그레이드 전에 해당 값을 `schema`로 옮겨야 합니다.

## v1.1.1의 External Catalog {#external-catalogs-in-v111}

어댑터는 External Catalog의 소스를 읽고, `dbt docs generate`에 사용할 테이블과 컬럼 정보를 조회할 수 있습니다. 먼저 Doris에서 Catalog를 생성한 후, 소스의 `database` 필드에 해당 이름을 지정합니다.

```yaml
sources:
  - name: lakehouse
    database: hive_catalog
    schema: ods
    tables:
      - name: orders
```

`{{ source('lakehouse', 'orders') }}`는 `hive_catalog.ods.orders`로 해석됩니다. `schema` 필드는 해당 Catalog 내부의 데이터베이스 이름을 지정합니다. 어댑터는 Catalog로 한정된 관계 이름을 지원하지만, Doris에서 수행할 수 있는 DDL과 쓰기 작업은 각 Catalog 커넥터가 결정합니다.

Iceberg 대상을 생성하려면 먼저 [쓰기 가능한 Iceberg Catalog를 구성](../../lakehouse/catalogs/iceberg-catalog)합니다. 기존 프로필 출력에 다음 필드를 설정합니다.

```yaml
database: iceberg_catalog
schema: analytics
```

`models/iceberg_sample.sql`을 생성합니다.

```sql
{{ config(materialized='table', engine='iceberg') }}

select cast(1 as int) as id
```

`INT`로 명시적으로 변환하면 Iceberg 컬럼 타입이 아닌 `TINYINT`로 추론되는 것을 방지할 수 있습니다.

`dbt run --select iceberg_sample`을 실행합니다. 그러면 `iceberg_catalog.analytics.iceberg_sample`이 생성됩니다. Catalog는 이미 존재해야 하며, 해당 데이터베이스는 이미 존재하거나 dbt가 생성할 수 있어야 하고, 대상은 쓰기가 가능해야 합니다. `engine='iceberg'`는 명시적인 엔진 절을 생성합니다. `engine`을 생략하면 Doris가 대상 Catalog에서 엔진을 추론합니다. Catalog 기반 추론은 Doris 4.1.3에서 검증되었습니다. 이전 Doris 릴리스에서는 명시적인 엔진 설정이 필요할 수 있습니다.

| Iceberg 대상 | v1.1.1 동작 |
| --- | --- |
| `table` | Iceberg 테이블을 생성합니다. 다시 실행하면 백업과 이름 변경을 통해 교체합니다 |
| `incremental` | 아래에 설명된 `append`, `merge`, `insert_overwrite`, `microbatch`를 지원합니다 |
| Seed와 Snapshot | 지원합니다. Snapshot 게시와 Seed 전체 새로 고침은 백업과 이름 변경을 사용합니다. 일반적인 재적재에서는 파티션이 없는 테이블에 INSERT OVERWRITE를 사용하고, 파티션이 있는 테이블에는 네이티브 MERGE를 사용하며 V2+가 필요합니다. V1 파티션 Seed에는 `dbt seed --full-refresh`를 사용하세요 |
| `view`와 `materialized_view` | 대상은 Internal Catalog에 있어야 합니다. Internal Catalog의 뷰와 구체화된 뷰는 External Catalog 소스를 쿼리할 수 있습니다 |

Iceberg의 `merge`, `microbatch`, 파티션 Seed 재적재에는 네이티브 Iceberg `MERGE INTO`를 지원하는 Doris 릴리스와 Iceberg V2 이상 테이블이 필요합니다. 이 경로들은 Doris 4.1.3에서 검증되었습니다. [Doris 문서에서는 Iceberg MERGE를 4.1.0부터 실험적 기능으로 설명합니다](../../lakehouse/catalogs/iceberg-catalog#merge-into). 외부 테이블 교체는 원자적이지 않습니다. 이름을 변경하는 사이에 잠시 해당 이름을 사용할 수 없으며, 실패하면 이전 테이블이 백업 이름으로 남을 수 있습니다. 프로덕션에서 사용하기 전에 격리된 테스트 프로젝트에서 Doris 릴리스, Catalog 커넥터, 복구 절차를 검증하세요.

어댑터는 테이블, 뷰, 증분 또는 구체화된 뷰 대상에 쓰기 전에 모델이나 컬럼의 `constraints` 선언을 거부합니다. 모델 계약은 여전히 컬럼 이름과 타입을 검사합니다. 쓰기 후에는 `data_tests`에 `not_null`과 같은 테스트를 사용하여 데이터를 검사하세요. 이러한 테스트는 데이터베이스에서 강제하는 제약 조건을 생성하지 않습니다.

[실행 가능한 다섯 가지 Doris 데모](https://github.com/velodb/dbt-for-apache-doris/tree/3fb9cc75f9dcdd756b472847728bbdf42fb3b128/examples/doris-demos)는 모델, 테스트, 데이터베이스 간 소스 참조, 증분 처리, Snapshot, 비동기 구체화된 뷰를 다룹니다. 데모 설정의 기본값은 `dbt-for-apache-doris==1.1.1`입니다.

<!-- Knowledge Type: Capability Reference / Configuration Parameters / Architecture Decision -->
<!-- Use Case: Materialization selection / Incremental processing / Materialized views -->

## 구체화 방식 {#materializations}

`dbt-for-apache-doris`는 다음 주요 구체화 방식을 지원합니다.

| 구체화 방식 | Doris 객체 또는 동작 | 사용 사례 |
| --- | --- | --- |
| `view` | Internal Catalog의 Doris 뷰 | 항상 최신 소스 데이터를 읽어야 하는 경량 변환 |
| `table` | 전체를 다시 빌드하는 Internal Catalog Duplicate Key 테이블 또는 쓰기 가능한 Iceberg 테이블 | 안정적인 쿼리 성능이 필요한 유한한 결과 집합 |
| `incremental` | 전략에 따라 데이터를 추가, upsert 또는 덮어쓰기 | 대용량 테이블의 증분 처리 |
| `materialized_view` | Internal Catalog의 Doris 비동기 구체화된 뷰 | Doris가 관리하는 새로 고침과 투명한 쿼리 재작성 |
| `ephemeral` | 다운스트림 모델의 CTE로 컴파일 | Doris 객체를 생성하지 않고 SQL 재사용 |

Seed와 Snapshot도 Doris 테이블을 생성할 수 있습니다. 어댑터는 현재 사용자 지정 `partition` 구체화 방식을 포함하지 않습니다. 파티션을 교체하려면 증분 `insert_overwrite`를 사용하세요. 아래 예제는 BE가 하나인 개발 클러스터에서도 실행할 수 있도록 `replication_num=1`을 유지합니다. 실제 배포에서는 프로덕션에 적합한 복제본 수를 사용하세요.

### 뷰 {#view}

```sql
{{ config(materialized='view') }}

select order_id, customer_id, amount
from {{ source('raw', 'orders') }}
where status = 'PAID'
```

실행할 때마다 뷰 정의를 업데이트합니다. 뷰는 데이터를 저장하지 않으며, 쿼리 비용은 뷰 SQL과 다운스트림 쿼리에 따라 달라집니다.

### 테이블 {#table}

```sql
{{
  config(
    materialized='table',
    duplicate_key=['event_date', 'event_id'],
    partition_by=['event_date'],
    partition_type='RANGE',
    partition_by_init=[
      "PARTITION p_before_202608 VALUES LESS THAN ('2026-08-01')",
      "PARTITION p202608 VALUES LESS THAN ('2026-09-01')",
      "PARTITION pmax VALUES LESS THAN (MAXVALUE)"
    ],
    distributed_by=['event_id'],
    buckets=16,
    properties={'replication_num': '1'}
  )
}}

select
    cast(order_time as date) as event_date,
    order_id as event_id,
    status as event_type
from {{ source('raw', 'orders') }}
```

Internal Catalog 대상에서 `table` 구체화 방식은 Duplicate Key 테이블을 생성하고 이후 실행 시 전체를 교체합니다. Iceberg 대상은 Doris OLAP 키나 기본 분산 방식을 사용하지 않습니다. 테이블 모델은 다음 테이블 생성 설정을 지원합니다.

| 설정 | 타입 및 기본값 | 설명 |
| --- | --- | --- |
| `duplicate_key` | 문자열 또는 목록, 선택 사항 | Duplicate Key 컬럼 |
| `partition_by` | 문자열 또는 목록, 선택 사항 | 파티션 컬럼 |
| `partition_type` | `RANGE` 또는 `LIST`, 기본값은 `RANGE` | `partition_by`와 함께 사용하는 파티션 타입 |
| `partition_by_init` | 문자열 목록, 선택 사항 | 테이블 생성 시 `partition_by`와 함께 사용하는 Doris 파티션 정의 |
| `distributed_by` | 문자열 또는 목록, 선택 사항 | 해시 분산 컬럼 |
| `buckets` | 양의 정수, Hash Distribution을 생성할 때 기본값은 `10` | 해시 버킷 수. `distributed_by`와 함께 사용할 때만 적용됩니다 |
| `replication_num` | 양의 정수 또는 숫자 문자열, 선택 사항 | 복제본 수. 최상위 설정이 `properties`의 동일한 키보다 우선합니다 |
| `properties` | 딕셔너리, 선택 사항 | Doris `PROPERTIES`에 렌더링되는 키-값 쌍 |

Duplicate Key, 파티션, 분산 컬럼은 모델 출력에 포함되어야 하며 Doris 테이블 생성 규칙을 준수해야 합니다. 어댑터는 `partition_by_init`과 `properties`를 `CREATE TABLE` 문에 렌더링합니다. Doris가 파티션 정의, 속성 이름, 값을 검증합니다. `duplicate_key`와 `distributed_by` 같은 OLAP 전용 옵션은 Iceberg 대상에 적합하지 않습니다. 일반적인 `table` 모델은 현재 Aggregate Key 또는 독립적인 Unique Key 설정을 제공하지 않습니다. Unique Key upsert에는 증분 `merge`를 사용하세요.

### 증분 {#incremental}

`append`, `merge`, `insert_overwrite`를 사용하는 증분 모델은 두 부분으로 구성됩니다.

- 모델 SQL은 일반적으로 `is_incremental()`을 사용하여 현재 실행에서 반환할 소스 행을 결정합니다.
- `incremental_strategy`는 어댑터가 해당 배치를 대상에 쓰는 방식을 결정합니다.

Microbatch는 이 필터링 패턴을 사용하지 않습니다. dbt Core가 배치 컨텍스트와 업스트림 리소스에 구성된 `event_time`을 바탕으로 시간 필터를 삽입합니다.

| 전략 | Doris 대상 및 동작 | 주요 요구 사항 |
| --- | --- | --- |
| `append` | OLAP Duplicate Key 또는 쓰기 가능한 Iceberg 테이블에 `INSERT INTO` 실행 | `unique_key`를 설정하지 마세요 |
| `merge` | OLAP Unique Key 테이블에 전체 행 `INSERT INTO` upsert 실행. Iceberg에는 네이티브 `MERGE INTO` 실행 | `unique_key`가 필요합니다. Iceberg에는 네이티브 MERGE 지원과 V2+ 테이블도 필요합니다 |
| `insert_overwrite` | OLAP의 전체 테이블, 지정한 파티션 또는 동적 파티션 덮어쓰기. Iceberg의 전체 테이블, 동적 또는 정적 파티션 덮어쓰기 | `unique_key`를 허용하지 않습니다. Iceberg의 정적 범위는 컬럼/값 매핑을 사용합니다 |
| `microbatch` | OLAP의 정확히 일치하는 RANGE 파티션 덮어쓰기. Iceberg에서는 네이티브 MERGE로 하나의 UTC 구간 교체 | `event_time`, `batch_size`, `begin`을 구성하세요. Iceberg에는 네이티브 MERGE와 V2+가 필요합니다 |

전략을 설정하지 않으면 `unique_key`가 있을 때 `merge`를 선택하고, 그렇지 않으면 어댑터가 `append`를 사용합니다. 어댑터는 `on_schema_change`의 네 가지 모드인 `ignore`, `fail`, `append_new_columns`, `sync_all_columns`를 모두 지원합니다.

`delete+insert`와 `delete_insert`는 허용되지 않습니다. Doris Unique Key upsert에는 `merge`를 사용하세요. OLAP 대상에서 `merge`는 Doris Unique Key 의미 체계에 따라 전체 행 `INSERT INTO`를 사용합니다. Iceberg 대상에서는 네이티브 `MERGE INTO`를 생성하고, 쓰기 전에 중복 소스 키를 거부합니다. 각 배치는 `unique_key`별로 최대 한 행만 포함해야 합니다. Sequence Column을 사용하려면 `function_column.sequence_col`을 `properties`에 설정하여 표시되는 컬럼을 지정하고, 계속 `merge`를 사용하세요. 단독 `sequence_col` 설정과 `function_column.sequence_type`을 숨겨진 `__DORIS_SEQUENCE_COL__`과 함께 사용하는 방식은 현재 지원되지 않습니다.

다음 예제는 `order_id`를 기준으로 전체 행 upsert를 수행합니다.

```sql
{{
  config(
    materialized='incremental',
    incremental_strategy='merge',
    unique_key=['order_id'],
    distributed_by=['order_id'],
    buckets=16,
    properties={'replication_num': '1'},
    on_schema_change='append_new_columns'
  )
}}

select
    order_id,
    customer_id,
    amount,
    updated_at
from {{ source('raw', 'orders') }}

{% if is_incremental() %}
where updated_at >= (
    select coalesce(max(updated_at), '1970-01-01 00:00:00')
    from {{ this }}
)
{% endif %}
```

Internal Catalog에서 이름으로 지정한 Doris 파티션을 덮어쓰려면 다음과 같이 설정합니다.

```sql
{{
  config(
    materialized='incremental',
    incremental_strategy='insert_overwrite',
    duplicate_key=['event_date', 'event_id'],
    partition_by=['event_date'],
    partition_type='RANGE',
    partition_by_init=[
      "PARTITION p_before_202607 VALUES LESS THAN ('2026-07-01')",
      "PARTITION p202607 VALUES LESS THAN ('2026-08-01')",
      "PARTITION p202608 VALUES LESS THAN ('2026-09-01')",
      "PARTITION pmax VALUES LESS THAN (MAXVALUE)"
    ],
    overwrite_partitions=['p202607', 'p202608'],
    distributed_by=['event_id'],
    buckets=16,
    properties={'replication_num': '1'}
  )
}}

select event_date, event_id, event_type
from (
    select
        cast(order_time as date) as event_date,
        order_id as event_id,
        status as event_type,
        order_time
    from {{ source('raw', 'orders') }}
) events

{% if is_incremental() %}
where order_time >= '2026-07-01'
  and order_time < '2026-09-01'
{% endif %}
```

첫 실행에서는 CTAS로 대상을 생성하며 `INSERT OVERWRITE`를 실행하지 않습니다. 따라서 이 예제는 `partition_by_init`을 사용하여 필요한 대상 파티션을 모두 생성합니다. 대상이 존재하면 `overwrite_partitions`가 덮어쓰기 범위를 제어합니다.

- 생략: 전체 테이블을 덮어씁니다.
- 파티션 이름 목록: 지정한 파티션만 덮어씁니다.
- `'*'`: Doris가 배치에 포함된 파티션을 동적으로 덮어쓰도록 합니다.

동적 OLAP 덮어쓰기는 빈 배치에서 어떤 파티션을 비워야 하는지 추론할 수 없습니다. 빈 소스 배치로 대상 데이터를 비워야 한다면 파티션 이름을 지정하세요.

Iceberg 대상에서는 `overwrite_partitions`를 생략하면 파티션이 있는 테이블에 네이티브 동적 덮어쓰기를 사용합니다. 하나의 정적 범위를 교체하려면 `overwrite_partitions={'dt': '2025-01-25'}`와 같이 비어 있지 않은 컬럼/값 매핑을 설정합니다. 모델은 해당 범위의 모든 행을 반환해야 합니다. 파티션이 없는 대상에서는 모델이 교체할 전체 결과를 반환해야 하며, 결과가 비어 있으면 테이블이 비워집니다. 정적 범위의 결과가 비어 있어도 해당 범위가 비워집니다. `NULL`을 포함하는 매핑은 네이티브 MERGE를 사용하며 Iceberg V2+가 필요합니다.

### Microbatch {#microbatch}

`microbatch`는 dbt Core 배치 컨텍스트를 사용합니다. 다음 예제는 Internal Catalog의 OLAP 테이블을 대상으로 하며, 각 UTC 구간마다 정확히 일치하는 RANGE 파티션 하나를 덮어씁니다. 각 직접 업스트림 리소스와 대상 모델에 `event_time` 필드를 구성하세요. 위의 첫 번째 모델 예제에서 생성한 `raw.orders` 소스는 기존 테이블 선언에 다음 구성을 추가합니다.

```yaml
sources:
  - name: raw
    schema: raw
    tables:
      - name: orders
        config:
          event_time: order_time
```

```sql
{{
  config(
    materialized='incremental',
    incremental_strategy='microbatch',
    event_time='event_time',
    batch_size='day',
    begin=modules.datetime.datetime(2026, 8, 1, 0, 0, 0),
    duplicate_key=['event_id', 'event_time'],
    partition_by=['event_time'],
    partition_type='RANGE',
    distributed_by=['event_id'],
    buckets=16,
    properties={'replication_num': '1'}
  )
}}

select
    order_id as event_id,
    order_time as event_time,
    status as event_type
from {{ source('raw', 'orders') }}
```

Internal Catalog의 OLAP 대상에서 `event_time`은 따옴표로 감싸지 않은 컬럼 이름이어야 하며, `partition_by`와 동일한 단일 컬럼을 참조해야 합니다. `batch_size`는 `hour`, `day`, `month`, `year`를 지원합니다. 대상은 Duplicate Key 테이블입니다. `duplicate_key`는 Doris 테이블 키를 구성하며, dbt의 `unique_key`가 아닙니다. `unique_key`, `overwrite_partitions`, `partition_by_init`은 설정하지 마세요. 어댑터가 현재 배치에서 파티션 경계와 덮어쓰기 대상을 도출합니다. 업스트림의 `ref()` 또는 `source()`에도 `event_time`이 구성되어 있으면 dbt Core가 해당 입력을 현재 구간으로 필터링합니다. Microbatch 배치는 순차적으로 실행되며, 배치가 비어 있어도 정확히 일치하는 파티션을 덮어쓰므로 해당 구간에서 제거된 행도 대상에서 삭제됩니다.

Internal Catalog Microbatch는 다음 속성을 구성하고 어댑터 검증을 통과하면 Doris Dynamic Partition도 사용할 수 있습니다.

- `dynamic_partition.enable='true'`.
- `dynamic_partition.time_unit`이 `batch_size`와 일치하고, `dynamic_partition.time_zone`이 `UTC`, `Etc/UTC`, `+00:00` 중 하나입니다.
- `dynamic_partition.create_history_partition='true'`이며, `dynamic_partition.start` 또는 `dynamic_partition.history_partition_num` 중 하나를 설정합니다.
- `dynamic_partition.prefix`가 유효한 식별자이고, `dynamic_partition.end`가 양의 정수입니다.
- 월별 배치에서는 `dynamic_partition.start_day_of_month`를 설정할 경우 값이 `1`이어야 합니다.

Doris는 Dynamic Partition 테이블을 생성할 때 양의 `dynamic_partition.buckets` 값도 요구합니다. 이 속성은 어댑터가 아닌 Doris가 검증합니다. 보존 기간은 `begin`, `lookback`, 모든 수동 백필 범위를 포함해야 합니다. 기존 대상에서는 어댑터가 검증하는 물리적 속성이 모델 구성과 일치해야 합니다. 그렇지 않으면 구성을 일치시키거나 `--full-refresh`를 실행하세요.

:::caution

`append`, `merge`, 파티션 범위의 `insert_overwrite`에서는 어댑터가 새로 추가되거나 변경된 소스 행을 자동으로 탐지하지 않습니다. 모델 SQL이 의도한 배치를 반환해야 합니다. 전체 테이블 `insert_overwrite`는 대상 데이터 전체를 반환해야 합니다. 각 `merge` 배치에는 고유한 `unique_key` 값이 포함되어야 합니다. dbt Core는 `event_time`이 구성된 업스트림 리소스에서 Microbatch 필터링을 제공하므로 Microbatch 모델에는 `is_incremental()`이 필요하지 않습니다. 호환되지 않는 키, 파티션 또는 물리적 레이아웃 변경 후에는 `dbt run --full-refresh`를 실행하세요. Iceberg Microbatch에서는 `unique_key`, `overwrite_partitions`(컬럼/값 매핑 포함), `partition_by_init`, OLAP Dynamic Partition 속성을 생략하세요. `partition_by`를 구성한 경우 `partition_type='LIST'`를 설정하세요. 빈 구간을 포함한 각 UTC 구간은 네이티브 MERGE로 교체됩니다.

:::

### 비동기 구체화된 뷰 {#asynchronous-materialized-views}

dbt 사용자는 표준 설정인 `materialized='materialized_view'`를 구성합니다. 어댑터는 이를 Doris [비동기 구체화된 뷰](../../query-acceleration/materialized-view/async-materialized-view/overview)로 구현합니다.

:::note

이 구체화 방식의 FE 버전 검사는 Doris 2.x 중 2.1.5 이상, Doris 3.x 중 3.0.0을 제외한 버전, Doris 4.x 이상, 그리고 `doris-0.0.0-<git-sha>`로 보고되어 식별 가능한 소스 빌드를 허용합니다. 소스 빌드는 개발 테스트 전용입니다. 이러한 검사는 코드에서 사용을 허용하는 조건이며, 허용된 모든 버전이 호환성 테스트를 통과했다는 근거는 아닙니다.

:::

```sql
{{
  config(
    materialized='materialized_view',
    build_mode='immediate',
    refresh_method='auto',
    refresh_trigger='manual',
    duplicate_key=['order_date'],
    distribution_type='hash',
    distributed_by=['order_date'],
    buckets=8,
    wait_for_refresh=true,
    properties={'replication_num': '1'}
  )
}}

select order_date, sales_amount
from {{ ref('fct_daily_sales') }}
```

| 설정 | 기본값 | 지원 값 또는 형식 |
| --- | --- | --- |
| `build_mode` | `immediate` | `immediate`, `deferred` |
| `refresh_method` | `auto` | `auto`는 Doris가 새로 고침 범위를 결정하도록 하고, `complete`는 모든 파티션을 새로 고칩니다 |
| `refresh_trigger` | `manual` | `manual`, `schedule`, `commit` |
| `refresh_schedule` | - | `schedule`에 필수입니다. 양의 `interval`, `minute/hour/day/week` 단위, 선택 사항인 `start_time`을 포함합니다 |
| `wait_for_refresh` | `true` | `BUILD IMMEDIATE`의 초기 빌드 또는 어댑터가 제출한 수동 새로 고침을 기다릴지 여부 |
| `refresh_wait_timeout` | `300` | 새로 고침 작업의 제한 시간(초). 양의 정수 |
| `refresh_poll_interval` | `1` | 새로 고침 작업의 폴링 간격(초). 제한 시간 이하의 양의 정수 |
| `duplicate_key` | - | 비동기 구체화된 뷰의 Duplicate Key 컬럼. 문자열 또는 목록 |
| `partition_by` | - | Doris 파티션 컬럼 하나 또는 파티션 함수 표현식. 문자열 또는 요소가 하나인 목록 |
| `distribution_type` | 자동 선택 | `hash`는 `distributed_by`가 설정된 경우에 사용하며, 그렇지 않으면 `random`을 사용합니다 |
| `distributed_by` | - | Hash Distribution 컬럼 |
| `buckets` | `auto` | 양의 정수 또는 `auto` |
| `replication_num` | - | 복제본 수를 간편하게 지정하는 설정. `properties`의 동일한 키보다 우선합니다 |
| `properties` | `{}` | Doris 비동기 구체화된 뷰 속성 |
| `on_configuration_change` | `apply` | `apply`, `continue`, `fail` |

`BUILD IMMEDIATE`는 정의를 생성하거나 교체할 때 초기 빌드를 시작합니다. 어댑터는 임시 이름으로 새 정의를 생성하고, 기본적으로 초기 빌드를 기다린 후 대상 이름으로 게시합니다. 추가 `REFRESH MATERIALIZED VIEW`는 제출하지 않습니다. `BUILD DEFERRED`는 초기 빌드 없이 정의를 생성합니다.

정의가 변경되지 않았다면 새로 고침 동작은 전적으로 `refresh_trigger`가 제어합니다. 현재 `refresh_on_run` 구성은 없습니다.

- `manual`은 `REFRESH MATERIALIZED VIEW ... AUTO|COMPLETE`를 이후 `dbt run`에서 모델을 선택할 때 제출하고, 기본적으로 성공할 때까지 기다립니다.
- `schedule`과 `commit`은 이후 dbt 실행에서 새로 고침을 제출하지 않습니다. Doris가 일정 또는 기본 테이블 커밋에 따라 새로 고침을 트리거합니다.

예를 들어 매일 실행하는 일정은 다음과 같이 구성합니다.

```sql
{{
  config(
    materialized='materialized_view',
    build_mode='deferred',
    refresh_method='auto',
    refresh_trigger='schedule',
    refresh_schedule={
      'interval': 1,
      'unit': 'day'
    },
    properties={'replication_num': '1'}
  )
}}

select order_date, sales_amount
from {{ ref('fct_daily_sales') }}
```

`wait_for_refresh=false`는 작업 폴링을 비활성화하며, 새로 고침 요청을 막지는 않습니다. dbt 대기 제한 시간이 초과되어도 이미 제출된 Doris 작업은 취소되지 않습니다. 어댑터는 제출 전후의 Doris 구체화된 뷰 작업 ID를 비교하여 새로 제출된 작업을 식별하므로, 동일한 대상에 수동 새로 고침을 동시에 실행하지 마세요.

모델 SQL이나 DDL 구성이 변경되면 기본값인 `on_configuration_change=apply`는 임시 비동기 구체화된 뷰를 빌드하고 기존 정의를 원자적으로 교체합니다. `continue`는 수동 새로 고침을 제출하지 않고 기존 정의를 유지하며, `fail`은 실행을 중단합니다. `--full-refresh`는 정의를 강제로 다시 배포합니다.

<!-- Knowledge Type: Capability Reference / Configuration Parameters -->
<!-- Use Case: Seeds / Snapshots / Source freshness / Grants -->

## 기타 dbt 기능 {#other-dbt-capabilities}

| 기능 | 지원 내용 |
| --- | --- |
| Seed | 버전 관리되는 소규모 CSV 파일을 `seeds/`에 넣은 후 `dbt seed`를 실행합니다. 타입 추론, `column_types`, `ref`를 지원합니다 |
| Snapshot | `check` 또는 `timestamp` 전략을 `snapshots/`에 정의한 후 `dbt snapshot`을 실행합니다. 하드 삭제와 스키마 진화를 지원합니다. Internal Catalog의 교체는 원자적이며, Iceberg의 교체는 백업과 이름 변경을 사용합니다 |
| 데이터 테스트 | YAML에서 Generic Tests를 구성하거나 `tests/`에 Singular Tests를 작성합니다. ephemeral 및 `store_failures` 경로를 지원합니다 |
| 단위 테스트 | 모델 YAML에 인라인 행 또는 CSV 픽스처를 제공한 후 `dbt test --select test_type:unit`을 실행합니다 |
| 모델 계약 | `contract.enforced: true`를 설정하고 테이블, 뷰 또는 증분 모델의 컬럼 이름과 타입을 선언합니다. `constraints` 선언은 허용되지 않으며, 데이터 테스트는 데이터베이스 제약 조건을 생성하지 않습니다 |
| 문서 영구 저장 | 주요 관계 타입의 관계 및 컬럼 주석을 저장하려면 `persist_docs`를 활성화합니다 |
| 소스 최신성 | `loaded_at_field` 또는 `loaded_at_query`를 `freshness`와 함께 구성한 후 `dbt source freshness`를 실행합니다 |
| 권한 부여 | 표준 `grants` 구성을 사용하여 Doris의 `user` 및 `user@host`에 테이블 권한을 부여합니다. 역할을 권한 부여 대상으로 지정하는 것은 현재 지원되지 않습니다 |
| Hook | `pre_hook`과 `post_hook`을 사용하여 구체화 전후에 Doris SQL을 실행합니다. Hook의 부수 효과에는 트랜잭션 롤백이 적용되지 않습니다 |
| 문서화 및 계보 | 설명을 작성하고 `dbt docs generate`를 실행하여 Internal Catalog와 External Catalog의 관계 및 컬럼 메타데이터를 생성합니다. Internal Catalog의 비동기 구체화된 뷰도 포함됩니다 |

Seed는 국가 코드나 상태 매핑처럼 버전 관리되는 소규모 데이터에 적합하며, 대량의 업무 데이터를 수집하는 용도로는 적합하지 않습니다. 대용량 파일에는 Doris Stream Load, Broker Load 또는 Doris Connector를 사용하세요.

Snapshot 소스의 `unique_key` 값은 `NULL`이 아니어야 하며 각 배치 내에서 고유해야 합니다. `timestamp` 전략에서는 `updated_at`이 `NULL`이 아니어야 하고, 해당 키의 현재 이력 버전보다 이전 시점이어서는 안 됩니다.

테이블 및 컬럼 설명을 영구 저장하려면 다음과 같이 설정합니다.

```yaml
models:
  - name: fct_daily_sales
    description: Daily sales summary
    config:
      persist_docs:
        relation: true
        columns: true
    columns:
      - name: order_date
        description: Order date
      - name: sales_amount
        description: Daily sales amount
```

### 소스 최신성 {#source-freshness}

소스 최신성은 타임스탬프를 명시적으로 제공하는 두 가지 방식을 지원합니다. 일반적인 타임스탬프 컬럼의 경우 `loaded_at_field`를 사용합니다.

```yaml
sources:
  - name: raw
    schema: raw
    tables:
      - name: orders
        config:
          loaded_at_field: updated_at
          freshness:
            warn_after: {count: 1, period: hour}
            error_after: {count: 2, period: hour}
```

최신성 타임스탬프를 구하는 데 사용자 지정 SQL이나 집계가 필요하면 `loaded_at_query`를 사용합니다.

```yaml
sources:
  - name: raw
    schema: raw
    tables:
      - name: orders
        config:
          loaded_at_query: |
            select max(updated_at)
            from {{ this }}
            where is_valid = 1
          freshness:
            warn_after: {count: 1, period: hour}
            error_after: {count: 2, period: hour}
```

`loaded_at_field`를 사용할 때는 `filter`를 `freshness` 아래에 설정하여 최신성 평가에 포함할 행을 제한할 수 있습니다. 예를 들어 `filter: is_valid = 1`을 설정합니다. `loaded_at_field`와 `loaded_at_query`를 함께 구성하지 마세요. 어댑터는 현재 Doris 테이블 메타데이터에서 데이터 적재 시간을 추론하지 않으므로, 필드나 쿼리를 명시적으로 제공해야 합니다.

어댑터는 현재 시간으로 `utc_timestamp()`를 사용합니다. 이는 시간대 정보가 없는 최신성 타임스탬프를 UTC로 평가하는 dbt Core의 규칙과 일치합니다.

### 권한 부여 {#grants}

선언적 권한 부여는 Doris 사용자를 권한 부여 대상으로 사용합니다.

```yaml
models:
  doris_demo:
    +grants:
      select:
        - analyst
        - reporter@10.0.0.%
```

`@host`가 없는 이름은 `username@%`로 처리합니다. 권한은 다음과 같이 매핑됩니다. `select`는 `SELECT_PRIV`, `insert`는 `LOAD_PRIV`, `alter`는 `ALTER_PRIV`, `create`는 `CREATE_PRIV`, `drop`은 `DROP_PRIV`, `show_view`는 `SHOW_VIEW_PRIV`에 매핑됩니다. Doris 역할은 현재 `grants`에서 지원되지 않으므로 구체적인 사용자를 지정하세요. dbt를 실행하는 계정은 권한 부여 대상을 조회하고 대상 객체의 권한을 조정할 수 있어야 합니다.

<!-- Knowledge Type: Command Reference -->
<!-- Use Case: dbt project development / Execution / Testing / Documentation generation -->

## 자주 사용하는 명령 {#common-commands}

| 명령 | 용도 |
| --- | --- |
| `dbt debug` | 프로젝트 구성과 Doris 연결 검증 |
| `dbt parse` | SQL을 실행하지 않고 프로젝트 파싱 |
| `dbt compile` | 모델을 컴파일하고 생성된 Doris SQL 확인 |
| `dbt run` | 선택한 모델 빌드 |
| `dbt test` | 데이터 테스트와 단위 테스트 실행 |
| `dbt build` | 종속성 순서에 따라 Seed, 모델, Snapshot, 테스트 실행 |
| `dbt seed` | Seed CSV 파일의 데이터 적재 |
| `dbt snapshot` | Snapshot 업데이트 |
| `dbt source freshness` | 소스 최신성 평가 |
| `dbt docs generate` | Catalog, 문서, 계보 메타데이터 생성 |

자주 사용하는 선택자:

```shell
# Run one model
dbt run --select fct_daily_sales

# Run the model and all upstream dependencies
dbt build --select +fct_daily_sales

# Run the model and all downstream dependencies
dbt build --select fct_daily_sales+

# Fully rebuild an incremental model
dbt run --select fct_orders --full-refresh
```

<!-- Knowledge Type: Limitations / Architecture Decision -->
<!-- Use Case: Version evaluation / Production readiness review -->

## 현재 제한 사항 {#current-limitations}

- 어댑터는 현재 Aggregate Key 테이블 모델링이나 보조 인덱스 구성을 지원하지 않습니다.
- External Catalog의 쓰기 동작은 Doris 커넥터에 따라 달라집니다. Catalogs V2와 커넥터별 쓰기 보장은 지원되지 않습니다.
- 어댑터는 현재 SSL 구성, 제한 시간/재시도, 다중 FE 장애 조치, 서버 측 취소, 완전한 쿼리 텔레메트리를 구현하지 않습니다.
- 일부 테이블/뷰/구체화된 뷰 타입 변경에서는 무중단 전환 대신 정식 이름을 잠시 사용할 수 없는 구간이 발생합니다.

<!-- Knowledge Type: Troubleshooting -->
<!-- Use Case: Connection errors / Catalog and database lookup -->

## 문제 해결 {#troubleshooting}

### `dbt debug` 연결 실패 {#dbt-debug-cannot-connect}

`host`와 `port`가 접근 가능한 FE MySQL 쿼리 포트를 가리키는지 확인하고, 사용자 이름, 비밀번호, 네트워크 정책을 점검하세요. 기본 쿼리 포트는 `9030`이며, `8030`은 일반적으로 FE HTTP 포트입니다.

### Catalog 또는 데이터베이스를 찾을 수 없음 {#catalog-or-database-cannot-be-found}

v1.1.1에서 프로필과 소스의 `database` 값은 Doris Catalog를 식별하고, `schema`는 해당 Catalog 내부의 데이터베이스를 식별합니다. Internal Catalog에서는 `database`를 생략하세요. 이전 프로젝트에서 소스의 `database`를 Doris 데이터베이스에 사용했다면 해당 값을 `schema`로 옮기세요. 외부 Catalog가 이미 존재하고 dbt 계정에서 조회할 수 있는지 확인하세요.
