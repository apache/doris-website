---
{
    "title": "file_cache_statistics",
    "language": "ko",
    "description": "각 BE 노드의 데이터 캐시 관련 지표 정보를 조회하는 데 사용됩니다."
}
---

## 개요 {#overview}

각 BE 노드의 데이터 캐시 관련 지표 정보를 조회하는 데 사용됩니다. 이 정보는 BE의 데이터 캐시 관련 모니터링 지표에서 가져옵니다.

:::tip 팁
이 시스템 테이블은 2.1.6 및 3.0.2 버전부터 지원됩니다.
:::

## 데이터베이스 {#database}

`information_schema`

## 테이블 정보 {#table-information}

| 컬럼 이름 | 타입 | 설명 |
|---|---|---|
| BE_ID | BIGINT | BE 노드 ID |
| BE_IP | STRING | BE 노드 IP |
| CACHE_PATH | STRING | BE 노드의 캐시 경로 |
| METRIC_NAME | STRING | 지표 이름 |
| METRIC_VALUE | STRING | 지표 값을 텍스트로 표현한 값입니다. 숫자 비교나 계산을 수행하려면 명시적으로 타입을 변환해야 합니다. |

:::info 참고

Doris 버전에 따라 제공되는 지표가 다를 수 있습니다.

:::

### 2.1.x 지표 {#21x-metrics}

> 주요 지표만 나열합니다.

- `normal_queue_curr_elements`

    현재 캐시에 있는 File Blocks의 수입니다.

- `normal_queue_max_elements`

    캐시에 허용되는 File Blocks의 최대 수입니다.

- `normal_queue_curr_size`

    현재 캐시 크기입니다.

- `normal_queue_max_size`

    허용되는 최대 캐시 크기입니다.

- `hits_ratio`

    BE 시작 이후의 전체 캐시 적중률입니다. 범위는 0-1입니다.

- `hits_ratio_5m`

    최근 5분간의 캐시 적중률입니다. 범위는 0-1입니다.

- `hits_ratio_1h`

    최근 1시간 동안의 캐시 적중률입니다. 범위는 0-1입니다.

### 3.0.x 지표 {#30x-metrics}

TODO

### 4.1.5 버전의 지표 변경 사항 {#metric-changes-in-version-415}

4.1.5 버전부터 다음 두 가지 `METRIC_NAME` 값을 사용할 수 있습니다. 이 값은 프로세스 시작 시점부터 BE 및 캐시 경로별로 각각 누적됩니다:

| METRIC_NAME | 단위 | 의미 |
| --- | --- | --- |
| `evict_not_downloaded_size` | 바이트 | 다운로드가 완료되기 전에 제거된 캐시 블록의 논리적 범위 크기 누계입니다. 현재 다운로드 중인 블록은 제외하며, 다운로드된 데이터의 물리적 제거를 나타내지는 않습니다. |
| `evict_not_downloaded_num` | 블록 | 이러한 방식으로 제거된 캐시 블록 수의 누계입니다. |

같은 버전부터 `total_removed_size`는 다운로드가 완료된 캐시 블록이 제거될 때 해당 바이트 수만 집계합니다. 다운로드되지 않은 블록은 새 지표로 별도로 집계합니다. 다운로드 중인 블록을 삭제 대상으로 표시해도 이 카운터는 증가하지 않습니다.

이에 대응하는 brpc `/vars` 이름은 `file_cache_evict_not_downloaded_size`와 `file_cache_evict_not_downloaded_num`이며, 각 이름에는 해당 캐시 경로가 접두사로 붙습니다. [파일 캐시 모니터링](../../../compute-storage-decoupled/file-cache/file-cache.md#cache-space-and-hit-rate-metrics)을 참조하세요. 시스템 테이블의 `METRIC_NAME`에는 경로 접두사가 없으며, 경로는 `CACHE_PATH`에 표시됩니다.

예를 들어, 다음과 같이 새 지표와 다운로드된 데이터의 누적 제거량을 쿼리할 수 있습니다:

```sql
SELECT BE_ID, CACHE_PATH, METRIC_NAME, CAST(METRIC_VALUE AS DOUBLE) AS metric_value
FROM information_schema.file_cache_statistics
WHERE METRIC_NAME IN ('total_removed_size', 'evict_not_downloaded_size', 'evict_not_downloaded_num')
ORDER BY BE_ID, CACHE_PATH, METRIC_NAME;
```

이 쿼리는 각 BE의 캐시 경로별 지표를 반환합니다. 값은 캐시 활동에 따라 달라집니다.

## 예제 {#examples}

1. 모든 캐시 지표 쿼리

    ```sql
    mysql> select * from information_schema.file_cache_statistics;
    +-------+---------------+----------------------------+----------------------------+--------------------+
    | BE_ID | BE_IP         | CACHE_PATH                 | METRIC_NAME                | METRIC_VALUE       |
    +-------+---------------+----------------------------+----------------------------+--------------------+
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | normal_queue_curr_elements |               1392 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | normal_queue_curr_size     |          248922234 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | normal_queue_max_elements  |             102400 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | normal_queue_max_size      |        21474836480 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | hits_ratio                 | 0.8539634687001242 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | hits_ratio_1h              |                  0 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | hits_ratio_5m              |                  0 |
    +-------+---------------+----------------------------+----------------------------+--------------------+
    ```

2. 캐시 적중률 쿼리 및 적중률순 정렬

    ```sql
    select * from information_schema.file_cache_statistics where METRIC_NAME = "hits_ratio" order by cast(METRIC_VALUE as double) desc;
    ```
