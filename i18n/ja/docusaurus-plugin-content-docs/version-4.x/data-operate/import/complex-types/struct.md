---
{
    "title": "STRUCT 型データのインポート",
    "language": "ja",
    "description": "CSV、JSON、INSERT INTO を使用して Apache Doris に STRUCT 型データをインポートする方法を、テーブル作成、Stream Load、結果の確認例とともに説明します。",
    "keywords": [
        "STRUCT のインポート",
        "複合型のインポート",
        "Doris STRUCT",
        "Stream Load STRUCT",
        "named_struct",
        "CSV による STRUCT のインポート",
        "JSON による STRUCT のインポート"
    ],
    "sidebar_label": "STRUCT"
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Complex type data import -->

`STRUCT<field_name:field_type [COMMENT 'comment_string'], ... >` は、複数のフィールドで構成される構造体を表します。複数の列をまとめたものと考えることもできます。型の詳細については、[STRUCT データ型](../../../sql-manual/basic-element/sql-data-types/semi-structured/STRUCT.md)を参照してください。

この記事では、一般的な利用場面に沿って、次の二種類のデータ形式で STRUCT データを Apache Doris にインポートする方法を説明します。

- **CSV 形式でのインポート**: テキストファイルや ETL ジョブの出力などからインポートする場合に適しています。
- **JSON 形式でのインポート**: API、ログ、半構造化データソースなどからインポートする場合に適しています。

どちらも [Stream Load](../import-way/stream-load-manual.md) を使用します。直接書き込む場合は、`INSERT INTO VALUES` 文も使用できます。

## インポート手順の概要

データ形式にかかわらず、STRUCT 型データのインポートは次の 4 ステップで行います。

| ステップ | 操作 | 説明 |
|------|------|------|
| 1 | データを準備する | 対象の形式（CSV / JSON）でテストデータファイルを作成する |
| 2 | データベースにテーブルを作成する | `STRUCT` フィールドを含むテーブルスキーマを作成する |
| 3 | データをインポートする | Stream Load または `INSERT INTO` でデータを書き込む |
| 4 | インポートしたデータを確認する | `SELECT` で結果を確認する |

## CSV 形式でのインポート

### ステップ 1: データを準備する

次の CSV ファイル `test_struct.csv` を作成します。STRUCT 内部のカンマと区別できるように、区切り文字にはカンマの代わりに `|` を使用します。

```text
1|{10, 3.14, "Emily"}
2|{4, 1.5, null}
3|{7, null, "Benjamin"}
4|{}
5|null
```

### ステップ 2: データベースにテーブルを作成する

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

### ステップ 3: データをインポートする

Stream Load を使用して CSV ファイルをインポートします。

```bash
curl --location-trusted \
    -u "root":"" \
    -H "column_separator:|" \
    -H "columns: id, c_struct" \
    -T "test_struct.csv" \
    http://localhost:8040/api/testdb/struct_test/_stream_load
```

`INSERT INTO VALUES` 文でもインポートできます。

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

## JSON 形式でのインポート

### ステップ 1: データを準備する

次の JSON ファイル `test_struct.json` を作成します。

```json
[
    {"id":1, "c_struct":{"f1":10, "f2":3.14, "f3":"Emily"}},
    {"id":2, "c_struct":{"f1":4, "f2":1.5, "f3":null}},
    {"id":3, "c_struct":{"f1":7, "f2":null, "f3":"Benjamin"}},
    {"id":4, "c_struct":{}},
    {"id":5, "c_struct":null}
]
```

### ステップ 2: データベースにテーブルを作成する

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

### ステップ 3: データをインポートする

Stream Load を使用して JSON ファイルをインポートします。`format:json` で形式を指定し、`strip_outer_array:true` で最上位の JSON 配列をレコードごとに解析します。

```bash
curl --location-trusted \
    -u "root":"" \
    -H "format:json" \
    -H "columns: id, c_struct" \
    -H "strip_outer_array:true" \
    -T "test_struct.json" \
    http://localhost:8040/api/testdb/struct_test/_stream_load
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
5 rows in set (0.00 sec)
```

## 主なパラメータ

<!-- Knowledge type: Configuration parameters -->

次の表に、STRUCT のインポートでよく使用する Stream Load のヘッダーパラメータを示します。

| パラメータ | 対象形式 | 説明 |
|------|----------|------|
| `column_separator` | CSV | 列の区切り文字。STRUCT 内部では `,` を使用するため、区切り位置が曖昧にならないよう、外側の区切り文字には `|` など別の文字を使用することを推奨します |
| `columns` | CSV / JSON | 入力列とテーブルのフィールドの対応関係を指定します |
| `format` | JSON | インポートするファイルの形式が `json` であることを指定します |
| `strip_outer_array` | JSON | JSON ファイルの最上位が配列の場合に `true` を指定すると、レコードごとに解析されます |

## よくある質問

<!-- Knowledge type: FAQ -->

### 1. CSV ファイルの区切り文字に `|` を使用し、`,` を使用しないのはなぜですか？

STRUCT フィールドのリテラルでは、内部のフィールドを `,` で区切ります（例: `{10, 3.14, "Emily"}`）。外側の列の区切り文字にも `,` を使用すると、STRUCT 内部の区切り文字と衝突し、解析エラーが発生します。STRUCT 内部に現れない `|` や `\t` などの文字を使用することを推奨します。

### 2. SQL で STRUCT 値を直接挿入するにはどうすればよいですか？

`named_struct` 関数を使用して、各フィールドの名前と値を明示的に指定します。例:

```sql
INSERT INTO struct_test VALUES(1, named_struct('f1', '1', 'f2', '2.0', 'f3', 'abc'));
```

### 3. STRUCT フィールドではどのような NULL 値を使用できますか？

| データの形式 | 意味 |
|----------|------|
| `null` | STRUCT 列全体が NULL |
| `{}` | STRUCT は存在するが、すべてのフィールドが NULL |
| `{10, null, "Emily"}` | 一部のフィールドが NULL で、ほかのフィールドには値が設定されている |

### 4. JSON のインポートで `strip_outer_array:true` を設定する必要があるのはなぜですか？

JSON ファイルで複数のレコードが配列（例: `[ {...}, {...} ]`）にまとめられている場合は、Doris が最上位の配列を取り除いてレコードごとに解析できるように、`strip_outer_array:true` を指定する必要があります。指定しない場合、配列全体が単一のレコードとして扱われます。
