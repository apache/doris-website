---
{
    "title": "JSON | ファイル形式",
    "language": "ja",
    "description": "Doris に JSON ファイルをインポートするためのガイドです。3 種類の JSON 形式、jsonpaths や json_root などのパラメータ設定、Stream Load、Broker Load、Routine Load、TVF の使用例を説明します。",
    "keywords": [
        "Doris JSON インポート",
        "jsonpaths",
        "json_root",
        "strip_outer_array",
        "read_json_by_line",
        "Stream Load JSON",
        "Routine Load JSON",
        "ネストされた JSON のインポート"
    ],
    "sidebar_label": "JSON"
}
---

<!-- Knowledge type: Procedure + Configuration parameters -->
<!-- Applicable scenario: JSON data import / Field extraction / Nested structure handling -->

このドキュメントでは、JSON 形式のデータファイルを Doris にインポートする方法を説明します。Doris は標準的な JSON 形式のデータをインポートできます。パラメータを設定することで、さまざまな JSON データ構造への対応、フィールドの抽出、ネストされた構造の解析などができます。

## インポート方法

次のインポート方法は JSON 形式のデータに対応しています。

| インポート方法 | 適した用途 | パラメータの指定方法 |
|---|---|---|
| [Stream Load](../import-way/stream-load-manual) | ローカルまたはクライアントから送信する小規模バッチの準リアルタイムインポート | HTTP ヘッダー。例: `-H "jsonpaths: $.data"` |
| [Broker Load](../import-way/broker-load-manual) | オブジェクトストレージや HDFS などにある大きなファイルの一括インポート | `PROPERTIES`。例: `PROPERTIES("jsonpaths"="$.data")` |
| [Routine Load](../import-way/routine-load-manual) | Kafka などのメッセージキューから JSON を継続的に取り込む場合 | `PROPERTIES`。例: `PROPERTIES("jsonpaths"="$.data")` |
| [INSERT INTO FROM S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3) | S3 上の JSON ファイルを SQL で直接読み込む場合 | TVF パラメータ。例: `S3("jsonpaths"="$.data")` |
| [INSERT INTO FROM HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs) | HDFS 上の JSON ファイルを SQL で直接読み込む場合 | TVF パラメータ |

## 対応する JSON 形式

Doris は、次の三種類の JSON ファイル構成形式に対応しています。それぞれ適した用途が異なります。

### 形式 1: 配列で表された複数行

複数行を一度にまとめてインポートする場合に適しています。

要件:

- ルートノードは配列である必要があります。
- 配列の各要素は、一行分のデータを表すオブジェクトです。
- `strip_outer_array=true` を設定する必要があります。

データ例:

```json
[
    {"id": 123, "city": "beijing"},
    {"id": 456, "city": "shanghai"}
]

// Nested structures are supported
[
    {"id": 123, "city": {"name": "beijing", "region": "haidian"}},
    {"id": 456, "city": {"name": "beijing", "region": "chaoyang"}}
]
```

### 形式 2: オブジェクトで表された単一行

単一行のデータをインポートする場合に適しています。

要件:

- ルートノードはオブジェクトである必要があります。
- オブジェクト全体が一行分のデータを表します。
- ファイルの各行には JSON レコードが一件だけ含まれます。

データ例:

```json
{"id": 123, "city": "beijing"}

// Nested structures are supported
{"id": 123, "city": {"name": "beijing", "region": "haidian"}}
```

:::tip 注記
この形式は、Kafka の単一メッセージなどを Routine Load で取り込む場合によく使用します。
:::

### 形式 3: 固定の区切り文字で区切られた複数行のオブジェクトデータ {#format-3-multiple-rows-of-object-data-separated-by-a-fixed-delimiter}

各行が独立した JSON オブジェクトである複数行をまとめてインポートする場合に適しています（NDJSON に類似）。

要件:

- 各行は完全な JSON オブジェクトである必要があります。
- `read_json_by_line=true` を明示的に設定する必要はありません。デフォルトで有効です。
- 行区切り文字は `line_delimiter` パラメータで指定でき、デフォルトは `\n` です。

データ例:

```json
{"id": 123, "city": "beijing"}
{"id": 456, "city": "shanghai"}
```

## パラメータ設定

### インポート方法別のパラメータ対応表

次の表に、各インポート方法での JSON 関連パラメータの対応状況を示します。

| パラメータ | デフォルト値 | Stream Load | Broker Load | Routine Load | TVF |
|---|---|---|---|---|---|
| `jsonpaths` | なし | 対応 | 対応 | 対応 | 対応 |
| `json_root` | なし | 対応 | 対応 | 対応 | 対応 |
| `strip_outer_array` | false | 対応 | 対応 | 対応 | 対応 |
| `read_json_by_line` | true | 対応 | 設定不可 | 設定不可 | 対応 |
| `fuzzy_parse` | false | 対応 | 対応 | 非対応 | 対応 |
| `num_as_string` | false | 対応 | 対応 | 対応 | 対応 |
| 圧縮形式 | plain | 対応 | 対応 | 非対応 | 対応 |

:::tip パラメータの指定方法とデフォルトの動作

1. Stream Load: パラメータを HTTP ヘッダーで直接指定します。例: `-H "jsonpaths: $.data"`。
2. Broker Load: パラメータを `PROPERTIES` で指定します。例: `PROPERTIES("jsonpaths"="$.data")`。
3. Routine Load: パラメータを `PROPERTIES` で指定します。例: `PROPERTIES("jsonpaths"="$.data")`。
4. TVF: パラメータを TVF ステートメントで指定します。例: `S3("jsonpaths"="$.data")`。
5. JSON ファイルのルートノードにある JSON オブジェクトを直接インポートするには、`jsonpaths` に `$.` を設定します。例: `PROPERTIES("jsonpaths"="$.")`。
6. `read_json_by_line` のデフォルト値は true です。つまり、インポート時に `strip_outer_array` と `read_json_by_line` のどちらも指定しなければ、`read_json_by_line` は true になります。
7. Broker Load と Routine Load では `read_json_by_line` を設定できません。ストリーミング読み込みを可能にし、BE のメモリ負荷を抑えるため、true に固定されます。

:::

### パラメータの詳細

#### jsonpaths

- **用途**: JSON データからフィールドを抽出する方法を指定します。
- **型**: 文字列の配列。
- **デフォルト**: なし。デフォルトでは列を名前で照合します。
- **例**:

    ```json
    -- Basic usage
    ["$.id", "$.city"]

    -- Nested structure
    ["$.id", "$.info.city", "$.data[0].name"]
    ```

#### json_root

- **用途**: JSON データの解析を開始する位置を指定します。
- **型**: 文字列。
- **デフォルト**: なし。デフォルトではルートノードから解析を開始します。
- **例**:

    ```json
    -- Original data
    {
      "data": {
        "id": 123,
        "city": "beijing"
      }
    }

    -- Set json_root
    json_root = $.data
    ```

#### strip_outer_array

- **用途**: 最も外側の配列構造を取り除くかどうかを指定します。
- **型**: 真偽値。
- **デフォルト**: false。
- **例**:

    ```json
    -- Original data
    [
      {"id": 1, "city": "beijing"},
      {"id": 2, "city": "shanghai"}
    ]

    -- Set strip_outer_array=true
    ```

#### read_json_by_line

- **用途**: JSON データを一行ずつ読み込むかどうかを指定します。
- **型**: 真偽値。
- **デフォルト**: `strip_outer_array` を設定しない場合は true です。`strip_outer_array=true` を指定すると、デフォルトは false になります。（Broker Load と Routine Load では常に `read_json_by_line=true` に固定されます。）
- **例**:

    ```json
    -- Original data (one complete JSON object per line)
    {"id": 1, "city": "beijing"}
    {"id": 2, "city": "shanghai"}

    -- Set read_json_by_line=true
    ```

#### fuzzy_parse

- **用途**: JSON データのインポートを高速化します。
- **型**: 真偽値。
- **デフォルト**: false。
- **制約**:
    - 配列のすべての行でフィールドの順序が完全に同じである必要があります。
    - 通常は `strip_outer_array` と併用します。
- **性能**: インポート効率が 3～5 倍になります。

#### num_as_string

- **用途**: JSON 内の数値を文字列として解析するかどうかを指定します。
- **型**: 真偽値。
- **デフォルト**: false。
- **使用例**:
    - 対応する数値範囲を超える数値を扱う場合。
    - 数値の精度が失われるのを防ぐ場合。
- **例**:

    ```json
    -- Original data
    {
      "id": "12345678901234567890",
      "price": "99999999.999999"
    }
    -- With num_as_string=true, the price field is parsed as a string
    ```

### JSON Path と Columns の関係 {#relationship-between-json-path-and-columns}

データのインポート時には、`jsonpaths` と `columns` はそれぞれ異なる役割を持ちます。

| パラメータ | 役割 | 結果 |
|---|---|---|
| `jsonpaths` | データ抽出の規則を定義する | 指定したパスに沿って JSON データからフィールドを抽出し、`jsonpaths` で定義した順序に並べ替える |
| `columns` | データのマッピング規則を定義する | 抽出したフィールドを対象テーブルの列に対応付ける。必要に応じて列の並べ替えや変換も行える |

この二つは次の順序で処理されます。

1. まず `jsonpaths` がソースデータからフィールドを抽出し、順序付けられたデータを作成します。
2. 次に `columns` が各データ項目をテーブルの列に対応付けます。

`columns` を指定しない場合、抽出したフィールドはテーブルの列順に直接対応付けられます。

#### 例 1: JSON Path のみを使用する

テーブルスキーマとデータ:

```sql
-- Table schema
CREATE TABLE example_table (
    k2 int,
    k1 int
);

-- JSON data
{"k1": 1, "k2": 2}
```

インポートコマンド:

```shell
curl -v ... -H "format: json" \
    -H "jsonpaths: [\"$.k2\", \"$.k1\"]" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load
```

インポート結果:

```text
+------+------+
| k1   | k2   |
+------+------+
|    2 |    1 |
+------+------+
```

#### 例 2: JSON Path と Columns を併用する

上記と同じテーブルスキーマとデータを使用し、`columns` パラメータを追加します。

インポートコマンド:

```shell
curl -v ... -H "format: json" \
    -H "jsonpaths: [\"$.k2\", \"$.k1\"]" \
    -H "columns: k2, k1" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load
```

インポート結果:

```text
+------+------+
| k1   | k2   |
+------+------+
|    1 |    2 |
+------+------+
```

#### 例 3: フィールドを再利用する

テーブルスキーマとデータ:

```sql
-- Table schema
CREATE TABLE example_table (
    k2 int,
    k1 int,
    k1_copy int
);

-- JSON data
{"k1": 1, "k2": 2}
```

インポートコマンド:

```shell
curl -v ... -H "format: json" \
    -H "jsonpaths: [\"$.k2\", \"$.k1\", \"$.k1\"]" \
    -H "columns: k2, k1, k1_copy" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load
```

インポート結果:

```text
+------+------+---------+
| k2   | k1   | k1_copy |
+------+------+---------+
|    2 |    1 |       1 |
+------+------+---------+
```

#### 例 4: ネストされたフィールドを対応付ける

テーブルスキーマとデータ:

```sql
-- Table schema
CREATE TABLE example_table (
    k2 int,
    k1 int,
    k1_nested1 int,
    k1_nested2 int
);

-- JSON data
{
    "k1": 1,
    "k2": 2,
    "k3": {
        "k1": 31,
        "k1_nested": {
            "k1": 32
        }
    }
}
```

インポートコマンド:

```shell
curl -v ... -H "format: json" \
    -H "jsonpaths: [\"$.k2\", \"$.k1\", \"$.k3.k1\", \"$.k3.k1_nested.k1\"]" \
    -H "columns: k2, k1, k1_nested1, k1_nested2" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load
```

インポート結果:

```text
+------+------+------------+------------+
| k2   | k1   | k1_nested1 | k1_nested2 |
+------+------+------------+------------+
|    2 |    1 |         31 |         32 |
+------+------+------------+------------+
```

## 使用例

このセクションでは、各インポート方法で JSON 形式を使用する例を示します。コード例をコピーして用途に合わせて調整できます。

### Stream Load

```bash
# Use JSON Path
curl --location-trusted -u <user>:<passwd> \
    -H "format: json" \
    -H "jsonpaths: [\"$.id\", \"$.city\"]" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load

# Specify JSON root
curl --location-trusted -u <user>:<passwd> \
    -H "format: json" \
    -H "json_root: $.events" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load

# Read JSON line by line
curl --location-trusted -u <user>:<passwd> \
    -H "format: json" \
    -H "read_json_by_line: true" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load
```

### Broker Load

```sql
-- Use JSON Path
LOAD LABEL example_db.example_label
(
    DATA INFILE("s3://bucket/path/example.json")
    INTO TABLE example_table
    FORMAT AS "json"
    PROPERTIES
    (
        "jsonpaths" = "[\"$.id\", \"$.city\"]"
    )
)
WITH S3
(
    ...
);

-- Specify JSON root
LOAD LABEL example_db.example_label
(
    DATA INFILE("s3://bucket/path/example.json")
    INTO TABLE example_table
    FORMAT AS "json"
    PROPERTIES
    (
        "json_root" = "$.events"
    )
)
WITH S3
(
    ...
);
```

### Routine Load

```sql
-- Use JSON Path
CREATE ROUTINE LOAD example_db.example_job ON example_table
PROPERTIES
(
    "format" = "json",
    "jsonpaths" = "[\"$.id\", \"$.city\"]"
)
FROM KAFKA
(
    ...
);
```

### TVF

```sql
-- Use JSON Path
INSERT INTO example_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.json",
    "format" = "json",
    "jsonpaths" = "[\"$.id\", \"$.city\"]",
    ...
);

-- Specify JSON root
INSERT INTO example_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.json",
    "format" = "json",
    "json_root" = "$.events",
    ...
);
```

## よくある質問

<!-- Knowledge type: Troubleshooting -->

### Q1: 配列形式の JSON ファイルをインポートすると、すべてのデータが一行として扱われるのはなぜですか？

`strip_outer_array=true` を明示的に設定する必要があります。設定しないと、Doris は外側の配列全体を一つの JSON オブジェクトとして解析し、データを一行ずつ書き込めません。

### Q2: 一行に一つの JSON オブジェクトがあるファイル（NDJSON）はどのようにインポートしますか？

[形式 3](#format-3-multiple-rows-of-object-data-separated-by-a-fixed-delimiter) を使用してそのままインポートします。`read_json_by_line` はデフォルトで有効なため、追加設定は不要です。行区切り文字が `\n` 以外の場合は、`line_delimiter` で指定します。

### Q3: JSON ファイルのルートノードにある JSON オブジェクトを直接インポートするにはどうすればよいですか？

`jsonpaths` に `$.` を設定します。例: `PROPERTIES("jsonpaths"="$.")`。

### Q4: 非常に大きな数値や高精度の小数で精度が失われるのを防ぐにはどうすればよいですか？

`num_as_string=true` を設定します。JSON 内の数値は文字列として解析され、対応する列の型に書き込まれます。これにより、数値のオーバーフローや精度の損失を防げます。

### Q5: Broker Load と Routine Load で `read_json_by_line` を設定できないのはなぜですか？

BE のメモリ負荷を抑えるため、Broker Load と Routine Load は常にストリーミングモードで一行ずつ読み込みます。そのため、`read_json_by_line` を明示的に設定することはできません。

### Q6: 同じ構造の JSON 配列を大量にインポートする際、高速化するにはどうすればよいですか？

`fuzzy_parse=true` を `strip_outer_array=true` とともに有効にすると、インポート性能が 3～5 倍になります。配列のすべての行でフィールドの順序が完全に同じである必要があります。

### Q7: `jsonpaths` と `columns` はどのような関係にあり、どちらが先に適用されますか？

まず `jsonpaths` が JSON からフィールドを抽出して指定順に並べ、次に `columns` がこれらのフィールドを対象テーブルの列に対応付けます。詳しくは、[JSON Path と Columns の関係](#relationship-between-json-path-and-columns)を参照してください。
