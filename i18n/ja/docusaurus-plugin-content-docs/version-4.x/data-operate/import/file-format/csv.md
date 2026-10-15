---
{
    "title": "CSV",
    "language": "ja",
    "description": "Apache Doris に CSV ファイルをインポートするための総合ガイド。カスタム区切り文字、囲み文字、エスケープ文字、圧縮形式に対応し、Stream Load や Broker Load などの複数のインポート方法で利用できます。",
    "keywords": [
        "Doris CSV インポート",
        "CSV 形式のパラメータ",
        "column_separator",
        "line_delimiter",
        "enclose",
        "Stream Load CSV",
        "Broker Load CSV",
        "Routine Load CSV",
        "csv_with_names",
        "compress_type"
    ]
}
---

<!-- Knowledge type: Operation guide + Parameter reference -->
<!-- Applicable scenario: Data import / File format adaptation -->

このドキュメントでは、CSV 形式のデータファイルを Apache Doris にインポートする方法を説明します。Doris では、行と列の区切り文字、フィールドの囲み文字、エスケープ文字、読み飛ばす行数、圧縮形式を柔軟に設定できます。また、バッチロード、リアルタイムのストリーミング取り込み、フェデレーテッドクエリなど、さまざまな要件に対応する複数のインポート方法を利用できます。

## クイックナビゲーション {#quick-navigation}

作業を始める前に、データソースと取り込みの即時性に応じてインポート方法を選び、該当するセクションのパラメータと例を参照してください。

- 小さなローカルファイルを HTTP で送信する場合: [Stream Load](../import-way/stream-load-manual) を使用
- オブジェクトストレージや HDFS にある大量のファイルをバッチ処理する場合: [Broker Load](../import-way/broker-load-manual) を使用
- Kafka からリアルタイムにデータを取り込む場合: [Routine Load](../import-way/routine-load-manual) を使用
- MySQL クライアントからローカルファイルを取り込む場合: [MySQL Load](../import-way/mysql-load-manual) を使用
- 外部ストレージのファイルを SQL で直接クエリまたはロードする場合: [S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3) または [HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs) を使用

## 対応するインポート方法 {#supported-import-methods}

Doris では、CSV 形式のデータを次の方法でインポートできます。

| インポート方法 | 適した用途 | 参照先 |
|----------|----------|------|
| Stream Load | ローカルファイルやプログラムのデータを HTTP で送信 | [Stream Load](../import-way/stream-load-manual) |
| Broker Load | S3 や HDFS などのリモートストレージからバッチインポート | [Broker Load](../import-way/broker-load-manual) |
| Routine Load | Kafka から継続的に購読してインポート | [Routine Load](../import-way/routine-load-manual) |
| MySQL Load | MySQL プロトコル経由でローカルファイルをインポート | [MySQL Load](../import-way/mysql-load-manual) |
| INSERT INTO FROM S3 TVF | S3 のファイルを直接読み込み、テーブルに挿入 | [S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3) |
| INSERT INTO FROM HDFS TVF | HDFS のファイルを直接読み込み、テーブルに挿入 | [HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs) |

## CSV 形式のパラメータ {#csv-format-parameters}

<!-- Knowledge type: Configuration parameters -->

### インポート方法別のパラメータ対応表 {#parameter-support-matrix-across-import-methods}

次の表は、CSV 形式のパラメータについて、各インポート方法での対応状況と指定構文をまとめたものです。

| パラメータ | デフォルト | Stream Load | Broker Load | Routine Load | MySQL Load | TVF |
|------|--------|-------------|-------------|--------------|------------|-----|
| 行区切り文字 | `\n` | line_delimiter | LINES TERMINATED BY | 非対応 | LINES TERMINATED BY | line_delimiter |
| 列区切り文字 | `\t` | column_separator | COLUMNS TERMINATED BY | COLUMNS TERMINATED BY | COLUMNS TERMINATED BY | column_separator |
| 囲み文字 | なし | enclose | PROPERTIES.enclose | PROPERTIES.enclose | PROPERTIES.enclose | enclose |
| エスケープ文字 | `\` | escape | PROPERTIES.escape | PROPERTIES.escape | PROPERTIES.escape | escape |
| 読み飛ばす行数 | 0 | skip_lines | PROPERTIES.skip_lines | 非対応 | IGNORE LINES | skip_lines |
| 外側の二重引用符の除去 | false | trim_double_quotes | 非対応 | PROPERTIES.trim_double_quotes | 非対応 | trim_double_quotes |
| 圧縮形式 | plain | compress_type | PROPERTIES.compress_type | 非対応 | 非対応 | compress_type |

:::tip インポート方法ごとのパラメータ指定構文
1. **Stream Load**: パラメータは HTTP ヘッダーで直接指定します。例: `-H "line_delimiter:\n"`
2. **Broker Load**: パラメータは SQL 文で指定します。
    - 区切り文字は `COLUMNS TERMINATED BY` と `LINES TERMINATED BY` で指定します。
    - その他のパラメータは `PROPERTIES` で指定します。例: `PROPERTIES("compress_type"="gz")`
3. **Routine Load**: パラメータは SQL 文で指定します。
    - 区切り文字は `COLUMNS TERMINATED BY` で指定します。
    - その他のパラメータは `PROPERTIES` で指定します。例: `PROPERTIES("enclose"="\"")`
4. **MySQL Load**: パラメータは SQL 文で指定します。
    - 区切り文字は `LINES TERMINATED BY` と `COLUMNS TERMINATED BY` で指定します。
    - その他のパラメータは `PROPERTIES` で指定します。例: `PROPERTIES("escape"="\\")`
5. **TVF**: パラメータは TVF 文内で指定します。例: `S3("line_delimiter"="\n")`
:::

### パラメータの詳細 {#parameter-details}

#### 行区切り文字 (line_delimiter) {#line-delimiter-line_delimiter}

- **用途**: インポートするファイルの改行文字を指定します。
- **デフォルト**: `\n`
- **特性**: 複数の文字を組み合わせて行区切り文字にできます。

**主な使用例**:

- Linux/Unix のファイル:

    ```text
    Data file:
    Zhang San, 25\n
    Li Si, 30\n

    Parameter setting:
    line_delimiter: \n (default value, can be omitted)
    ```

- Windows のファイル:

    ```text
    Data file:
    Zhang San, 25\r\n
    Li Si, 30\r\n

    Parameter setting:
    line_delimiter: \r\n
    ```

- 特殊なプログラムで生成されたファイル:

    ```text
    Data file:
    Zhang San, 25\r
    Li Si, 30\r

    Parameter setting:
    line_delimiter: \r
    ```

- 複数文字のカスタム区切り文字:

    ```text
    Data file:
    Zhang San, 25||
    Li Si, 30||

    Parameter setting:
    line_delimiter: ||
    ```

#### 列区切り文字 (column_separator) {#column-separator-column_separator}

- **用途**: インポートするファイルの列区切り文字を指定します。
- **デフォルト**: `\t` (タブ)
- **特性**:
    - 可視文字と不可視文字の両方に対応します。
    - 複数の文字を組み合わせて指定できます。
    - 不可視文字は `\x` プレフィックスを付けた十六進数で表す必要があります。
- **MySQL プロトコルでの特別な扱い**:
    - 不可視文字にはバックスラッシュをもう一つ追加する必要があります。
    - たとえば、Hive の `\x01` は Broker Load では `\\x01` と記述する必要があります。

**主な使用例**:

- 一般的な可視文字:

    ```text
    Data file:
    Zhang San, 25, Beijing
    Li Si, 30, Shanghai

    Parameter setting:
    column_separator: ,
    ```

- タブ (デフォルト):

    ```text
    Data file:
    Zhang San    25    Beijing
    Li Si    30    Shanghai

    Parameter setting:
    column_separator: \t (default value, can be omitted)
    ```

- Hive のファイル (Stream Load):

    ```text
    Data file:
    Zhang San\x0125\x01 Beijing
    Li Si\x0130\x01 Shanghai

    Parameter setting:
    column_separator: \x01
    ```

- Hive のファイル (Broker Load):

    ```text
    Data file:
    Zhang San\x0125\x01 Beijing
    Li Si\x0130\x01 Shanghai

    Parameter setting:
    PROPERTIES("column_separator"="\\x01")
    ```

- 複数文字の区切り文字:

    ```text
    Data file:
    Zhang San||25||Beijing
    Li Si||30||Shanghai

    Parameter setting:
    column_separator: ||
    ```

#### 囲み文字 (enclose) {#enclose-enclose}

- **用途**: 特殊文字を含むフィールドが誤って解析されるのを防ぎます。
- **制限**: 単一バイト文字のみ対応します。
- **一般的な文字**:
    - 一重引用符: `'`
    - 二重引用符: `"`

**主な使用例**:

- フィールドに列区切り文字が含まれる場合:

    ```text
    Data: a,'b,c',d
    Column separator: ,
    Enclose: '
    Parsing result: 3 fields [a] [b,c] [d]
    ```

- フィールドに行区切り文字が含まれる場合:

    ```text
    Data: a,'b\nc',d
    Column separator: ,
    Enclose: '
    Parsing result: 3 fields [a] [b\nc] [d]
    ```

- フィールドに列区切り文字と行区切り文字の両方が含まれる場合:

    ```text
    Data: a,'b,c\nd,e',f
    Column separator: ,
    Enclose: '
    Parsing result: 3 fields [a] [b,c\nd,e] [f]
    ```

#### エスケープ文字 (escape) {#escape-escape}

- **用途**: フィールド内に囲み文字と同じ文字がある場合、その文字をエスケープします。
- **制限**: 単一バイト文字のみ対応します。デフォルトは `\` です。

**主な使用例**:

- フィールドに囲み文字が含まれる場合:

    ```text
    Data: a,'b,\'c',d
    Column separator: ,
    Enclose: '
    Escape: \
    Parsing result: 3 fields [a] [b,'c] [d]
    ```

- フィールドに複数の囲み文字が含まれる場合:

    ```text
    Data: a,"b,\"c\"d",e
    Column separator: ,
    Enclose: "
    Escape: \
    Parsing result: 3 fields [a] [b,"c"d] [e]
    ```

- フィールドにエスケープ文字自体が含まれる場合:

    ```text
    Data: a,'b\\c',d
    Column separator: ,
    Enclose: '
    Escape: \
    Parsing result: 3 fields [a] [b\c] [d]
    ```

#### 読み飛ばす行数 (skip_lines) {#skip-lines-skip_lines}

- **用途**: CSV ファイルの先頭から N 行を読み飛ばします。
- **型**: 整数
- **デフォルト**: 0
- **注意事項**:
    - `format` が `csv_with_names` の場合、システムは先頭行 (列名) を自動的に読み飛ばし、`skip_lines` パラメータを無視します。
    - `format` が `csv_with_names_and_types` の場合、システムは先頭の二行 (列名と型) を自動的に読み飛ばし、`skip_lines` パラメータを無視します。

**主な使用例**:

- ヘッダー行を読み飛ばす場合:

    ```text
    Data file:
    Name, Age, City
    Zhang San, 25, Beijing
    Li Si, 30, Shanghai

    Parameter setting:
    skip_lines: 1
    Result: skip the header line and import the subsequent data
    ```

- コメント行を読み飛ばす場合:

    ```text
    Data file:
    # User information table
    # Created at: 2024-01-01
    Zhang San, 25, Beijing
    Li Si, 30, Shanghai

    Parameter setting:
    skip_lines: 2
    Result: skip the comment lines and import the subsequent data
    ```

- csv_with_names 形式を使用する場合:

    ```text
    Data file:
    name,age,city
    Zhang San, 25, Beijing
    Li Si, 30, Shanghai

    Parameter setting:
    format: csv_with_names
    Result: the system automatically skips the first line of column names
    ```

- csv_with_names_and_types 形式を使用する場合:

    ```text
    Data file:
    name,age,city
    string,int,string
    Zhang San, 25, Beijing
    Li Si, 30, Shanghai

    Parameter setting:
    format: csv_with_names_and_types
    Result: the system automatically skips the first two lines of column names and types
    ```

#### 外側の二重引用符を除去する (trim_double_quotes) {#trim-double-quotes-trim_double_quotes}

- **用途**: CSV ファイルの各フィールドから最も外側の二重引用符を除去します。
- **型**: 真偽値
- **デフォルト**: false

**主な使用例**:

- 二重引用符を除去する場合:

    ```text
    Data file:
    "Zhang San","25","Beijing"
    "Li Si","30","Shanghai"

    Parameter setting:
    trim_double_quotes: true
    Result:
    Zhang San, 25, Beijing
    Li Si, 30, Shanghai
    ```

#### 圧縮形式 (compress_type) {#compression-format-compress_type}

- **用途**: インポートするファイルの圧縮形式を指定します。
- **型**: 文字列。大文字と小文字は区別しません。
- **デフォルト**: plain
- **対応する圧縮形式**:

    | 値 | 説明 |
    |------|------|
    | plain | 圧縮なし (デフォルト) |
    | bz2 | BZIP2 圧縮 |
    | deflate | DEFLATE 圧縮 |
    | gz | GZIP 圧縮 |
    | lz4 | LZ4 Frame 形式の圧縮 |
    | lz4_block | LZ4 Block 形式の圧縮 |
    | lzo | LZO 圧縮 |
    | lzop | LZOP 圧縮 |
    | snappy_block | SNAPPY Block 形式の圧縮 |

- **注記**:
    - tar は圧縮形式ではなくファイルのアーカイブ形式であるため、`.tar` ファイルには対応していません。
    - tar 形式でまとめられたファイルは、展開してからインポートしてください。

## 例 {#examples}

<!-- Knowledge type: Operation steps -->

このセクションでは、区切り文字の指定、引用符で囲まれたデータの処理、圧縮ファイルのインポートという、各インポート方法でよく使う三つの操作を示します。

### Stream Load {#stream-load}

```shell
# Specify delimiters
curl --location-trusted -u root: \
    -H "column_separator:," \
    -H "line_delimiter:\n" \
    -T example.csv \
    http://<fe_host>:<fe_http_port>/api/test_db/test_table/_stream_load

# Handle quoted data
curl --location-trusted -u root: \
    -H "column_separator:," \
    -H "enclose:\"" \
    -H "escape:\\" \
    -T example.csv \
    http://<fe_host>:<fe_http_port>/api/test_db/test_table/_stream_load

# Import a compressed file
curl --location-trusted -u root: \
    -H "compress_type:gz" \
    -T example.csv.gz \
    http://<fe_host>:<fe_http_port>/api/test_db/test_table/_stream_load
```

### Broker Load {#broker-load}

```sql
-- Specify delimiters
LOAD LABEL test_db.test_label
(
    DATA INFILE("s3://bucket/example.csv")
    INTO TABLE test_table
    COLUMNS TERMINATED BY ","
    LINES TERMINATED BY "\n"
)
WITH S3
(
    ...
);

-- Handle quoted data
LOAD LABEL test_db.test_label
(
    DATA INFILE("s3://bucket/example.csv")
    INTO TABLE test_table
    PROPERTIES
    (
        "enclose" = "\"",
        "escape" = "\\"
    )
)
WITH S3
(
    ...
);

-- Import a compressed file
LOAD LABEL test_db.test_label
(
    DATA INFILE("s3://bucket/example.csv.gz")
    INTO TABLE test_table
    PROPERTIES
    (
        "compress_type" = "gz"
    )
)
WITH S3
(
    ...
);
```

### Routine Load {#routine-load}

```sql
-- Specify delimiters
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

### MySQL Load {#mysql-load}

```sql
-- Specify delimiters
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

-- Skip the header
LOAD DATA LOCAL INFILE 'example.csv'
INTO TABLE test_table
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n'
IGNORE 1 LINES;
```

### TVF {#tvf}

```sql
-- Specify delimiters
INSERT INTO test_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.csv",
    "format" = "csv",
    "column_separator" = ",",
    "line_delimiter" = "\n"
    ...
);

-- Handle quoted data
INSERT INTO test_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.csv",
    "format" = "csv",
    "column_separator" = ",",
    "enclose" = "\"",
    "escape" = "\\"
    ...
);

-- Import a compressed file
INSERT INTO test_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.csv.gz",
    "format" = "csv",
    "compress_type" = "gz"
    ...
);
```

## FAQ {#faq}

<!-- Knowledge type: Troubleshooting -->

**Q1: Hive のデフォルトの列区切り文字 `\x01` が Broker Load で機能しないのはなぜですか？**

MySQL プロトコルでは、不可視文字にバックスラッシュをもう一つ追加し、`\\x01` と記述する必要があります。例: `PROPERTIES("column_separator"="\\x01")`。Stream Load の HTTP ヘッダーで指定する場合は、`\x01` で十分です。

**Q2: Routine Load はカスタムの行区切り文字に対応していますか？**

いいえ。Routine Load が Kafka から取り込む各メッセージは、それぞれ一行に相当するため、`line_delimiter` パラメータは不要であり、対応していません。

**Q3: CSV ファイルの先頭行がヘッダーの場合、インポート時にどう読み飛ばせますか？**

- Stream Load / Broker Load / TVF: `skip_lines=1` を使用します。
- MySQL Load: `IGNORE 1 LINES` を使用します。
- ファイルのヘッダーが `name1,name2,...` の形式であれば、`format` に `csv_with_names` を指定すると、先頭行が自動的に読み飛ばされます。`csv_with_names_and_types` を指定すると、先頭の二行 (列名と型) が自動的に読み飛ばされます。

**Q4: `.tar` または `.tar.gz` ファイルを直接インポートできますか？**

いいえ。tar は圧縮形式ではなくアーカイブ形式です。Doris が対応する圧縮形式は `compress_type` に列挙されたものだけです。`.tar` または `.tar.gz` ファイルは展開してからインポートしてください。

**Q5: フィールドに列区切り文字と改行の両方が含まれる場合、どう処理すればよいですか？**

そのフィールドの `enclose` を設定します。たとえば、囲み文字に一重引用符を使用すると、`a,'b,c\nd,e',f` は 3 つのフィールド `[a]`、`[b,c\nd,e]`、`[f]` に正しく解析されます。このとき、列区切り文字は `,`、囲み文字は `'` です。フィールドに囲み文字自体も含まれる場合は、`escape` を併用します。

**Q6: 二重引用符で囲まれたフィールドをインポートする際に、最も外側の二重引用符を除去するにはどうすればよいですか？**

`trim_double_quotes` を `true` に設定すると、Doris は解析後に各フィールドの最も外側の二重引用符を自動的に除去します。このパラメータは Stream Load、Routine Load、TVF に対応していますが、Broker Load と MySQL Load には対応していません。
