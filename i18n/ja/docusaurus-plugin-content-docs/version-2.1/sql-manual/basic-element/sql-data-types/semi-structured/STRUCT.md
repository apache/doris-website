---
{
  "title": "STRUCT | 半構造化",
  "language": "ja",
  "description": "構造体",
  "sidebar_label": "STRUCT"
}
---
# STRUCT

## STRUCT

### name

STRUCT

### description

`STRUCT<field_name:field_type [COMMENT 'comment_string'], ... >`

複数のフィールドで記述される構造を持つ値を表し、複数の列のコレクションとして見ることができます。

サポートを手動で有効にする必要があり、デフォルトでは無効になっています。

```
admin set frontend config("enable_struct_type" = "true");
```
Key列として使用することはできません。現在、STRUCTはDuplicate Model Tablesでのみ使用できます。

Struct内のFieldの名前と数は固定されており、常にNullableです。Fieldは通常、以下の部分で構成されます。

- field_name: fieldに名前を付けるIdentifier、重複不可。
- field_type: データ型。
- COMMENT: fieldを説明するオプションの文字列。（現在サポートされていません）

現在サポートされている型は次のとおりです：

```
BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DECIMALV3, DATE,
DATEV2, DATETIME, DATETIMEV2, CHAR, VARCHAR, STRING
```
今後のバージョンに向けたtodoリストがあります：

```
TODO: Supports nested Struct or other complex types
```
### example

テーブル作成例:

```
mysql> CREATE TABLE `struct_test` (
  `id` int(11) NULL,
  `s_info` STRUCT<s_id:int(11), s_name:string, s_address:string> NULL
) ENGINE=OLAP
DUPLICATE KEY(`id`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1",
"storage_format" = "V2",
"light_schema_change" = "true",
"disable_auto_compaction" = "false"
);
```
データ挿入例：

```
INSERT INTO `struct_test` VALUES (1, {1, 'sn1', 'sa1'});
INSERT INTO `struct_test` VALUES (2, struct(2, 'sn2', 'sa2'));
INSERT INTO `struct_test` VALUES (3, named_struct('s_id', 3, 's_name', 'sn3', 's_address', 'sa3'));
```
ストリーム読み込み:

test.csv:

```
1|{"s_id":1, "s_name":"sn1", "s_address":"sa1"}
2|{s_id:2, s_name:sn2, s_address:sa2}
3|{"s_address":"sa3", "s_name":"sn3", "s_id":3}
```
例：

```
curl --location-trusted -u root -T test.csv  -H "label:test_label" http://host:port/api/test/struct_test/_stream_load
```
データ選択の例:

```
mysql> select * from struct_test;
+------+-------------------+
| id   | s_info            |
+------+-------------------+
|    1 | {1, 'sn1', 'sa1'} |
|    2 | {2, 'sn2', 'sa2'} |
|    3 | {3, 'sn3', 'sa3'} |
+------+-------------------+
3 rows in set (0.02 sec)
```
### キーワード

    STRUCT
