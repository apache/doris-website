---
{
  "title": "STRUCT | 複合型",
  "sidebar_label": "STRUCT",
  "description": "STRUCT<fieldname:fieldtype [COMMENT 'commentstring'], ... > は、複数のフィールドによって記述された構造を持つ値を表します。",
  "language": "ja"
}
---
# STRUCT

`STRUCT<field_name:field_type [COMMENT 'comment_string'], ... >` は、複数のフィールドによって記述された構造を持つ値を表し、複数の列の集合として見ることができます。詳細については [STRUCT](../../../sql-manual/basic-element/sql-data-types/semi-structured/STRUCT.md) をクリックしてください。

## CSV format インポート

### ステップ 1: データの準備

以下のcsvファイルを作成します: `test_struct.csv`
区切り文字は、struct内のカンマと区別するために、カンマの代わりに `|` を使用します。

```
1|{10, 3.14, "Emily"}
2|{4, 1.5, null}
3|{7, null, "Benjamin"}
4|{}
5|null
```
### ステップ2: データベースにTableを作成する

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
## JSON format import

### ステップ 1: データを準備する

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
