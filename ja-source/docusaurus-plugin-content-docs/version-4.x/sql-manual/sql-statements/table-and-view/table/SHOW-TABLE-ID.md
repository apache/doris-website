---
{
  "title": "SHOW TABLE ID",
  "description": "この文は、TableIDに基づいて対応するデータベース名、table名を見つけるために使用されます。",
  "language": "ja"
}
---
### 説明

この文は、TableIDに応じて対応するデータベース名、table名を検索するために使用されます。

## 構文

```sql
SHOW TABLE <table_id>
```
## 必須パラメータ

**1. `<table_id>`**
> データベース名、Table名Tableの`<table_id>`を見つける必要があります。

## 戻り値

| Column name (Column) | タイプ (DataType) | 注釈 (注釈) |
|:--------------------|:-------------|:----------|
| DbName | String | データベース名 |
| TableName | String | Table名 |
| DbId | String | データベースID |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege (Privilege) | Object (Object) | 注釈 (注釈) |
|:--------------|:-----------|:------------------------|
| ADMIN_PRIV | Table (table) | 現在、この操作を実行するには**ADMIN**権限のみをサポートしています |

## 例

- table idに応じて対応するデータベース名、Table名を見つける

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
