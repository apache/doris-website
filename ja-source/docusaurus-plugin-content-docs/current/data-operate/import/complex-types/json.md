---
{
  "title": "JSON | 複合型",
  "language": "ja",
  "description": "JSONデータ型はJSONデータをバイナリ形式で効率的に格納し、JSON関数を通じてその内部フィールドへのアクセスを可能にします。",
  "sidebar_label": "JSON"
}
---
# JSON

JSONデータ型はJSONデータを効率的にバイナリ形式で格納し、JSON関数を通じて内部フィールドへのアクセスを可能にします。

デフォルトでは、最大1048576バイト（1MB）をサポートし、最大2147483643バイト（2GB）まで増加可能です。これはstring_type_length_soft_limit_bytes設定で調整できます。

通常のSTRING型にJSON文字列を格納する場合と比較して、JSON型には2つの主な利点があります：

データ挿入時のJSON形式検証。
より効率的なバイナリストレージ形式により、get_json_xx関数と比較してjson_extractなどの関数を使用したJSON内部フィールドへの高速アクセスが可能。

注意：バージョン1.2.xでは、JSON型はJSONBという名前でした。MySQLとの互換性を保つため、バージョン2.0.0からJSONに名前が変更されました。古いテーブルでは以前の名前を引き続き使用できます。

## CSV形式インポート

### ステップ1：データの準備

次のcsvファイルを作成します：`test_json.csv`
区切り文字はjson内のカンマと区別するため、カンマではなく`|`を使用します。

```
1|{"name": "tom", "age": 35}
2|{"name": null, "age": 28}
3|{"name": "michael", "age": null}
4|{"name": null, "age": null}
5|null
```
### ステップ2: データベースにテーブルを作成する

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
### Step 3: データを読み込む

```bash
curl --location-trusted \
        -u "root":"" \
        -H "column_separator:|" \
        -H "columns: id, c_json" \
        -T "test_json.csv" \
        http://localhost:8040/api/testdb/json_test/_stream_load
```
### ステップ 4: インポートしたデータを確認する

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
## JSON形式のインポート

### ステップ1: データを準備する

以下のJSONファイル`test_json.json`を作成してください

```json
[
    {"id": 1, "c_json": {"name": "tom", "age": 35}},
    {"id": 2, "c_json": {"name": null, "age": 28}},
    {"id": 3, "c_json": {"name": "michael", "age": null}},
    {"id": 4, "c_json": {"name": null, "age": null}},
    {"id": 5, "c_json": null}
]
```
### ステップ2: データベースにテーブルを作成する

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
### ステップ3: データの読み込み

```bash
curl --location-trusted \
        -u "root":"" \
        -H "format:json" \
        -H "columns: id, c_json" \
        -H "strip_outer_array:true" \
        -T "test_json.json" \
        http://localhost:8040/api/testdb/json_test/_stream_load
```
### ステップ4: インポートされたデータを確認する

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
