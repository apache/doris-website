---
{
  "title": "CLEAN ALL QUERY STATS",
  "description": "このステートメントはクエリ統計をクリアするために使用されます",
  "language": "ja"
}
---
## 説明

このステートメントはクエリ統計情報をクリアするために使用されます

## 構文

```sql
CLEAN [ { ALL| DATABASE | TABLE } ] QUERY STATS [ { [ FOR <db_name>] | [ { FROM | IN } ] <table_name>]];
```
## 必須パラメータ

**1. `ALL`**

> すべてのクエリ統計情報をクリアするには ALL を使用します

**2. `DATABASE`**

> データベースのクエリ統計情報をクリアするには DATABASE を使用します

**3. `TABLE`**

> Tableのクエリ統計情報をクリアするには TABLE を使用します

## オプションパラメータ

**1. `<db_name>`**

> このパラメータが設定されている場合、対応するデータベースの統計情報がクリアされます

**2. `<table_name>`**

> このパラメータが設定されている場合、対応するTableの統計情報がクリアされます


## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| Privilege  | Object   | 注釈                 |
|:-----------|:---------|:--------------------------|
| ADMIN_PRIV | ALL      | ALL が指定されている場合、ADMIN権限が必要です     |
| ALTER_PRIV | DATABASE | データベースが指定されている場合、対応するデータベースのALTER権限が必要です |
| ADMIN_PRIV | TABLE    | Tableを指定する場合、そのTableのalter権限が必要です     |


## 例

```sql
clean all query stats
```
```sql
clean database query stats for test_query_db
```
```sql
clean table query stats from test_query_db.baseall
```
