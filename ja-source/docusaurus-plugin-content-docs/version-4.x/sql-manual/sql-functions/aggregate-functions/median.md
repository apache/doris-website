---
{
  "title": "MEDIAN",
  "description": "MEDIAN関数は式の中央値を返します。これはpercentile(expr, 0.5)と同等です。",
  "language": "ja"
}
---
## デスクリプション

MEDIAN関数は式の中央値を返します。これはpercentile(expr, 0.5)と等価です。

## Syntax

```sql
MEDIAN(<expr>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<expr>` | 計算する式。サポートされる型：Double、Float、LargeInt、BigInt、Int、SmallInt、TinyInt。 |

## Return Value

入力式と同じデータ型を返します。
グループ内に有効なデータがない場合はNULLを返します。

## Example

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
select median(scan_rows) from log_statis group by datetime;
```
```text
select median(scan_rows) from log_statis where scan_rows is null;
+-------------------+
| median(scan_rows) |
+-------------------+
|              NULL |
+-------------------+
```
