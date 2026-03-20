---
{
  "title": "ARRAY | 複合型",
  "language": "ja",
  "description": "ARRAY<T> T型アイテムの配列で、キー列として使用することはできません。",
  "sidebar_label": "ARRAY"
}
---
# ARRAY

`ARRAY<T>` T型アイテムの配列で、キー列として使用することはできません。

- バージョン2.0以前では、Duplicateモデルテーブルでのみサポートされていました。
- バージョン2.0以降では、Uniqueモデルテーブルの非キー列でサポートされています。

T型は以下のいずれかです：

```sql
BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE,
DATEV2, DATETIME, DATETIMEV2, CHAR, VARCHAR, STRING
```
## CSV形式のインポート

### ステップ1: データの準備

以下のcsvファイルを作成してください: `test_array.csv`
区切り文字は配列内のカンマと区別するため、カンマの代わりに`|`を使用します。

```
1|[1,2,3,4,5]
2|[6,7,8]
3|[]
4|null
```
### ステップ2: データベースにテーブルを作成する

```sql
CREATE TABLE `array_test` (
    `id`         INT           NOT NULL,
    `c_array`    ARRAY<INT>    NULL
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```
### ステップ3: データの読み込み

```bash
curl --location-trusted \
        -u "root":"" \
        -H "column_separator:|" \
        -H "columns: id, c_array" \
        -T "test_array.csv" \
        http://localhost:8040/api/testdb/array_test/_stream_load
```
### ステップ4: インポートしたデータを確認する

```sql
mysql> SELECT * FROM array_test;
+------+-----------------+
| id   | c_array         |
+------+-----------------+
|    1 | [1, 2, 3, 4, 5] |
|    2 | [6, 7, 8]       |
|    3 | []              |
|    4 | NULL            |
+------+-----------------+
4 rows in set (0.01 sec)
```
## JSON形式でのインポート

### ステップ1: データを準備する

以下のJSONファイル`test_array.json`を作成します

```json
[
    {"id":1, "c_array":[1,2,3,4,5]},
    {"id":2, "c_array":[6,7,8]},
    {"id":3, "c_array":[]},
    {"id":4, "c_array":null}
]
```
### ステップ2: データベースにテーブルを作成する

```sql
CREATE TABLE `array_test` (
    `id`         INT           NOT NULL,
    `c_array`    ARRAY<INT>    NULL
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```
### ステップ3: データの読み込み

```bash
curl --location-trusted \
        -u "root":"" \
        -H "format:json" \
        -H "columns: id, c_array" \
        -H "strip_outer_array:true" \
        -T "test_array.json" \
        http://localhost:8040/api/testdb/array_test/_stream_load
```
### ステップ4: インポートされたデータを確認する

```sql
mysql> SELECT * FROM array_test;
+------+-----------------+
| id   | c_array         |
+------+-----------------+
|    1 | [1, 2, 3, 4, 5] |
|    2 | [6, 7, 8]       |
|    3 | []              |
|    4 | NULL            |
+------+-----------------+
4 rows in set (0.01 sec)
```
