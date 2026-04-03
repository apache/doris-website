---
{
  "title": "データベース",
  "language": "ja",
  "description": "現在のsqlクライアント接続のdatabaseを取得する。"
}
---
## 説明

現在のsqlクライアント接続のデータベースを取得します。

## エイリアス

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
