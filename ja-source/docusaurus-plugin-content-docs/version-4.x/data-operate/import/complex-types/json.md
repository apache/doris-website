---
{
  "title": "JSON | 複合型",
  "sidebar_label": "JSON",
  "description": "JSONデータ型は、JSONデータをバイナリ形式で効率的に保存し、JSON関数を通じてその内部フィールドへのアクセスを可能にします。",
  "language": "ja"
}
---
# JSON

JSONデータ型は、JSONデータを効率的にバイナリ形式で格納し、JSON関数を通じて内部フィールドへのアクセスを可能にします。

デフォルトでは、最大1048576バイト（1MB）をサポートし、最大2147483643バイト（2GB）まで増加できます。これはstring_type_length_soft_limit_bytes設定で調整できます。

通常のSTRING型でJSON文字列を格納する場合と比較して、JSON型には2つの主な利点があります：

データ挿入時のJSON形式検証。
より効率的なバイナリストレージ形式により、get_json_xx関数と比較してjson_extractなどの関数を使用したJSON内部フィールドへの高速アクセスが可能。

注意：バージョン1.2.xでは、JSON型はJSONBという名前でした。MySQLとの互換性を保つため、バージョン2.0.0からJSONに名前が変更されました。古いtableでは引き続き以前の名前を使用できます。

## CSV形式インポート

### ステップ1：データの準備

以下のcsvファイルを作成します：`test_json.csv`
セパレータはjson内のカンマと区別するため、カンマの代わりに`|`を使用します。

```
1|{"name": "tom", "age": 35}
2|{"name": null, "age": 28}
3|{"name": "michael", "age": null}
4|{"name": null, "age": null}
5|null
```
### ステップ 2: データベースにTableを作成する

```sql
CREATE TABLE json_test (
    id          INT     NOT NULL,
    c_json      JSON    NULL
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
        -H "columns: id, c_json" \
        -T "test_json.csv" \
        http://localhost:8040/api/testdb/json_test/_stream_load
```
### ステップ 4: インポートされたデータを確認する

```sql
SELECT * FROM json_test;
+------+-------------------------------+
| id   | c_json                        |
+------+-------------------------------+
|    1 | {"name":"tom","age":35}       |
|    2 | {"name":null,"age":28}        |
|    3 | {"name":"michael","age":null} |
|    4 | {"name":null,"age":null}      |
|    5 | null                          |
+------+-------------------------------+
5 rows in set (0.01 sec)
```
## JSON format import

### ステップ 1: データの準備

以下のJSONファイル `test_json.json` を作成します

```json
[
    {"id": 1, "c_json": {"name": "tom", "age": 35}},
    {"id": 2, "c_json": {"name": null, "age": 28}},
    {"id": 3, "c_json": {"name": "michael", "age": null}},
    {"id": 4, "c_json": {"name": null, "age": null}},
    {"id": 5, "c_json": null}
]
```
### ステップ 2: データベースにTableを作成する

```sql
CREATE TABLE json_test (
    id          INT     NOT NULL,
    c_json      JSON    NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```
### ステップ 3: データを読み込む

```bash
curl --location-trusted \
        -u "root":"" \
        -H "format:json" \
        -H "columns: id, c_json" \
        -H "strip_outer_array:true" \
        -T "test_json.json" \
        http://localhost:8040/api/testdb/json_test/_stream_load
```
### ステップ 4: インポートしたデータを確認する

```sql
mysql> SELECT * FROM json_test;
+------+-------------------------------+
| id   | c_json                        |
+------+-------------------------------+
|    1 | {"name":"tom","age":35}       |
|    2 | {"name":null,"age":28}        |
|    3 | {"name":"michael","age":null} |
|    4 | {"name":null,"age":null}      |
|    5 | NULL                          |
+------+-------------------------------+
5 rows in set (0.01 sec)
```
