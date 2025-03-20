---
{
    "title": "CSV",
    "language": "en"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

This document explains how to load CSV format data files into Doris. Doris supports flexible CSV format configuration, including custom delimiters, field enclosures, and provides various loading methods to meet data loading requirements in different scenarios.

## Loading Methods

Doris supports the following methods to load CSV format data:

- [Stream Load](../import-way/stream-load-manual)
- [Broker Load](../import-way/broker-load-manual)
- [Routine Load](../import-way/routine-load-manual)
- [MySQL Load](../import-way/mysql-load-manual)
- [INSERT INTO FROM S3 TVF](../../sql-manual/sql-functions/table-valued-functions/s3)
- [INSERT INTO FROM HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs)

## Parameter Configuration

### Parameter Support

The following table lists the CSV format parameters supported by various loading methods:

| Parameter | Default Value | Stream Load | Broker Load | Routine Load | MySQL Load | TVF |
|-----------|--------------|-------------|--------------|--------------|------------|-----|
| Line Delimiter | `\n` | line_delimiter | LINES TERMINATED BY | Not supported | LINES TERMINATED BY | line_delimiter |
| Column Delimiter | `\t` | column_separator | COLUMNS TERMINATED BY | COLUMNS TERMINATED BY | COLUMNS TERMINATED BY | column_separator |
| Enclosure | None | enclose | PROPERTIES.enclose | PROPERTIES.enclose | PROPERTIES.enclose | enclose |
| Escape Character | `\` | escape | PROPERTIES.escape | PROPERTIES.escape | PROPERTIES.escape | escape |
| Skip Lines | 0 | skip_lines | PROPERTIES.skip_lines | Not supported | IGNORE LINES | skip_lines |
| Trim Double Quotes | false | trim_double_quotes | Not supported | PROPERTIES.trim_double_quotes | Not supported | trim_double_quotes |
| Compression Format | plain | compress_type | PROPERTIES.compress_type | Not supported | Not supported | compress_type |

:::tip Note
1. Stream Load: Parameters are specified directly through HTTP Headers, e.g., `-H "line_delimiter:\n"`
2. Broker Load: Parameters are specified in SQL statements, where:
   - Delimiters are specified through `COLUMNS TERMINATED BY`, `LINES TERMINATED BY`
   - Other parameters are specified through `PROPERTIES`, e.g., `PROPERTIES("compress_type"="gz")`
3. Routine Load: Parameters are specified in SQL statements, where:
   - Delimiters are specified through `COLUMNS TERMINATED BY`
   - Other parameters are specified through `PROPERTIES`, e.g., `PROPERTIES("enclose"="\"")`
4. MySQL Load: Parameters are specified in SQL statements, where:
   - Delimiters are specified through `LINES TERMINATED BY`, `COLUMNS TERMINATED BY`
   - Other parameters are specified through `PROPERTIES`, e.g., `PROPERTIES("escape"="\\")`
5. TVF: Parameters are specified in TVF statements, e.g., `S3("line_delimiter"="\n")`
:::

### Parameter Description

| Parameter | Default Value | Description |
|--|--|--|
| Line Delimiter | `\n` | Specify the line break character in the imported file. Multiple character combinations are supported as line breaks. |
| Column Delimiter | `\t` | Specifies the column separator in the import file. It supports visible and invisible characters and multiple character combinations. Invisible characters need to be represented in hexadecimal with the prefix `\x`. Invisible characters in the MySQL protocol need to be represented with an additional backslash. |
| Enclosure | 无 | Protect fields containing special characters from being parsed incorrectly. Only single-byte characters are supported. |
| Escape Character | `\` | Escape the same characters as the enclosing characters in the field. Only single-byte characters are supported. |
| Skip Lines | 0 | Skip the first few lines of the CSV file. When format is `csv_with_names`, the system automatically skips the first line (column names). When format is `csv_with_names_and_types`, the system automatically skips the first two lines (column names and types). The skip_lines parameter is ignored. |
| Trim Double Quotes | false | Trim the outermost double quotes of each field in the CSV file |
| Compression Format | plain | Specify the compression format of the imported file. Tar is a file packaging format, not a compression format, so .tar files are not supported. If you need to use a tar-packed file, please unpack it before importing it. |

  The Line Delimiter example is as follows:
  - Linux/Unix System Files:
    ```
    Data File:
    John,25\n
    Mary,30\n
    
    Parameter Setting:
    line_delimiter: \n (default value, can be omitted)
    ```
  - Windows System Files:
    ```
    Data File:
    John,25\r\n
    Mary,30\r\n
    
    Parameter Setting:
    line_delimiter: \r\n
    ```
  - Special Program Generated Files:
    ```
    Data File:
    John,25\r
    Mary,30\r
    
    Parameter Setting:
    line_delimiter: \r
    ```
  - Custom Multi-character Delimiter:
    ```
    Data File:
    John,25||
    Mary,30||
    
    Parameter Setting:
    line_delimiter: ||
    ```

  The following is an example of Column Delimiter:
  - Common Visible Characters:
    ```
    Data File:
    John,25,New York
    Mary,30,Los Angeles
    
    Parameter Setting:
    column_separator: ,
    ```
  - Tab (Default):
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
  - Multi-character Delimiter:
    ```
    Data File:
    John||25||New York
    Mary||30||Los Angeles
    
    Parameter Setting:
    column_separator: ||
    ```

  The following is an example of Enclosure:
  - Field Contains Column Delimiter:
    ```
    Data: a,'b,c',d
    Column Delimiter: ,
    Enclosure: '
    Parsing Result: 3 fields [a] [b,c] [d]
    ```
  - Field Contains Line Delimiter:
    ```
    Data: a,'b\nc',d
    Column Delimiter: ,
    Enclosure: '
    Parsing Result: 3 fields [a] [b\nc] [d]
    ```
  - Field Contains Both Column and Line Delimiters:
    ```
    Data: a,'b,c\nd,e',f
    Column Delimiter: ,
    Enclosure: '
    Parsing Result: 3 fields [a] [b,c\nd,e] [f]
    ```

  The following are examples of Escape Characters:
  - Field Contains Enclosure Character:
    ```
    Data: a,'b,\'c',d
    Column Delimiter: ,
    Enclosure: '
    Escape Character: \
    Parsing Result: 3 fields [a] [b,'c] [d]
    ```
  - Field Contains Multiple Enclosure Characters:
    ```
    Data: a,"b,\"c\"d",e
    Column Delimiter: ,
    Enclosure: "
    Escape Character: \
    Parsing Result: 3 fields [a] [b,"c"d] [e]
    ```
  - Field Contains Escape Character Itself:
    ```
    Data: a,'b\\c',d
    Column Delimiter: ,
    Enclosure: '
    Escape Character: \
    Parsing Result: 3 fields [a] [b\c] [d]
    ```

  The Skip Lines example is as follows:
  - Skip Title Line:
    ```
    Data File:
    Name,Age,City
    John,25,New York
    Mary,30,Los Angeles
    
    Parameter Setting:
    skip_lines: 1
    Result: Skip title line, load subsequent data
    ```
  - Skip Comment Lines:
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
  - Use csv_with_names Format:
    ```
    Data File:
    name,age,city
    John,25,New York
    Mary,30,Los Angeles
    
    Parameter Setting:
    format: csv_with_names
    Result: System automatically skips the first line of column names
    ```
  - Use csv_with_names_and_types Format:
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

  Trim Double Quotes example is as follows:
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

  The Compression Format example is as follows:
  - Supported Compression Formats:
    - plain: No compression (default)
    - bz2: BZIP2 compression
    - deflate: DEFLATE compression
    - gz: GZIP compression
    - lz4: LZ4 Frame format compression
    - lz4_block: LZ4 Block format compression
    - lzo: LZO compression
    - lzop: LZOP compression
    - snappy_block: SNAPPY Block format compression

## Usage Examples

This section demonstrates the usage of CSV format in different loading methods.

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

### MySQL Load

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
