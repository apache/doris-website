---
{
  "title": "ISNAN",
  "description": "指定された値がNaN（Not a Number）かどうかを判定します。",
  "language": "ja"
}
---
## 概要

指定された値がNaN（Not a Number）かどうかを判定します。

## 構文

```sql
ISNAN(<value>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<value>` | チェックする値。DOUBLE型またはFLOAT型である必要があります |

## Return Value

値がNaNの場合は1を返し、それ以外の場合は0を返します。
値がNULLの場合は、NULLを返します。

## Examples

```sql
SELECT isnan(1);
```
```text
+----------+
| isnan(1) |
+----------+
|        0 |
+----------+
```
```sql
SELECT cast('nan' as double),isnan(cast('nan' as double));
```
```text
+-----------------------+------------------------------+
| cast('nan' as double) | isnan(cast('nan' as double)) |
+-----------------------+------------------------------+
|                   NaN |                            1 |
+-----------------------+------------------------------+
```
```sql
SELECT isnan(NULL)
```
```text
+-------------+
| isnan(NULL) |
+-------------+
|        NULL |
+-------------+
```
