---
{
    "title": "CSV",
    "language": "en",
    "description": "A complete guide to importing CSV files into Apache Doris: supports custom delimiters, enclosing characters, escape characters, and compression formats, applicable to multiple import methods such as Stream Load and Broker Load.",
    "keywords": [
        "Doris CSV import",
        "CSV format parameters",
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

This document describes how to import CSV-format data files into Apache Doris. Doris supports flexible CSV format configuration, including custom row/column delimiters, field enclosing characters, escape characters, the number of lines to skip, and compression formats. It also provides multiple import methods to meet data import requirements for different scenarios such as batch loading, real-time streaming ingestion, and federated queries.

## Quick navigation

Before you start, choose an appropriate import method based on your data source and timeliness requirements, then refer to the parameters and examples in the corresponding section:

- Small local files, HTTP push: use [Stream Load](../import-way/stream-load-manual)
- Large batches of files in object storage / HDFS: use [Broker Load](../import-way/broker-load-manual)
- Real-time data streams from Kafka: use [Routine Load](../import-way/routine-load-manual)
- Local files via the MySQL client: use [MySQL Load](../import-way/mysql-load-manual)
- Querying or loading external storage files directly via SQL: use [S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3) or [HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs)

## Supported import methods

Doris provides the following methods for importing CSV-format data:

| Import method | Applicable scenario | Entry point |
|----------|----------|------|
| Stream Load | Push local files or program data via HTTP | [Stream Load](../import-way/stream-load-manual) |
| Broker Load | Batch import from remote storage such as S3 / HDFS | [Broker Load](../import-way/broker-load-manual) |
| Routine Load | Continuously subscribe to and import from Kafka | [Routine Load](../import-way/routine-load-manual) |
| MySQL Load | Import local files via the MySQL protocol | [MySQL Load](../import-way/mysql-load-manual) |
| INSERT INTO FROM S3 TVF | Read S3 files directly and insert into a table | [S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3) |
| INSERT INTO FROM HDFS TVF | Read HDFS files directly and insert into a table | [HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs) |

## CSV format parameters

<!-- Knowledge type: Configuration parameters -->

### Parameter support matrix across import methods

The following table summarizes the support and corresponding syntax of CSV format parameters across different import methods:

| Parameter | Default | Stream Load | Broker Load | Routine Load | MySQL Load | TVF |
|------|--------|-------------|-------------|--------------|------------|-----|
| Line delimiter | `\n` | line_delimiter | LINES TERMINATED BY | Not supported | LINES TERMINATED BY | line_delimiter |
| Column separator | `\t` | column_separator | COLUMNS TERMINATED BY | COLUMNS TERMINATED BY | COLUMNS TERMINATED BY | column_separator |
| Enclose | None | enclose | PROPERTIES.enclose | PROPERTIES.enclose | PROPERTIES.enclose | enclose |
| Escape | `\` | escape | PROPERTIES.escape | PROPERTIES.escape | PROPERTIES.escape | escape |
| Skip lines | 0 | skip_lines | PROPERTIES.skip_lines | Not supported | IGNORE LINES | skip_lines |
| Trim double quotes | false | trim_double_quotes | Not supported | PROPERTIES.trim_double_quotes | Not supported | trim_double_quotes |
| Compression format | plain | compress_type | PROPERTIES.compress_type | Not supported | Not supported | compress_type |

:::tip Parameter syntax for each import method
1. **Stream Load**: parameters are specified directly via HTTP headers, for example: `-H "line_delimiter:\n"`
2. **Broker Load**: parameters are specified via SQL statements:
    - Delimiters are specified via `COLUMNS TERMINATED BY` and `LINES TERMINATED BY`
    - Other parameters are specified via `PROPERTIES`, for example: `PROPERTIES("compress_type"="gz")`
3. **Routine Load**: parameters are specified via SQL statements:
    - Delimiters are specified via `COLUMNS TERMINATED BY`
    - Other parameters are specified via `PROPERTIES`, for example: `PROPERTIES("enclose"="\"")`
4. **MySQL Load**: parameters are specified via SQL statements:
    - Delimiters are specified via `LINES TERMINATED BY` and `COLUMNS TERMINATED BY`
    - Other parameters are specified via `PROPERTIES`, for example: `PROPERTIES("escape"="\\")`
5. **TVF**: parameters are specified in the TVF statement, for example: `S3("line_delimiter"="\n")`
:::

### Parameter details

#### Line delimiter (line_delimiter)

- **Purpose**: specifies the line break character in the file to import
- **Default**: `\n`
- **Characteristics**: supports a combination of multiple characters as the line delimiter

**Typical scenarios**:

- Linux/Unix files:

    ```text
    Data file:
    Zhang San, 25\n
    Li Si, 30\n

    Parameter setting:
    line_delimiter: \n (default value, can be omitted)
    ```

- Windows files:

    ```text
    Data file:
    Zhang San, 25\r\n
    Li Si, 30\r\n

    Parameter setting:
    line_delimiter: \r\n
    ```

- Files generated by special programs:

    ```text
    Data file:
    Zhang San, 25\r
    Li Si, 30\r

    Parameter setting:
    line_delimiter: \r
    ```

- Custom multi-character delimiter:

    ```text
    Data file:
    Zhang San, 25||
    Li Si, 30||

    Parameter setting:
    line_delimiter: ||
    ```

#### Column separator (column_separator)

- **Purpose**: specifies the column separator in the file to import
- **Default**: `\t` (tab)
- **Characteristics**:
    - Supports both visible and invisible characters
    - Supports multi-character combinations
    - Invisible characters must be represented in hexadecimal with the `\x` prefix
- **MySQL protocol special handling**:
    - Invisible characters require an additional backslash
    - For example, Hive's `\x01` must be written as `\\x01` in Broker Load

**Typical scenarios**:

- Common visible characters:

    ```text
    Data file:
    Zhang San, 25, Beijing
    Li Si, 30, Shanghai

    Parameter setting:
    column_separator: ,
    ```

- Tab (default):

    ```text
    Data file:
    Zhang San    25    Beijing
    Li Si    30    Shanghai

    Parameter setting:
    column_separator: \t (default value, can be omitted)
    ```

- Hive files (Stream Load):

    ```text
    Data file:
    Zhang San\x0125\x01 Beijing
    Li Si\x0130\x01 Shanghai

    Parameter setting:
    column_separator: \x01
    ```

- Hive files (Broker Load):

    ```text
    Data file:
    Zhang San\x0125\x01 Beijing
    Li Si\x0130\x01 Shanghai

    Parameter setting:
    PROPERTIES("column_separator"="\\x01")
    ```

- Multi-character delimiter:

    ```text
    Data file:
    Zhang San||25||Beijing
    Li Si||30||Shanghai

    Parameter setting:
    column_separator: ||
    ```

#### Enclose (enclose)

- **Purpose**: protects fields that contain special characters from being parsed incorrectly
- **Limitation**: only single-byte characters are supported
- **Common characters**:
    - Single quote: `'`
    - Double quote: `"`

**Typical scenarios**:

- Field contains the column separator:

    ```text
    Data: a,'b,c',d
    Column separator: ,
    Enclose: '
    Parsing result: 3 fields [a] [b,c] [d]
    ```

- Field contains the line delimiter:

    ```text
    Data: a,'b\nc',d
    Column separator: ,
    Enclose: '
    Parsing result: 3 fields [a] [b\nc] [d]
    ```

- Field contains both the column separator and the line delimiter:

    ```text
    Data: a,'b,c\nd,e',f
    Column separator: ,
    Enclose: '
    Parsing result: 3 fields [a] [b,c\nd,e] [f]
    ```

#### Escape (escape)

- **Purpose**: escapes characters in a field that are the same as the enclosing character
- **Limitation**: only single-byte characters are supported. The default is `\`

**Typical scenarios**:

- Field contains the enclosing character:

    ```text
    Data: a,'b,\'c',d
    Column separator: ,
    Enclose: '
    Escape: \
    Parsing result: 3 fields [a] [b,'c] [d]
    ```

- Field contains multiple enclosing characters:

    ```text
    Data: a,"b,\"c\"d",e
    Column separator: ,
    Enclose: "
    Escape: \
    Parsing result: 3 fields [a] [b,"c"d] [e]
    ```

- Field contains the escape character itself:

    ```text
    Data: a,'b\\c',d
    Column separator: ,
    Enclose: '
    Escape: \
    Parsing result: 3 fields [a] [b\c] [d]
    ```

#### Skip lines (skip_lines)

- **Purpose**: skips the first N lines of the CSV file
- **Type**: integer
- **Default**: 0
- **Special notes**:
    - When `format` is `csv_with_names`, the system automatically skips the first line (column names) and ignores the `skip_lines` parameter
    - When `format` is `csv_with_names_and_types`, the system automatically skips the first two lines (column names and types) and ignores the `skip_lines` parameter

**Typical scenarios**:

- Skip the header line:

    ```text
    Data file:
    Name, Age, City
    Zhang San, 25, Beijing
    Li Si, 30, Shanghai

    Parameter setting:
    skip_lines: 1
    Result: skip the header line and import the subsequent data
    ```

- Skip comment lines:

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

- Use the csv_with_names format:

    ```text
    Data file:
    name,age,city
    Zhang San, 25, Beijing
    Li Si, 30, Shanghai

    Parameter setting:
    format: csv_with_names
    Result: the system automatically skips the first line of column names
    ```

- Use the csv_with_names_and_types format:

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

#### Trim double quotes (trim_double_quotes)

- **Purpose**: trims the outermost double quotes from each field in the CSV file
- **Type**: boolean
- **Default**: false

**Typical scenarios**:

- Trim double quotes:

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

#### Compression format (compress_type)

- **Purpose**: specifies the compression format of the file to import
- **Type**: string, case-insensitive
- **Default**: plain
- **Supported compression formats**:

    | Value | Description |
    |------|------|
    | plain | No compression (default) |
    | bz2 | BZIP2 compression |
    | deflate | DEFLATE compression |
    | gz | GZIP compression |
    | lz4 | LZ4 Frame format compression |
    | lz4_block | LZ4 Block format compression |
    | lzo | LZO compression |
    | lzop | LZOP compression |
    | snappy_block | SNAPPY Block format compression |

- **Notes**:
    - tar is a file packaging format, not a compression format, so `.tar` files are not supported
    - To use a tar-packaged file, unpack it first and then import

## Examples

<!-- Knowledge type: Operation steps -->

This section shows the three most common operations for each import method: specifying delimiters, handling quoted data, and importing compressed files.

### Stream Load

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

### Broker Load

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

### Routine Load

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

### MySQL Load

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

### TVF

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

## FAQ

<!-- Knowledge type: Troubleshooting -->

**Q1: Hive's default `\x01` column separator does not work in Broker Load. Why?**

Under the MySQL protocol, invisible characters require an additional backslash and must be written as `\\x01`, for example `PROPERTIES("column_separator"="\\x01")`. When specified via the HTTP header in Stream Load, `\x01` is sufficient.

**Q2: Does Routine Load support a custom line delimiter?**

No. Each message consumed by Routine Load from Kafka naturally corresponds to a single line, so the `line_delimiter` parameter is neither needed nor supported.

**Q3: The first line of the CSV file is the header. How do I skip it during import?**

- Stream Load / Broker Load / TVF: use `skip_lines=1`
- MySQL Load: use `IGNORE 1 LINES`
- If the file also follows the `name1,name2,...` header convention, set `format` to `csv_with_names` and the system automatically skips the first line. Set it to `csv_with_names_and_types` to automatically skip the first two lines (column names + types)

**Q4: Can I import a `.tar` or `.tar.gz` file directly?**

No. tar is a packaging format, not a compression format. Doris only supports the compression formats listed under `compress_type`. Unpack `.tar` or `.tar.gz` files first and then import them.

**Q5: A field contains both the column separator and a line break. How should I handle it?**

Set `enclose` for that field. For example, with single quotes as the enclosing character, `a,'b,c\nd,e',f` is correctly parsed into 3 fields `[a]`, `[b,c\nd,e]`, `[f]` when the column separator is `,` and the enclose is `'`. If the field also contains the enclosing character itself, combine it with `escape`.

**Q6: How do I remove the outermost double quotes when importing fields wrapped in double quotes?**

Set `trim_double_quotes` to `true`, and Doris automatically trims the outermost double quotes from each field after parsing. This parameter is supported in Stream Load, Routine Load, and TVF, but not in Broker Load or MySQL Load.
