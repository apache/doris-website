---
{
  "title": "DESC FUNCTION",
  "description": "desc関数tablevaluedfunction を使用して、対応するtable値関数のスキーマ情報を取得します。",
  "language": "ja"
}
---
## 説明

desc関数table_valued_functionを使用して、対応するtable値関数のスキーマ情報を取得します。

## 構文

```sql
DESC FUNCTION <table_valued_function>
```
## 必須パラメータ

**<table_valued_function>**

> table_valued_function、Table値関数の名前。CATALOGSなど。サポートされているTable値関数のリストについては、「[Table-Valued Functions](https://doris.apache.org/docs/dev/lakehouse/file-analysis)」セクションを参照してください。

## 例

Table値関数CATALOGSの情報を照会する：

```sql
DESC FUNCTION catalogs();
```
結果は以下の通りです：

```sql
+-------------+--------+------+-------+---------+-------+
| Field       | タイプ   | Null | Key   | Default | Extra |
+-------------+--------+------+-------+---------+-------+
| CatalogId   | bigint | No   | false | NULL    | NONE  |
| CatalogName | text   | No   | false | NULL    | NONE  |
| CatalogType | text   | No   | false | NULL    | NONE  |
| Property    | text   | No   | false | NULL    | NONE  |
| Value       | text   | No   | false | NULL    | NONE  |
+-------------+--------+------+-------+---------+-------+
```
