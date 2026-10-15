---
{
    "title": "ARRAY | 複合型",
    "language": "ja",
    "description": "CSV および JSON 形式のデータを Stream Load で Apache Doris の ARRAY 型にインポートする方法を、テーブル作成、区切り文字、パラメータの例とともに説明します。",
    "sidebar_label": "ARRAY",
    "keywords": [
        "ARRAY のインポート",
        "配列型",
        "複合型のインポート",
        "CSV からの配列インポート",
        "JSON からの配列インポート",
        "Stream Load",
        "ARRAY<T>",
        "Apache Doris の配列",
        "column_separator",
        "strip_outer_array"
    ]
}
---

<!-- Knowledge type: Procedure / Data import example -->
<!-- Applicable scenario: Importing data files containing array fields into Doris -->

`ARRAY<T>` は型 T の要素からなる配列を表します。タグ、ID のリスト、複数値の属性などを格納する際によく使用します。この型の構文、制約、関数のサポートについては、[ARRAY データ型](../../../sql-manual/basic-element/sql-data-types/semi-structured/ARRAY.md)を参照してください。

このドキュメントでは、**ARRAY フィールドを含むデータを Doris にインポートする方法**を説明します。ソースデータの形式に応じて、CSV と JSON の代表的な二つのケースについて、一連の手順を示します。

## 適用シナリオ

| データソース | 推奨方法 | 主なパラメータ |
| --- | --- | --- |
| `|`, `\t` などで区切られたテキストファイル | CSV 形式の Stream Load | `column_separator` |
| ネストされた構造を持つ JSON 配列 | JSON 形式の Stream Load | `format=json`、`strip_outer_array` |

基本的な手順は次のとおりです。

1. 適切な形式のソースデータファイルを用意する
2. Doris に `ARRAY<T>` カラムを持つターゲットテーブルを作成する
3. Stream Load でファイルをインポートする
4. クエリを実行し、データが正しく解析されたことを確認する

## CSV 形式でのインポート

### ステップ 1: データを用意する

CSV ファイル `test_array.csv` を作成します。配列の要素はカンマで区切られるため、ここではカラム区切り文字に `|` を使用し、配列内の区切り文字との衝突を避けます。

```text
1|[1,2,3,4,5]
2|[6,7,8]
3|[]
4|null
```

### ステップ 2: データベースにテーブルを作成する

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

### ステップ 3: データをインポートする

Stream Load でインポートします。`column_separator` を使用して、カラム区切り文字に `|` を指定します。

```bash
curl --location-trusted \
        -u "root":"" \
        -H "column_separator:|" \
        -H "columns: id, c_array" \
        -T "test_array.csv" \
        http://localhost:8040/api/testdb/array_test/_stream_load
```

### ステップ 4: インポートしたデータを確認する

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

## JSON 形式でのインポート

### ステップ 1: データを用意する

JSON ファイル `test_array.json` を作成します。最外層はオブジェクトの配列です。

```json
[
    {"id":1, "c_array":[1,2,3,4,5]},
    {"id":2, "c_array":[6,7,8]},
    {"id":3, "c_array":[]},
    {"id":4, "c_array":null}
]
```

### ステップ 2: データベースにテーブルを作成する

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

### ステップ 3: データをインポートする

Stream Load でインポートします。`format` を `json` に設定し、`strip_outer_array:true` を使用して最外層の配列を複数の行に分割します。

```bash
curl --location-trusted \
        -u "root":"" \
        -H "format:json" \
        -H "columns: id, c_array" \
        -H "strip_outer_array:true" \
        -T "test_array.json" \
        http://localhost:8040/api/testdb/array_test/_stream_load
```

### ステップ 4: インポートしたデータを確認する

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

## 主なパラメータの説明

| パラメータ | 対応する形式 | 説明 |
| --- | --- | --- |
| `column_separator` | CSV | カラム区切り文字。配列にカンマが含まれる場合は、配列要素の区切り文字との衝突を避けるため、`|` or `\t` などの文字を推奨します |
| `columns` | CSV / JSON | データのカラムとテーブルのカラムの対応順序を指定します |
| `format` | JSON | `json` に設定し、入力を JSON 形式として解析することを指定します |
| `strip_outer_array` | JSON | `true` に設定すると最外層の `[]` が取り除かれ、その中の各オブジェクトが一行としてインポートされます |

## よくある質問

### 配列にカンマが含まれる場合、CSV のカラム区切り文字にカンマを使用できないのはなぜですか？

CSV ファイルでは、`ARRAY` は `[1,2,3]` の形式で表され、要素はカンマで区切られます。カラム区切り文字にもカンマを使用すると、パーサーが配列内の区切り文字とカラム区切り文字を区別できず、解析エラーが発生します。配列の内容に現れない `|` や `\t` などの文字を使用してください。

### NULL 配列と空の配列はどのように表しますか？

- **NULL 配列**: CSV では `null` をそのまま記述し、JSON ではリテラル `null` を使用します。インポート後の値は `NULL` です
- **空の配列**: `[]` と記述します。インポート後の値は `[]` です。この二つは意味が異なります

### JSON ファイルの最外層が配列ではない場合はどうしますか？

ファイルの各行が独立した JSON オブジェクト（JSON Lines）の場合、`strip_outer_array` を設定する必要はありません。最外層が `[ {...}, {...} ]` の形式の場合にのみ、`strip_outer_array` を `true` に設定する必要があります。
