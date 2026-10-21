---
{
    "title": "BITMAP-UNION-INT",
    "language": "ko",
    "description": "입력 표현식에서 음수가 아닌 정수의 고유 개수를 계산하며, 음수와 NULL은 무시합니다."
}
---

## 설명 {#description}

입력 표현식에서 음수가 아닌 정수의 고유 개수를 계산하며, 음수와 NULL은 무시합니다.

지원되는 정수 입력의 경우, 이 함수는 `COUNT(DISTINCT CASE WHEN expr >= 0 THEN expr END)` 및 `BITMAP_COUNT(BITMAP_AGG(expr))`와 동일한 결과를 반환합니다. 입력에 음수가 없을 때만 `COUNT(DISTINCT expr)`와 동일한 결과를 반환합니다.

## 사용 시 참고 사항 {#usage-notes}

개발 버전에서는 음수를 무시합니다. 이전 릴리스에서는 음수를 집계할 수 있으므로, 음수 입력이 포함된 쿼리는 업그레이드 후 다른 결과를 반환할 수 있습니다.

## 구문 {#syntax}

```sql
BITMAP_UNION_INT(<expr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<expr>` | 입력 표현식입니다. 지원되는 타입: TinyInt, SmallInt, Integer. |

## 반환 값 {#return-value}

음수가 아닌 정수의 고유 개수를 BIGINT로 반환합니다. NULL과 음수는 무시합니다. 입력이 비어 있거나 그룹에 NULL과 음수만 포함된 경우 0을 반환하며, 결과가 NULL인 경우는 없습니다.

## 예제 {#example}

```sql
-- setup
CREATE TABLE pv_bitmap (
    dt INT,
    page INT,
    user_id BITMAP
) DISTRIBUTED BY HASH(dt) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO pv_bitmap VALUES
    (1, 100, to_bitmap(100)),
    (1, 100, to_bitmap(200)),
    (1, 100, to_bitmap(300)),
    (1, 300, to_bitmap(300)),
    (2, 200, to_bitmap(300));
```

```text
Query OK, 0 rows affected
Query OK, 5 rows affected
```

```sql
select bitmap_union_int(dt) from pv_bitmap;
```

```text
+----------------------+
| bitmap_union_int(dt) |
+----------------------+
|                    2 |
+----------------------+
```

```sql
select bitmap_union_int(dt) from pv_bitmap where dt is null;
```

```text
+----------------------+
| bitmap_union_int(dt) |
+----------------------+
|                    0 |
+----------------------+
```

음의 정수는 제외하고 영은 포함합니다:

```sql
SELECT bitmap_union_int(x) AS nonnegative_count
FROM (
    SELECT -1 AS x UNION ALL SELECT 0 UNION ALL SELECT 1
    UNION ALL SELECT 1 UNION ALL SELECT NULL
) AS input;
```

```text
+-------------------+
| nonnegative_count |
+-------------------+
|                 2 |
+-------------------+
```

음수와 NULL만 포함된 그룹은 영을 반환합니다:

```sql
SELECT bitmap_union_int(x) AS nonnegative_count
FROM (SELECT -1 AS x UNION ALL SELECT -2 UNION ALL SELECT NULL) AS input;
```

```text
+-------------------+
| nonnegative_count |
+-------------------+
|                 0 |
+-------------------+
```
