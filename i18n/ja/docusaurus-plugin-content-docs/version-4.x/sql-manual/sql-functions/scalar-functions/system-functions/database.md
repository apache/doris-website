---
{
    "title": "DATABASE",
    "language": "ja",
    "description": "現在の SQL クライアント接続のデータベースを取得します。"
}
---

## 説明

現在の SQL クライアント接続のデータベースを取得します。

## 別名

- SCHEMA

## 構文

```sql
DATABASE()
```
または

```sql
SCHEMA()
```

## 戻り値

現在の SQL クライアントが接続しているデータベース名を返します。

## 例

```sql
select database(),schema();
```

```text
+------------+------------+
| database() | database() |
+------------+------------+
| test       | test       |
+------------+------------+
```

