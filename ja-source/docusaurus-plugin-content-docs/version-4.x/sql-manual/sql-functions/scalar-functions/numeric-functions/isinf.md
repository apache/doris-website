---
{
  "title": "ISINF",
  "description": "指定された値が無限大かどうかを判定します。",
  "language": "ja"
}
---
## 説明

指定された値が無限大かどうかを判定します。

## 構文

```sql
ISINF(<value>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<value>` | チェックする値。DOUBLEまたはFLOAT型である必要があります |

## Return Value

値が無限大（正または負）の場合は1を返し、そうでない場合は0を返します。
値がNULLの場合は、NULLを返します。

## Examples

```sql
SELECT isinf(1);
```
```text
+----------+
| isinf(1) |
+----------+
|        0 |
+----------+
```
```sql
SELECT cast('inf' as double),isinf(cast('inf' as double))
```
```text
+-----------------------+------------------------------+
| cast('inf' as double) | isinf(cast('inf' as double)) |
+-----------------------+------------------------------+
|              Infinity |                            1 |
+-----------------------+------------------------------+
```
```sql
SELECT isinf(NULL)
```
```text
+-------------+
| isinf(NULL) |
+-------------+
|        NULL |
+-------------+
```
