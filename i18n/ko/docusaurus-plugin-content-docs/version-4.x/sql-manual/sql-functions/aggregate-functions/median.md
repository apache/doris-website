---
{
    "title": "MEDIAN",
    "language": "ko",
    "description": "MEDIAN 함수는 표현식의 중앙값을 반환하며, percentile(expr, 0.5)와 동일합니다."
}
---

## 설명 {#description}

MEDIAN 함수는 표현식의 중앙값을 반환하며, percentile(expr, 0.5)와 동일합니다.

## 구문 {#syntax}

```sql
MEDIAN(<expr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<expr>` | 계산할 표현식입니다. 지원하는 타입은 Double, Float, LargeInt, BigInt, Int, SmallInt, TinyInt입니다. |

## 반환값 {#return-value}

입력 표현식과 동일한 데이터 타입을 반환합니다.
그룹에 유효한 데이터가 없으면 NULL을 반환합니다.

## 예제 {#example}

```sql
-- setup
create table log_statis(
    datetime datetime,
    scan_rows int
) distributed by hash(datetime) buckets 1
properties ("replication_num"="1");
insert into log_statis values
    ('2025-08-25 10:00:00', 10),
    ('2025-08-25 10:00:00', 50),
    ('2025-08-25 10:00:00', 100),
    ('2025-08-25 11:00:00', 20),
    ('2025-08-25 11:00:00', 30),
    ('2025-08-25 11:00:00', 40);
```

```sql
select datetime, median(scan_rows) from log_statis group by datetime;
```

```text
select datetime, median(scan_rows) from log_statis group by datetime;
+---------------------+-------------------+
| datetime            | median(scan_rows) |
+---------------------+-------------------+
| 2025-08-25 10:00:00 |                50 |
| 2025-08-25 11:00:00 |                30 |
+---------------------+-------------------+
```

```sql
select median(scan_rows) from log_statis where scan_rows is null;
```

```text
select median(scan_rows) from log_statis where scan_rows is null;
+-------------------+
| median(scan_rows) |
+-------------------+
|              NULL |
+-------------------+
```
