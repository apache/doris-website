---
{
  "title": "BITMAP_AGG",
  "description": "入力式の非NULL値をBitmapに集約します。値が0未満または18446744073709551615より大きい場合、",
  "language": "ja"
}
---
## デスクリプション

入力式のnon-NULL値をBitmapに集約します。
値が0未満または18446744073709551615より大きい場合、その値は無視されBitmapにマージされません。

## Syntax

```sql
BITMAP_AGG(<expr>)
```
## Arguments

| Argument | デスクリプション |
| -- | -- |
| `<expr>` | 集約対象の列または式。サポートされる型：TinyInt、SmallInt、Integer、BigInt。 |

## Return Value

Bitmap型の値を返します。グループ内に有効なデータが存在しない場合は、空のBitmapを返します。

## Example

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
