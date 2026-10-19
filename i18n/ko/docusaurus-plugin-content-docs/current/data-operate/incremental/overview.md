---
{
    "title": "변경 데이터 및 증분 소비 개요",
    "language": "ko",
    "description": "Doris 5.0의 행 수준 변경 데이터: Row Binlog는 삽입, 업데이트, 삭제를 기록하고, Table Stream은 오프셋을 기준으로 이를 소비하며, @incr는 시간 범위로 이를 쿼리하고, IVM은 비동기 구체화된 뷰를 행 단위로 유지 관리합니다.",
    "keywords": [
        "Doris 증분 소비",
        "Doris 변경 데이터",
        "Row Binlog",
        "행 수준 binlog",
        "Table Stream",
        "Incremental View Maintenance",
        "IVM",
        "@incr 증분 쿼리",
        "증분 ETL",
        "다운스트림 테이블 동기화",
        "변경 감사",
        "CDC",
        "Change Data Capture",
        "UPDATE_BEFORE UPDATE_AFTER",
        "append_only min_delta detail",
        "enable_feature_binlog",
        "enable_table_stream",
        "Merge-on-Write"
    ]
}
---

<!-- Knowledge type: Concept description + Selection guide -->
<!-- Use cases: Incremental ETL / Downstream sync / Change auditing / Incremental reads by time window -->

Doris는 버전 5.0부터 내부 테이블의 행 수준 변경 로그(Row Binlog)를 기록할 수 있으며, 이러한 변경 사항을 읽는 두 가지 방법을 제공합니다.

- **Table Stream**: 소비한 위치를 기억하는 이름이 있는 소비 객체입니다. 읽을 때마다 마지막 소비 이후의 변경 사항만 반환하며, 변경 사항 읽기와 대상 테이블 쓰기가 하나의 트랜잭션에서 이루어집니다.
- **증분 쿼리(`@incr`)**: 객체를 생성할 필요가 없습니다. 지정한 시간 범위 내의 테이블 변경 사항을 읽습니다.

비동기 구체화된 뷰는 상위 수준 기능인 [Incremental View Maintenance (IVM)](../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view)도 사용할 수 있습니다. IVM을 사용하면 Doris가 내부 Table Stream을 자동으로 관리하고, 행 수준 변경 사항을 바탕으로 구체화된 뷰를 유지 관리합니다. 구체화된 뷰를 유지 관리해야 한다면 Stream을 직접 생성하고 소비하는 대신 IVM을 바로 사용하세요.

:::caution 실험적 기능
이 기능은 버전 5.0.0부터 사용할 수 있습니다. 실험적 기능이며 기본적으로 비활성화되어 있습니다. 활성화 방법은 [사전 요구 사항](#prerequisites)을 참조하세요.
:::

## 해결하는 문제 {#what-problems-it-solves}

<!-- Knowledge type: Problem background -->

Doris 내부에서 증분 처리를 수행할 때는 일반적으로 다음과 같은 문제가 발생합니다.

| 문제 | 변경 기록이 없는 경우 | Row Binlog를 사용하는 경우 |
|---|---|---|
| 다운스트림에서 증분 데이터가 필요하지만 가져올 수 없음 | 업스트림 테이블에 매일 많은 업데이트와 삭제가 발생하므로 다운스트림 보고서, 와이드 테이블, 집계 테이블은 전체를 다시 계산하거나 애플리케이션에서 관리하는 `update_time` 컬럼에 의존해야 함 | Table Stream이 두 번의 소비 사이에 발생한 변경 사항만 반환하므로 다운스트림에서 증분 데이터만 처리함 |
| 업데이트와 삭제 내역을 확인할 수 없음 | Unique Key 테이블을 업데이트하면 이전 값을 덮어쓰고, 삭제된 행은 사라지므로 나중에 무엇이 변경되거나 삭제되었는지 알 수 없음 | 각 행의 모든 삽입, 업데이트(변경 전후 값 포함), 삭제가 기록됨 |
| 여러 테이블의 증분 데이터가 같은 시점에 맞지 않음 | 증분 데이터를 차원 테이블과 조인할 때 차원 테이블은 "현재" 상태인 반면, 증분 데이터는 "과거의 일정 기간"에 해당함 | `<stream>@snapshot()`으로 소비 오프셋에 맞는 차원 테이블 이미지를 읽음 |

Row Binlog는 각 행의 모든 삽입, 업데이트(업데이트 전후 값 포함), 삭제를 전역적으로 단조 증가하는 커밋 타임스탬프와 함께 기록합니다. Table Stream과 증분 쿼리는 이러한 기록을 서로 다른 방식으로 읽습니다.

## 두 계층 {#two-layers}

<!-- Knowledge type: Architecture description -->

![증분 소비의 두 계층: Row Binlog가 Table Stream과 증분 쿼리에 변경 데이터를 제공](/images/next/data-operate/incremental/two-layers.png)

| 기능 | 필요한 객체 | 위치 추적 주체 | 적합한 용도 |
|---|---|---|---|
| Table Stream | `CREATE STREAM` 필요 | Doris가 파티션별 소비 오프셋을 관리 | 지속적인 증분 ETL, 다운스트림 동기화, exactly-once 소비 |
| 증분 쿼리 `@incr` | 생성할 객체 없음 | 사용자가 시간 범위를 선택 | 애드혹 분석, 처리 위치를 직접 관리하는 외부 스케줄러 |

IVM은 이 두 계층 위에서 동작합니다. Row Binlog가 기록한 변경 사항과 Doris가 자동으로 생성하는 내부 Table Stream을 사용하지만, 사용자는 계속 `CREATE MATERIALIZED VIEW`와 `REFRESH MATERIALIZED VIEW`를 통해 이용합니다.

## 대표적인 시나리오 {#typical-scenarios}

<!-- Knowledge type: Scenario description -->
<!-- Use cases: Incremental sync to a downstream table / Append-only logs / Change auditing and replay / Joining dimension tables -->

![대표적인 네 가지 시나리오별 권장 증분 소비 방식](/images/next/data-operate/incremental/typical-scenarios.png)

| 시나리오 | 권장 방식 | 동작 방식 | 참고 |
|---|---|---|---|
| 다운스트림 테이블로 증분 동기화 | Table Stream, `min_delta` 유형 | 주문 테이블에 매일 많은 상태 업데이트가 발생합니다. `min_delta` Table Stream을 생성하고 주기적으로 `INSERT INTO downstream SELECT ... FROM the orders stream`을 실행합니다. 각 실행은 두 번의 실행 사이에 발생한 순변경분만 처리합니다. 여기에는 새 주문, 상태가 변경된 주문(변경 전후 값 포함), 삭제된 주문이 포함됩니다. 변경 사항 읽기와 다운스트림 테이블 쓰기는 하나의 트랜잭션에서 이루어집니다. 실패하면 자동으로 롤백되므로 누락되거나 중복 소비되는 데이터가 없습니다 | [Table Stream 기본](table-stream) |
| 추가 전용 로그 및 이벤트 테이블 | Table Stream, `append_only` 유형 | 삽입만 발생하는 상세 테이블에서 최소 비용으로 새로 기록된 행만 가져옵니다 | [소비 유형](table-stream#consumption-types) |
| 변경 감사 및 재생 | Table Stream의 `detail` 유형 또는 `DETAIL` 모드로 실행하는 `@incr` | 모든 수정의 전체 이력이 필요할 때 소비 오프셋이나 시간 범위를 기준으로 행별 변경 사항을 내보내 감사 테이블에 저장합니다 | [증분 쿼리](incremental-query) |
| 증분 데이터와 차원 테이블 간 일관된 조인 | `<stream>@snapshot()` | 주문 변경 사항을 소비할 때 사용자 테이블과 조인해야 합니다. `users_stream@snapshot()`은 소비 오프셋에 맞는 사용자 테이블 이미지를 읽으므로 새 주문이 오래된 사용자 정보와 조인되거나 그 반대의 상황이 발생하지 않습니다 | [스냅샷 읽기](table-stream-advanced#snapshot-reads-snapshot) |

## 기능 지원 표 {#capability-matrix}

### 테이블 모델 {#table-models}

<!-- Knowledge type: Support matrix -->

| 테이블 모델 | Row Binlog | 변경 전 이미지 | 사용 가능한 변경 유형 |
|---|---|---|---|
| Duplicate Key | 지원 | 지원하지 않음 | APPEND만 지원 |
| Unique Key (Merge-on-Write, 클러스터 키 없음) | 지원 | 지원 (`binlog.need_historical_value = true`) | APPEND / UPDATE_BEFORE / UPDATE_AFTER / DELETE |
| Unique Key (Merge-on-Read) | 지원하지 않음 | - | - |
| Aggregate Key | 지원하지 않음 | - | - |

기타 제한 사항(자동 증가 컬럼, VARIANT 컬럼, 스키마 변경 범위 등)은 [Row Binlog](row-binlog#supported-scope-and-limitations)에 나와 있습니다.

### 소비 유형 선택 {#choosing-a-consumption-type}

<!-- Knowledge type: Selection guide -->

| 필요한 데이터 | 선택할 유형 | 참고 사항 |
|---|---|---|
| 새로 삽입된 행만 필요 | `append_only` | 업데이트와 삭제는 출력하지 않으며, 오버헤드가 가장 낮음 |
| 두 번의 소비 사이에 발생한 각 키의 순변경분 | `min_delta` (기본값) | 같은 키에 대한 여러 수정 사항을 하나의 UPDATE_BEFORE + UPDATE_AFTER 쌍으로 병합하며, 삽입 후 삭제된 키는 출력하지 않음 |
| 모든 수정의 전체 기록 | `detail` | 병합하지 않고 행별로 출력 |

UPDATE_BEFORE와 DELETE 행은 `min_delta` 및 `detail`에서 변경 전 이미지가 필요하므로, 기본 테이블은 `binlog.need_historical_value`가 활성화된 MoW 테이블이어야 합니다.

## 사전 요구 사항 {#prerequisites}

<!-- Knowledge type: Environment requirements -->
<!-- Use cases: Pre-deployment check / Enabling the feature -->

1. **버전**: Doris 5.0.0 이상.
2. **FE 설정**: `fe.conf`에서 다음 두 항목을 활성화하고 FE를 다시 시작합니다(둘 다 동적 설정이 아닙니다).

    ```text
    enable_feature_binlog = true
    enable_table_stream = true
    ```

    `enable_feature_binlog`는 Row Binlog와 커밋 타임스탬프(TSO) 할당을 제어하고, `enable_table_stream`은 Table Stream DDL을 제어합니다. 비활성화된 상태에서 Stream을 생성하면 `Table Stream is experimental. Please set enable_table_stream=true to enable it.` 오류가 발생합니다.

3. **테이블 생성 시 Row Binlog 활성화**: Row Binlog는 테이블을 생성할 때만 활성화할 수 있습니다. 기존 테이블에서는 `ALTER TABLE`로 활성화할 수 없으므로, 테이블을 다시 생성하고 데이터를 다시 적재해야 합니다.
4. **배포 모드**: Row Binlog와 Table Stream은 스토리지·컴퓨팅 통합 모드와 컴퓨팅·스토리지 분리 모드 모두에서 동작합니다. `@incr` 증분 쿼리는 현재 통합 모드에서 사용하세요. 분리 모드 지원은 아직 개발 중입니다.

:::tip 쓰기 오버헤드
Row Binlog를 활성화하면 쓰기 작업마다 변경 기록을 추가로 생성하고 영구 저장하며, MoW 테이블은 이전 값도 읽어야 합니다. 이로 인해 데이터 적재 처리량이 눈에 띄게 감소합니다. 증분 소비가 꼭 필요한 테이블에만 활성화하고, 운영 환경에 적용하기 전에 실제와 유사한 워크로드로 평가하세요.
:::

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ -->

| 질문 | 답변 |
|---|---|
| 기존 테이블에서 Row Binlog를 활성화할 수 있나요? | 아니요. Row Binlog는 테이블 생성 시에만 활성화할 수 있습니다. Row Binlog를 활성화한 새 테이블을 생성하고 데이터를 다시 적재하세요. [Row Binlog](row-binlog#enabling-row-binlog)를 참조하세요 |
| Table Stream과 `@incr` 중 무엇을 사용해야 하나요? | exactly-once를 보장해야 하는 지속적인 증분 ETL에는 Table Stream을 사용하세요. 애드혹 분석, 특정 기간의 변경 이력 조회, 처리 위치를 이미 직접 관리하는 외부 시스템에는 `@incr`를 사용하세요. [Table Stream과의 차이점](incremental-query#differences-from-table-stream)을 참조하세요 |
| Stream을 생성하면 `Table Stream is experimental. Please set enable_table_stream=true to enable it.` 오류가 발생합니다 | FE에서 `enable_table_stream`이 활성화되어 있지 않습니다. `fe.conf`를 수정하고 FE를 다시 시작하세요 |
| 컴퓨팅·스토리지 분리 모드에서 동작하나요? | Row Binlog와 Table Stream은 동작합니다. `@incr`는 현재 스토리지·컴퓨팅 통합 모드에서 사용하세요 |
| Row Binlog는 쓰기에 어떤 영향을 주나요? | 쓰기 작업마다 변경 기록을 추가로 생성하고 영구 저장하며, MoW 테이블은 이전 값도 읽으므로 데이터 적재 처리량이 눈에 띄게 감소합니다. 증분 소비가 필요한 테이블에만 활성화하고 실제와 유사한 워크로드로 평가하세요 |
| 변경 기록은 자동으로 정리되나요? | 네. `binlog.ttl_seconds`가 보존 기간을 제어합니다(기본값은 하루). 증분 읽기는 만료된 기록을 걸러 내고, 백그라운드 compaction이 해당 저장 공간을 회수합니다. 보존 기간 내에 변경 사항을 소비하세요. [보존 및 정리](row-binlog#retention-and-cleanup)를 참조하세요 |

## 문서 안내 {#reading-guide}

<!-- Knowledge type: Navigation -->

| 페이지 | 내용 |
|---|---|
| [빠른 시작](quick-start) | 10분 실습: 테이블 생성, Stream 생성, 데이터 쓰기, 변경 사항 확인, 소비 |
| [Row Binlog](row-binlog) | 활성화 방법, 속성, 지원 범위, 변경 기록 모델, DDL 제한 사항, 오버헤드 및 문제 해결 |
| [증분 쿼리](incremental-query) | `@incr` 시간 범위 쿼리와 세 가지 증분 모드 |
| [Table Stream 기본](table-stream) | Stream 생성 및 관리, 세 가지 소비 유형, 초기 행, 읽기와 소비의 차이, 가상 컬럼 |
| [Table Stream 고급](table-stream-advanced) | 파티션 수준 오프셋, 스냅샷 및 재설정, 일관된 조인, 동시 소비, 기본 테이블 변경의 영향, 모니터링 및 복구 |
| [Incremental View Maintenance (IVM)](../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view) | Row Binlog와 내부 Table Stream을 사용하여 비동기 구체화된 뷰를 행 단위로 유지 관리 |
