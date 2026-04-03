---
{
  "title": "CONNECTION_ID",
  "language": "ja",
  "description": "現在のsqlクライアントの接続番号を取得します。"
}
---
## 説明

現在のsqlクライアントの接続番号を取得します。

## 構文

```sql
CONNECTION_ID()
```
## 戻り値

現在のsqlクライアントの接続番号。

## 例

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
