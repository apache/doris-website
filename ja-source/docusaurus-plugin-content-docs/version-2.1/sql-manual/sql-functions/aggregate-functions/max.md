---
{
  "title": "MAX",
  "language": "ja",
  "description": "MAX関数は式の最大値を返します。"
}
---
## 説明

MAX関数は式の最大値を返します。

## 構文

```sql
MAX(<expr>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `expr` | 取得する必要がある式 |

## 戻り値

入力式と同じデータ型を返します。

## 例

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
