---
{
  "title": "STRUCT | 複合型",
  "sidebar_label": "STRUCT",
  "description": "STRUCT<fieldname:fieldtype [COMMENT 'commentstring'], ... > は、複数のフィールドで記述された構造を持つ値を表します。",
  "language": "ja"
}
---
# STRUCT

`STRUCT<field_name:field_type [COMMENT 'comment_string'], ... >` は複数のフィールドで記述された構造を持つ値を表し、複数の列の集合として見ることができます。

- Key列として使用することはできません。現在、STRUCTはDuplicate Model Tablesでのみ使用可能です。

- Struct内のフィールドの名前と数は固定されており、常にNullableです。フィールドは通常以下の部分で構成されます。

  - field_name: フィールドに名前を付ける識別子で、重複不可です。
  - field_type: データ型です。
  - COMMENT: フィールドを説明するオプションの文字列です。（現在サポートされていません）

現在サポートされている型は以下の通りです：

```sql
BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DECIMALV3, DATE,
DATEV2, DATETIME, DATETIMEV2, CHAR, VARCHAR, STRING
```
## CSV format import

### ステップ 1: データの準備

以下のcsvファイルを作成してください：`test_struct.csv`
区切り文字は構造体内のカンマと区別するため、カンマの代わりに`|`を使用します。

```
1|{10, 3.14, "Emily"}
2|{4, 1.5, null}
3|{7, null, "Benjamin"}
4|{}
5|null
```
### ステップ 2: データベースにTableを作成する

```sql
CREATE TABLE struct_test (
    id          INT                                  NOT NULL,
    c_struct    STRUCT<f1:INT,f2:FLOAT,f3:STRING>    NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```
### ステップ3: データの読み込み

```bash
curl --location-trusted \
        -u "root":"" \
        -H "column_separator:|" \
        -H "columns: id, c_struct" \
        -T "test_struct.csv" \
        http://localhost:8040/api/testdb/struct_test/_stream_load
```
`INSERT INTO VALUES`も使用できます：

```sql
INSERT INTO struct_test VALUES(1, named_struct('f1', '1', 'f2', '2.0', 'f3', 'abc'));
```
### ステップ 4: インポートしたデータを確認する

```sql
mysql> SELECT * FROM struct_test;
+------+--------------------------------------+
| id   | c_struct                             |
+------+--------------------------------------+
|    1 | {"f1":10, "f2":3.14, "f3":"Emily"}   |
|    2 | {"f1":4, "f2":1.5, "f3":null}        |
|    3 | {"f1":7, "f2":null, "f3":"Benjamin"} |
|    4 | {"f1":null, "f2":null, "f3":null}    |
|    5 | NULL                                 |
+------+--------------------------------------+
5 rows in set (0.01 sec)
```
## JSON形式のインポート

### ステップ1: データを準備する

以下のJSONファイル `test_struct.json` を作成してください

```json
[
    {"id":1, "c_struct":{"f1":10, "f2":3.14, "f3":"Emily"}},
    {"id":2, "c_struct":{"f1":4, "f2":1.5, "f3":null}},
    {"id":3, "c_struct":{"f1":7, "f2":null, "f3":"Benjamin"}},
    {"id":4, "c_struct":{}},
    {"id":5, "c_struct":null}
]
```
### ステップ 2: データベースにTableを作成する

```sql
CREATE TABLE struct_test (
    id          INT                                  NOT NULL,
    c_struct    STRUCT<f1:INT,f2:FLOAT,f3:STRING>    NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```
### ステップ 3: データの読み込み

```bash
curl --location-trusted \
        -u "root":"" \
        -H "format:json" \
        -H "columns: id, c_struct" \
        -H "strip_outer_array:true" \
        -T "test_struct.json" \
        http://localhost:8040/api/testdb/struct_test/_stream_load
```
### ステップ 4: インポートされたデータを確認する

```sql
mysql> SELECT * FROM struct_test;
+------+--------------------------------------+
| id   | c_struct                             |
+------+--------------------------------------+
|    1 | {"f1":10, "f2":3.14, "f3":"Emily"}   |
|    2 | {"f1":4, "f2":1.5, "f3":null}        |
|    3 | {"f1":7, "f2":null, "f3":"Benjamin"} |
|    4 | {"f1":null, "f2":null, "f3":null}    |
|    5 | NULL                                 |
+------+--------------------------------------+
5 rows in set (0.00 sec)
```
