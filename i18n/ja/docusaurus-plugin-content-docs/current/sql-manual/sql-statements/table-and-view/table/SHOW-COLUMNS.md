---
{
    "title": "SHOW COLUMNS",
    "language": "ja",
    "description": "テーブルの列情報を表示します。"
}
---

## 説明

テーブルの列情報を表示します。

## 構文

```sql
SHOW [ FULL ] COLUMNS FROM <tbl>;
```

## 必須パラメータ
**1. `<tbl>`**

列情報を表示するテーブル名を指定する必要があります。

## 任意パラメータ
**1. `FULL`**

`FULL` を指定すると、列の集約型、権限、コメントなどの詳細情報を返します。

## 戻り値
| 列     | データ型 | 説明                    |
|------------|----------|-------------------------|
| Field      | varchar  | 列名             |
| 型       | varchar  | 列のデータ型        |
| Collation  | varchar  | 列の照合順序        |
| Null       | varchar  | NULL を許可するかどうか |
| Key        | varchar  | テーブルの主キー    |
| Default    | varchar  | デフォルト値           |
| Extra      | varchar  | 追加情報              |
| Privileges | varchar  | 列の権限       |
| Comment    | varchar  | 列のコメント          |

## 必要な権限
表示するテーブルに対する `SHOW` 権限が必要です。

## 例

1. 指定したテーブルの列の詳細情報を表示します

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

2. 指定したテーブルの通常の列情報を表示します

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

