---
{
    "title": "table_streams",
    "language": "ko",
    "description": "클러스터에 있는 모든 Table Stream의 정의와 상태를 기록합니다."
}
---

## 개요 {#overview}

클러스터에 있는 모든 Table Stream의 정의와 상태를 기록합니다. 각 행은 하나의 Stream에 해당합니다. 사용 방법은 [Table Stream 기본 사항](../../../data-operate/incremental/table-stream)을 참조하세요.

## 데이터베이스 {#database}

`information_schema`

## 테이블 정보 {#table-information}

| 열 | 타입 | 설명 |
| :--- | :--- | :--- |
| DB_NAME | varchar(64) | Stream이 속한 데이터베이스 |
| STREAM_NAME | varchar(64) | Stream 이름 |
| STREAM_ID | bigint | Stream ID |
| STREAM_TYPE | varchar(64) | Stream 유형. 내부 테이블의 Stream은 `OLAP_TABLE_STREAM` |
| CONSUME_TYPE | varchar(64) | 소비 유형: `APPEND_ONLY`, `MIN_DELTA`, `DETAIL` |
| STREAM_COMMENT | string | Stream에 대한 주석 |
| BASE_TABLE_NAME | varchar(64) | 기본 테이블 이름 |
| BASE_TABLE_DB | varchar(64) | 기본 테이블이 속한 데이터베이스 |
| BASE_TABLE_CTL | varchar(64) | 기본 테이블이 속한 Catalog |
| BASE_TABLE_TYPE | varchar(64) | 기본 테이블 유형 |
| ENABLED | boolean | Stream을 사용할 수 있는지 여부 |
| IS_STALE | boolean | Stream이 무효화되었는지 여부(예: 변경 레코드가 정리되어 소비 오프셋부터 더 이상 읽을 수 없는 경우) |
| STALE_REASON | string | 무효화된 이유. 무효화되지 않은 경우 `N/A` |

## 예제 {#examples}

```sql
SELECT STREAM_NAME, CONSUME_TYPE, BASE_TABLE_DB, BASE_TABLE_NAME, ENABLED, IS_STALE, STALE_REASON
FROM information_schema.table_streams
WHERE DB_NAME = 'demo';
```

```text
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
| STREAM_NAME   | CONSUME_TYPE | BASE_TABLE_DB | BASE_TABLE_NAME | ENABLED | IS_STALE | STALE_REASON |
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
| orders_stream | MIN_DELTA    | demo          | orders          |       1 |        0 | N/A          |
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
```
