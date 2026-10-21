---
{
    "title": "BITMAP_AGG",
    "language": "ko",
    "description": "입력 표현식의 NULL이 아닌 값을 Bitmap으로 집계합니다. 값이 0보다 작거나 18446744073709551615보다 크면,"
}
---

## 설명 {#description}

입력 표현식의 NULL이 아닌 값을 Bitmap으로 집계합니다.
값이 0보다 작거나 18446744073709551615보다 크면 해당 값은 무시되며 Bitmap에 병합되지 않습니다.

## 구문 {#syntax}

```sql
BITMAP_AGG(<expr>)
```

## 인수 {#arguments}

| 인수 | 설명 |
| -- | -- |
| `<expr>` | 집계할 열 또는 표현식입니다. 지원되는 타입: TinyInt, SmallInt, Integer, BigInt. |

## 반환 값 {#return-value}

Bitmap 타입의 값을 반환합니다. 그룹에 유효한 데이터가 없으면 빈 Bitmap을 반환합니다.

## 예제 {#example}

```sql
-- setup
CREATE TABLE test_bitmap_agg (
    id INT,
    k0 INT,
    k1 INT,
    k2 INT,
    k3 INT,
    k4 BIGINT,
    k5 BIGINT
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO test_bitmap_agg VALUES
    (1, 10, 110, 11, 300, 10000000000, 0),
    (2, 20, 120, 21, 400, 20000000000, 200000000000000),
    (3, 30, 130, 31, 350, 30000000000, 300000000000000),
    (4, 40, 140, 41, 500, 40000000000, 18446744073709551616),
    (5, 50, 150, 51, 250, 50000000000, 18446744073709551615),
    (6, 60, 160, 61, 600, 60000000000, -1),
    (7, 60, 160, 120, 600, 60000000000, NULL);
```

```sql
select bitmap_to_string(bitmap_agg(k0)) from test_bitmap_agg;
```

```text
+----------------------------------+
| bitmap_to_string(bitmap_agg(k0)) |
+----------------------------------+
| 10,20,30,40,50,60                |
+----------------------------------+
```

```sql
select bitmap_to_string(bitmap_agg(k5)) from test_bitmap_agg;
```

```text
+--------------------------------------------------------+
| bitmap_to_string(bitmap_agg(k5))                       |
+--------------------------------------------------------+
| 0,200000000000000,300000000000000,18446744073709551615 |
+--------------------------------------------------------+
```

```sql
select bitmap_to_string(bitmap_agg(k5)) from test_bitmap_agg where k5 is null;
```

```text
+----------------------------------+
| bitmap_to_string(bitmap_agg(k5)) |
+----------------------------------+
|                                  |
+----------------------------------+
```

```sql
select bitmap_to_string(bitmap_agg(k5)) from test_bitmap_agg;
```

```text
+--------------------------------------------------------+
| bitmap_to_string(bitmap_agg(cast(k5 as BIGINT)))       |
+--------------------------------------------------------+
| 0,200000000000000,300000000000000,18446744073709551615 |
+--------------------------------------------------------+
```
