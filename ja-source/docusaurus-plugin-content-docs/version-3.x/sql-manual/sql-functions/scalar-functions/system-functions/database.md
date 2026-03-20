---
{
  "title": "データベース",
  "description": "現在のsqlクライアント接続のデータベースを取得します。",
  "language": "ja"
}
---
## 説明

現在のsqlクライアント接続のデータベースを取得します。

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

現在のsqlクライアントに接続されているデータベースの名前。

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
