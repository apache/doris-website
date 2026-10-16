---
{
    "title": "CONNECTION_ID",
    "language": "ja",
    "description": "現在の SQL クライアントの接続 ID を取得します。"
}
---

## 説明

現在の SQL クライアントの接続 ID を取得します。

## 構文

```sql
CONNECTION_ID()
```

## 戻り値

現在の SQL クライアントの接続 ID を返します。

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
