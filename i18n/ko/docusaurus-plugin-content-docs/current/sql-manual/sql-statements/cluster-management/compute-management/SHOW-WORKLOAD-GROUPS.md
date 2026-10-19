---
{
    "title": "SHOW WORKLOAD GROUPS",
    "language": "ko",
    "description": "이 문은 현재 사용자에게 조회 권한이 있는 워크로드 그룹을 표시합니다."
}
---

## 설명 {#description}

이 문은 현재 사용자에게 조회 권한이 있는 워크로드 그룹을 표시합니다. `LIKE`를 사용하여 이름을 기준으로 패턴을 일치시킬 수 있습니다. 특정 워크로드 그룹을 조회하려면 해당 워크로드 그룹에 대한 `USAGE_PRIV` 권한이나 전역 `ADMIN_PRIV` 권한이 있어야 합니다.

## 구문 {#syntax}

```sql
SHOW WORKLOAD GROUPS [LIKE "<pattern>"];
```

## 예제 {#examples}

### 예제 1: 모든 워크로드 그룹 표시 {#example-1-show-all-workload-groups}

```sql
SHOW WORKLOAD GROUPS;
```

```text
mysql> show workload groups \G;
*************************** 1. row ***************************
                          Id: 1754728930516
                        Name: normal
             min_cpu_percent: 20%
             max_cpu_percent: 30%
          min_memory_percent: 0%
          max_memory_percent: 50%
             max_concurrency: 1
              max_queue_size: 1
               queue_timeout: 0
             scan_thread_num: 16
  max_remote_scan_thread_num: -1
  min_remote_scan_thread_num: -1
        memory_low_watermark: 75%
       memory_high_watermark: 85%
               compute_group: default
       read_bytes_per_second: -1
remote_read_bytes_per_second: -1
          slot_memory_policy: none
           running_query_num: 0
           waiting_query_num: 0
*************************** 2. row ***************************
                          Id: 1754740507946
                        Name: test_group2
             min_cpu_percent: 10%
             max_cpu_percent: 30%
          min_memory_percent: 0%
          max_memory_percent: 3%
             max_concurrency: 2147483647
              max_queue_size: 0
               queue_timeout: 0
             scan_thread_num: -1
  max_remote_scan_thread_num: -1
  min_remote_scan_thread_num: -1
        memory_low_watermark: 75%
       memory_high_watermark: 85%
               compute_group: default
       read_bytes_per_second: -1
remote_read_bytes_per_second: -1
          slot_memory_policy: none
           running_query_num: 0
           waiting_query_num: 0
```

### 예제 2: 패턴을 사용하여 워크로드 그룹 표시 {#example-2-show-workload-groups-using-a-pattern}

```sql
SHOW WORKLOAD GROUPS LIKE "normal%";
```

```text
mysql> show workload groups like "normal%" \G;
*************************** 1. row ***************************
                          Id: 1754728930516
                        Name: normal
             min_cpu_percent: 20%
             max_cpu_percent: 30%
          min_memory_percent: 0%
          max_memory_percent: 50%
             max_concurrency: 1
              max_queue_size: 1
               queue_timeout: 0
             scan_thread_num: 16
  max_remote_scan_thread_num: -1
  min_remote_scan_thread_num: -1
        memory_low_watermark: 75%
       memory_high_watermark: 85%
               compute_group: default
       read_bytes_per_second: -1
remote_read_bytes_per_second: -1
          slot_memory_policy: none
           running_query_num: 0
           waiting_query_num: 0
```

## 필드 설명 {#field-descriptions}

이 문은 현재 사용자가 조회할 수 있는 워크로드 그룹을 반환합니다. 주요 출력 필드는 다음과 같습니다.

| 필드 | 설명 |
| --- | --- |
| `Id` | 워크로드 그룹의 ID입니다. |
| `Name` | 워크로드 그룹의 이름입니다. |
| `min_cpu_percent` | 최소 보장 CPU 비율입니다. |
| `max_cpu_percent` | 최대 CPU 비율입니다. |
| `min_memory_percent` | 최소 보장 메모리 비율입니다. |
| `max_memory_percent` | 최대 메모리 비율입니다. |
| `max_concurrency` | 최대 동시 실행 쿼리 수입니다. |
| `max_queue_size` | 대기 중인 쿼리를 위한 큐의 최대 길이입니다. |
| `queue_timeout` | 최대 큐 대기 시간이며, 단위는 밀리초입니다. |
| `scan_thread_num` | 워크로드 그룹에서 사용하는 로컬 스캔 스레드 수입니다. |
| `max_remote_scan_thread_num` | 원격 데이터 소스의 최대 스캔 스레드 수입니다. |
| `min_remote_scan_thread_num` | 원격 데이터 소스의 최소 스캔 스레드 수입니다. |
| `memory_low_watermark` | 메모리 하한 워터마크입니다. |
| `memory_high_watermark` | 메모리 상한 워터마크입니다. |
| `compute_group` | 워크로드 그룹이 속한 컴퓨팅 그룹입니다. 비클라우드 모드에서는 일반적으로 `default`와 같은 기본 리소스 그룹/태그가 표시됩니다. |
| `read_bytes_per_second` | Doris 내부 테이블을 읽을 때의 IO 처리량 제한이며, 단위는 초당 바이트입니다. `-1`은 무제한을 의미합니다. |
| `remote_read_bytes_per_second` | 원격 데이터 소스를 읽을 때의 IO 처리량 제한이며, 단위는 초당 바이트입니다. `-1`은 무제한을 의미합니다. |
| `slot_memory_policy` | 쿼리 슬롯의 메모리 할당 정책입니다. |
| `running_query_num` | 현재 이 워크로드 그룹에서 실행 중인 쿼리 수입니다. |
| `waiting_query_num` | 현재 이 워크로드 그룹의 큐에서 대기 중인 쿼리 수입니다. |

## 사용 시 참고 사항 {#usage-notes}

1. 이 문은 `LIKE` 필터링만 지원하며 `WHERE` 절은 지원하지 않습니다.
2. 이 문은 워크로드 그룹 정보를 간단히 표시하는 용도로 사용합니다. 더 복잡한 조회나 필터링에는 TVF `workload_groups()`를 사용하세요.
3. 결과는 권한에 따라 필터링됩니다. 특정 워크로드 그룹을 조회하려면 해당 워크로드 그룹에 대한 `USAGE_PRIV` 권한이나 전역 `ADMIN_PRIV` 권한이 있어야 합니다. 예:

   ```sql
   GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO 'user_1'@'%';
   ```

4. 현재 구현에서는 호환성을 위해 일반적으로 추가 권한 부여 없이 기본 워크로드 그룹 `normal`을 조회할 수 있습니다.
