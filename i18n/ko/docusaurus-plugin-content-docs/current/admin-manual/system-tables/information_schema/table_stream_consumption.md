---
{
    "title": "table_stream_consumption",
    "language": "ko",
    "description": "각 Table Stream에 대해 기반 테이블의 각 파티션별 소비 오프셋, 백로그, 마지막 소비 시간을 기록합니다."
}
---

## 개요 {#overview}

각 Table Stream에 대해 기반 테이블의 각 파티션별 소비 오프셋, 백로그, 마지막 소비 시간을 기록합니다. 각 행은 한 Stream의 소비 단위 하나(기반 테이블의 파티션)에 해당합니다. 사용 방법은 [Table Stream 고급 사용법](../../../data-operate/incremental/table-stream-advanced#partition-level-consumption-offsets)을 참고하세요.

## 데이터베이스 {#database}

`information_schema`

## 테이블 정보 {#table-information}

| 열 | 타입 | 설명 |
| :--- | :--- | :--- |
| DB_NAME | varchar(64) | Stream이 속한 데이터베이스 |
| STREAM_NAME | varchar(64) | Stream 이름 |
| STREAM_ID | bigint | Stream ID |
| UNIT | varchar(64) | 소비 단위, 즉 기반 테이블의 파티션 이름입니다. 파티션을 명시적으로 지정하지 않은 테이블에는 테이블과 이름이 같은 단일 파티션이 있습니다 |
| CONSUMPTION_STATUS | varchar(64) | 파티션이 소비된 지점의 커밋 타임스탬프(TSO)입니다. `N/A`는 해당 파티션이 한 번도 소비되지 않았음을 의미합니다 |
| LAG | varchar(64) | 파티션에서 가장 최근에 커밋된 TSO와 소비된 TSO의 차이입니다. `0`은 백로그가 없음을, `N/A`는 파티션에 데이터가 있지만 한 번도 소비되지 않았음을 의미합니다. TSO의 하위 18비트는 논리 카운터이므로 `LAG`를 262144로 나눈 값은 밀리초 단위로 나타낸 백로그의 근삿값입니다 |
| LAST_CONSUMPTION_TIME | bigint | 파티션의 가장 최근 소비 시간(밀리초 단위 타임스탬프)입니다. `-1`은 한 번도 소비되지 않았음을 의미합니다 |

## 예제 {#examples}

```sql
SELECT UNIT, CONSUMPTION_STATUS, LAG, LAST_CONSUMPTION_TIME
FROM information_schema.table_stream_consumption
WHERE DB_NAME = 'demo' AND STREAM_NAME = 'orders_stream'
ORDER BY UNIT;
```

```text
+-----------+--------------------+-----------+-----------------------+
| UNIT      | CONSUMPTION_STATUS | LAG       | LAST_CONSUMPTION_TIME |
+-----------+--------------------+-----------+-----------------------+
| p20260913 | 469041123123200000 | 0         |         1789267206000 |
| p20260914 | 469067681628160003 | 262144000 |         1789351206000 |
| p20260915 | N/A                | 0         |                    -1 |
+-----------+--------------------+-----------+-----------------------+
```
