---
{
    "title": "BITMAP-UNION-INT",
    "language": "ja",
    "description": "入力式に含まれる重複しない非負整数の数を、負の値とNULLを無視して数えます。"
}
---

## 説明 {#description}

入力式に含まれる重複しない非負整数の数を、負の値とNULLを無視して数えます。

サポートされる整数型の入力では、これは `COUNT(DISTINCT CASE WHEN expr >= 0 THEN expr END)` および `BITMAP_COUNT(BITMAP_AGG(expr))`と同等です。また、 `COUNT(DISTINCT expr)` と同等になるのは、入力に負の値が含まれない場合に限られます。

## 使用上の注意 {#usage-notes}

負の値を無視するのは開発版の動作です。以前のリリースでは負の値も数える場合があるため、負の値を含むクエリはアップグレード後に異なる結果を返す可能性があります。

## 構文 {#syntax}

```sql
BITMAP_UNION_INT(<expr>)
```

## パラメータ {#parameters}

| パラメータ | 説明 |
| --- | --- |
| `<expr>` | 入力式。サポートされる型: TinyInt、SmallInt、Integer。 |

## 戻り値 {#return-value}

重複しない非負整数の数をBIGINTで返します。NULLと負の値は無視されます。入力が空の場合、またはグループにNULLと負の値しか含まれない場合は0を返します。結果がNULLになることはありません。

## 例 {#example}

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

負の整数は除外され、ゼロは含まれます:

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

負の値とNULLしか含まれないグループでは、ゼロが返されます:

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
