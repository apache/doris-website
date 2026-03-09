---
{
  "title": "JSON | ファイル形式",
  "language": "ja",
  "description": "この文書では、JSON形式のデータファイルをDorisに読み込む方法について説明します。",
  "sidebar_label": "JSON"
}
---
このドキュメントでは、JSON形式のデータファイルをDorisに読み込む方法について説明します。Dorisは標準的なJSON形式のデータの読み込みをサポートし、パラメータ設定により異なるJSONデータ構造を柔軟に処理でき、JSONデータからのフィールド抽出やネストした構造の処理をサポートします。

## 読み込み方法

以下の読み込み方法でJSON形式のデータをサポートします：

- [Stream Load](../import-way/stream-load-manual.md)
- [Broker Load](../import-way/broker-load-manual.md)
- [Routine Load](../import-way/routine-load-manual.md)
- [INSERT INTO FROM S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3)
- [INSERT INTO FROM HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs)

## サポートされるJSON形式

Dorisは以下の3つのJSON形式をサポートします：

### 配列で表現される複数行

複数行のデータをバッチで読み込むのに適しており、要件は以下の通りです：
- ルートノードは配列である必要があります
- 配列の各要素は1行のデータを表すオブジェクトです
- `strip_outer_array=true`を設定する必要があります

データ例：

```json
[
    {"id": 123, "city": "beijing"},
    {"id": 456, "city": "shanghai"}
]

// Supports nested structures
[
    {"id": 123, "city": {"name": "beijing", "region": "haidian"}},
    {"id": 456, "city": {"name": "beijing", "region": "chaoyang"}}
]
```
### オブジェクトとして表現される単一行

単一行データの読み込みに適しており、要件は以下の通りです：
- ルートノードはオブジェクトである必要があります
- オブジェクト全体が1行のデータを表します

データ例：

```json
{"id": 123, "city": "beijing"}

// Supports nested structures
{"id": 123, "city": {"name": "beijing", "region": "haidian"}}
```
:::tip Note
通常、Kafkaの単一メッセージなど、Routine Load方式で使用されます。
:::

### 区切り文字で分離された複数オブジェクト行

複数行のデータをバッチ読み込みする場合に適しており、要件は以下の通りです：
- 各行が完全なJSONオブジェクトであること
- `read_json_by_line=true`を設定する必要があります
- 行区切り文字は`line_delimiter`パラメータで指定可能で、デフォルトは`\n`です

データ例：

```json
{"id": 123, "city": "beijing"}
{"id": 456, "city": "shanghai"}
```
## パラメータ設定

### パラメータサポート

以下の表は、各種読み込み方法でサポートされるJSONフォーマットパラメータを示しています：

| パラメータ | デフォルト値 | Stream Load | Broker Load | Routine Load | TVF |
|-----------|--------------|-------------|--------------|--------------|-----|
| json paths | None | supported | supported | supported | supported |
| json root | None | supported | supported | supported | supported |
| strip outer array | false | supported | supported | supported | supported |
| read json by line | true | supported | not supported | not supported | supported |
| fuzzy parse | false | supported | supported | not supported | supported |
| num as string | false | supported | supported | supported | supported |
| compression format | plain | supported | supported | not supported | supported |

:::tip 注意
1. Stream Load: パラメータはHTTP Headersで直接指定します。例：`-H "jsonpaths: $.data"`
2. Broker Load: パラメータは`PROPERTIES`で指定します。例：`PROPERTIES("jsonpaths"="$.data")`
3. Routine Load: パラメータは`PROPERTIES`で指定します。例：`PROPERTIES("jsonpaths"="$.data")`
4. TVF: パラメータはTVF文で指定します。例：`S3("jsonpaths"="$.data")`
5. JSONファイルのルートノードのJSONオブジェクトを読み込む必要がある場合、jsonpathsは`$.`として指定する必要があります。例：`PROPERTIES("jsonpaths"="$.")`
6. read_json_by_lineのデフォルト値はtrueです。これは、インポート時にstrip_outer_arrayもread_json_by_lineも指定されていない場合、read_json_by_lineがtrueに設定されることを意味します。
7. "read_json_by_line not configurable"は、ストリーミング読み取りを有効にし、BEメモリ使用量を削減するために強制的にtrueに設定されることを意味します。
:::

### パラメータ説明

#### JSON Path
- 用途: JSONデータからフィールドを抽出する方法を指定
- タイプ: 文字列配列
- デフォルト値: None、デフォルトでは列名との一致
- 使用例:

  ```json
  -- Basic usage
  ["$.id", "$.city"]
  
  -- Nested structures
  ["$.id", "$.info.city", "$.data[0].name"]
  ```
#### JSON Root
- 目的: JSONデータの解析開始点を指定します
- 型: String
- デフォルト値: なし、ルートノードからの解析がデフォルト
- 使用例:

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
#### Strip Outer Array
- 目的: 最外側の配列構造を削除するかどうかを指定します
- 型: Boolean
- デフォルト値: false
- 使用例:

  ```json
  -- Original data
  [
    {"id": 1, "city": "beijing"},
    {"id": 2, "city": "shanghai"}
  ]
  
  -- Set strip_outer_array=true
  ```
#### Read JSON By Line
- 目的: JSON データを行ごとに読み取るかどうかを指定する
- 型: Boolean
- デフォルト値: false
- 使用例:

  ```json
  -- Original data (one complete JSON object per line)
  {"id": 1, "city": "beijing"}
  {"id": 2, "city": "shanghai"}
  
  -- Set read_json_by_line=true
  ```
#### Fuzzy Parse
- 目的: JSONデータの読み込み効率を向上させる
- 型: Boolean
- デフォルト値: false
- 制限事項:
  - Arrayの各行のフィールド順序は同一である必要がある
  - 通常はstrip_outer_arrayと併用する
- パフォーマンス: 読み込み効率を3-5倍向上させることができる

#### Num As String
- 目的: JSONの数値型を文字列として解析するかどうかを指定する
- 型: Boolean
- デフォルト値: false
- 使用例:
  - 数値範囲外の数値を処理する場合
  - 数値精度の損失を避ける場合
- 使用例:

  ```json
  -- Original data
  {
    "id": "12345678901234567890",
    "price": "99999999.999999"
  }
  -- Set num_as_string=true, price field will be parsed as string
  ```
### JSON Path と Columns の関係

データロード中、JSON Path と Columns は異なる責任を担います：

**JSON Path**: データ抽出ルールを定義
   - 指定されたパスに従ってJSONデータからフィールドを抽出
   - 抽出されたフィールドは JSON Path で定義された順序に従って再配列

**Columns**: データマッピングルールを定義
   - 抽出されたフィールドをターゲットテーブルのカラムにマッピング
   - カラムの再配列と変換を実行可能

これら2つのパラメータは連続的に処理されます：まず、JSON Path がソースデータからフィールドを抽出して順序付きデータセットを形成し、次に Columns がこれらのデータをテーブルカラムにマッピングします。Columns が指定されていない場合、抽出されたフィールドはテーブルカラムの順序に従って直接マッピングされます。

#### 使用例

##### JSON Path のみを使用

テーブル構造とデータ：

```sql
-- Table structure
CREATE TABLE example_table (
    k2 int,
    k1 int
);

-- JSON data
{"k1": 1, "k2": 2}
```
Load コマンド:

```shell
curl -v ... -H "format: json" \
    -H "jsonpaths: [\"$.k2\", \"$.k1\"]" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load
```
読み込み結果:

```text
+------+------+
| k1   | k2   |
+------+------+
|    2 |    1 | 
+------+------+
```
##### JSON Path + Columns の使用

同じテーブル構造とデータを使用して、columnsパラメータを追加します：

Loadコマンド：

```shell
curl -v ... -H "format: json" \
    -H "jsonpaths: [\"$.k2\", \"$.k1\"]" \
    -H "columns: k2, k1" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load
```
読み込み結果:

```text
+------+------+
| k1   | k2   |
+------+------+
|    1 |    2 | 
+------+------+
```
##### フィールドの再利用

テーブル構造とデータ：

```sql
-- Table structure
CREATE TABLE example_table (
    k2 int,
    k1 int,
    k1_copy int
);

-- JSON data
{"k1": 1, "k2": 2}
```
Load コマンド:

```shell
curl -v ... -H "format: json" \
    -H "jsonpaths: [\"$.k2\", \"$.k1\", \"$.k1\"]" \
    -H "columns: k2, k1, k1_copy" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load
```
読み込み結果:

```text
+------+------+---------+
| k2   | k1   | k1_copy |
+------+------+---------+
|    2 |    1 |       1 |
+------+------+---------+
```
##### ネストされたフィールドマッピング

テーブル構造とデータ:

```sql
-- Table structure
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
ロードコマンド:

```shell
curl -v ... -H "format: json" \
    -H "jsonpaths: [\"$.k2\", \"$.k1\", \"$.k3.k1\", \"$.k3.k1_nested.k1\"]" \
    -H "columns: k2, k1, k1_nested1, k1_nested2" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load
```
読み込み結果:

```text
+------+------+------------+------------+
| k2   | k1   | k1_nested1 | k1_nested2 |
+------+------+------------+------------+
|    2 |    1 |         31 |         32 |
+------+------+------------+------------+
```
## 使用例

このセクションでは、異なる読み込み方法におけるJSON形式の使用方法を説明します。

### Stream Load

```bash
# Using JSON Path
curl --location-trusted -u <user>:<passwd> \
    -H "format: json" \
    -H "jsonpaths: [\"$.id\", \"$.city\"]" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load

# Specifying JSON root
curl --location-trusted -u <user>:<passwd> \
    -H "format: json" \
    -H "json_root: $.events" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load

# Reading JSON by line
curl --location-trusted -u <user>:<passwd> \
    -H "format: json" \
    -H "read_json_by_line: true" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load
```
### Broker負荷

```sql
-- Using JSON Path
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

-- Specifying JSON root
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
-- Using JSON Path
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
### TVF ロード

```sql
-- Using JSON Path
INSERT INTO example_table
SELECT *
FROM S3
(
    "path" = "s3://bucket/example.json",
    "format" = "json",
    "jsonpaths" = "[\"$.id\", \"$.city\"]",
    ...
);

-- Specifying JSON root
INSERT INTO example_table
SELECT *
FROM S3
(
    "path" = "s3://bucket/example.json",
    "format" = "json",
    "json_root" = "$.events",
    ...
);
