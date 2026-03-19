---
{
  "title": "MAX",
  "description": "MAX関数は式の最大値を返します。",
  "language": "ja"
}
---
## デスクリプション

MAX関数は式の最大値を返します。

## Syntax

```sql
MAX(<expr>)
```
## パラメータ

| パラメータ | デスクリプション |
| -- | -- |
| `expr` | 取得する必要がある式 |

## Return Value

入力式と同じデータ型を返します。

## Example

```sql
select max(scan_rows) from log_statis group by datetime;
```
```text
+------------------+
| max(`scan_rows`) |
+------------------+
|          4671587 |
+------------------+
```
