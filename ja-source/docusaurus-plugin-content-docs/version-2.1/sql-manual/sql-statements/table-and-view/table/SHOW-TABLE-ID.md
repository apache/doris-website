---
{
  "title": "SHOW TABLE ID",
  "language": "ja",
  "description": "このステートメントは、テーブルIDに従って対応するデータベース名、テーブル名を見つけるために使用されます。"
}
---
### 説明

このステートメントは、テーブルIDに応じて対応するデータベース名、テーブル名を検索するために使用されます。

## 構文

```sql
SHOW TABLE <table_id>
```
## 必須パラメータ

**1. `<table_id>`**
> データベース名、テーブル名テーブルの`<table_id>`を見つける必要があります。

## 戻り値

| Column name (Column) | Type (DataType) | Notes (Notes) |
|:--------------------|:-------------|:----------|
| DbName | String | データベース名 |
| TableName | String | テーブル名 |
| DbId | String | データベースID |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、最低限以下の権限を持っている必要があります：

| Privilege (Privilege) | Object (Object) | Notes (Notes) |
|:--------------|:-----------|:------------------------|
| ADMIN_PRIV | Table (table) | 現在、この操作を実行するには**ADMIN**権限のみがサポートされています |

## 例

- table idに応じて対応するデータベース名、テーブル名を見つける

   ```sql
   SHOW TABLE 2261121
   ```
   ```text
   +--------+------------+---------+
   | DbName | TableName  | DbId    |
   +--------+------------+---------+
   | demo   | test_table | 2261034 |
   +--------+------------+---------+
   ```
