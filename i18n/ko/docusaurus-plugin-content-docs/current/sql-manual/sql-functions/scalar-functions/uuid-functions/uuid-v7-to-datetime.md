---
{
    "title": "UUID_V7_TO_DATETIME",
    "language": "ko",
    "description": "UUID v7에서 Unix 밀리초 타임스탬프를 추출하고 선택한 시간대의 날짜와 시간으로 변환합니다. `NULL` 입력에는 `NULL`을 반환합니다."
}
---

## 설명 {#description}

UUID v7에서 Unix 밀리초 타임스탬프를 추출하고 선택한 시간대의 날짜와 시간으로 변환합니다. `NULL` 입력에는 `NULL`을 반환합니다.

## 별칭 {#alias}

`UUIDv7ToDateTime`.

## 구문 {#syntax}

```sql
UUID_V7_TO_DATETIME(<uuid> [, <time_zone>])
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<uuid>` | UUID 타입의 값입니다. |
| `<time_zone>` | `UTC`, `Asia/Shanghai` 또는 `+08:00`과 같은 선택적 상수 문자열입니다. 기본값은 세션의 `time_zone`입니다. 행마다 시간대 값이 달라지는 컬럼은 허용되지 않으며, 유효하지 않은 시간대를 지정하면 오류가 발생합니다. |

## 반환 값 {#return-value}

`DATETIME(3)` 타입을 반환합니다. 반환값이 `NULL`인 경우는 UUID 또는 명시적으로 지정한 시간대가 `NULL`이거나, 변환된 날짜와 시간이 DATETIME 범위를 벗어날 때입니다. 버전 필드가 7이 아니면 선택한 시간대의 Unix epoch(1970-01-01 00:00:00 UTC)를 반환하며, `NULL`을 반환하지 않습니다. UUID variant 비트는 검증하지 않습니다.

## 예제 {#example}

```sql
SET time_zone = 'UTC';
SELECT UUID_V7_TO_DATETIME(CAST('00000000-0001-7000-8000-000000000000' AS UUID)) AS session_time,
       UUID_V7_TO_DATETIME(CAST('00000000-0001-7000-8000-000000000000' AS UUID), 'Asia/Shanghai') AS shanghai_time;
```

```text
+-------------------------+-------------------------+
| session_time            | shanghai_time           |
+-------------------------+-------------------------+
| 1970-01-01 00:00:00.001 | 1970-01-01 08:00:00.001 |
+-------------------------+-------------------------+
```

```sql
SELECT UUID_V7_TO_DATETIME(CAST('550e8400-e29b-41d4-a716-446655440000' AS UUID), 'UTC') AS non_v7,
       UUID_V7_TO_DATETIME(CAST(NULL AS UUID), 'UTC') AS null_input,
       UUID_V7_TO_DATETIME(CAST('550e8400-e29b-41d4-a716-446655440000' AS UUID), NULL) AS null_zone,
       UUID_V7_TO_DATETIME(CAST('ffffffff-ffff-7000-8000-000000000000' AS UUID), 'UTC') AS out_of_range;
```

```text
+-------------------------+------------+-----------+--------------+
| non_v7                  | null_input | null_zone | out_of_range |
+-------------------------+------------+-----------+--------------+
| 1970-01-01 00:00:00.000 | NULL       | NULL      | NULL         |
+-------------------------+------------+-----------+--------------+
```
