---
{
    "title": "읽기/쓰기 분리 및 주/대기 클러스터의 File Cache 워밍업 구성 가이드",
    "sidebar_label": "읽기/쓰기 분리: File Cache 워밍업",
    "language": "ko",
    "description": "읽기/쓰기 분리 및 주/대기 아키텍처를 위한 Doris File Cache 능동형 증분 워밍업 메커니즘을 설명합니다. 컴퓨트 그룹 수준 및 테이블 수준의 이벤트 기반 워밍업, 작업 생성, 상태 확인, 지표, 문제 해결을 다룹니다.",
    "keywords": ["읽기/쓰기 분리", "주/대기 클러스터", "File Cache 워밍업", "능동형 증분 워밍업", "테이블 수준 워밍업", "ON TABLES", "컴퓨트 그룹 동기화", "고가용성"]
}
---

<!-- Knowledge type: Architecture decision -->
<!-- Applicable scenarios: Read/write separation deployment / Primary/standby cluster high availability / File Cache warm-up -->

## 배경 및 적용 시나리오 {#background-and-applicable-scenarios}

Apache Doris의 컴퓨팅과 스토리지가 분리된 아키텍처에서는 여러 컴퓨트 그룹이 동일한 원격 스토리지 데이터를 공유할 수 있습니다. 쓰기 컴퓨트 그룹은 데이터 적재, Compaction 또는 Schema Change를 처리하고, 쿼리 컴퓨트 그룹은 온라인 쿼리를 처리합니다. 새 Rowset이 생성된 후 쿼리 컴퓨트 그룹의 로컬 File Cache에 해당 파일이 로드되지 않았다면, 첫 쿼리는 객체 스토리지나 HDFS에 접근해야 하므로 쿼리 지연 시간이 불안정해질 수 있습니다.

File Cache 능동형 증분 워밍업은 쓰기 측에서 새 데이터가 생성된 후 관련 Segment 및 인덱스 파일을 대상 컴퓨트 그룹의 로컬 캐시에 미리 로드합니다. 주로 다음 시나리오에 적용할 수 있습니다.

| 시나리오 | 설명 | 이점 |
|------|------|----------|
| 읽기/쓰기 분리 | 쓰기 컴퓨트 그룹은 지속적으로 데이터를 적재하고, 쿼리 컴퓨트 그룹은 쿼리만 처리합니다 | 쿼리 컴퓨트 그룹이 새 데이터를 읽을 때 Cache Miss를 줄입니다 |
| 주/대기 클러스터 고가용성 | 대기 컴퓨트 그룹이 주 컴퓨트 그룹의 핫 데이터를 지속적으로 동기화합니다 | 장애 조치 후 콜드 캐시 복구 시간을 단축합니다 |
| 멀티테넌트 또는 계층형 데이터 웨어하우스 | 쿼리 컴퓨트 그룹마다 일부 업무 테이블에만 접근합니다 | 테이블 수준 필터링으로 불필요한 워밍업과 캐시 사용을 줄입니다 |
| 비용 최적화 | 소스 컴퓨트 그룹에 테이블이 많지만 자주 실행되는 쿼리는 일부 테이블에 집중됩니다 | 원격 스토리지 읽기와 네트워크 전송을 줄입니다 |

:::tip 버전 정보
이 문서는 File Cache 능동형 증분 워밍업과 테이블 수준의 `ON TABLES` 필터링 기능을 설명합니다. 정확한 버전별 지원 여부는 해당 버전의 릴리스 노트와 SQL 구문 문서를 참조하세요.
:::

## 기능 개요 {#feature-overview}

File Cache 능동형 워밍업은 세 가지 동기화 모드를 지원합니다.

| 동기화 모드 | 속성값 | 적용 시나리오 |
|------|--------|----------|
| 일회성 동기화 | `once` | 새 컴퓨트 그룹을 가동할 때 초기 워밍업을 수동으로 트리거합니다 |
| 주기적 동기화 | `periodic` | 일정한 간격으로 핫 데이터를 동기화하여 캐시를 지속적으로 유지합니다 |
| 이벤트 기반 동기화 | `event_driven` | Load, Compaction, Schema Change 중에 생성된 데이터를 자동으로 워밍업합니다 |

이벤트 기반 동기화는 두 가지 범위로 적용할 수 있습니다.

| 범위 | 구문 형식 | 설명 |
|------|----------|------|
| 컴퓨트 그룹 수준의 이벤트 기반 워밍업 | `ON TABLES` 없음 | 소스 컴퓨트 그룹에서 해당 이벤트로 생성된 새 데이터가 워밍업을 트리거합니다 |
| 테이블 수준의 이벤트 기반 워밍업 | `ON TABLES (...)` 포함 | 규칙과 일치하는 테이블의 새 데이터만 워밍업을 트리거합니다 |

테이블 수준의 이벤트 기반 워밍업은 쿼리 컴퓨트 그룹이 일부 핵심 테이블만 사용하는 경우에 적합합니다. 컴퓨트 그룹 수준의 워밍업에 비해 불필요한 원격 읽기, 네트워크 전송, 대상 컴퓨트 그룹의 캐시 사용을 줄일 수 있습니다.

## 워밍업 작업 생성 {#creating-warm-up-jobs}

### 일회성 동기화 {#one-time-sync}

일회성 동기화는 새 컴퓨트 그룹을 가동할 때 초기 워밍업을 수행하는 데 적합합니다.

```sql
WARM UP COMPUTE GROUP <target_compute_group> WITH COMPUTE GROUP <source_compute_group>;
```

### 주기적 동기화 {#periodic-sync}

주기적 동기화는 핫 데이터의 동기화를 지속적으로 유지하는 데 적합합니다.

```sql
WARM UP COMPUTE GROUP <target_compute_group> WITH COMPUTE GROUP <source_compute_group>
PROPERTIES (
    "sync_mode" = "periodic",
    "sync_interval_sec" = "600"
);
```

`sync_interval_sec`는 동기화 간격을 초 단위로 지정합니다. 기본값은 `600`입니다.

### 컴퓨트 그룹 수준의 이벤트 기반 워밍업 {#compute-group-level-event-driven-warm-up}

컴퓨트 그룹 수준의 이벤트 기반 워밍업은 읽기/쓰기 분리 시나리오에 적합합니다. 소스 컴퓨트 그룹의 쓰기 이벤트를 수신하고, Load, Compaction, Schema Change 중에 생성된 데이터를 대상 컴퓨트 그룹에 미리 로드합니다.

```sql
WARM UP COMPUTE GROUP <target_compute_group> WITH COMPUTE GROUP <source_compute_group>
PROPERTIES (
    "sync_mode" = "event_driven",
    "sync_event" = "load"
);
```

- `sync_event`: 이벤트 기반 워밍업 작업을 생성할 때 이 매개변수를 `load`로 설정합니다.

### 테이블 수준의 이벤트 기반 워밍업 {#table-level-event-driven-warm-up}

테이블 수준의 이벤트 기반 워밍업은 컴퓨트 그룹 수준의 이벤트 기반 워밍업에 `ON TABLES` 절을 추가하여 워밍업할 테이블 범위를 지정합니다.

```sql
WARM UP COMPUTE GROUP <target_compute_group> WITH COMPUTE GROUP <source_compute_group>
ON TABLES (
    INCLUDE '<database_pattern>.<table_pattern>'
    [, INCLUDE '<database_pattern>.<table_pattern>' ...]
    [, EXCLUDE '<database_pattern>.<table_pattern>' ...]
)
PROPERTIES (
    "sync_mode" = "event_driven",
    "sync_event" = "load"
);
```

매개변수 설명:

| 매개변수 | 필수 여부 | 설명 |
|------|----------|------|
| `<target_compute_group>` | 예 | 대상 컴퓨트 그룹의 이름입니다. 일치하는 테이블의 새 데이터를 이 컴퓨트 그룹의 로컬 File Cache에 워밍업합니다 |
| `<source_compute_group>` | 예 | 소스 컴퓨트 그룹의 이름입니다. Doris는 이 컴퓨트 그룹의 쓰기 이벤트를 수신합니다 |
| `ON TABLES` | 아니요 | 테이블 수준 필터 규칙입니다. 생략하면 컴퓨트 그룹 수준의 이벤트 기반 워밍업 작업이 됩니다 |
| `INCLUDE` | `ON TABLES` 사용 시 필수 | 워밍업 범위에 포함할 테이블 패턴을 선언합니다. 하나 이상의 `INCLUDE` 규칙이 필요합니다 |
| `EXCLUDE` | 아니요 | `INCLUDE` 결과에서 해당 테이블 패턴을 제외합니다 |
| `sync_mode` | 예 | 테이블 수준의 이벤트 기반 워밍업은 `event_driven`을 사용합니다 |
| `sync_event` | 예 | 테이블 수준의 이벤트 기반 워밍업은 현재 `load` 이벤트를 사용합니다 |

:::caution 참고
동일한 소스 및 대상 컴퓨트 그룹에 컴퓨트 그룹 수준의 `load` 이벤트 기반 워밍업과 테이블 수준의 `ON TABLES` 이벤트 기반 워밍업을 동시에 구성하지 마세요. 두 구성의 의미가 중복되므로 Doris는 작업 생성 시 충돌하는 구성을 거부합니다. 컴퓨트 그룹 수준의 워밍업에서 테이블 수준의 워밍업으로 전환하려면 기존 작업을 먼저 취소한 다음 새 `ON TABLES` 작업을 생성하세요.
:::

## ON TABLES 일치 규칙 {#on-tables-matching-rules}

### 패턴 형식 {#pattern-format}

`ON TABLES`의 패턴은 `'database.table'` 형식을 사용해야 하며 작은따옴표로 묶어야 합니다. 다음 와일드카드를 지원합니다.

| 와일드카드 | 의미 | 예시 |
|--------|------|------|
| `*` | 빈 문자열을 포함하여 길이에 관계없이 모든 문자열과 일치합니다 | `'ods.*'`는 `ods` 데이터베이스의 모든 테이블과 일치합니다 |
| `?` | 임의의 문자 하나와 정확히 일치합니다 | `'logs.access_202?'`는 `logs.access_2020`부터 `logs.access_2029`까지 일치합니다 |

와일드카드가 없는 패턴은 정확히 일치하는 항목만 찾습니다. 예를 들어 `'sales.orders'`는 테이블 이름이 `orders`이고 데이터베이스 이름이 `sales`인 경우에만 일치합니다.

자주 사용하는 패턴 예시:

| 패턴 | 의미 |
|------|------|
| `'mydb.*'` | `mydb` 데이터베이스의 모든 테이블과 일치합니다 |
| `'*.orders'` | 모든 데이터베이스에서 이름이 `orders`인 테이블과 일치합니다 |
| `'dw.fact_*'` | 테이블 이름이 `fact_`로 시작하고 `dw` 데이터베이스에 속하는 테이블과 일치합니다 |
| `'*.*_bak'` | 모든 데이터베이스에서 이름이 `_bak`로 끝나는 테이블과 일치합니다 |
| `'sales.orders'` | `sales.orders`와 정확히 일치합니다 |

### INCLUDE와 EXCLUDE {#include-and-exclude}

Doris는 최종 워밍업 범위를 다음과 같이 계산합니다.

```text
Final warm-up scope = tables matched by all INCLUDE rules - tables matched by all EXCLUDE rules
```

규칙:

- `INCLUDE`와 `EXCLUDE` 규칙의 순서는 최종 결과에 영향을 주지 않습니다.
- 하나 이상의 `INCLUDE` 규칙이 필요합니다. `EXCLUDE`만 지정할 수는 없습니다.
- 여러 `INCLUDE` 규칙의 결과는 합집합으로 결합됩니다.
- 여러 `EXCLUDE` 규칙은 후보 집합에서 일치하는 테이블을 제거합니다.
- 일치 여부는 Doris의 데이터베이스 및 테이블 명명 규칙을 따릅니다. 실제 데이터베이스 및 테이블 이름과 대소문자를 동일하게 지정하세요.

예시:

```sql
WARM UP COMPUTE GROUP analytics_cg WITH COMPUTE GROUP write_cg
ON TABLES (
    INCLUDE 'ods.*',
    INCLUDE 'dw.fact_*',
    INCLUDE 'dw.dim_*',
    EXCLUDE 'ods.tmp_*',
    EXCLUDE '*.*_bak'
)
PROPERTIES (
    "sync_mode" = "event_driven",
    "sync_event" = "load"
);
```

이 예시는 다음 테이블을 워밍업합니다.

- `ods` 데이터베이스에서 이름이 `tmp_`로 시작하는 테이블을 제외한 모든 테이블.
- `dw` 데이터베이스에서 이름이 `fact_` 또는 `dim_`로 시작하는 테이블.
- 모든 데이터베이스에서 이름이 `_bak`로 끝나는 백업 테이블은 제외됩니다.

### 구체화된 뷰 {#materialized-views}

`ON TABLES` 규칙은 일반 테이블과 비동기 구체화된 뷰 모두에 적용됩니다. 비동기 구체화된 뷰는 데이터베이스 네임스페이스에 독립적인 테이블로 존재하며, `INCLUDE` 및 `EXCLUDE` 규칙을 통해 이름으로 일치 여부를 판단합니다.

동기 구체화된 뷰(Rollup)는 기본 테이블의 내부 인덱스이며 독립적인 테이블이 아닙니다. 기본 테이블을 워밍업할 때 동기 구체화된 뷰와 관련된 데이터도 기본 테이블과 함께 처리되므로 별도의 규칙이 필요하지 않습니다.

## 예시 {#examples}

### 특정 테이블 워밍업 {#warm-up-specific-tables}

```sql
WARM UP COMPUTE GROUP report_cg WITH COMPUTE GROUP business_cg
ON TABLES (
    INCLUDE 'sales.orders',
    INCLUDE 'sales.customers',
    INCLUDE 'inventory.stock_level'
)
PROPERTIES (
    "sync_mode" = "event_driven",
    "sync_event" = "load"
);
```

### 전체 데이터베이스 워밍업 {#warm-up-an-entire-database}

```sql
WARM UP COMPUTE GROUP analytics_cg WITH COMPUTE GROUP load_cg
ON TABLES (
    INCLUDE 'analytics_db.*'
)
PROPERTIES (
    "sync_mode" = "event_driven",
    "sync_event" = "load"
);
```

### 여러 데이터베이스 워밍업 및 임시 테이블 제외 {#warm-up-multiple-databases-and-exclude-temporary-tables}

```sql
WARM UP COMPUTE GROUP query_cg WITH COMPUTE GROUP etl_cg
ON TABLES (
    INCLUDE 'ods.*',
    INCLUDE 'dwd.*',
    INCLUDE 'dws.*',
    EXCLUDE '*.tmp_*',
    EXCLUDE '*.*_backup'
)
PROPERTIES (
    "sync_mode" = "event_driven",
    "sync_event" = "load"
);
```

### 동일한 테이블을 여러 대상 컴퓨트 그룹에 워밍업 {#warm-up-the-same-table-to-multiple-target-compute-groups}

동일한 테이블을 여러 쿼리 컴퓨트 그룹에서 사용해야 한다면 대상 컴퓨트 그룹마다 작업을 하나씩 생성합니다.

```sql
WARM UP COMPUTE GROUP realtime_cg WITH COMPUTE GROUP write_cg
ON TABLES (INCLUDE 'sales.orders')
PROPERTIES ("sync_mode" = "event_driven", "sync_event" = "load");

WARM UP COMPUTE GROUP batch_cg WITH COMPUTE GROUP write_cg
ON TABLES (INCLUDE 'sales.orders')
PROPERTIES ("sync_mode" = "event_driven", "sync_event" = "load");
```

## 워밍업 작업 관리 {#managing-warm-up-jobs}

### 작업 조회 {#viewing-jobs}

모든 워밍업 작업을 조회합니다.

```sql
SHOW WARM UP JOB;
```

특정 작업을 조회합니다.

```sql
SHOW WARM UP JOB WHERE id = <job_id>;
```

필드 설명:

| 필드 | 설명 |
|--------|------|
| `JobId` | 워밍업 작업의 고유 ID |
| `SrcComputeGroup` | 소스 컴퓨트 그룹 이름 |
| `DstComputeGroup` | 대상 컴퓨트 그룹 이름 |
| `Status` | 작업 상태. 예: `PENDING`, `RUNNING`, `FINISHED`, `CANCELLED` |
| `Type` | 워밍업 범위. `CLUSTER`는 컴퓨트 그룹 수준, `TABLE`은 명시적으로 지정한 테이블, `TABLES`는 `ON TABLES` 규칙에 따라 일치하는 테이블을 의미합니다 |
| `SyncMode` | 동기화 모드. 예: `ONCE`, `PERIODIC(interval_sec)`, `EVENT_DRIVEN(event)` |
| `CreateTime` | 작업 생성 시간 |
| `StartTime` | 가장 최근 시작 시간 |
| `FinishBatch` | 완료된 배치 수 |
| `AllBatch` | 전체 배치 수 |
| `FinishTime` | 가장 최근 완료 시간. 이벤트 기반 작업은 일반적으로 계속 실행됩니다 |
| `ErrMsg` | 가장 최근 오류 메시지. 오류가 없으면 비어 있습니다 |
| `Tables` | 명시적으로 지정한 테이블 목록. 주로 일회성 또는 주기적 테이블 수준 워밍업에서 사용합니다 |
| `TableFilter` | `ON TABLES` 규칙의 정규화된 표현. 컴퓨트 그룹 수준 작업에서는 비어 있습니다 |
| `MatchedTables` | 현재 일치하는 테이블 이름 목록. 주기적으로 새로 고쳐 테이블 생성, 삭제, 이름 변경을 반영합니다 |
| `SyncStats` | 이벤트 기반 작업의 동기화 진행 상황. 목록 조회에서는 요약을, ID 조회에서는 상세 JSON을 표시합니다 |

`SHOW WARM UP JOB`은 일상적인 점검에 적합합니다. 목록의 너비가 지나치게 넓어지지 않도록 `SyncStats`는 최근 30분의 요약을 표시합니다.

```json
{
  "window": "30m",
  "src_size": "58.2mb",
  "dst_size": "57.5mb",
  "gap_size": "716kb",
  "trigger_gap_ms": 1200
}
```

작업 ID로 조회하면 `SyncStats`에 5분, 30분, 1시간 구간별 상세 지표가 표시됩니다.

```sql
SHOW WARM UP JOB WHERE id = <job_id>;
```

`SyncStats` 예시:

```json
{
  "seg_num": {
    "requested_5m": 42,
    "finish_5m": 40,
    "gap_5m": 2,
    "fail_5m": 0,
    "requested_30m": 180,
    "finish_30m": 178,
    "gap_30m": 2,
    "fail_30m": 0,
    "requested_1h": 320,
    "finish_1h": 318,
    "gap_1h": 2,
    "fail_1h": 0
  },
  "seg_size": {
    "requested_5m": "12.5mb",
    "finish_5m": "11.8mb",
    "gap_5m": "716kb",
    "fail_5m": "0b",
    "requested_30m": "58.2mb",
    "finish_30m": "57.5mb",
    "gap_30m": "716kb",
    "fail_30m": "0b",
    "requested_1h": "102.3mb",
    "finish_1h": "101.6mb",
    "gap_1h": "716kb",
    "fail_1h": "0b"
  },
  "idx_num": {
    "requested_5m": 10,
    "finish_5m": 10,
    "gap_5m": 0,
    "fail_5m": 0
  },
  "idx_size": {
    "requested_5m": "2.1mb",
    "finish_5m": "2.1mb",
    "gap_5m": "0b",
    "fail_5m": "0b"
  },
  "last_trigger_ts": "2026-08-11 14:32:15",
  "last_finish_ts": "2026-08-11 14:32:18",
  "progress_trigger_ts": "2026-08-11 14:32:14",
  "trigger_gap_ms": 1000
}
```

다음 필드를 주의해서 확인하세요.

| 필드 | 설명 |
|------|------|
| `requested_*` | 소스 컴퓨트 그룹이 제출한 워밍업 요청량 |
| `finish_*` | 대상 컴퓨트 그룹이 완료한 워밍업 작업량 |
| `gap_*` | 아직 완료되지 않은 양을 나타내는 차이 |
| `fail_*` | 대상 컴퓨트 그룹에서 실패한 워밍업 작업량 |
| `last_trigger_ts` | 가장 최근 워밍업 트리거 시간 |
| `progress_trigger_ts` | 대상 컴퓨트 그룹의 현재 진행 상황에 대응하는 업스트림 트리거 시간 |
| `last_finish_ts` | 가장 최근 워밍업 완료 시간 |
| `trigger_gap_ms` | 소스의 최신 트리거 시간과 대상의 진행 워터마크 간 시간 차이. 밀리초 단위 |

:::info 버전 참고 사항 (4.0.8)

4.0.8 버전부터 세 타임스탬프 필드 `last_trigger_ts`, `last_finish_ts`, `progress_trigger_ts`의 형식이 `HH:mm:ss`에서 `yyyy-MM-dd HH:mm:ss`로 변경되어 날짜도 포함합니다. 이전에는 시각만 표시되어 날짜가 바뀌는 경계에서 어느 날짜인지 구분하기 어려웠습니다.

고정된 형식으로 이 필드를 파싱하는 스크립트가 있다면 4.0.8로 업그레이드하기 전에 수정하세요.

:::

### 작업 취소 {#canceling-a-job}

```sql
CANCEL WARM UP JOB WHERE id = <job_id>;
```

작업을 취소하면 Doris는 해당 작업의 이벤트 수신과 워밍업 트리거를 중단합니다. 대상 컴퓨트 그룹의 File Cache에 이미 기록된 데이터는 즉시 제거하지 않으며, 일반적인 캐시 축출 정책에 따라 해제됩니다.

현재 버전에서는 기존 작업의 `ON TABLES` 규칙을 직접 수정할 수 없습니다. 워밍업 범위를 조정하려면 기존 작업을 먼저 취소한 다음 새 작업을 생성하세요.

## 일치 결과 갱신 및 동작 참고 사항 {#matching-refresh-and-behavior-notes}

### 테이블 생성, 삭제, 이름 변경 {#creating-dropping-and-renaming-tables}

`ON TABLES` 규칙은 작업 생성 시 평가되며, 작업 실행 중에도 주기적으로 재평가됩니다. 기본 갱신 간격은 60초입니다.

이에 따라 다음과 같이 동작합니다.

- 작업을 생성한 후 새 테이블을 만들면, 테이블 이름이 규칙과 일치할 경우 이후 갱신 주기에서 워밍업 범위에 자동으로 포함됩니다.
- 일치하는 테이블을 삭제하면 이후 갱신 주기에서 `MatchedTables`에서 제거됩니다.
- 일치하는 테이블의 이름을 변경하면 새 이름이 규칙과 일치하는지에 따라 워밍업 지속 여부가 결정됩니다.

새 테이블 생성 후 다음 규칙 갱신까지 최대 60초의 지연이 있을 수 있습니다. 이 지연 구간에 새 테이블에 쓰기를 수행해도 해당 테이블 수준 작업은 트리거되지 않습니다. 갱신 이후의 쓰기는 정상적으로 워밍업을 트리거합니다.

### 생성 시 일치하는 테이블이 없는 경우 {#no-matched-table-at-creation}

테이블 수준의 이벤트 기반 워밍업 작업을 생성할 때 `ON TABLES` 규칙은 기존 테이블 중 하나 이상과 일치해야 합니다. 일치하는 테이블이 없으면 작업 생성이 실패합니다. 데이터베이스 이름, 테이블 이름, 와일드카드 패턴을 확인하세요.

워밍업 관계를 미리 구성하려면 워밍업 작업을 생성하기 전에 규칙과 일치하는 테이블을 하나 이상 생성하세요.

### Schema Change {#schema-change}

`ON TABLES`는 테이블 집합만 결정하며 이벤트 유형 자체의 트리거 의미는 변경하지 않습니다. 현재 작업에 구성되어 있고 현재 버전에서 지원하는 이벤트 유형의 경우, 새로 생성된 데이터는 테이블 일치 결과에 따라 처리됩니다. 작업이 `sync_event = "load"`로 구성되어 있다면 해당 데이터 적재 이벤트만 수신합니다.

## 동작 원리 {#how-it-works}

### 주기적 동기화 실행 흐름 {#periodic-sync-execution-flow}

1. FE가 작업을 등록하고 동기화 간격을 기록합니다.
2. FE가 트리거 시간에 도달했는지 주기적으로 확인합니다.
3. 트리거 시간에 도달하면 FE가 대상 테이블이나 파티션을 해당 Tablet으로 변환하고 태스크를 전달합니다.
4. BE가 원격 스토리지에서 파일을 읽어 대상 컴퓨트 그룹의 File Cache에 기록합니다.

### 이벤트 기반 동기화 실행 흐름 {#event-driven-sync-execution-flow}

1. 사용자가 이벤트 기반 작업을 생성하면 FE가 동기화 관계를 영구 저장합니다.
2. FE가 이벤트 기반 구성을 소스 컴퓨트 그룹의 BE에 전달합니다.
3. 소스 컴퓨트 그룹의 BE가 쓰기 이벤트 커밋 후 워밍업을 트리거합니다.
4. 테이블 수준의 이벤트 기반 작업에서는 소스 BE가 현재 일치하는 테이블 집합에 속하는 Rowset만 처리합니다.
5. 대상 컴퓨트 그룹의 BE가 해당 Segment 및 인덱스 파일을 다운로드하여 로컬 File Cache에 기록합니다.
6. FE가 `SHOW WARM UP JOB`과 FE 지표를 통해 작업 상태 및 동기화 진행 상황을 제공합니다.

## 지표 모니터링 {#metrics-monitoring}

### SQL로 확인 {#sql-observation}

워밍업 진행 상황을 가장 직접적으로 확인하는 방법은 `SHOW WARM UP JOB`을 사용하는 것입니다.

```sql
SHOW WARM UP JOB;
SHOW WARM UP JOB WHERE id = <job_id>;
```

활용 제안:

- `gap_size` 또는 세부 `gap_*` 값이 지속적으로 0에 가까워지면 대상 컴퓨트 그룹이 대체로 소스 컴퓨트 그룹의 쓰기 속도를 따라가고 있다는 의미입니다.
- `trigger_gap_ms`가 0에 가까워지면 대상 컴퓨트 그룹이 소스 컴퓨트 그룹의 최신 트리거 이벤트까지 따라잡았다는 의미입니다.
- `fail_*`가 0보다 크면 BE 로그에서 디스크 공간 부족, 원격 스토리지 접근 실패, 네트워크 오류를 확인하세요.
- 5분 구간은 실시간 변동을 확인하는 데 유용하며, 30분 및 1시간 구간은 지속적인 추세를 확인하는 데 유용합니다.

### BE Bvar 지표 {#be-bvar-metrics}

`SHOW WARM UP JOB` 및 FE `/metrics` 외에도 BE Bvar 페이지를 사용하여 단일 BE의 워밍업 실행 지표를 확인할 수 있습니다.

```bash
curl http://<be_host>:<brpc_port>/vars
```

주기적 작업의 BE 측 지표:

| 지표 이름 | 의미 |
|----------|------|
| `file_cache_once_or_periodic_warm_up_submitted_segment_size` | 제출된 Segment 데이터 크기 |
| `file_cache_once_or_periodic_warm_up_finished_segment_size` | 완료된 Segment 데이터 크기 |
| `file_cache_once_or_periodic_warm_up_submitted_index_num` | 제출된 인덱스 수 |
| `file_cache_once_or_periodic_warm_up_finished_index_num` | 완료된 인덱스 수 |

이벤트 기반 작업의 소스 BE 지표:

| 지표 이름 | 의미 |
|----------|------|
| `file_cache_event_driven_warm_up_requested_segment_size` | 동기화를 요청한 Segment 데이터 크기 |
| `file_cache_event_driven_warm_up_requested_index_num` | 동기화를 요청한 인덱스 수 |
| `file_cache_warm_up_rowset_last_call_unix_ts` | 마지막으로 시작한 동기화 요청의 타임스탬프 |

이벤트 기반 작업의 대상 BE 지표:

| 지표 이름 | 의미 |
|----------|------|
| `file_cache_event_driven_warm_up_submitted_segment_num` | 수신한 Segment 수 |
| `file_cache_event_driven_warm_up_finished_segment_num` | 워밍업을 완료한 Segment 수 |
| `file_cache_warm_up_rowset_last_handle_unix_ts` | 마지막으로 처리한 동기화 요청의 타임스탬프 |

이 지표는 단일 BE의 실행 상태를 반영하며, BE가 워밍업 요청을 수신했는지, 다운로드를 완료했는지, 최근에 요청을 시작하거나 처리했는지 확인하는 데 유용합니다. 여러 BE에 걸친 작업 수준 집계에는 `SHOW WARM UP JOB WHERE id = <job_id>` 또는 FE Prometheus 지표를 사용하는 것이 좋습니다.

### FE Prometheus 지표 {#fe-prometheus-metrics}

클라우드 모드에서는 FE가 BE에서 이벤트 기반 워밍업 진행 상황을 주기적으로 가져와 집계합니다. 기본 갱신 간격은 15초입니다. 이 간격은 FE 구성 항목인 `cloud_warm_up_sync_stats_refresh_interval_ms`로 제어하며, 기본값은 `15000`밀리초입니다.

FE `/metrics`에서 다음 지표를 수집할 수 있습니다.

| 지표 이름 | 설명 |
|--------|------|
| `doris_fe_file_cache_warm_up_sync_job_info` | 작업 메타데이터. 값은 항상 1입니다. 레이블에는 `job_id`, `job_type`, `sync_mode`, `sync_event`, `job_state`, 소스/대상 컴퓨트 그룹이 포함됩니다 |
| `doris_fe_file_cache_warm_up_sync_job_size_bytes` | 소스 측에서 제출하고 대상 측에서 완료한 총 워밍업 크기. 바이트 단위이며, `side` 및 `window` 레이블을 포함합니다 |
| `doris_fe_file_cache_warm_up_sync_job_trigger_gap_ms` | 소스의 최신 트리거 시간과 대상의 진행 워터마크 간 시간 차이. 밀리초 단위 |

자주 사용하는 PromQL 예시:

```promql
# Total warm-up size submitted by the source side in the last 5 minutes for each job
doris_fe_file_cache_warm_up_sync_job_size_bytes{side="src",window="5m"}

# Total warm-up size completed by the target side in the last 5 minutes for each job
doris_fe_file_cache_warm_up_sync_job_size_bytes{side="dst",window="5m"}

# Sync size gap in the last 5 minutes for each job
doris_fe_file_cache_warm_up_sync_job_size_bytes{side="src",window="5m"}
  - ignoring(side)
doris_fe_file_cache_warm_up_sync_job_size_bytes{side="dst",window="5m"}

# Trigger progress time gap for each job
doris_fe_file_cache_warm_up_sync_job_trigger_gap_ms
```

`ignoring(side)`는 소스와 대상의 크기 시계열을 뺄 때 Prometheus가 `side` 레이블을 무시하도록 합니다. 따라서 작업과 시간 구간이 동일한 `src` 및 `dst` 시계열을 서로 대응시킬 수 있습니다.

## 전체 절차 {#end-to-end-procedure}

1. 현재 컴퓨트 그룹을 조회하고 소스 및 대상 컴퓨트 그룹 이름을 확인합니다.

    ```sql
    SHOW COMPUTE GROUPS;
    ```

2. 워밍업이 필요한 테이블 범위를 확인합니다.

    ```sql
    SHOW TABLES FROM ods;
    SHOW TABLES FROM dw;
    ```

3. 테이블 수준의 이벤트 기반 워밍업 작업을 생성합니다.

    ```sql
    WARM UP COMPUTE GROUP read_cg WITH COMPUTE GROUP write_cg
    ON TABLES (
        INCLUDE 'ods.*',
        INCLUDE 'dw.fact_*',
        EXCLUDE 'ods.tmp_*'
    )
    PROPERTIES (
        "sync_mode" = "event_driven",
        "sync_event" = "load"
    );
    ```

4. 작업 상태와 일치하는 테이블을 확인합니다.

    ```sql
    SHOW WARM UP JOB;
    ```

5. 데이터를 쓴 후 동기화 진행 상황을 확인합니다.

    ```sql
    SHOW WARM UP JOB WHERE id = <job_id>;
    ```

6. 규칙을 조정하려면 기존 작업을 취소하고 새 작업을 생성합니다.

    ```sql
    CANCEL WARM UP JOB WHERE id = <job_id>;
    ```

## 권장 사항 {#best-practices}

- 쿼리 컴퓨트 그룹이 소수의 핵심 테이블에만 접근한다면 테이블 수준의 이벤트 기반 워밍업을 사용하는 것이 좋습니다. 컴퓨트 그룹 수준의 워밍업으로 인한 과도한 캐시 사용을 방지할 수 있습니다.
- 테이블 명명 규칙이 명확한 데이터 웨어하우스에서는 `INCLUDE 'dws.*'`, `INCLUDE 'ads.*'`, `EXCLUDE '*.tmp_*'` 같은 규칙을 사용하면 유지 관리가 쉽습니다.
- 여러 작업이 동일한 핫 테이블을 대상으로 삼지 않도록 하세요. 대상 측에서 가능한 한 중복 다운로드를 피하더라도 작업 관리와 지표 해석은 더 복잡해집니다.
- 워밍업 범위를 변경하려면 작업을 취소하고 다시 생성하세요. 기존 작업의 규칙이 자동으로 변경될 것으로 기대하지 마세요.
- 개별 작업의 세부 정보는 `SHOW WARM UP JOB`으로 확인하고, 장기적인 추세는 Grafana에서 FE Prometheus 지표로 모니터링하세요.

## 자주 묻는 질문 {#faq}

**질문: 한 차례의 동기화가 실패하면 전체 작업이 취소되나요?**

아니요. 현재 회차의 동기화가 실패하면 해당 실행만 건너뜁니다. 작업 상태는 그대로 유지되며 이후 주기에도 재시도합니다. `SHOW WARM UP JOB WHERE id = <job_id>`를 실행하여 `ErrMsg`와 `SyncStats`의 실패 횟수를 확인한 다음, BE 로그에서 근본 원인을 확인할 수 있습니다.

**질문: 주기적 작업 실행이 시간 초과되면 어떻게 되나요?**

시간이 초과되면 시스템은 현재 회차를 건너뜁니다. 작업 자체는 삭제되지 않으며 다음 주기에 정상적으로 트리거됩니다. `StartTime`, `FinishTime`, `FinishBatch`, `AllBatch`를 `SHOW WARM UP JOB`에서 확인하여 가장 최근 실행 상황을 파악할 수 있습니다.

**질문: 여러 소스 컴퓨트 그룹에서 동일한 대상 컴퓨트 그룹으로 동기화할 수 있나요?**

예. 예를 들어 컴퓨트 그룹 A와 컴퓨트 그룹 C는 모두 컴퓨트 그룹 B로 동기화할 수 있습니다(A -> B와 C -> B가 공존). 여러 작업이 동일한 테이블을 대상으로 삼으면 작업 관리와 지표 해석이 더 복잡해집니다.

**질문: 테이블 수준의 이벤트 기반 워밍업은 언제 사용해야 하나요?**

대상 컴퓨트 그룹이 일부 테이블만 쿼리하거나, 소스 컴퓨트 그룹에 테이블이 많지만 그중 일부만 자주 사용하는 경우에 사용하세요. 불필요한 워밍업과 캐시 오염을 줄일 수 있습니다.

**질문: `ON TABLES`를 사용하지 않으면 어떻게 되나요?**

`ON TABLES`가 없으면 컴퓨트 그룹 수준의 이벤트 기반 워밍업 작업이 됩니다. 소스 컴퓨트 그룹에서 해당 이벤트로 생성된 새 데이터가 워밍업을 트리거합니다.

**질문: `INCLUDE`와 `EXCLUDE`의 순서가 중요한가요?**

아니요. Doris는 먼저 모든 `INCLUDE` 규칙의 합집합을 계산한 다음, `EXCLUDE` 규칙과 일치하는 모든 테이블을 제거합니다.

**질문: 작업 생성 후 규칙과 일치하는 테이블을 새로 만들면 자동으로 워밍업되나요?**

예. Doris는 규칙을 주기적으로 재평가합니다. 새 테이블이 규칙과 일치하면 이후 갱신 주기에서 워밍업 범위에 포함됩니다. 기본 갱신 간격은 60초입니다.

**질문: 테이블 이름을 변경한 후에도 워밍업이 계속되나요?**

새 테이블 이름이 `ON TABLES` 규칙과 계속 일치하는지에 따라 달라집니다. 일치하면 워밍업이 계속됩니다. 일치하지 않으면 이후 갱신 주기에서 워밍업이 중단됩니다.

**질문: 테이블의 특정 파티션만 워밍업할 수 있나요?**

테이블 수준의 이벤트 기반 워밍업은 테이블 단위로 필터링하며, `ON TABLES`에서 파티션을 지정하는 기능은 지원하지 않습니다. 일치하는 테이블의 새 데이터는 테이블 수준 규칙에 따라 처리됩니다.

**질문: 워밍업이 적용되었는지 어떻게 확인하나요?**

다음과 같이 확인할 수 있습니다.

1. `SHOW WARM UP JOB WHERE id = <job_id>`를 실행하고 `Status`가 `RUNNING` 또는 `FINISHED`인지 확인합니다.
2. 테이블 수준의 이벤트 기반 워밍업이라면 `MatchedTables`가 예상과 일치하는지 확인합니다.
3. `FinishBatch`와 `AllBatch`를 비교하여 일회성 또는 주기적 작업의 진행 상황을 확인합니다.
4. `SyncStats`를 확인하여 `gap_size` 또는 세부 `gap_*` 값이 0에 가까워지고 `trigger_gap_ms`가 계속 증가하지 않는지 확인합니다.
5. 대상 컴퓨트 그룹의 BE Bvar 지표를 확인하여 `file_cache_event_driven_warm_up_finished_segment_num` 같은 완료 카운터가 계속 증가하는지 확인합니다.
6. 대상 컴퓨트 그룹에서 관련 테이블을 쿼리하고, File Cache 적중률, FE 지표, BE 로그를 사용하여 여전히 원격 읽기가 많이 발생하는지 확인합니다.

**질문: 동기화 간격이나 `ON TABLES` 규칙 등 동기화 작업의 구성을 어떻게 수정하나요?**

현재 버전에서는 직접 수정할 수 없습니다. 먼저 `CANCEL WARM UP JOB WHERE id = <job_id>`를 실행하여 기존 작업을 취소한 다음 새 작업을 생성해야 합니다.
