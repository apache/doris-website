---
{
    "title": "JSON | 複合データ型",
    "language": "ja",
    "description": "Apache Doris の JSON 型の特徴と容量制限、および CSV 形式と JSON 形式の Stream Load によるインポート方法と例を説明します。",
    "keywords": [
        "Doris JSON",
        "JSON データ型",
        "JSONB",
        "JSON インポート",
        "Stream Load JSON",
        "json_extract",
        "複合データ型のインポート",
        "半構造化データ"
    ],
    "sidebar_label": "JSON"
}
---

<!-- Knowledge type: Data type description + Operation steps -->
<!-- Use case: Semi-structured data modeling / JSON data import -->

## 概要

`JSON` は Apache Doris が提供する複合データ型です。JSON データをバイナリ形式で効率的に保存し、JSON 関数を使って内部フィールドにアクセスできます。イベントトラッキングログ、ユーザー属性、設定項目などの半構造化データを保存し、内部フィールドに高速にアクセスする必要がある場合に、この型を選択します。

JSON 文字列を `String` 型として保存する場合と比べて、`JSON` 型には次の利点があります。

1. **データの検証**: Doris は書き込み時に JSON 形式を自動的に検証し、不正なデータの保存を防ぎます。
2. **効率的なアクセス**: バイナリ形式で保存するため、データがよりコンパクトになります。また、`json_extract` などの関数による JSON フィールドへのアクセスは、`get_json_xx` 関数を使う場合より数倍高速です。

### 容量制限

| 項目 | デフォルト | 最大値 | 調整方法 |
| --- | --- | --- | --- |
| 単一の JSON フィールドのサイズ | 1 MB (1048576 バイト) | 2 GB (2147483643 バイト) | BE の設定項目 `string_type_length_soft_limit_bytes` を調整する |

:::caution[バージョン間の互換性]
バージョン 1.2.x では、JSON 型は `JSONB` という名前でした。MySQL との互換性のため、バージョン 2.0.0 から `JSON` に改名されました。`JSONB` で作成された既存のテーブルは、そのまま正常に動作します。
:::

## インポート方法の選択

元のデータファイルの形式に応じて、インポート方法を選択します。

| 元のファイル形式 | 用途 | 主なパラメータ |
| --- | --- | --- |
| CSV | 区切り文字で分割された、各行にレコードを一つ含むファイルからデータを読み込む場合 | `column_separator` (カンマ以外の区切り文字、たとえば `|` を推奨) |
| JSON | データがすでに JSON 配列または JSON Lines 形式である場合 | `format:json`, `strip_outer_array:true` |

以下では、Stream Load を例に、両方の形式についてインポートの全手順を説明します。

## CSV 形式でのインポート

### ステップ 1: データを準備する

CSV ファイル `test_json.csv` を作成します。JSON 内部ではフィールドの区切りにカンマを使うため、衝突を避けるために列の区切り文字には `|` を使います。

```text
1|{"name": "tom", "age": 35}
2|{"name": null, "age": 28}
3|{"name": "micheal", "age": null}
4|{"name": null, "age": null}
5|null
```

### ステップ 2: データベースにテーブルを作成する

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

### ステップ 3: データをインポートする

Stream Load ジョブを送信します。列の区切り文字を `|` にするには、`column_separator` を設定します。

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
|    3 | {"name":"micheal","age":null} |
|    4 | {"name":null,"age":null}      |
|    5 | null                          |
+------+-------------------------------+
5 rows in set (0.01 sec)
```

## JSON 形式でのインポート

### ステップ 1: データを準備する

JSON ファイル `test_json.json` を作成します。ファイルの内容は JSON 配列で、各要素が一行分のレコードに対応します。

```json
[
    {"id": 1, "c_json": {"name": "tom", "age": 35}},
    {"id": 2, "c_json": {"name": null, "age": 28}},
    {"id": 3, "c_json": {"name": "micheal", "age": null}},
    {"id": 4, "c_json": {"name": null, "age": null}},
    {"id": 5, "c_json": null}
]
```

### ステップ 2: データベースにテーブルを作成する

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

### ステップ 3: データをインポートする

Stream Load ジョブを送信します。`format:json` を設定し、`strip_outer_array:true` で外側の配列を展開します。

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
|    3 | {"name":"micheal","age":null} |
|    4 | {"name":null,"age":null}      |
|    5 | NULL                          |
+------+-------------------------------+
5 rows in set (0.01 sec)
```

## よくある質問

<!-- Knowledge type: FAQ -->

**Q1: JSON フィールドの最大サイズはどれくらいですか？**

デフォルトの上限は 1 MB (1048576 バイト) です。BE の設定項目 `string_type_length_soft_limit_bytes` を調整すると、最大 2 GB (2147483643 バイト) まで引き上げられます。

**Q2: バージョン 1.2.x で作成した `JSONB` フィールドは、アップグレード後に変更する必要がありますか？**

変更は不要です。バージョン 2.0.0 から型の名前は `JSON` に変わりましたが、`JSONB` で作成された既存のテーブルでは、引き続き通常どおり読み書きできます。

**Q3: JSON の保存に `JSON` 型が `String` 型より推奨されるのはなぜですか？**

`JSON` 型は書き込み時に形式を検証し、不正なデータの保存を防ぎます。バイナリ形式で保存するためデータがよりコンパクトになり、`json_extract` などの関数によるフィールドへのアクセスは、`get_json_xx` 関数を使う場合より数倍高速です。

**Q4: CSV のインポート時に区切り文字として `|` を使うのはなぜですか？**

JSON 自体にカンマが含まれるため、列の区切り文字にカンマを使うと解析エラーが発生します。JSON 文字列に含まれない文字 (`|` など) を列の区切り文字に選びます。

**Q5: JSON 配列のインポートに `strip_outer_array:true` が必要なのはなぜですか？**

このパラメータを指定すると、Stream Load は外側の JSON 配列を展開し、配列の各要素を独立した行としてインポートします。指定しない場合、配列全体が一つのレコードとして処理されます。
