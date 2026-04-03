---
{
  "title": "クエリ",
  "language": "ja",
  "description": "クエリテーブル関数（table-valued-function、tvf）は、データクエリのためにクエリステートメントを透過的にカタログに直接送信するために使用できます"
}
---
## 詳細

クエリテーブル関数（table-valued-function、tvf）は、データクエリのためにクエリステートメントを直接catalogに透過的に送信するために使用できます。

Dorisバージョン2.1.3でサポートされており、現在は透過的なクエリjdbc catalogのみがサポートされています。
最初にDorisで対応するcatalogを作成する必要があります。


## Syntax

```sql
QUERY(
    "catalog" = "<catalog>", 
    "query" = "<query_sql>"
  );
```
## 必須パラメータ
クエリテーブル関数tvfの各パラメータは`"key"="value"`ペアです。

| フィールド | 説明                                        |
|------------|---------------------------------------------|
| `catalog`  | カタログ名。カタログの名前に従って入力する必要があります。 |
| `query`    | 実行するクエリ文。                          |


## 例

`desc function`と併用できます

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
jdbc catalogデータソースのテーブルに対する透過的クエリ

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
jdbc catalog データソースのテーブルに対する透過的結合クエリ

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
