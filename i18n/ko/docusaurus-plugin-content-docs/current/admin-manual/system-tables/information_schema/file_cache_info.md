---
{
    "title": "file_cache_info",
    "language": "ko",
    "description": "BE 노드의 블록 단위 File Cache 항목을 조회합니다. 이 시스템 테이블은 Doris 4.1 이상에서 지원됩니다."
}
---

## 개요 {#overview}

`file_cache_info` 시스템 테이블은 정상 가동 중인 모든 BE 노드의 블록 단위 File Cache 항목을 제공합니다. 이 테이블을 사용하면 태블릿, BE, 캐시 경로 또는 캐시 유형별로 캐시 공간을 분석하고, 캐시 편중이나 예상치 못한 캐시 증가의 원인을 조사할 수 있습니다.

:::tip 버전

이 시스템 테이블은 Doris 4.1 이상에서 지원됩니다. Doris 4.0.x에서는 사용할 수 없습니다.

:::

각 행은 캐시된 블록 하나를 나타냅니다. 결과는 현재 캐시 상태를 반영하며, 쿼리가 캐시 항목을 추가하거나 제거하는 동안 변경될 수 있습니다.

:::caution

이 테이블을 쿼리하면 선택한 BE 노드에 영속화된 File Cache 메타데이터를 스캔하므로, 캐시에 블록이 많으면 추가 I/O가 발생할 수 있습니다. 필터 없이 쿼리를 자주 실행하지 마세요. 특정 BE 노드의 데이터만 필요한 경우 `BE_ID`로 필터링하세요.

:::

## 데이터베이스 {#database}

`information_schema`

## 테이블 정보 {#table-information}

| 열 이름 | 유형 | 설명 |
|---|---|---|
| `HASH` | STRING | 캐시된 블록이 속한 원격 파일의 해시입니다. |
| `OFFSET` | BIGINT | 원격 파일에서 캐시된 블록이 시작되는 오프셋으로, 단위는 바이트입니다. |
| `TABLET_ID` | BIGINT | 캐시된 블록과 연결된 태블릿의 ID입니다. 블록이 태블릿과 연결되지 않은 경우 값은 `0`입니다. |
| `SIZE` | BIGINT | 캐시된 블록의 크기로, 단위는 바이트입니다. |
| `TYPE` | STRING | 캐시 유형입니다. 가능한 값은 `normal`, `index`, `ttl`, `disposable`입니다. |
| `REMOTE_PATH` | STRING | 원격 파일 경로를 위해 예약된 열입니다. 현재는 빈 문자열을 반환합니다. |
| `CACHE_PATH` | STRING | BE 노드의 로컬 File Cache 루트 경로입니다. |
| `BE_ID` | BIGINT | 캐시된 블록을 저장하는 BE 노드의 ID입니다. |

## 예제 {#examples}

### 태블릿의 캐시 항목 조회 {#query-the-cache-entries-of-a-tablet}

```sql
SELECT *
FROM information_schema.file_cache_info
WHERE TABLET_ID = 1761571031445;
```

```text
+----------------------------------+--------+---------------+-------+-------+-------------+------------------------------+---------------+
| HASH                             | OFFSET | TABLET_ID     | SIZE  | TYPE  | REMOTE_PATH | CACHE_PATH                   | BE_ID         |
+----------------------------------+--------+---------------+-------+-------+-------------+------------------------------+---------------+
| 468448215c52334ae5bee147259b1027 |      0 | 1761571031445 | 15120 | index |             | /mnt/disk1/project/filecache | 1761571031251 |
| 71bb73d34cd8ffe280b16dd329df5ba1 |  15120 | 1761571031445 | 13117 | index |             | /mnt/disk1/project/filecache | 1761571031251 |
| 77c6b69d1a7c4fe740a11bab5c1bbaa3 |  28237 | 1761571031445 | 12249 | index |             | /mnt/disk1/project/filecache | 1761571031251 |
+----------------------------------+--------+---------------+-------+-------+-------------+------------------------------+---------------+
```

### 캐시 사용량 집계 {#summarize-cache-usage}

다음 쿼리는 태블릿이 차지하는 캐시 공간을 BE별, 캐시 유형별로 집계합니다.

```sql
SELECT BE_ID, TABLET_ID, TYPE, SUM(SIZE) AS CACHE_BYTES
FROM information_schema.file_cache_info
WHERE TABLET_ID = 1761571031445
GROUP BY BE_ID, TABLET_ID, TYPE
ORDER BY CACHE_BYTES DESC;
```

```text
+---------------+---------------+-------+-------------+
| BE_ID         | TABLET_ID     | TYPE  | CACHE_BYTES |
+---------------+---------------+-------+-------------+
| 1761571031251 | 1761571031445 | index |       40486 |
+---------------+---------------+-------+-------------+
```
