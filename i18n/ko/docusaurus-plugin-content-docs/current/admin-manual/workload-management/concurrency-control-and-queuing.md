---
{
    "title": "동시성 제어 및 큐잉: 높은 동시성 환경에서 OOM과 시스템 멈춤 방지",
    "sidebar_label": "동시성 제어 및 큐잉",
    "language": "ko",
    "description": "Doris 워크로드 그룹의 동시 실행 수 제한과 큐잉 정책을 구성하여 높은 동시성 환경에서 OOM이나 시스템 멈춤을 방지합니다.",
    "keywords": ["동시성 제어", "큐잉", "워크로드 그룹", "max_concurrency", "max_queue_size", "queue_timeout", "높은 동시성", "OOM", "리소스 관리", "쿼리 실행 제한"]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: High-concurrency query throttling / OOM prevention / System resource management -->

동시성 제어 및 큐잉은 Doris 워크로드 관리의 핵심 메커니즘입니다. 동시에 실행되는 쿼리 수가 시스템 한도를 초과하면 Doris는 초과 쿼리를 즉시 거부하거나 시스템에 과부하가 걸리도록 두는 대신 대기 큐에 넣습니다. 이를 통해 OOM이나 시스템 멈춤과 같은 문제를 방지합니다.

이 메커니즘은 **워크로드 그룹**을 통해 구현됩니다. 각 워크로드 그룹에서 최대 동시 실행 수, 큐 길이, 큐 대기 시간 제한을 독립적으로 설정할 수 있습니다.

## 동시성 제어 및 큐잉 구성 {#configure-concurrency-control-and-queuing}

<!-- Knowledge type: Procedure -->

**목적**: 워크로드 그룹을 생성하거나 수정하여 동시에 실행되는 쿼리 수를 제한하고 큐잉을 활성화합니다.

**명령**:

```sql
CREATE WORKLOAD GROUP IF NOT EXISTS queue_group
PROPERTIES (
    "max_concurrency" = "10",
    "max_queue_size" = "20",
    "queue_timeout" = "3000"
);
```

**매개변수 설명**:

| 매개변수 | 유형 | 기본값 | 범위 | 설명 |
|---|---|---|---|---|
| `max_concurrency` | integer | 2147483647 | [0, 2147483647] | 최대 쿼리 동시 실행 수입니다. 기본값은 정수의 최댓값으로, 동시 실행 수에 제한이 없음을 의미합니다. 실행 중인 쿼리 수가 이 한도에 도달하면 새 쿼리에 큐잉 로직이 적용됩니다. |
| `max_queue_size` | integer | 0 | [0, 2147483647] | 대기 큐의 길이입니다. 큐가 가득 차면 새 쿼리는 즉시 거부됩니다. 기본값은 0으로, 큐잉을 하지 않음을 의미합니다. |
| `queue_timeout` | integer | 0 | [0, 2147483647] | 쿼리가 큐에서 대기할 수 있는 최대 시간이며, 단위는 밀리초입니다. 대기 시간이 초과되면 클라이언트에 즉시 실패를 반환합니다. 기본값은 0으로, 큐에 들어간 직후 실패를 반환함을 의미합니다. |

**예제 설명**:

단일 FE 환경에서 위 설정은 다음을 의미합니다.

- 클러스터는 최대 10개의 쿼리를 동시에 실행합니다.
- 동시 실행 수가 한도에 도달하면 새 쿼리는 큐에 들어가며, 큐의 최대 길이는 20입니다.
- 큐에 있는 쿼리는 최대 3초(3000밀리초) 동안 대기하며, 대기 시간이 초과되면 실패를 반환합니다.

:::tip 다중 FE 환경에서의 참고 사항
큐잉 매개변수는 **개별 FE 단위**로 적용되며, 클러스터의 전체 FE 수는 고려하지 않습니다. 예를 들면 다음과 같습니다.

- `max_concurrency = 1`이고 클러스터에 FE가 1개이면, 동시에 실행되는 SQL은 최대 1개입니다.
- `max_concurrency = 1`이고 클러스터에 FE가 3개이면, 동시에 실행되는 SQL은 최대 3개입니다(FE당 1개).

다중 FE 클러스터에서는 원하는 클러스터 전체 동시 실행 수를 FE 수로 나눈 값을 `max_concurrency`로 설정하세요.
:::

## 현재 큐잉 상태 확인 {#view-the-current-queuing-status}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Monitor queuing / Diagnose concurrency issues -->

**목적**: 각 워크로드 그룹에서 현재 실행 중인 쿼리 수와 큐에서 대기 중인 쿼리 수를 확인합니다.

**명령**:

```sql
SHOW WORKLOAD GROUPS;
```

**출력 예시**:

```text
mysql [(none)]> SHOW WORKLOAD GROUPS\G;
*************************** 1. row ***************************
                          Id: 1
                        Name: normal
                   cpu_share: 20
                memory_limit: 50%
    enable_memory_overcommit: true
             max_concurrency: 2147483647
              max_queue_size: 0
               queue_timeout: 0
              cpu_hard_limit: 1%
             scan_thread_num: 16
  max_remote_scan_thread_num: -1
  min_remote_scan_thread_num: -1
        memory_low_watermark: 50%
       memory_high_watermark: 80%
                         tag: 
       read_bytes_per_second: -1
remote_read_bytes_per_second: -1
           running_query_num: 0
           waiting_query_num: 0
```

주요 필드:

- `running_query_num`: 현재 실행 중인 쿼리 수입니다.
- `waiting_query_num`: 현재 큐에서 대기 중인 쿼리 수입니다.

## 큐잉 제한 우회(관리자 작업) {#bypass-the-queuing-limit-administrator-operation}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Operations / Emergency administration -->

**목적**: 운영 작업 시 관리자 계정이 큐잉 로직을 건너뛰고 관리용 SQL을 직접 실행해야 할 때 사용합니다.

**명령**:

```sql
SET bypass_workload_group = true;
```

**설명**: 이 설정은 세션 수준 변수이며 현재 세션에서만 적용됩니다. 운영 작업 중에만 일시적으로 활성화하고, 작업이 완료되면 비활성화하거나 연결을 다시 설정하세요.

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Troubleshooting -->

### 질문: 새 쿼리가 큐에 들어가지 않고 즉시 실패합니다 {#q-a-new-query-fails-immediately-and-does-not-enter-the-queue}
`queue_timeout = 0` 또는 `max_queue_size = 0`이면 쿼리를 큐에 넣어 대기시킬 수 없습니다. `max_queue_size`를 0보다 크게, `queue_timeout`을 0보다 크게 설정하세요.

### 질문: 큐가 가득 차면 쿼리가 거부됩니다 {#q-queries-are-rejected-after-the-queue-is-full}
`max_queue_size`가 너무 작게 설정되어 있습니다. `max_queue_size`를 늘리거나 `max_concurrency`를 높이세요.

### 질문: 다중 FE 클러스터의 동시 실행 수 제한이 예상과 다릅니다 {#q-the-concurrency-limit-in-a-multi-fe-cluster-does-not-match-expectations}
큐잉 매개변수는 개별 FE 단위로 적용됩니다. `max_concurrency`를 목표값을 FE 수로 나눈 값으로 설정하세요.

### 질문: 관리자 작업도 큐에 막힙니다 {#q-administrator-operations-are-also-blocked-by-the-queue}
우회 변수가 활성화되어 있지 않습니다. `SET bypass_workload_group = true`를 실행하세요.
