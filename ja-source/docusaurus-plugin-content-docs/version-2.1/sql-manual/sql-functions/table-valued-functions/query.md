---
{
  "title": "クエリ",
  "language": "ja",
  "description": "クエリテーブル関数（table-valued-function、tvf）は、データクエリのためにクエリステートメントを直接カタログに透過的に送信するために使用できます"
}
---
## 説明

クエリテーブル関数（table-valued-function、tvf）を使用して、クエリ文を直接カタログに透過的に送信し、データクエリを実行できます。

Dorisバージョン2.1.3でサポートされており、現在はjdbc catalogの透過的クエリのみサポートされています。
まずDorisで対応するcatalogを作成する必要があります。


## 構文

```sql
QUERY(
    "catalog" = "<catalog>", 
    "query" = "<query_sql>"
  );
```
## 必須パラメータ
クエリテーブル関数tvf内の各パラメータは`"key"="value"`ペアです。

| Field      | Description                                |
|------------|--------------------------------------------|
| `catalog`  | カタログ名。カタログの名前に従って入力する必要があります。 |
| `query`    | 実行するクエリ文。       |


## 例

`desc function`と一緒に使用できます

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
jdbc カタログデータソースのテーブルに対する透過的クエリ

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
jdbc カタログデータソースのテーブルに対する透過的結合クエリ

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
