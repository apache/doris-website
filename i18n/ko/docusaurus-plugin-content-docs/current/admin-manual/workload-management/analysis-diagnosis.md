---
{
    "title": "워크로드 분석 및 진단: 런타임 모니터링과 과거 감사 로그 분석",
    "sidebar_label": "워크로드 분석",
    "language": "ko",
    "description": "실시간 모니터링과 과거 감사 로그를 통해 클러스터 병목을 찾고 비정상 SQL의 문제를 해결하는 방법과 클러스터 가용성을 빠르게 복구하는 방법을 설명합니다.",
    "keywords": ["워크로드 관리", "워크로드 그룹", "클러스터 진단", "비정상 SQL", "감사 로그", "리소스 병목", "CPU 메모리 IO", "쿼리 종료", "backend_active_tasks", "active_queries"]
}
---

<!-- Applicable scenarios: Troubleshooting / Performance tuning -->

클러스터 워크로드 분석은 **런타임 분석**(클러스터 가용성이 떨어졌을 때 신속하게 피해 확산 방지)과 **과거 데이터 분석**(사후에 감사 로그에서 비효율적인 워크로드 파악)의 두 단계로 나뉩니다.

## 적용 시나리오 {#applicable-scenarios}

| 시나리오 | 수행 시점 | 주요 도구 |
|------|----------|----------|
| 런타임 분석 | 모니터링에서 CPU / 메모리 / IO 사용량의 비정상적인 증가가 나타날 때 | `workload_group_resource_usage`, `backend_active_tasks`, KILL 문 |
| 과거 데이터 분석 | 장애 후 검토 또는 정기 점검 시 | 감사 로그 테이블, 백분위수 함수, SQL 튜닝 |

## 런타임 워크로드 분석 {#runtime-workload-analysis}

<!-- Knowledge type: Procedure -->

모니터링에서 클러스터 가용성이 떨어진 것으로 나타나면 아래 단계를 따릅니다.

### 1단계: 리소스 병목 유형 파악 {#step-1-determine-the-type-of-resource-bottleneck}

모니터링을 통해 현재 주요 병목이 메모리, CPU, IO 중 무엇인지 파악합니다. 세 가지 모두 사용량이 높으면 메모리 문제부터 해결합니다.

### 2단계: 리소스 사용량이 가장 많은 워크로드 그룹 찾기 {#step-2-find-the-workload-group-with-the-highest-resource-usage}

`workload_group_resource_usage` 테이블에서 해당 리소스 지표를 기준으로 내림차순 정렬하여 사용량이 많은 상위 N개 그룹을 찾습니다. 자세한 내용은 [자주 사용하는 진단 SQL](#common-diagnostic-sql)을 참조하세요.

### 3단계: 사용량이 많은 그룹의 쿼리 동시 실행 수 제한 {#step-3-limit-query-concurrency-for-high-usage-groups}

클러스터 리소스가 이미 부족한 상황에서는 그룹의 최대 쿼리 동시 실행 수를 낮춰 새 쿼리가 계속해서 리소스를 소진하지 않도록 합니다.

### 4단계: 사용량이 많은 그룹에 리소스 제한 적용 {#step-4-apply-degradation-to-high-usage-groups}

<!-- Knowledge type: Configuration parameters -->

병목 유형에 따라 적절한 리소스 제한 방법을 선택합니다.

| 병목 유형 | 리소스 제한 방법 | 참고 사항 |
|----------|----------|------|
| CPU | CPU 제한 방식을 하드 제한으로 변경하고 `cpu_hard_limit`을 더 낮게 설정 | CPU를 적극적으로 양보하여 다른 그룹에 미치는 영향 방지 |
| IO | `read_bytes_per_second` 설정 | 그룹의 최대 디스크 읽기 속도 제한 |
| 메모리 | 메모리 제한 방식을 하드 제한으로 변경하고 `memory_limit`을 낮춤 | 메모리 일부를 해제하지만, 그룹 내 다수의 쿼리가 실패할 수 있음 |

### 5단계: 근본 원인 추가 분석 {#step-5-further-analyze-the-root-cause}

리소스 제한을 적용하면 대개 클러스터 가용성이 어느 정도 회복됩니다. 이때 리소스 사용량이 급증한 근본 원인을 분석합니다. 전체 쿼리 동시 실행 수가 증가했는지, 특정 대규모 쿼리가 원인인지 확인합니다. 대규모 쿼리가 원인이라면 KILL 문으로 신속하게 종료하여 장애 복구를 앞당깁니다.

### 6단계: 비정상 SQL을 찾아 종료 {#step-6-locate-and-kill-abnormal-sql}

`backend_active_tasks`와 `active_queries`를 함께 사용하여 리소스 사용량이 비정상적인 SQL을 찾고, KILL 문으로 리소스를 해제합니다. 자세한 내용은 [자주 사용하는 진단 SQL](#common-diagnostic-sql)을 참조하세요.

## 과거 데이터 분석 {#historical-data-analysis}

<!-- Knowledge type: Procedure -->

Doris 감사 로그 테이블에는 SQL 실행에 대한 간략한 정보가 기록되므로, 이를 사용하여 사후에 비효율적인 쿼리를 찾을 수 있습니다.

### 1단계: 모니터링으로 과거 리소스 병목 확인 {#step-1-confirm-historical-resource-bottlenecks-through-monitoring}

과거 모니터링 데이터를 검토하여 클러스터의 병목 유형(CPU, 메모리 또는 IO)을 확인하고 조사할 시간 범위를 좁힙니다.

### 2단계: 감사 로그에서 비정상 SQL 찾기 {#step-2-locate-abnormal-sql-from-the-audit-log}

비정상 SQL은 두 가지 방식으로 정의할 수 있습니다.

- **업무상 기대 수준 기준**: 대부분의 쿼리가 초 단위 지연 시간으로 수천만 개의 행을 스캔한다면, 수억 개 또는 수십억 개의 행을 스캔하는 SQL은 비정상으로 볼 수 있으며 수동 개입이 필요합니다.

- **백분위수 기준선 기준**: 업무 측에 리소스 사용량에 대한 기대 수준이 없다면 백분위수 함수로 기준선을 설정할 수 있습니다. CPU 병목을 예로 들면, 먼저 과거 일정 기간의 쿼리 CPU 시간에 대한 tp50/tp75/tp99/tp999를 계산하여 정상 기준선으로 삼은 다음, 현재 기간의 동일한 시간 구간에 대한 백분위수 값과 비교합니다. 예를 들어 과거의 tp999가 1분인데 현재 tp50이 1분에 도달했다면, 현재 기간에 CPU 시간이 1분을 초과하는 SQL 문이 다수 발생했음을 의미하며, 이러한 SQL 문을 비정상 SQL로 정의할 수 있습니다. 다른 리소스 지표에도 같은 방법을 적용할 수 있습니다.

### 3단계: 비정상 SQL 최적화 {#step-3-optimize-abnormal-sql}

리소스 사용량이 비정상적인 SQL을 최적화합니다. 일반적인 방법으로는 SQL 재작성, 테이블 스키마 최적화, 병렬 처리 수준 조정 등이 있으며, 이를 통해 개별 SQL의 리소스 사용량을 줄입니다.

### 4단계: 스케일 아웃 또는 처리량 제한 여부 결정 {#step-4-decide-whether-to-scale-out-or-throttle}

감사 로그에서 각 SQL의 리소스 사용량이 정상으로 나타난다면, 모니터링과 감사 로그를 사용하여 해당 시점에 실행된 SQL 문의 수가 과거 수준보다 많았는지 확인합니다. 크게 증가했다면 상위 업무 시스템 담당자에게 접근 트래픽이 늘었는지 확인한 뒤, 클러스터를 스케일 아웃할지 또는 대기열과 처리량 제한을 활성화할지 결정합니다.

## 자주 사용하는 진단 SQL {#common-diagnostic-sql}

<!-- Knowledge type: Procedure -->

:::tip 참고
`active_queries`는 FE에 등록된 쿼리를 기록하고, `backend_active_tasks`는 BE에서 실행 중인 태스크를 기록합니다. 모든 쿼리가 FE에 등록되는 것은 아닙니다(예를 들어 Stream Load는 FE에 등록되지 않음). 따라서 `backend_active_tasks` LEFT JOIN `active_queries`로 조인할 때 일치하지 않는 행이 나타나는 것은 정상입니다.

- 쿼리 유형이 SELECT이면 두 테이블의 `queryId`가 같습니다.
- 쿼리 유형이 Stream Load이면 `queryId`는 `active_queries`에서 비어 있고, `queryId`는 `backend_active_tasks`에서 해당 Stream Load의 ID입니다.
:::

**1. 각 워크로드 그룹의 리소스 사용량 조회(메모리 / CPU / IO 기준 내림차순 정렬)**

```sql
SELECT be_id, workload_group_id, memory_usage_bytes, cpu_usage_percent, local_scan_bytes_per_second
FROM workload_group_resource_usage
ORDER BY memory_usage_bytes DESC, cpu_usage_percent DESC, local_scan_bytes_per_second DESC;
```

**2. CPU 사용량 기준 상위 N개 SQL**

```sql
SELECT
    t1.query_id AS be_query_id,
    t1.query_type,
    t2.query_id,
    t2.workload_group_id,
    t2.`database`,
    t1.cpu_time,
    t2.`sql`
FROM
    (SELECT query_id, query_type, sum(task_cpu_time_ms) AS cpu_time
     FROM backend_active_tasks
     GROUP BY query_id, query_type) t1
LEFT JOIN active_queries t2 ON t1.query_id = t2.query_id
ORDER BY cpu_time DESC
LIMIT 10;
```

**3. 메모리 사용량 기준 상위 N개 SQL**

```sql
SELECT
    t1.query_id AS be_query_id,
    t1.query_type,
    t2.query_id,
    t2.workload_group_id,
    t1.mem_used
FROM
    (SELECT query_id, query_type, sum(current_used_memory_bytes) AS mem_used
     FROM backend_active_tasks
     GROUP BY query_id, query_type) t1
LEFT JOIN active_queries t2 ON t1.query_id = t2.query_id
ORDER BY mem_used DESC
LIMIT 10;
```

**4. 스캔한 데이터 양 기준 상위 N개 SQL**

```sql
SELECT
    t1.query_id AS be_query_id,
    t1.query_type,
    t2.query_id,
    t2.workload_group_id,
    t1.scan_rows,
    t1.scan_bytes
FROM
    (SELECT query_id, query_type, sum(scan_rows) AS scan_rows, sum(scan_bytes) AS scan_bytes
     FROM backend_active_tasks
     GROUP BY query_id, query_type) t1
LEFT JOIN active_queries t2 ON t1.query_id = t2.query_id
ORDER BY scan_rows DESC, scan_bytes DESC
LIMIT 10;
```

**5. 각 워크로드 그룹의 스캔한 데이터 양 집계**

```sql
SELECT
    t2.workload_group_id,
    sum(t1.scan_rows) AS wg_scan_rows,
    sum(t1.scan_bytes) AS wg_scan_bytes
FROM
    (SELECT query_id, sum(scan_rows) AS scan_rows, sum(scan_bytes) AS scan_bytes
     FROM backend_active_tasks
     GROUP BY query_id) t1
LEFT JOIN active_queries t2 ON t1.query_id = t2.query_id
GROUP BY t2.workload_group_id
ORDER BY wg_scan_rows DESC, wg_scan_bytes DESC;
```

**6. 각 워크로드 그룹의 대기 중인 쿼리와 대기 시간 조회**

```sql
SELECT
    workload_group_id,
    query_id,
    query_status,
    now() - queue_start_time AS queued_time
FROM active_queries
WHERE query_status = 'queued'
ORDER BY workload_group_id;
```
