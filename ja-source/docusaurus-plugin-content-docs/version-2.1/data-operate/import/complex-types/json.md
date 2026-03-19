---
{
  "title": "JSON | 複合型",
  "language": "ja",
  "description": "JSONデータ型は、JSONデータをバイナリ形式で効率的に格納し、JSON関数を通じてその内部フィールドへのアクセスを可能にします。",
  "sidebar_label": "JSON"
}
---
# JSON

JSON データ型は JSON データを効率的にバイナリ形式で保存し、JSON 関数を通じてその内部フィールドにアクセスできます。

デフォルトでは、最大 1048576 バイト（1MB）をサポートし、最大 2147483643 バイト（2GB）まで増やすことができます。これは string_type_length_soft_limit_bytes 設定で調整できます。

通常の STRING 型で JSON 文字列を保存する場合と比較して、JSON 型には 2 つの主な利点があります：

データ挿入時の JSON 形式検証。
より効率的なバイナリストレージ形式により、get_json_xx 関数と比較して、json_extract などの関数を使用した JSON 内部フィールドへの高速アクセスが可能。

注：バージョン 1.2.x では、JSON 型は JSONB という名前でした。MySQL との互換性を維持するため、バージョン 2.0.0 から JSON に名前が変更されました。古いテーブルでは以前の名前を引き続き使用できます。

## CSV format インポート

### ステップ 1：データの準備

以下の csv ファイルを作成してください：`test_json.csv`
セパレーターは json 内のカンマと区別するためにカンマの代わりに `|` を使用します。

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
### ステップ3: データの読み込み

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
## JSON形式でのインポート

### ステップ1: データを準備する

以下のJSONファイル `test_json.json` を作成してください

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
