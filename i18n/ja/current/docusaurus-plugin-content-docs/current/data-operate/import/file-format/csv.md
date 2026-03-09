---
{
  "title": "CSV",
  "language": "ja",
  "description": "この文書では、CSV形式のデータファイルをDorisに読み込む方法について説明します。Dorisは、カスタム区切り文字を含む柔軟なCSV形式の設定をサポートしています。"
}
---
このドキュメントでは、CSV形式のデータファイルをDorisに読み込む方法について説明します。DorisはカスタムデリミタやフィールドのEnclosureなど、柔軟なCSV形式の設定をサポートし、様々なシナリオでのデータ読み込み要件を満たすための多様な読み込み方法を提供します。

## 読み込み方法

DorisはCSV形式のデータを読み込むための以下の方法をサポートしています：

- [Stream Load](../import-way/stream-load-manual)
- [Broker Load](../import-way/broker-load-manual)
- [Routine Load](../import-way/routine-load-manual)
- [MySQL Load](../import-way/mysql-load-manual)
- [INSERT INTO FROM S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3)
- [INSERT INTO FROM HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs)

## パラメータ設定

### パラメータサポート

以下の表は、様々な読み込み方法でサポートされているCSV形式のパラメータを示します：

| パラメータ | デフォルト値 | Stream Load | Broker Load | Routine Load | MySQL Load | TVF |
|-----------|--------------|-------------|--------------|--------------|------------|-----|
| Line Delimiter | `\n` | line_delimiter | LINES TERMINATED BY | サポートなし | LINES TERMINATED BY | line_delimiter |
| Column Delimiter | `\t` | column_separator | COLUMNS TERMINATED BY | COLUMNS TERMINATED BY | COLUMNS TERMINATED BY | column_separator |
| Enclosure | なし | enclose | PROPERTIES.enclose | PROPERTIES.enclose | PROPERTIES.enclose | enclose |
| Escape Character | `\` | escape | PROPERTIES.escape | PROPERTIES.escape | PROPERTIES.escape | escape |
| Skip Lines | 0 | skip_lines | PROPERTIES.skip_lines | サポートなし | IGNORE LINES | skip_lines |
| Trim Double Quotes | false | trim_double_quotes | サポートなし | PROPERTIES.trim_double_quotes | サポートなし | trim_double_quotes |
| Compression Format | plain | compress_type | PROPERTIES.compress_type | サポートなし | サポートなし | compress_type |

:::tip 注意
1. Stream Load: パラメータはHTTP Headersを通じて直接指定します。例：`-H "line_delimiter:\n"`
2. Broker Load: パラメータはSQL文で指定します。ここで：
   - デリミタは`COLUMNS TERMINATED BY`、`LINES TERMINATED BY`を通じて指定
   - その他のパラメータは`PROPERTIES`を通じて指定。例：`PROPERTIES("compress_type"="gz")`
3. Routine Load: パラメータはSQL文で指定します。ここで：
   - デリミタは`COLUMNS TERMINATED BY`を通じて指定
   - その他のパラメータは`PROPERTIES`を通じて指定。例：`PROPERTIES("enclose"="\"")`
4. MySQL Load: パラメータはSQL文で指定します。ここで：
   - デリミタは`LINES TERMINATED BY`、`COLUMNS TERMINATED BY`を通じて指定
   - その他のパラメータは`PROPERTIES`を通じて指定。例：`PROPERTIES("escape"="\\")`
5. TVF: パラメータはTVF文で指定します。例：`S3("line_delimiter"="\n")`
:::

### パラメータの説明

#### Line Delimiter
- 目的: データファイル内の改行文字を指定します
- デフォルト値: `\n`
- 特徴: 複数文字の組み合わせを改行として使用することをサポートします
- 使用例とケース:
  - Linux/Unixシステムファイル:

    ```
    Data File:
    John,25\n
    Mary,30\n
    
    Parameter Setting:
    line_delimiter: \n (default value, can be omitted)
    ```
- Windows システムファイル:

    ```
    Data File:
    John,25\r\n
    Mary,30\r\n
    
    Parameter Setting:
    line_delimiter: \r\n
    ```
- 特別プログラム生成ファイル:

    ```
    Data File:
    John,25\r
    Mary,30\r
    
    Parameter Setting:
    line_delimiter: \r
    ```
- カスタム複数文字区切り文字:

    ```
    Data File:
    John,25||
    Mary,30||
    
    Parameter Setting:
    line_delimiter: ||
    ```
#### カラム区切り文字
- 目的: データファイル内のカラム区切り文字を指定します
- デフォルト値: `\t` (タブ)
- 機能:
  - 可視文字と不可視文字をサポート
  - 複数文字の組み合わせをサポート
  - 不可視文字は`\x`プレフィックス付きの16進表現を使用する必要があります
- MySQL Protocolの特別な処理:
  - 不可視文字には追加のバックスラッシュが必要
  - 例えば、Hiveの`\x01`はBroker Loadでは`\\x01`と記述する必要があります
- 使用例と事例:
  - 一般的な可視文字:

    ```
    Data File:
    John,25,New York
    Mary,30,Los Angeles
    
    Parameter Setting:
    column_separator: ,
    ```
- Tab（デフォルト）：

    ```
    Data File:
    John    25    New York
    Mary    30    Los Angeles
    
    Parameter Setting:
    column_separator: \t (default value, can be omitted)
    ```
- Hive Files (Stream Load):

    ```
    Data File:
    John\x0125\x01New York
    Mary\x0130\x01Los Angeles
    
    Parameter Setting:
    column_separator: \x01
    ```
- Hive Files (Broker Load):

    ```
    Data File:
    John\x0125\x01New York
    Mary\x0130\x01Los Angeles
    
    Parameter Setting:
    PROPERTIES("column_separator"="\\x01")
    ```
- 複数文字区切り文字：

    ```
    Data File:
    John||25||New York
    Mary||30||Los Angeles
    
    Parameter Setting:
    column_separator: ||
    ```
#### Enclosure
- 目的: 特殊文字を含むフィールドが誤って解析されることを防ぐ
- 制限事項: 単一バイト文字のみサポート
- 一般的な文字:
  - シングルクォート: `'`
  - ダブルクォート: `"`
- 使用例とサンプル:
  - フィールドに Column Delimiter が含まれる場合:

    ```
    Data: a,'b,c',d
    Column Delimiter: ,
    Enclosure: '
    Parsing Result: 3 fields [a] [b,c] [d]
    ```
- フィールドに行区切り文字が含まれています：

    ```
    Data: a,'b\nc',d
    Column Delimiter: ,
    Enclosure: '
    Parsing Result: 3 fields [a] [b\nc] [d]
    ```
- フィールドに列区切り文字と行区切り文字の両方が含まれる場合:

    ```
    Data: a,'b,c\nd,e',f
    Column Delimiter: ,
    Enclosure: '
    Parsing Result: 3 fields [a] [b,c\nd,e] [f]
    ```
#### エスケープ文字
- 目的: 囲み文字と同じ文字をフィールド内でエスケープする
- 制限: 単一バイト文字のみサポート、デフォルトは `\`
- 使用例:
  - フィールドに囲み文字が含まれる場合:

    ```
    Data: a,'b,\'c',d
    Column Delimiter: ,
    Enclosure: '
    Escape Character: \
    Parsing Result: 3 fields [a] [b,'c] [d]
    ```
- フィールドに複数の囲み文字が含まれている場合:

    ```
    Data: a,"b,\"c\"d",e
    Column Delimiter: ,
    Enclosure: "
    Escape Character: \
    Parsing Result: 3 fields [a] [b,"c"d] [e]
    ```
- フィールドにエスケープ文字自体が含まれる場合：

    ```
    Data: a,'b\\c',d
    Column Delimiter: ,
    Enclosure: '
    Escape Character: \
    Parsing Result: 3 fields [a] [b\c] [d]
    ```
#### Skip Lines
- 目的: CSVファイルの最初の数行をスキップします
- 型: Integer
- デフォルト値: 0
- 特記事項:
  - formatが`csv_with_names`の場合、システムは自動的に最初の行（カラム名）をスキップし、`skip_lines`パラメータを無視します
  - formatが`csv_with_names_and_types`の場合、システムは自動的に最初の2行（カラム名と型）をスキップし、`skip_lines`パラメータを無視します
- 使用例とケース:
  - タイトル行のスキップ:

    ```
    Data File:
    Name,Age,City
    John,25,New York
    Mary,30,Los Angeles
    
    Parameter Setting:
    skip_lines: 1
    Result: Skip title line, load subsequent data
    ```
- コメント行をスキップ:

    ```
    Data File:
    # User Information Table
    # Created Time: 2024-01-01
    John,25,New York
    Mary,30,Los Angeles
    
    Parameter Setting:
    skip_lines: 2
    Result: Skip comment lines, load subsequent data
    ```
- csv_with_names形式を使用する：

    ```
    Data File:
    name,age,city
    John,25,New York
    Mary,30,Los Angeles
    
    Parameter Setting:
    format: csv_with_names
    Result: System automatically skips the first line of column names
    ```
- csv_with_names_and_types フォーマットを使用する：

    ```
    Data File:
    name,age,city
    string,int,string
    John,25,New York
    Mary,30,Los Angeles
    
    Parameter Setting:
    format: csv_with_names_and_types
    Result: System automatically skips the first two lines of column names and types
    ```
#### 二重引用符のトリミング
- 目的: CSVファイルの各フィールドから最外側の二重引用符をトリミングします
- タイプ: Boolean
- デフォルト値: false
- 使用例とサンプル:
  - Trim Double Quotes:

    ```
    Data File:
    "John","25","New York"
    "Mary","30","Los Angeles"
    
    Parameter Setting:
    trim_double_quotes: true
    Result:
    John,25,New York
    Mary,30,Los Angeles
    ```
#### Compression Format
- 目的: データファイルの圧縮形式を指定します
- 型: String、大文字小文字を区別しない
- デフォルト値: plain
- サポートされている圧縮形式:
  - plain: 圧縮なし (デフォルト)
  - bz2: BZIP2圧縮
  - deflate: DEFLATE圧縮
  - gz: GZIP圧縮
  - lz4: LZ4 Frame形式の圧縮
  - lz4_block: LZ4 Block形式の圧縮
  - lzo: LZO圧縮
  - lzop: LZOP圧縮
  - snappy_block: SNAPPY Block形式の圧縮
- 注意:
  - tarはファイルパッケージング形式であり、圧縮形式ではないため、サポートされていません
  - tarパッケージファイルを使用する必要がある場合は、読み込み前にまず展開してください

## 使用例

このセクションでは、異なる読み込み方法におけるCSV形式の使用方法を説明します。

### Stream Load

```shell
# Specify delimiter
curl --location-trusted -u root: \
    -H "column_separator:," \
    -H "line_delimiter:\n" \
    -T example.csv \
    http://<fe_host>:<fe_http_port>/api/test_db/test_table/_stream_load

# Handle quoted data
curl --location-trusted -u root: \
    -H "column_separator:," \
    -H "enclose:\"" \
    -T example.csv \
    http://<fe_host>:<fe_http_port>/api/test_db/test_table/_stream_load

# Load compressed file
curl --location-trusted -u root: \
    -H "compress_type:gz" \
    -T example.csv.gz \
    http://<fe_host>:<fe_http_port>/api/test_db/test_table/_stream_load
```
### Broker Load

```sql
-- Specify delimiter
LOAD LABEL test_db.test_label
(
    DATA INFILE("s3://bucket/example.csv")
    INTO TABLE test_table
    COLUMNS TERMINATED BY ","
    LINES TERMINATED BY "\n"
    ...
);

-- Handle quoted data
LOAD LABEL test_db.test_label
(
    DATA INFILE("s3://bucket/example.csv")
    INTO TABLE test_table
    COLUMNS TERMINATED BY ","
    LINES TERMINATED BY "\n"
    PROPERTIES
    (
        "enclose" = "\"",
        "escape" = "\\"
    )
    ...
);

-- Load compressed file
LOAD LABEL test_db.test_label
(
    DATA INFILE("s3://bucket/example.csv.gz")
    INTO TABLE test_table
    COLUMNS TERMINATED BY ","
    LINES TERMINATED BY "\n"
    PROPERTIES
    (
        "compress_type" = "gz"
    )
    ...
);
```
### Routine Load

```sql
-- Specify delimiter
CREATE ROUTINE LOAD test_db.test_job ON test_table
COLUMNS TERMINATED BY ","
FROM KAFKA
(
     ...
);

-- Handle quoted data
CREATE ROUTINE LOAD test_db.test_job ON test_table
COLUMNS TERMINATED BY ","
PROPERTIES
(
    "enclose" = "\"",
    "escape" = "\\"
)
FROM KAFKA
(
     ...
);
```
### MySQL負荷

```sql
-- Specify delimiter
LOAD DATA LOCAL INFILE 'example.csv'
INTO TABLE test_table
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n';

-- Handle quoted data
LOAD DATA LOCAL INFILE 'example.csv'
INTO TABLE test_table
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n'
PROPERTIES
(
    "enclose" = "\"",
    "escape" = "\\"
);

-- Skip table header
LOAD DATA LOCAL INFILE 'example.csv'
INTO TABLE test_table
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n'
IGNORE 1 LINES;
```
### TVF Load

```sql
-- Specify delimiter
INSERT INTO test_table
SELECT *
FROM S3
(
    "path" = "s3://bucket/example.csv",
    "column_separator" = ",",
    "line_delimiter" = "\n",
    ...
);

-- Handle quoted data
INSERT INTO test_table
SELECT *
FROM S3
(
    "path" = "s3://bucket/example.csv",
    "column_separator" = ",",
    "enclose" = "\"",
    "escape" = "\\",
    ...
);

-- Load compressed file
INSERT INTO test_table
SELECT *
FROM S3
(
    "path" = "s3://bucket/example.csv.gz",
    "column_separator" = ",",
    "line_delimiter" = "\n",
    "compress_type" = "gz",
    ...
);
