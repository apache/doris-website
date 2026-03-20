---
{
  "title": "MAP | 複合型",
  "sidebar_label": "MAP",
  "description": "MAP<K, V> K、V項目のMapです。詳細はMAPをクリックしてください。",
  "language": "ja"
}
---
# MAP

`MAP<K, V>` K、Vアイテムのマップ。詳細は[MAP](../../../sql-manual/basic-element/sql-data-types/semi-structured/MAP.md)をクリックしてください。

## CSV形式のインポート

### ステップ1: データの準備

以下のcsvファイルを作成します: `test_map.csv`
区切り文字はカンマではなく`|`を使用します。これはmap内のカンマと区別するためです。

```
1|{"Emily":101,"age":25}
2|{"Benjamin":102}
3|{}
4|null
```
### ステップ 2: データベースにTableを作成する

```sql
CREATE TABLE map_test (
    id       INT                 NOT NULL,
    c_map    MAP<STRING, INT>    NULL
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
        -H "columns: id, c_map" \
        -T "test_map.csv" \
        http://localhost:8040/api/testdb/map_test/_stream_load
```
### ステップ 4: インポートされたデータを確認する

```sql
mysql> SELECT * FROM map_test;
+------+-------------------------+
| id   | c_map                   |
+------+-------------------------+
|    1 | {"Emily":101, "age":25} |
|    2 | {"Benjamin":102}        |
|    3 | {}                      |
|    4 | NULL                    |
+------+-------------------------+
4 rows in set (0.01 sec)
```
## JSON format import

### ステップ 1: データの準備

以下のJSONファイル`test_map.json`を作成してください

```json
[
    {"id":1, "c_map":{"Emily":101, "age":25}},
    {"id":2, "c_map":{"Benjamin":102}},
    {"id":3, "c_map":{}},
    {"id":4, "c_map":null}
]
```
### ステップ 2: データベースにTableを作成する

```sql
CREATE TABLE map_test (
    id       INT                 NOT NULL,
    c_map    MAP<STRING, INT>    NULL
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
        -H "columns: id, c_map" \
        -H "strip_outer_array:true" \
        -T "test_map.json" \
        http://localhost:8040/api/testdb/map_test/_stream_load
```
### ステップ 4: インポートしたデータを確認する

```sql
mysql> SELECT * FROM map_test;
+------+-------------------------+
| id   | c_map                   |
+------+-------------------------+
|    1 | {"Emily":101, "age":25} |
|    2 | {"Benjamin":102}        |
|    3 | {}                      |
|    4 | NULL                    |
+------+-------------------------+
4 rows in set (0.01 sec)
```
