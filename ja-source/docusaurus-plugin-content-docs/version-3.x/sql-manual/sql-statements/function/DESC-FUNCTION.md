---
{
  "title": "DESC FUNCTION",
  "description": "desc関数tablevaluedfunctionを使用して、対応するtable値関数のスキーマ情報を取得します。",
  "language": "ja"
}
---
## デスクリプション

対応するtable-valued functionのスキーマ情報を取得するには、desc function table_valued_functionを使用します。

## Syntax

```sql
DESC FUNCTION <table_valued_function>
```
## 必須パラメータ

**<table_valued_function>**

> table_valued_function、CATALOGSなどのTable値関数の名前。サポートされているTable値関数の一覧については、"[Table-Valued Functions](https://doris.apache.org/docs/dev/lakehouse/file-analysis)"セクションを参照してください

## 例

Table値関数CATALOGSの情報をクエリする：

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
