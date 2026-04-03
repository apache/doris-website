---
{
  "title": "CONNECTION_ID",
  "description": "現在のsqlクライアントの接続番号を取得します。",
  "language": "ja"
}
---
## 説明

現在のsqlクライアントの接続番号を取得します。

## 構文

```sql
CONNECTION_ID()
```
## Return Value

現在のsqlクライアントの接続番号。

## Examples

```sql
select connection_id();
```
```text
+-----------------+
| connection_id() |
+-----------------+
|             549 |
+-----------------+
```
