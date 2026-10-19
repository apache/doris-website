---
{
    "title": "쿼리 중간 결과를 디스크로 스필하기",
    "sidebar_label": "중간 결과를 디스크로 스필하기",
    "language": "ko",
    "description": "대규모 쿼리나 ETL 작업 실행 중 메모리가 부족해지면 Doris는 중간 결과를 디스크로 스필하여 OOM 오류 없이 실행을 계속할 수 있습니다. 이 문서에서는 스필의 작동 방식과 설정 및 모니터링 방법을 설명합니다.",
    "keywords": ["스필", "디스크 스필", "대규모 쿼리 메모리 부족", "OOM", "메모리 관리", "workload group", "쿼리 안정성"]
}
---

<!-- Knowledge type: concept introduction + procedure -->

## 스필이 필요한 이유 {#why-spilling-is-needed}

Doris의 컴퓨팅 계층은 MPP 아키텍처를 기반으로 합니다. 모든 컴퓨팅 작업은 BE 메모리에서 실행되며, 노드 간 데이터 교환도 메모리에 의존하므로 메모리 관리는 쿼리 안정성에 직접적인 영향을 줍니다. **ETL 데이터 처리, 다중 테이블 구체화된 뷰 처리, 복잡한 비정형 쿼리**를 Doris로 이전하는 사용자가 늘어나면서 단일 노드의 메모리에 모든 중간 상태를 담기 어려운 경우가 많아지고 있습니다.

**스필**(spill to disk)은 집계 상태나 정렬 임시 데이터 같은 중간 상태를 디스크에 기록하여, 메모리가 부족한 쿼리도 계속 실행할 수 있게 합니다. 스필은 다음과 같은 세 가지 이점을 제공합니다.

| 이점 | 설명 |
|------|------|
| 확장성 | 단일 노드의 메모리 한도를 초과하는 데이터 세트 처리 |
| 안정성 | 메모리 부족으로 인한 쿼리 오류나 프로세스 비정상 종료 감소 |
| 유연성 | 하드웨어를 추가하지 않고도 더 복잡한 쿼리 실행 |

현재 스필을 지원하는 연산자는 Hash Join, Aggregation, Sort, CTE입니다.

:::caution 참고
스필은 디스크 I/O를 추가로 발생시키므로 쿼리 지연 시간이 크게 늘어날 수 있습니다. 이에 맞춰 세션 변수 `query_timeout`을 늘리고, 스필 디렉터리에 전용 디스크를 마운트하거나 SSD를 사용하여 일반적인 데이터 적재 및 쿼리 워크로드에 미치는 영향을 줄이세요.

**쿼리 스필은 기본적으로 비활성화되어 있습니다.**
:::

## 스필이 트리거되는 방식 {#how-spilling-is-triggered}

Doris는 **메모리 예약(reserve memory)** 메커니즘을 사용하여 스필 발생 시점을 제어합니다. 처리 흐름은 다음과 같습니다.

1. 실행 중에 Doris는 각 Block을 처리하는 데 필요한 메모리를 추정하고 통합 메모리 관리자에 요청합니다.
2. 전역 메모리 할당기는 이 요청이 쿼리, Workload Group 또는 프로세스의 메모리 한도를 초과하는지 확인합니다.
3. 한도를 초과하면 요청이 실패합니다. Doris는 현재 쿼리를 일시 중단하고 메모리를 가장 많이 사용하는 연산자에서 스필을 트리거합니다.
4. 스필이 완료되면 쿼리가 실행을 계속합니다.

## 메모리 관리 계층 {#memory-management-hierarchy}

Doris의 메모리 관리는 **프로세스 수준 -> Workload Group 수준 -> 쿼리 수준**의 세 단계로 구성됩니다. 스필 동작은 이 세 수준의 제약을 모두 받습니다.

### 프로세스 수준 메모리(BE) {#process-level-memory-be}

`mem_limit` 매개변수는 `be.conf`에서 전체 BE 프로세스의 메모리 상한을 제어합니다. 메모리 사용량이 이 임계값을 초과하면 Doris는 현재 메모리를 요청 중인 쿼리를 취소하고, 비동기 백그라운드 작업이 일부 쿼리를 종료하거나 캐시를 해제합니다.

**문제가 자주 발생하는 두 가지 상황:**

- **혼합 배포**: BE가 FE, Kafka, HDFS 또는 다른 프로세스와 호스트를 공유하면 실제 사용 가능한 메모리가 `mem_limit`보다 훨씬 적을 수 있습니다. 이 경우 메모리 해제 메커니즘이 제대로 작동하지 않아 OS OOM Killer가 실행됩니다.
- **컨테이너 배포**: K8s 또는 Cgroup 환경에서는 Doris가 컨테이너의 메모리 설정을 자동으로 감지하므로 수동 조정이 필요하지 않습니다.

### Workload Group 메모리 {#workload-group-memory}

<!-- Knowledge type: parameter reference -->

| 매개변수 | 설명 |
|------|------|
| `max_memory_percent` | 이 Workload Group이 사용할 수 있는 프로세스 메모리의 최대 비율입니다. 이를 초과하면 스필이 트리거되거나 쿼리가 종료됩니다. |
| `min_memory_percent` | 이 Workload Group에 보장되는 최소 메모리 비율입니다. 메모리가 부족하면 시스템은 이 값을 기준으로 메모리를 할당하여 다른 그룹에도 충분한 메모리가 확보되도록 합니다. |
| `memory_low_watermark` | 메모리 사용량의 하한 워터마크입니다. 기본값은 50%입니다. |
| `memory_high_watermark` | 메모리 사용량의 상한 워터마크입니다. 기본값은 80%입니다. 이 값을 초과하면 메모리 예약 요청이 실패하고 스필이 트리거됩니다. |

제약 조건: 모든 Workload Group의 `min_memory_percent` 합계는 100%를 초과할 수 없으며, 단일 그룹의 `min_memory_percent`는 해당 그룹의 `max_memory_percent`보다 클 수 없습니다.

### 쿼리 수준 메모리 {#query-level-memory}

#### 정적 메모리 할당 {#static-memory-allocation}

`exec_mem_limit`는 쿼리 실행 전에 세션 변수로 설정하며, 실행 중에는 동적으로 변경할 수 없습니다.

:::warning 업그레이드 참고 사항
`exec_mem_limit`의 기본값은 **버전 3.1** 이전에는 2 GB였으며, 버전 3.1 이상에서는 100 GB로 변경되었고 BE 측에서 실제로 적용됩니다. 버전 3.1 이상으로 업그레이드하기 전에 이 매개변수를 `100g`로 명시적으로 설정하여 기존 쿼리가 한도 초과로 취소되거나 예기치 않은 스필이 발생하지 않도록 하세요.
:::

#### 슬롯 기반 동적 메모리 할당 {#slot-based-dynamic-memory-allocation}

정적 할당 방식에서는 사용자가 단일 쿼리에 필요한 메모리를 정확히 추정하기 어려워 값을 지나치게 높게 설정하는 경우가 많습니다. 예를 들어 프로세스 메모리의 절반으로 설정하면 메모리를 세밀하게 제어하기 어려워집니다. Workload Group의 슬롯 메커니즘은 이 문제를 해결합니다.

**작동 방식:**

- Workload Group에 `max_memory_percent`와 `max_concurrency`를 설정하면 BE 메모리가 논리적으로 `max_concurrency`개의 슬롯으로 나뉘며, 각 슬롯의 메모리 = `max_memory_percent x mem_limit / max_concurrency`가 됩니다.
- 기본적으로 각 쿼리는 1개의 슬롯을 차지합니다. 더 많은 메모리를 사용하려면 세션 변수 `query_slot_count`를 변경하세요.
- 쿼리가 더 많은 슬롯을 차지하면 Workload Group에서 동시에 실행할 수 있는 쿼리 수가 자동으로 줄어들고, 새 쿼리는 대기열에 들어갑니다.

**`slot_memory_policy`에 설정할 수 있는 값:**

| 값 | 설명 |
|----|------|
| `none` | 기본값입니다. 활성화되지 않은 상태입니다. 쿼리는 가능한 한 많은 메모리를 사용하며, Workload Group의 한도에 도달하면 스필이 트리거됩니다. |
| `fixed` | 쿼리별 메모리 = `workload group mem_limit x query_slot_count / max_concurrency`입니다. 동시 실행 수에 따라 고정 할당합니다. |
| `dynamic` | 쿼리별 메모리 = `workload group mem_limit x query_slot_count / sum(running query slots)`입니다. 유휴 슬롯의 메모리는 실행 중인 대규모 쿼리에 동적으로 재할당됩니다. |

`fixed`와 `dynamic`은 모두 엄격한 한도입니다. 한도를 초과하면 스필이 트리거되거나 쿼리가 종료되며, 정적으로 할당된 `exec_mem_limit`보다 우선 적용됩니다. `slot_memory_policy`를 설정할 때는 `max_concurrency`를 신중하게 설정하세요. 그렇지 않으면 메모리 부족 문제가 발생할 수 있습니다.

## 쿼리 스필 활성화 {#enable-query-spilling}

<!-- Knowledge type: procedure -->

### 1단계: BE 스필 경로 설정 {#step-1-configure-be-spill-paths}

다음 설정을 `be.conf`에 추가하세요. 변경 사항을 적용하려면 **변경 후 BE를 재시작해야 합니다**.

```properties
spill_storage_root_path=/mnt/disk1/spilltest/doris/be/storage;/mnt/disk2/doris-spill;/mnt/disk3/doris-spill
spill_storage_limit=100%
```

| 매개변수 | 설명 |
|------|------|
| `spill_storage_root_path` | 스필 파일의 저장 경로입니다. 기본값은 `storage_root_path`와 같습니다. 전용 디스크 경로를 사용하는 것이 좋습니다. |
| `spill_storage_limit` | 스필 파일이 사용할 수 있는 최대 디스크 용량입니다. 절대값(예: `100G` 또는 `1T`)이나 백분율(기본값 `20%`)을 지원합니다. 전용 디스크를 사용한다면 `100%`로 설정할 수 있습니다. |

### 2단계: FE 세션 변수 설정 {#step-2-configure-fe-session-variables}

```sql
SET enable_spill = true;
SET exec_mem_limit = 10g;
SET query_timeout = 3600;
```

| 변수 | 설명 |
|------|------|
| `enable_spill` | 스필 활성화 여부입니다. 기본값은 `false`입니다. 활성화하면 메모리가 부족할 때 스필이 자동으로 트리거됩니다. |
| `exec_mem_limit` | 단일 쿼리가 사용할 수 있는 최대 메모리입니다. |
| `query_timeout` | 스필은 쿼리 지연 시간을 늘리므로 이에 맞춰 제한 시간을 늘리세요(단위: 초). |

### 3단계: Workload Group 설정(선택 사항) {#step-3-configure-workload-group-optional}

단일 Workload Group이 프로세스 메모리를 모두 소모하지 않도록 `max_memory_percent`를 조정하세요.

```sql
ALTER WORKLOAD GROUP normal PROPERTIES ('max_memory_percent'='90%');
```

대규모 쿼리가 먼저 스필하도록 슬롯 기반 동적 메모리 할당을 활성화하세요.

```sql
ALTER WORKLOAD GROUP normal PROPERTIES ('slot_memory_policy'='dynamic');
```

## 스필 상태 모니터링 {#monitor-spilling-status}

<!-- Knowledge type: monitoring and operations -->

### 감사 로그 {#audit-log}

FE 감사 로그에는 스필 읽기 및 쓰기 데이터량을 기록하는 다음 필드가 추가됩니다.

```
SpillWriteBytesToLocalStorage=503412182|SpillReadBytesFromLocalStorage=503412182
```

| 필드 | 설명 |
|------|------|
| `SpillWriteBytesToLocalStorage` | 스필 중 디스크에 기록한 총 데이터량(바이트)입니다. |
| `SpillReadBytesFromLocalStorage` | 스필 중 디스크에서 읽은 총 데이터량(바이트)입니다. |

### 쿼리 Profile {#query-profile}

쿼리에서 스필이 트리거되면 Profile에 `Spill` 접두사가 붙은 카운터가 표시됩니다. HashJoin Build HashTable을 예로 들면 다음과 같습니다.

```
PARTITIONED_HASH_JOIN_SINK_OPERATOR  (id=4  ,  nereids_id=179):(ExecTime:  6sec351ms)
      -  Spilled:  true
      -  CloseTime:  528ns
      -  ExecTime:  6sec351ms
      -  InitTime:  5.751us
      -  InputRows:  6.001215M  (6001215)
      -  MemoryUsage:  0.00  
      -  MemoryUsagePeak:  554.42  MB
      -  MemoryUsageReserved:  1024.00  KB
      -  OpenTime:  2.267ms
      -  PendingFinishDependency:  0ns
      -  SpillBuildTime:  2sec437ms
      -  SpillInMemRow:  0
      -  SpillMaxRowsOfPartition:  68.569K  (68569)
      -  SpillMinRowsOfPartition:  67.455K  (67455)
      -  SpillPartitionShuffleTime:  836.302ms
      -  SpillPartitionTime:  131.839ms
      -  SpillTotalTime:  5sec563ms
      -  SpillWriteBlockBytes:  714.13  MB
      -  SpillWriteBlockCount:  1.344K  (1344)
      -  SpillWriteFileBytes:  244.40  MB
      -  SpillWriteFileTime:  350.754ms
      -  SpillWriteFileTotalCount:  32
      -  SpillWriteRows:  6.001215M  (6001215)
      -  SpillWriteSerializeBlockTime:  4sec378ms
      -  SpillWriteTaskCount:  417
      -  SpillWriteTaskWaitInQueueCount:  0
      -  SpillWriteTaskWaitInQueueTime:  8.731ms
      -  SpillWriteTime:  5sec549ms
```

`Spilled: true`는 해당 연산자에서 스필이 트리거되었음을 나타냅니다.

### 시스템 테이블 `backend_active_tasks` {#system-table-backend_active_tasks}

진행 중인 쿼리의 스필 데이터량을 실시간으로 확인할 수 있도록 `information_schema.backend_active_tasks`에 새 열 두 개가 추가됩니다.

| 열 | 설명 |
|------|------|
| `SPILL_WRITE_BYTES_TO_LOCAL_STORAGE` | 현재 쿼리가 디스크에 기록한 스필 데이터량(바이트)입니다. |
| `SPILL_READ_BYTES_FROM_LOCAL_STORAGE` | 현재 쿼리가 디스크에서 읽은 스필 데이터량(바이트)입니다. |

```sql
SELECT * FROM information_schema.backend_active_tasks;
```

출력 예시:

```
+-------+------------+-------------------+-----------------------------------+--------------+------------------+-----------+------------+----------------------+---------------------------+--------------------+-------------------+------------+------------------------------------+-------------------------------------+
| BE_ID | FE_HOST    | WORKLOAD_GROUP_ID | QUERY_ID                          | TASK_TIME_MS | TASK_CPU_TIME_MS | SCAN_ROWS | SCAN_BYTES | BE_PEAK_MEMORY_BYTES | CURRENT_USED_MEMORY_BYTES | SHUFFLE_SEND_BYTES | SHUFFLE_SEND_ROWS | QUERY_TYPE | SPILL_WRITE_BYTES_TO_LOCAL_STORAGE | SPILL_READ_BYTES_FROM_LOCAL_STORAGE |
+-------+------------+-------------------+-----------------------------------+--------------+------------------+-----------+------------+----------------------+---------------------------+--------------------+-------------------+------------+------------------------------------+-------------------------------------+
| 10009 | 10.16.10.8 |                 1 | 6f08c74afbd44fff-9af951270933842d |        13612 |            11025 |  12002430 | 1960955904 |            733243057 |                  70113260 |                  0 |                 0 | SELECT     |                          508110119 |                            26383070 |
| 10009 | 10.16.10.8 |                 1 | 871d643b87bf447b-865eb799403bec96 |            0 |                0 |         0 |          0 |                    0 |                         0 |                  0 |                 0 | SELECT     |                                  0 |                                   0 |
+-------+------------+-------------------+-----------------------------------+--------------+------------------+-----------+------------+----------------------+---------------------------+--------------------+-------------------+------------+------------------------------------+-------------------------------------+
```

## 성능 참고 자료(TPC-DS 10TB) {#performance-reference-tpc-ds-10tb}

<!-- Knowledge type: test data -->

다음 데이터는 Alibaba Cloud 서버에서 쿼리를 하나씩 실행한 테스트 결과입니다. 메모리와 데이터의 비율이 약 **1:52**인 극단적인 상황에서도 스필을 사용하면 TPC-DS 쿼리 99개를 모두 완료할 수 있음을 보여 줍니다.

**테스트 환경:**

- 1 FE: vCPU 코어 16개, 메모리 32 GiB (ecs.c6.4xlarge)
- 3 BE: vCPU 코어 16개, 메모리 64 GiB (ecs.g6.4xlarge)
- 테스트 데이터: TPC-DS 10TB, Alibaba Cloud DLF Catalog를 통해 마운트

**총 소요 시간: 28,102.386초**

| 쿼리 | 시간(ms) | 쿼리 | 시간(ms) | 쿼리 | 시간(ms) |
|-------|---------|-------|---------|-------|---------|
| query1 | 29092 | query34 | 84055 | query67 | 3939554 |
| query2 | 130003 | query35 | 69885 | query68 | 183648 |
| query3 | 96119 | query36 | 148662 | query69 | 11031 |
| query4 | 1199097 | query37 | 21598 | query70 | 137901 |
| query5 | 212719 | query38 | 164746 | query71 | 166454 |
| query6 | 62259 | query39 | 5874 | query72 | 2859001 |
| query7 | 209154 | query40 | 51602 | query73 | 92015 |
| query8 | 62433 | query41 | 563 | query74 | 336694 |
| query9 | 579371 | query42 | 93005 | query75 | 838989 |
| query10 | 54260 | query43 | 67769 | query76 | 174235 |
| query11 | 560169 | query44 | 79527 | query77 | 174525 |
| query12 | 26084 | query45 | 26575 | query78 | 1956786 |
| query13 | 228756 | query46 | 134991 | query79 | 162259 |
| query14 | 1137097 | query47 | 161873 | query80 | 602088 |
| query15 | 27509 | query48 | 153657 | query81 | 16184 |
| query16 | 84806 | query49 | 259387 | query82 | 56292 |
| query17 | 288164 | query50 | 141421 | query83 | 26211 |
| query18 | 94770 | query51 | 158056 | query84 | 11906 |
| query19 | 124955 | query52 | 91392 | query85 | 57739 |
| query20 | 30970 | query53 | 89497 | query86 | 34350 |
| query21 | 4333 | query54 | 124118 | query87 | 173631 |
| query22 | 9890 | query55 | 82584 | query88 | 449003 |
| query23 | 1757755 | query56 | 152110 | query89 | 113799 |
| query24 | 399553 | query57 | 83417 | query90 | 30825 |
| query25 | 291474 | query58 | 259580 | query91 | 12239 |
| query26 | 79832 | query59 | 177125 | query92 | 26695 |
| query27 | 175894 | query60 | 161729 | query93 | 275828 |
| query28 | 647497 | query61 | 258058 | query94 | 56464 |
| query29 | 1299597 | query62 | 39619 | query95 | 64932 |
| query30 | 11434 | query63 | 91258 | query96 | 48102 |
| query31 | 106665 | query64 | 234882 | query97 | 597371 |
| query32 | 33481 | query65 | 278610 | query98 | 112399 |
| query33 | 146101 | query66 | 90246 | query99 | 64472 |

향후 Window Function, Intersect 등 더 많은 연산자로 스필 지원을 확대하고, 스필 성능도 지속적으로 최적화할 예정입니다.
