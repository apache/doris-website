---
{
    "title": "JSON | File Format",
    "language": "en",
    "description": "Guide to importing JSON files into Doris: covers three JSON formats, parameter configuration such as jsonpaths and json_root, and usage examples for Stream Load, Broker Load, Routine Load, and TVF.",
    "keywords": [
        "Doris JSON import",
        "jsonpaths",
        "json_root",
        "strip_outer_array",
        "read_json_by_line",
        "Stream Load JSON",
        "Routine Load JSON",
        "nested JSON import"
    ],
    "sidebar_label": "JSON"
}
---

<!-- Knowledge type: Procedure + Configuration parameters -->
<!-- Applicable scenario: JSON data import / Field extraction / Nested structure handling -->

This document describes how to import JSON-format data files into Doris. Doris supports importing standard JSON-format data. Through parameter configuration, you can flexibly handle different JSON data structures, extract fields from JSON data, parse nested structures, and more.

## Import methods

The following import methods support JSON-format data:

| Import method | Applicable scenario | Parameter passing |
|---|---|---|
| [Stream Load](../import-way/stream-load-manual) | Small-batch, near-real-time imports pushed from local or client | HTTP Header, for example `-H "jsonpaths: $.data"` |
| [Broker Load](../import-way/broker-load-manual) | Bulk imports of large files from object storage, HDFS, and similar sources | `PROPERTIES`, for example `PROPERTIES("jsonpaths"="$.data")` |
| [Routine Load](../import-way/routine-load-manual) | Continuously consume JSON from message queues such as Kafka | `PROPERTIES`, for example `PROPERTIES("jsonpaths"="$.data")` |
| [INSERT INTO FROM S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3) | Read JSON files on S3 directly with SQL | TVF parameters, for example `S3("jsonpaths"="$.data")` |
| [INSERT INTO FROM HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs) | Read JSON files on HDFS directly with SQL | TVF parameters |

## Supported JSON formats

Doris supports the following three JSON file organization formats, each suitable for different business scenarios.

### Format 1: Multiple rows represented as an Array

Suitable for bulk-importing multiple rows at once.

Requirements:

- The root node must be an array.
- Each element in the array is an object that represents one row of data.
- `strip_outer_array=true` must be set.

Example data:

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

### Format 2: A single row represented as an Object

Suitable for importing a single row of data.

Requirements:

- The root node must be an object.
- The entire object represents one row of data.
- The file contains only one JSON record per line.

Example data:

```json
{"id": 123, "city": "beijing"}

// Nested structures are supported
{"id": 123, "city": {"name": "beijing", "region": "haidian"}}
```

:::tip Note
This format is typically used with Routine Load, for example a single message in Kafka.
:::

### Format 3: Multiple rows of Object data separated by a fixed delimiter

Suitable for bulk-importing multiple rows, where each row is an independent JSON object (similar to NDJSON).

Requirements:

- Each line is a complete JSON object.
- You do not need to set `read_json_by_line=true` explicitly; it is enabled by default.
- The line delimiter can be specified with the `line_delimiter` parameter, and defaults to `\n`.

Example data:

```json
{"id": 123, "city": "beijing"}
{"id": 456, "city": "shanghai"}
```

## Parameter configuration

### Parameter support matrix for each import method

The following table lists the support for JSON-related parameters across the different import methods:

| Parameter | Default | Stream Load | Broker Load | Routine Load | TVF |
|---|---|---|---|---|---|
| `jsonpaths` | None | Supported | Supported | Supported | Supported |
| `json_root` | None | Supported | Supported | Supported | Supported |
| `strip_outer_array` | false | Supported | Supported | Supported | Supported |
| `read_json_by_line` | true | Supported | Not configurable | Not configurable | Supported |
| `fuzzy_parse` | false | Supported | Supported | Not supported | Supported |
| `num_as_string` | false | Supported | Supported | Supported | Supported |
| Compression format | plain | Supported | Supported | Not supported | Supported |

:::tip Parameter passing and default behavior

1. Stream Load: parameters are passed directly through HTTP Header, for example `-H "jsonpaths: $.data"`.
2. Broker Load: parameters are passed through `PROPERTIES`, for example `PROPERTIES("jsonpaths"="$.data")`.
3. Routine Load: parameters are passed through `PROPERTIES`, for example `PROPERTIES("jsonpaths"="$.data")`.
4. TVF: parameters are passed through the TVF statement, for example `S3("jsonpaths"="$.data")`.
5. To import the JSON object at the root node of a JSON file directly, set `jsonpaths` to `$.`, for example `PROPERTIES("jsonpaths"="$.")`.
6. The default value of `read_json_by_line` is true, which means: if neither `strip_outer_array` nor `read_json_by_line` is specified during import, `read_json_by_line` is true.
7. `read_json_by_line` is not configurable in Broker Load and Routine Load. It is forced to true to enable streaming reads and reduce memory pressure on the BE.

:::

### Detailed parameter description

#### jsonpaths

- **Purpose**: Specifies how to extract fields from JSON data.
- **Type**: Array of strings.
- **Default**: None. By default, columns are matched by name.
- **Examples**:

    ```json
    -- Basic usage
    ["$.id", "$.city"]

    -- Nested structure
    ["$.id", "$.info.city", "$.data[0].name"]
    ```

#### json_root

- **Purpose**: Specifies the parsing entry point of JSON data.
- **Type**: String.
- **Default**: None. By default, parsing starts from the root node.
- **Examples**:

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

- **Purpose**: Specifies whether to strip the outermost array structure.
- **Type**: Boolean.
- **Default**: false.
- **Examples**:

    ```json
    -- Original data
    [
      {"id": 1, "city": "beijing"},
      {"id": 2, "city": "shanghai"}
    ]

    -- Set strip_outer_array=true
    ```

#### read_json_by_line

- **Purpose**: Specifies whether to read JSON data line by line.
- **Type**: Boolean.
- **Default**: false.
- **Examples**:

    ```json
    -- Original data (one complete JSON object per line)
    {"id": 1, "city": "beijing"}
    {"id": 2, "city": "shanghai"}

    -- Set read_json_by_line=true
    ```

#### fuzzy_parse

- **Purpose**: Speeds up JSON data import.
- **Type**: Boolean.
- **Default**: false.
- **Restrictions**:
    - The field order in every row of the array must be exactly the same.
    - Typically used together with `strip_outer_array`.
- **Performance**: Improves import efficiency by 3 to 5 times.

#### num_as_string

- **Purpose**: Specifies whether numeric values in JSON are parsed as strings.
- **Type**: Boolean.
- **Default**: false.
- **Use cases**:
    - Handling numbers that exceed the supported numeric range.
    - Avoiding loss of numeric precision.
- **Example**:

    ```json
    -- Original data
    {
      "id": "12345678901234567890",
      "price": "99999999.999999"
    }
    -- With num_as_string=true, the price field is parsed as a string
    ```

### Relationship between JSON Path and Columns

During data import, `jsonpaths` and `columns` have distinct responsibilities:

| Parameter | Responsibility | Result |
|---|---|---|
| `jsonpaths` | Defines the data extraction rules | Extracts fields from JSON data along the specified paths and reorders them according to the order defined in `jsonpaths` |
| `columns` | Defines the data mapping rules | Maps the extracted fields to columns in the target table, with optional column reordering and transformation |

The two are processed sequentially:

1. `jsonpaths` first extracts fields from the source data and forms an ordered dataset.
2. `columns` then maps these data items to the table columns.

If `columns` is not specified, the extracted fields are mapped directly in the order of the table's columns.

#### Example 1: Using JSON Path only

Table schema and data:

```sql
-- Table schema
CREATE TABLE example_table (
    k2 int,
    k1 int
);

-- JSON data
{"k1": 1, "k2": 2}
```

Import command:

```shell
curl -v ... -H "format: json" \
    -H "jsonpaths: [\"$.k2\", \"$.k1\"]" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load
```

Import result:

```text
+------+------+
| k1   | k2   |
+------+------+
|    2 |    1 |
+------+------+
```

#### Example 2: Using JSON Path together with Columns

Use the same table schema and data as above, and add the `columns` parameter.

Import command:

```shell
curl -v ... -H "format: json" \
    -H "jsonpaths: [\"$.k2\", \"$.k1\"]" \
    -H "columns: k2, k1" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load
```

Import result:

```text
+------+------+
| k1   | k2   |
+------+------+
|    1 |    2 |
+------+------+
```

#### Example 3: Reusing a field

Table schema and data:

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

Import command:

```shell
curl -v ... -H "format: json" \
    -H "jsonpaths: [\"$.k2\", \"$.k1\", \"$.k1\"]" \
    -H "columns: k2, k1, k1_copy" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load
```

Import result:

```text
+------+------+---------+
| k2   | k1   | k1_copy |
+------+------+---------+
|    2 |    1 |       1 |
+------+------+---------+
```

#### Example 4: Mapping nested fields

Table schema and data:

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

Import command:

```shell
curl -v ... -H "format: json" \
    -H "jsonpaths: [\"$.k2\", \"$.k1\", \"$.k3.k1\", \"$.k3.k1_nested.k1\"]" \
    -H "columns: k2, k1, k1_nested1, k1_nested2" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load
```

Import result:

```text
+------+------+------------+------------+
| k2   | k1   | k1_nested1 | k1_nested2 |
+------+------+------------+------------+
|    2 |    1 |         31 |         32 |
+------+------+------------+------------+
```

## Usage examples

This section shows how to use the JSON format with each import method. You can copy and adapt the snippets directly.

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

## FAQ

<!-- Knowledge type: Troubleshooting -->

### Q1: When importing a JSON file in array form, all data is treated as a single row. Why?

You must explicitly set `strip_outer_array=true`. Otherwise, Doris parses the entire outer array as a single JSON object and cannot write the data row by row.

### Q2: How should I import a file with one JSON object per line (NDJSON)?

Import it directly using [Format 3](#format-3-multiple-rows-of-object-data-separated-by-a-fixed-delimiter). `read_json_by_line` is enabled by default, so no extra configuration is required. If the line delimiter is not `\n`, specify it with `line_delimiter`.

### Q3: How do I import the JSON object at the root node of a JSON file directly?

Set `jsonpaths` to `$.`, for example `PROPERTIES("jsonpaths"="$.")`.

### Q4: How do I avoid precision loss for very large numbers or high-precision decimals?

Set `num_as_string=true`. Numeric values in JSON are parsed as strings and then written into the corresponding column types, which avoids numeric overflow and precision loss.

### Q5: Why does Broker Load / Routine Load not allow `read_json_by_line` to be configured?

To reduce memory pressure on the BE, Broker Load and Routine Load always read line by line in streaming mode. As a result, `read_json_by_line` cannot be configured explicitly.

### Q6: How do I speed up the import of large numbers of JSON arrays with the same structure?

Enable `fuzzy_parse=true` together with `strip_outer_array=true` to gain a 3 to 5 times improvement in import performance. The field order in every row of the array must be exactly the same.

### Q7: What is the relationship between `jsonpaths` and `columns`, and which takes effect first?

`jsonpaths` first extracts fields from the JSON and arranges them in its specified order, and `columns` then maps these fields to columns in the target table. For details, see [Relationship between JSON Path and Columns](#relationship-between-json-path-and-columns).
