---
{
  "title": "SHOW COLUMNS",
  "language": "ja",
  "description": "このステートメントは、テーブルのカラム情報を指定するために使用されます。"
}
---
## 説明

このステートメントは、テーブルの列情報を指定するために使用されます。

## 構文

```sql
SHOW [ FULL ] COLUMNS FROM <tbl>;
```
## 必須パラメータ
**1. `<tbl>`**

カラム情報を表示するテーブルの名前を指定する必要があります。

## オプションパラメータ
**1. `FULL`**

`FULL`キーワードが指定された場合、カラムの集約タイプ、権限、コメントなどを含む、カラムに関する詳細情報が返されます。

## 戻り値
| Column     | DataType | Note                    |
|------------|----------|-------------------------|
| Field      | varchar  | カラム名                |
| Type       | varchar  | カラムデータタイプ      |
| Collation  | varchar  | カラム照合順序          |
| Null       | varchar  | NULLが許可されるかどうか |
| Key        | varchar  | テーブルの主キー        |
| Default    | varchar  | デフォルト値            |
| Extra      | varchar  | 追加情報                |
| Privileges | varchar  | カラム権限              |
| Comment    | varchar  | カラムコメント          |

## アクセス制御要件
表示するテーブルに対する`SHOW`権限が必要です。

## 例

1. 指定したテーブルの詳細なカラム情報を表示

```sql
SHOW FULL COLUMNS FROM t_agg;
```
```text
+-------+-----------------+-----------+------+------+---------+---------+------------+---------+
| Field | Type            | Collation | Null | Key  | Default | Extra   | Privileges | Comment |
+-------+-----------------+-----------+------+------+---------+---------+------------+---------+
| k1    | tinyint         |           | YES  | YES  | NULL    |         |            |         |
| k2    | decimalv3(10,2) |           | YES  | YES  | 10.5    |         |            |         |
| v1    | char(10)        |           | YES  | NO   | NULL    | REPLACE |            |         |
| v2    | int             |           | YES  | NO   | NULL    | SUM     |            |         |
+-------+-----------------+-----------+------+------+---------+---------+------------+---------+
```
2. 指定されたテーブルの通常の列情報を表示する

```sql
SHOW COLUMNS FROM t_agg;
```
```text
+-------+-----------------+------+------+---------+---------+
| Field | Type            | Null | Key  | Default | Extra   |
+-------+-----------------+------+------+---------+---------+
| k1    | tinyint         | YES  | YES  | NULL    |         |
| k2    | decimalv3(10,2) | YES  | YES  | 10.5    |         |
| v1    | char(10)        | YES  | NO   | NULL    | REPLACE |
| v2    | int             | YES  | NO   | NULL    | SUM     |
+-------+-----------------+------+------+---------+---------+
```
