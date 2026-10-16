---
{
    "title": "QUERY",
    "language": "ja",
    "description": "QUERY テーブル関数（table-valued function、TVF）は、クエリ文をカタログに透過的に転送してデータを照会できます"
}
---

## 説明

QUERY テーブル関数（table-valued function、TVF）は、クエリ文をカタログに透過的に転送してデータを照会できます。

Doris 2.1.3 でサポートされています。現時点では、JDBC Catalog に対する透過的なクエリのみサポートします。
事前に、対応するカタログを Doris に作成する必要があります。


## 構文

```sql
QUERY(
    "catalog" = "<catalog>", 
    "query" = "<query_sql>"
  );
```

## 必須パラメータ
QUERY テーブル関数の各パラメータは、`"key"="value"` の形式で指定します。

| 項目      | 説明                                |
|------------|--------------------------------------------|
| `catalog`  | カタログ名。作成済みのカタログの名前を指定します。 |
| `query`    | 実行するクエリ文。       |


## 例

`desc function` と組み合わせて使用できます。

```sql
desc function query("catalog" = "jdbc", "query" = "select * from test.student");
```
```text
+-------+------+------+-------+---------+-------+
| Field | Type | Null | Key   | Default | Extra |
+-------+------+------+-------+---------+-------+
| id    | int  | Yes  | true  | NULL    |       |
| name  | text | Yes  | false | NULL    | NONE  |
+-------+------+------+-------+---------+-------+
```

JDBC Catalog のデータソースにあるテーブルを透過的に照会します。

```sql
select * from query("catalog" = "jdbc", "query" = "select * from test.student");
```
```text
+------+---------+
| id   | name    |
+------+---------+
| 1    | alice   |
| 2    | bob     |
| 3    | jack    |
+------+---------+
```
```sql
select * from query("catalog" = "jdbc", "query" = "select * from test.score");
```
```text
+------+---------+
| id   | score   |
+------+---------+
| 1    | 100     |
| 2    | 90      |
| 3    | 80      |
+------+---------+
```

JDBC Catalog のデータソースにあるテーブルを、透過的なクエリで結合します。

```sql
select * from query("catalog" = "jdbc", "query" = "select a.id, a.name, b.score from test.student a join test.score b on a.id = b.id");
```
```
+------+---------+---------+
| id   | name    | score   |
+------+---------+---------+
| 1    | alice   | 100     |
| 2    | bob     | 90      |
| 3    | jack    | 80      |
+------+---------+---------+
```
