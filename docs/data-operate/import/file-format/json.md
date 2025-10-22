---
{
    "title": "JSON",
    "language": "en"
}
---

This document explains how to load JSON format data files into Doris. Doris supports loading standard JSON format data and can flexibly handle different JSON data structures through parameter configuration, supporting field extraction from JSON data and handling nested structures.

## Loading Methods

The following loading methods support JSON format data:

- [Stream Load](../import-way/stream-load-manual.md)
- [Broker Load](../import-way/broker-load-manual.md)
- [Routine Load](../import-way/routine-load-manual.md)
- [INSERT INTO FROM S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3)
- [INSERT INTO FROM HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs)

## Supported JSON Formats

Doris supports the following three JSON formats:

### Multiple Rows Represented as Array

Suitable for batch loading multiple rows of data, requirements:
- Root node must be an array
- Each element in the array is an object representing a row of data
- Must set `strip_outer_array=true`

Example data:
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

### Single Row Represented as Object

Suitable for loading single row data, requirements:
- Root node must be an object
- The entire object represents one row of data

Example data:
```json
{"id": 123, "city": "beijing"}

// Supports nested structures
{"id": 123, "city": {"name": "beijing", "region": "haidian"}}
```

:::tip Note
Typically used with Routine Load method, such as single messages in Kafka.
:::

### Multiple Object Rows Separated by Delimiter

Suitable for batch loading multiple rows of data, requirements:
- Each line is a complete JSON object
- Must set `read_json_by_line=true`
- Line delimiter can be specified using `line_delimiter` parameter, default is `\n`

Example data:
```json
{"id": 123, "city": "beijing"}
{"id": 456, "city": "shanghai"}
```

## Parameter Configuration

### Parameter Support

The following table lists the JSON format parameters supported by various loading methods:

| Parameter | Default Value | Stream Load | Broker Load | Routine Load | TVF |
|-----------|--------------|-------------|--------------|--------------|-----|
| json paths | None | supported | supported | supported | supported |
| json root | None | supported | supported | supported | supported |
| strip outer array | false | supported | supported | supported | supported |
| read json by line | true | supported | not supported | not supported | supported |
| fuzzy parse | false | supported | supported | not supported | supported |
| num as string | false | supported | supported | supported | supported |
| compression format | plain | supported | supported | not supported | supported |

:::tip Note
1. Stream Load: Parameters are specified directly through HTTP Headers, e.g., `-H "jsonpaths: $.data"`
2. Broker Load: Parameters are specified through `PROPERTIES`, e.g., `PROPERTIES("jsonpaths"="$.data")`
3. Routine Load: Parameters are specified through `PROPERTIES`, e.g., `PROPERTIES("jsonpaths"="$.data")`
4. TVF: Parameters are specified in TVF statements, e.g., `S3("jsonpaths"="$.data")`
5. If you need to load the JSON object at the root node of a JSON file, the jsonpaths should be specified as `$.` or `$`, e.g., `PROPERTIES("jsonpaths"="$.")`
6. The default value of read_json_by_line is true, which means if neither strip_outer_array nor read_json_by_line is specified during import, read_json_by_line will be set to true.
7. "read_json_by_line not configurable" means it is forcibly set to true to enable streaming reading and reduce BE memory usage.
:::

### Parameter Description

#### JSON Path
- Purpose: Specifies how to extract fields from JSON data
- Type: String array
- Default Value: None, defaults to matching column names
- Usage Examples:
  ```json
  -- Basic usage
  ["$.id", "$.city"]
  
  -- Nested structures
  ["$.id", "$.info.city", "$.data[0].name"]
  ```

#### JSON Root
- Purpose: Specifies the parsing starting point for JSON data
- Type: String
- Default Value: None, defaults to parsing from root node
- Usage Example:
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
- Purpose: Specifies whether to remove the outermost array structure
- Type: Boolean
- Default Value: false
- Usage Example:
  ```json
  -- Original data
  [
    {"id": 1, "city": "beijing"},
    {"id": 2, "city": "shanghai"}
  ]
  
  -- Set strip_outer_array=true
  ```

#### Read JSON By Line
- Purpose: Specifies whether to read JSON data line by line
- Type: Boolean
- Default Value: false
- Usage Example:
  ```json
  -- Original data (one complete JSON object per line)
  {"id": 1, "city": "beijing"}
  {"id": 2, "city": "shanghai"}
  
  -- Set read_json_by_line=true
  ```

#### Fuzzy Parse
- Purpose: Accelerates JSON data loading efficiency
- Type: Boolean
- Default Value: false
- Limitations:
  - Field order in each row of the Array must be identical
  - Usually used with strip_outer_array
- Performance: Can improve loading efficiency by 3-5 times

#### Num As String
- Purpose: Specifies whether to parse JSON numeric types as strings
- Type: Boolean
- Default Value: false
- Use Cases:
  - Handling numbers outside numeric range
  - Avoiding numeric precision loss
- Usage Example:
  ```json
  -- Original data
  {
    "id": "12345678901234567890",
    "price": "99999999.999999"
  }
  -- Set num_as_string=true, price field will be parsed as string
  ```

## Usage Examples

This section demonstrates how to use JSON format with different loading methods, and explains the parameters required for various JSON formats (using Stream Load as an example).

### Parameter Usage Guide

#### JSON Format Parameters

For different JSON file formats, there are two important parameters that control how data is read during import:

- `strip_outer_array`
- `read_json_by_line`

**Example 1: One Line One Json Record**

Each line contains a complete JSON record and is imported as a stream. When users don't specify values for these two parameters, the default settings are `read_json_by_line=true` and `strip_outer_array=false`. Therefore, users don't need to specify these parameters for this JSON format (although explicitly setting `read_json_by_line` is also acceptable).

```JSON
{"a": 1, "b": 11}
{"a": 2, "b": 12}
{"a": 3, "b": 13}
{"a": 4, "b": 14}
```

If you mistakenly set `strip_outer_array` to true, you will see an error message in `FirstErrorMsg` like: `JSON data is not an array-object, strip_outer_array must be FALSE`.

---

**Example 2: Array-Format JSON Records**

When JSON records are organized as an array in the file, you need to set `strip_outer_array=true`.

```JSON
[
    {"a": 1, "b": 11},
    {"a": 2, "b": 12}
]
```

If you mistakenly set `read_json_by_line` to true, you will see an error message in `FirstErrorMsg` like: `Parse json data failed. code: 28...`.

---

**Example 3: One Line Multiple Json Records**

If each line contains an array with multiple JSON records, you need to explicitly set both parameters to true.

```JSON
[{"a": 1, "b": 11},{"a": 2, "b": 12}]
[{"a": 3, "b": 13},{"a": 4, "b": 14}]
```

If you forget to set `strip_outer_array`, you will see an error message in `FirstErrorMsg` like: `JSON data is array-object, strip_outer_array must be TRUE`. If you forget to set `read_json_by_line`, **only the first line** (the two JSON records on the first line) will be imported. Please be aware of this behavior.

#### JSON Path Related Parameters

During JSON import, you can configure `jsonpaths` and `json_root` to have more flexible control over data extraction paths, which provides support for importing complex nested JSON formats. Another related parameter is `columns`.

```sql
-- Table structure
CREATE TABLE example_table (
    a INT,
    b INT
)

-- JSON data
[
    {"id":1, "record":{"year":25, "name":"hiki"}},
    {"id":2, "record":{"year":20, "name":"ykk"}}
]
```

```shell
curl -v ... -H "format: json" \
    -H "jsonpaths:[\"$.id\",\"$.record.year\"]" \
    -H "columns:b,a" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load

select * from example_table;
+------+------+
| a    | b    |
+------+------+
|   20 |    2 |
|   25 |    1 |
+------+------+
```

From the import command and the imported data above, we can clearly see how these parameters work together. You can think of JSON import as a two-step process: first, data is read from the JSON file and organized into an array of row data, then each row is imported into the table one by one. The order of data in this array (from JSON file to row array) is controlled by `jsonpaths` and `json_root`. In the example above, the data order for each row in the array is `id` and `year` from the JSON file. The mapping relationship between each row's data and the table columns is specified by `columns`. In the example above, the `id` data is imported into column `b`, and the `year` data is imported into column `a`.

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

### Broker Load

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

### TVF Load

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
