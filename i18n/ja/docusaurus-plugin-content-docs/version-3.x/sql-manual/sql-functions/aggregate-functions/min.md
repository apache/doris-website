---
{
  "title": "MIN",
  "description": "MIN関数は式の最小値を返します。",
  "language": "ja"
}
---
## デスクリプション

MIN関数は式の最小値を返します。

## Syntax

```sql
MIN(expr)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 取得する必要がある式 |

## 戻り値

入力式と同じデータ型を返します。

## 例

```sql
select MIN(scan_rows) from log_statis group by datetime;
```
```text
+------------------+
| MIN(`scan_rows`) |
+------------------+
|                0 |
+------------------+
```
