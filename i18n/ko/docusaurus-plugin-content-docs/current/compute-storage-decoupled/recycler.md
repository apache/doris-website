---
title: 컴퓨팅·스토리지 분리 환경의 데이터 회수(Recycler) - 원리, 구성 및 튜닝
sidebar_label: 데이터 회수(Recycler)
description: 삭제 표시 원리, 보존 기간을 통한 보호, 모니터링 지표, 일반적인 튜닝 시나리오를 포함하여 Doris의 컴퓨팅·스토리지 분리 아키텍처에서 사용하는 Recycler 데이터 회수 메커니즘을 소개합니다.
keywords: [Doris, compute-storage decoupled, data recycling, Recycler, mark-for-deletion, garbage collection, storage space, tuning]
---

<!-- Knowledge type: Architecture principles + Operational configuration -->
<!-- Applicable scenarios: Compute-storage decoupled deployment / Storage space management / Troubleshooting -->

Doris의 컴퓨팅·스토리지 분리 아키텍처는 데이터 회수에 **삭제 표시(Mark-for-Deletion)** 전략을 사용합니다. 전용 Recycler 컴포넌트가 표시된 메타데이터 항목을 주기적으로 스캔하고 해당 객체 파일을 일괄 삭제하여 성능, 안전성, 리소스 활용도 사이의 균형을 최적화합니다.

## 데이터 회수 전략 비교 {#comparison-of-data-recycling-strategies}

<!-- Knowledge type: Architecture selection decision -->

일반적으로 사용하는 세 가지 데이터 회수 전략에는 각각 장단점이 있습니다. Doris의 컴퓨팅·스토리지 분리 아키텍처는 삭제 표시 방식을 선택합니다.

| 전략 | 실행 계기 | 장점 | 단점 |
|----------|---------|------------|---------------|
| **동기 삭제** | 삭제 명령을 실행하면 메타데이터와 파일을 즉시 삭제 | 구현이 간단함 | 응답이 느리고 위험도가 높으며 유예 기간이 없음 |
| **대조를 통한 삭제(역방향)** | 주기적으로 모든 파일을 스캔하고 참조되지 않는 파일을 식별하여 일괄 삭제 | 고아 파일을 정리할 수 있음 | 모든 파일을 순회해야 하므로 I/O 오버헤드가 큼 |
| **삭제 표시(정방향)** | 삭제 시 메타데이터에 표시만 하고, 백그라운드 프로세스가 주기적으로 표시를 스캔하여 파일 삭제 | 응답이 빠르고 유예 기간이 있으며 효율이 높음 | 불필요한 데이터가 일시적으로 스토리지에 남음 |

### 삭제 표시 방식의 장점 {#advantages-of-mark-for-deletion}

삭제 표시 방식은 다른 방식에 비해 다음과 같은 장점이 있습니다.

- **빠른 응답**: `DROP TABLE`은 파일 I/O를 기다리지 않고 meta KV에 삭제 표시만 하므로 사용자가 즉시 응답을 받을 수 있으며, 대용량 테이블을 삭제해도 작업이 차단되지 않습니다.
- **효율적인 일괄 처리**: 백그라운드 프로세스가 파일 삭제를 주기적으로 일괄 처리하므로 시스템 호출 횟수가 줄고 전체 I/O 효율이 높아집니다.
- **실수로 인한 조작에 대한 보호**: 파일이 실제로 삭제되기 전까지 유예 기간이 있습니다. 이 기간 내에는 실수로 삭제한 테이블을 복구할 수 있어 사용자 실수로 인한 위험을 크게 줄일 수 있습니다.
- **트랜잭션 안전성**: 표시 작업은 가벼운 메타데이터 수정 작업입니다. 원자성을 보장하기 쉬워 시스템 장애로 인한 데이터 불일치를 줄일 수 있습니다.
- **부하 분산**: 시스템이 유휴 상태일 때 파일을 삭제할 수 있어 업무 피크 시간대에 I/O 리소스를 과도하게 소비하는 일을 피할 수 있습니다.

## Recycler의 동작 원리 {#how-recycler-works}

<!-- Knowledge type: Architecture principles -->

Recycler는 독립적으로 배포되는 컴포넌트로, 보존 기간이 만료된 불필요한 파일을 주기적으로 회수합니다. 하나의 Recycler가 여러 인스턴스를 동시에 회수할 수 있지만, 동일한 인스턴스는 한 번에 하나의 Recycler만 처리할 수 있습니다.

### 삭제 표시 워크플로 {#mark-for-deletion-workflow}

`DROP` 명령을 실행하거나 시스템에서 불필요한 데이터가 생성될 때마다(예: compaction으로 병합된 rowset) 해당 meta KV가 `recycled` 상태로 표시됩니다. Recycler는 인스턴스의 recycle KV를 주기적으로 스캔하고 다음 순서로 작업을 실행합니다.

1. 해당 객체 파일(segment 파일 등) 삭제
2. recycle KV 삭제

메타데이터보다 파일을 먼저 삭제하여 안전한 삭제 순서를 보장하고, 메타데이터는 이미 삭제되었지만 파일은 남아 있는 상황을 방지합니다.

### 계층적 회수 구조 {#hierarchical-recycling-structure}

<!-- Knowledge type: Operational steps -->

데이터 회수는 상위 계층에서 하위 계층으로 진행됩니다. `DROP TABLE`을 예로 들면 다음과 같습니다.

```
Table
 └─ Partition (delete recycle partition KV)
     └─ Tablet (delete recycle tablet KV)
         └─ Rowset (delete recycle rowset KV)
             └─ Segment files (actual object files, the final deletion unit)
```

회수 중에는 `recycle_indexes`, `recycle_partition`, `recycle_compacted_rowsets`, `recycle_txn` 등 여러 유형의 작업이 동시에 실행됩니다. 각 계층의 recycle KV는 해당 계층에 속한 모든 하위 항목이 성공적으로 삭제된 후에만 삭제됩니다.

### 보존 기간을 통한 보호 메커니즘 {#retention-protection-mechanism}

회수 대기 중인 객체의 각 KV에는 보존 기간이 기록됩니다. Recycler는 스캔할 때 보존 기간을 계산하며, **보존 기간이 아직 만료되지 않은 객체는 삭제하지 않습니다**.

이 메커니즘은 실수로 인한 조작으로부터 데이터를 보호합니다. 사용자가 실수로 테이블을 삭제하더라도 보존 기간이 만료되기 전까지는 Recycler가 해당 데이터를 삭제하지 않으므로, 사용자는 그 기간에 데이터를 복구할 수 있습니다.

### 신뢰성 보장 {#reliability-guarantees}

<!-- Knowledge type: Architecture principles -->

**단계적 삭제**: 데이터 파일을 먼저 삭제한 다음 메타데이터를 삭제하고, 마지막으로 인덱스나 파티션의 KV를 삭제하여 안전한 삭제 순서를 보장합니다.

**리스 보호 메커니즘**: 각 Recycler는 회수를 시작하기 전에 리스를 획득해야 하며, 백그라운드 스레드가 주기적으로 리스를 갱신합니다. 리스가 만료되거나 상태가 IDLE일 때만 새로운 Recycler가 작업을 인계받을 수 있습니다. 이를 통해 특정 인스턴스는 한 번에 하나의 Recycler만 회수하도록 보장하고, 동시 회수로 인한 데이터 불일치를 방지합니다.

### 다계층 검사 메커니즘(Checker) {#multi-layer-check-mechanism-checker}

<!-- Knowledge type: Architecture principles -->

Recycler는 FE 메타데이터, MS KV, 객체 파일 간의 다계층 상호 검사 메커니즘(checker)을 구현합니다. checker는 백그라운드에서 모든 Recycler KV, 객체 파일, FE 메모리 내 메타데이터를 대상으로 양방향 검사를 수행합니다.

segment 파일 KV와 객체 파일 검사를 예로 들면 다음과 같습니다.

| 검사 방향 | 검사 내용 |
|-----------------|---------------|
| **정방향 검사** | 모든 KV를 스캔하여 해당 segment 파일이 존재하는지, 해당 segment 정보가 FE 메모리에 있는지 확인 |
| **역방향 검사** | 모든 segment 파일을 스캔하여 각 파일에 대응하는 KV가 있는지, 해당 segment 정보가 FE 메모리에 있는지 확인 |

회수가 누락되거나 과도하게 회수된 경우 checker가 관련 정보를 수집합니다. 운영 담당자는 checker 보고서를 바탕으로 남아 있는 불필요한 파일을 수동으로 삭제하거나, 객체 버전 관리를 통해 실수로 삭제된 파일을 복구할 수 있습니다.

현재 segment 파일, idx 파일, delete bitmap 메타데이터에 대한 정방향 및 역방향 검사를 지원하며, 향후 모든 메타데이터로 검사 범위를 확대할 계획입니다.

## 모니터링 지표 {#monitoring-metrics}

<!-- Knowledge type: Observability -->
<!-- Applicable scenarios: Performance monitoring / Troubleshooting -->

모든 모니터링 지표는 **MS 대시보드**에서 실시간으로 확인할 수 있습니다.

### 주요 모니터링 항목 {#key-monitoring-questions}

| 확인할 항목 | 해당 지표 |
|----------|---------------------|
| 초당 회수 바이트 수, 객체 유형별 초당 회수 개수 | `recycler_instance_recycle_bytes_per_ms`, `recycler_instance_recycle_time_per_resource` |
| 회수 라운드별 데이터양과 소요 시간 | `recycler_instance_last_round_recycled_bytes`, `recycler_instance_last_round_recycle_elpased_ts` |
| 회수된 데이터양 / 회수 대기 중인 데이터양 | `recycler_instance_last_round_recycled_num`, `recycler_instance_last_round_to_recycle_num` |
| 스토리지 백엔드별 회수 상태 | `recycler_vault_recycle_status` |
| 마지막 성공 / 실패 시각 | `recycler_instance_recycle_last_success_ts`, `recycler_instance_recycle_end_ts` |
| 다음 회수 예상 시각 | `recycler_instance_next_ts` |

### 전체 지표 목록 {#full-metrics-list}

| 변수 이름 | 지표 이름 | 차원 / 레이블 | 설명 |
|---------------|--------------|---------------------|-------------|
| `g_bvar_recycler_vault_recycle_status` | `recycler_vault_recycle_status` | instance_id, resource_id, status | 인스턴스 ID, 리소스 ID, 상태별 vault 회수 작업의 상태 집계 |
| `g_bvar_recycler_vault_recycle_task_concurrency` | `recycler_vault_recycle_task_concurrency` | instance_id, resource_id | 인스턴스 ID와 리소스 ID별 vault 파일 회수 작업의 동시 실행 수 집계 |
| `g_bvar_recycler_instance_last_round_recycled_num` | `recycler_instance_last_round_recycled_num` | instance_id, resource_type | 가장 최근 라운드에서 회수된 객체 수 |
| `g_bvar_recycler_instance_last_round_to_recycle_num` | `recycler_instance_last_round_to_recycle_num` | instance_id, resource_type | 가장 최근 라운드에서 회수할 객체 수 |
| `g_bvar_recycler_instance_last_round_recycled_bytes` | `recycler_instance_last_round_recycled_bytes` | instance_id, resource_type | 가장 최근 라운드에서 회수된 데이터양(바이트) |
| `g_bvar_recycler_instance_last_round_to_recycle_bytes` | `recycler_instance_last_round_to_recycle_bytes` | instance_id, resource_type | 가장 최근 라운드에서 회수할 데이터양(바이트) |
| `g_bvar_recycler_instance_last_round_recycle_elpased_ts` | `recycler_instance_last_round_recycle_elpased_ts` | instance_id, resource_type | 가장 최근 회수 작업의 소요 시간(ms) |
| `g_bvar_recycler_instance_recycle_round` | `recycler_instance_recycle_round` | instance_id, resource_type | 회수 작업의 라운드 번호 |
| `g_bvar_recycler_instance_recycle_time_per_resource` | `recycler_instance_recycle_time_per_resource` | instance_id, resource_type | 각 리소스를 회수하는 데 걸린 시간(ms). `-1`은 회수되지 않았음을 의미 |
| `g_bvar_recycler_instance_recycle_bytes_per_ms` | `recycler_instance_recycle_bytes_per_ms` | instance_id, resource_type | 밀리초당 회수 바이트 수. `-1`은 회수되지 않았음을 의미 |
| `g_bvar_recycler_instance_recycle_total_num_since_started` | `recycler_instance_recycle_total_num_since_started` | instance_id, resource_type | Recycler 시작 이후 회수된 총 객체 수 |
| `g_bvar_recycler_instance_recycle_total_bytes_since_started` | `recycler_instance_recycle_total_bytes_since_started` | instance_id, resource_type | Recycler 시작 이후 회수된 총 데이터양(바이트) |
| `g_bvar_recycler_instance_running_counter` | `recycler_instance_running_counter` | — | 현재 회수 중인 인스턴스 수 |
| `g_bvar_recycler_instance_last_round_recycle_duration` | `recycler_instance_last_round_recycle_duration` | instance_id | 가장 최근 회수 라운드의 총 소요 시간 |
| `g_bvar_recycler_instance_next_ts` | `recycler_instance_next_ts` | instance_id | `recycle_interval_seconds`를 기준으로 계산한 다음 회수 예상 시각 |
| `g_bvar_recycler_instance_recycle_st_ts` | `recycler_instance_recycle_start_ts` | instance_id | 전체 회수 프로세스의 시작 시각 |
| `g_bvar_recycler_instance_recycle_ed_ts` | `recycler_instance_recycle_end_ts` | instance_id | 전체 회수 프로세스의 종료 시각 |
| `g_bvar_recycler_instance_recycle_last_success_ts` | `recycler_instance_recycle_last_success_ts` | instance_id | 마지막으로 회수에 성공한 시각 |

## 구성 매개변수 {#configuration-parameters}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Deployment tuning / Performance optimization -->

Recycler에서 자주 사용하는 구성 매개변수는 다음과 같습니다.

| 매개변수 | 기본값 | 설명 |
|-----------|---------|-------------|
| `recycle_interval_seconds` | `3600` | 회수 간격(초) |
| `retention_seconds` | `259200` (3일) | 보존 기간을 개별적으로 설정하지 않은 모든 객체에 적용되는 일반 보존 기간 |
| `recycle_concurrency` | `16` | 하나의 Recycler가 동시에 회수할 수 있는 최대 인스턴스 수 |
| `compacted_rowset_retention_seconds` | `1800` | compaction으로 병합된 rowset의 보존 기간(초) |
| `dropped_index_retention_seconds` | `10800` | 삭제된 인덱스의 보존 기간(초) |
| `dropped_partition_retention_seconds` | `10800` | 삭제된 파티션의 보존 기간(초) |
| `recycle_whitelist` | `""` | 회수 허용 목록. 인스턴스 ID를 쉼표로 구분하여 입력하며, 비어 있으면 모든 인스턴스를 회수 |
| `recycle_blacklist` | `""` | 회수 차단 목록. 인스턴스 ID를 쉼표로 구분하여 입력하며, 비어 있으면 모든 인스턴스를 회수 |
| `instance_recycler_worker_pool_size` | `32` | 객체 I/O 작업(list, delete 등)의 동시 실행 수 |
| `recycle_pool_parallelism` | `40` | 회수 작업(`recycle_tablet`, `recycle_rowset` 등)의 동시 실행 수 |
| `enable_checker` | `false` | 정방향 checker 활성화 여부 |
| `enable_inverted_check` | `false` | 역방향 checker 활성화 여부 |
| `check_object_interval_seconds` | `43200` (12시간) | checker 실행 간격(초) |
| `enable_recycler_stats_metrics` | `false` | Recycler 관측성 지표 활성화 여부 |
| `recycler_storage_vault_white_list` | `""` | 스토리지 백엔드 허용 목록. vault 이름을 쉼표로 구분하여 입력하며, 비어 있으면 모든 vault를 회수 |
| `enable_mark_delete_rowset_before_recycle` | `false` | rowset의 데이터를 실제로 삭제하기 전에 해당 meta를 회수 상태로 표시하고, 다음 스캔 라운드에서 데이터와 KV를 삭제할지 여부. 동적 변경을 지원합니다. **버전 4.0.8부터 기본값이 `true`에서 `false`로 변경되었습니다** |
| `enable_abort_txn_and_job_for_delete_rowset_before_recycle` | `false` | rowset을 삭제하기 전에 관련 트랜잭션과 작업을 중단할지 여부. 동적 변경을 지원합니다. **버전 4.0.8부터 기본값이 `true`에서 `false`로 변경되었습니다** |

:::caution 동작 변경(4.0.8)

`enable_mark_delete_rowset_before_recycle`과 `enable_abort_txn_and_job_for_delete_rowset_before_recycle`의 기본값이 `true`에서 `false`로 4.0.8에서 변경되었습니다.

두 설정 모두 rowset을 삭제하기 전에 수행하는 추가 보호 단계입니다. 하지만 현재 구현에서는 성능 비용이 상당하여 회수 속도가 느려지므로 더 이상 기본적으로 활성화되지 않습니다. 이 보호 기능을 유지하려면 두 설정을 모두 명시적으로 `true`로 설정하세요.

:::

## 일반적인 튜닝 시나리오 {#common-tuning-scenarios}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Troubleshooting / Performance tuning -->

### 회수 속도가 너무 느린 경우 {#recycling-speed-is-too-slow}

**목표**: 불필요한 데이터를 더 빠르게 정리하고 스토리지 공간을 확보합니다.

**조정 방법**:

1. 동시 실행 수를 늘립니다.
    - `recycle_concurrency`(기본값 16): 동시에 회수하는 인스턴스 수를 늘립니다.
    - `instance_recycler_worker_pool_size`(기본값 32): 객체 I/O 작업의 동시 실행 수를 늘립니다.
    - `recycle_pool_parallelism`(기본값 40): 회수 작업의 동시 실행 수를 늘립니다.
2. 회수 간격을 줄입니다. `recycle_interval_seconds`를 기본값인 3600초에서 줄입니다. 예를 들어 1800초로 설정할 수 있습니다.
3. 허용 목록을 사용합니다. `recycle_whitelist`를 사용하여 중요한 인스턴스를 우선적으로 회수합니다.

### 회수 부하가 업무에 영향을 주는 경우 {#recycling-pressure-interferes-with-business}

**목표**: Recycler가 업무 운영에 미치는 영향을 줄입니다.

**조정 방법**:

1. 동시 실행 수를 줄입니다. `recycle_concurrency`, `instance_recycler_worker_pool_size`, `recycle_pool_parallelism`을 적절히 낮춥니다.
2. 회수 간격을 늘립니다. `recycle_interval_seconds`를 늘립니다. 예를 들어 7200초로 설정할 수 있습니다.
3. 차단 목록을 사용합니다. `recycle_blacklist`를 사용하여 부하가 높은 인스턴스를 일시적으로 제외합니다.

### 스토리지 공간이 부족하여 정리 속도를 높여야 하는 경우 {#storage-space-is-insufficient-and-cleanup-needs-to-be-accelerated}

**목표**: 가능한 한 빠르게 스토리지 공간을 확보합니다.

**조정 방법**:

1. 일반 보존 기간을 줄입니다. `retention_seconds`를 기본값인 259200초(3일)에서 줄입니다.
2. 특정 객체 유형의 보존 기간을 줄입니다.
    - `compacted_rowset_retention_seconds`(기본값 1800초)를 적절히 줄일 수 있습니다.
    - `dropped_index_retention_seconds`와 `dropped_partition_retention_seconds`(기본값 10800초)를 필요에 따라 조정할 수 있습니다.
3. 스토리지 백엔드를 선택적으로 회수합니다. `recycler_storage_vault_white_list`를 사용하여 특정 vault를 우선적으로 정리합니다.

### 실수로 인한 삭제를 방지하기 위해 보존 기간을 늘려야 하는 경우 {#retention-time-needs-to-be-extended-to-prevent-accidental-deletion}

**목표**: 실수로 수행한 작업을 복구할 수 있도록 더 긴 유예 기간을 확보합니다.

**조정 방법**:

1. `retention_seconds`를 늘립니다. 예를 들어 604800초(7일)로 설정할 수 있습니다.
2. `dropped_partition_retention_seconds` 등의 매개변수를 객체 유형별 중요도에 따라 개별적으로 조정합니다.

### 모니터링 및 일관성 검사 활성화 {#enable-monitoring-and-consistency-checks}

**목표**: 관측성을 높이고 잠재적인 데이터 일관성 문제를 조사합니다.

**조정 방법**:

1. 관측성 지표를 활성화합니다. `enable_recycler_stats_metrics = true`로 설정합니다.
2. 검사 메커니즘을 활성화합니다.
    - `enable_checker = true`(정방향 검사)
    - `enable_inverted_check = true`(역방향 검사)
3. `check_object_interval_seconds`(기본값 43200초)를 조정하여 적절한 검사 빈도를 설정합니다.

### 특정 인스턴스의 회수가 비정상적인 경우 {#certain-instances-have-abnormal-recycling}

**목표**: 문제가 있는 인스턴스를 일시적으로 격리하여 다른 인스턴스의 회수에 영향을 주지 않도록 합니다.

**조정 방법**:

1. 비정상 인스턴스 ID를 `recycle_blacklist`에 추가하여 일시적으로 건너뜁니다.
2. 우선 처리가 필요한 인스턴스 ID를 `recycle_whitelist`에 추가합니다.
3. `recycler_storage_vault_white_list`를 사용하여 특정 스토리지 백엔드를 선택적으로 회수합니다.

### 대용량 테이블 삭제로 회수 작업이 적체된 경우 {#large-table-deletion-causes-recycling-task-backlog}

**목표**: 누적된 회수 작업을 빠르게 처리합니다.

**조정 방법**:

1. 동시 실행 수 매개변수(`recycle_concurrency`, `recycle_pool_parallelism`)를 일시적으로 높여 적체된 작업을 처리합니다.
2. 허용 목록을 사용하여 적체가 심한 인스턴스를 우선적으로 처리합니다.
3. 필요한 경우 여러 Recycler 인스턴스를 배포하여 부하를 분산합니다.

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Troubleshooting / Common errors -->

### 장시간 실행되는 쿼리에서 "404 File Not Found" 오류 발생 {#long-running-queries-encounter-404-file-not-found-errors}

**증상**: 쿼리가 오랫동안 실행됩니다. 이 기간에 tablet에서 compaction이 수행되고, 병합된 rowset이 Recycler에 의해 회수됩니다. 쿼리가 해당 rowset에 접근할 때 `404 file not found` 오류가 발생합니다.

**원인**: `compacted_rowset_retention_seconds`의 기본값은 1800초(30분)입니다. 쿼리 실행 시간이 이 값을 초과하면 필요한 rowset 파일이 이미 삭제되었을 수 있습니다.

**해결 방법**: 클러스터에서 가장 오래 실행되는 쿼리의 실행 시간을 기준으로 `compacted_rowset_retention_seconds`를 늘립니다. 장시간 실행되는 쿼리가 있는 환경에서는 7200초 이상으로 설정하는 것이 좋습니다.

### 데이터 회수가 정상적으로 진행되는지 확인하는 방법 {#how-to-confirm-that-data-recycling-is-proceeding-normally}

**확인 방법**:

1. `enable_recycler_stats_metrics = true`를 활성화하고 MS 대시보드에서 `recycler_instance_last_round_recycle_duration`과 `recycler_instance_recycle_last_success_ts` 지표를 확인합니다.
2. `recycler_instance_recycle_last_success_ts`가 오랫동안 갱신되지 않았다면 회수가 멈춰 있을 수 있습니다. 로그를 조사하세요.

### 데이터 일관성 문제가 의심될 때 조사하는 방법 {#how-to-investigate-suspected-data-consistency-issues}

**조사 방법**:

1. `enable_checker = true`와 `enable_inverted_check = true`가 설정되어 있는지 확인합니다.
2. `check_object_interval_seconds`를 적절히 줄여 검사 빈도를 높입니다.
3. MS 대시보드에서 checker가 발견한 이상을 확인합니다.
4. checker 보고서를 바탕으로 남아 있는 불필요한 파일을 수동으로 처리하거나, 객체 버전 관리를 사용하여 실수로 삭제된 파일을 복구합니다.

---

> **참고**: 위 튜닝 권장 사항은 실제 클러스터 규모, 스토리지 용량, 업무 특성을 함께 고려하여 평가해야 합니다. 튜닝 중에는 시스템 부하와 업무에 미치는 영향을 면밀히 모니터링하고, 매개변수를 점진적으로 조정하여 최적의 구성을 찾는 것이 좋습니다.
