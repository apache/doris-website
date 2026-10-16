---
{
    "title": "CLEAN ALL QUERY STATS",
    "language": "ja",
    "description": "クエリの統計情報を消去するステートメントです"
}
---

## 説明

このステートメントは、クエリの統計情報を消去します。

## 構文

```sql
CLEAN [ { ALL| DATABASE | TABLE } ] QUERY STATS [ { [ FOR <db_name>] | [ { FROM | IN } ] <table_name>]];
```

## 必須パラメータ

**1. `ALL`**

> ALL を指定すると、すべてのクエリの統計情報を消去します。

**2. `DATABASE`**

> DATABASE を指定すると、データベースのクエリの統計情報を消去します。

**3. `TABLE`**

> TABLE を指定すると、テーブルのクエリの統計情報を消去します。

## オプションパラメータ

**1. `<db_name>`**

> 指定した場合、該当するデータベースの統計情報を消去します。

**2. `<table_name>`**

> 指定した場合、該当するテーブルの統計情報を消去します。


## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | 対象 | 説明 |
|:-----------|:---------|:--------------------------|
| ADMIN_PRIV | ALL      | ALL を指定した場合、ADMIN 権限が必要です。 |
| ALTER_PRIV | DATABASE | データベースを指定した場合、該当するデータベースの ALTER 権限が必要です。 |
| ADMIN_PRIV | TABLE    | テーブルを指定した場合、そのテーブルの ALTER 権限が必要です。 |


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
