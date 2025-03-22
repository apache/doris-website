---
{
    "title": "JSON",
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

This document explains how to load JSON format data files into Doris. Doris supports loading standard JSON format data and can flexibly handle different JSON data structures through parameter configuration, supporting field extraction from JSON data and handling nested structures.

## Loading Methods

The following loading methods support JSON format data:

- [Stream Load](../import-way/stream-load-manual.md)
- [Broker Load](../import-way/broker-load-manual.md)
- [Routine Load](../import-way/routine-load-manual.md)
- [INSERT INTO FROM S3 TVF](../../sql-manual/sql-functions/table-valued-functions/s3)
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
| json paths | None | jsonpaths | properties.jsonpaths | properties.jsonpaths | jsonpaths |
| json root | None | json_root | properties.json_root | properties.json_root | json_root |
| strip outer array | false | strip_outer_array | properties.strip_outer_array | properties.strip_outer_array | strip_outer_array |
| read json by line | false | read_json_by_line | Always true | Not supported | read_json_by_line, default true |
| fuzzy parse | false | fuzzy_parse | properties.fuzzy_parse | Not supported | fuzzy_parse |
| num as string | false | num_as_string | properties.num_as_string | properties.num_as_string | num_as_string |
| compression format | plain | Not Supported | PROPERTIES.compress_type | Not supported | Not supported | compress_type |

:::tip Note
1. Stream Load: Parameters are specified directly through HTTP Headers, e.g., `-H "jsonpaths: $.data"`
2. Broker Load: Parameters are specified through `PROPERTIES`, e.g., `PROPERTIES("jsonpaths"="$.data")`
3. Routine Load: Parameters are specified through `PROPERTIES`, e.g., `PROPERTIES("jsonpaths"="$.data")`
4. TVF: Parameters are specified in TVF statements, e.g., `S3("jsonpaths"="$.data")`
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

### Relationship between JSON Path and Columns

During data loading, JSON Path and Columns serve different responsibilities:

**JSON Path**: Defines data extraction rules
   - Extracts fields from JSON data according to specified paths
   - Extracted fields are reordered according to the order defined in JSON Path

**Columns**: Defines data mapping rules
   - Maps extracted fields to target table columns
   - Can perform column reordering and transformation

These two parameters are processed serially: first, JSON Path extracts fields from source data and forms an ordered dataset, then Columns maps these data to table columns. If Columns is not specified, extracted fields will be mapped directly according to table column order.

#### Usage Examples

##### Using JSON Path Only

Table structure and data:
```sql
-- Table structure
CREATE TABLE example_table (
    k2 int,
    k1 int
);

-- JSON data
{"k1": 1, "k2": 2}
```

Load command:
```shell
curl -v ... -H "format: json" \
    -H "jsonpaths: [\"$.k2\", \"$.k1\"]" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load
```

Load result:
```text
+------+------+
| k1   | k2   |
+------+------+
|    2 |    1 | 
+------+------+
```

##### Using JSON Path + Columns

Using the same table structure and data, adding columns parameter:

Load command:
```shell
curl -v ... -H "format: json" \
    -H "jsonpaths: [\"$.k2\", \"$.k1\"]" \
    -H "columns: k2, k1" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load
```

Load result:
```text
+------+------+
| k1   | k2   |
+------+------+
|    1 |    2 | 
+------+------+
```

##### Field Reuse

Table structure and data:
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

Load command:
```shell
curl -v ... -H "format: json" \
    -H "jsonpaths: [\"$.k2\", \"$.k1\", \"$.k1\"]" \
    -H "columns: k2, k1, k1_copy" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load
```

Load result:
```text
+------+------+---------+
| k2   | k1   | k1_copy |
+------+------+---------+
|    2 |    1 |       1 |
+------+------+---------+
```

##### Nested Field Mapping

Table structure and data:
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

Load command:
```shell
curl -v ... -H "format: json" \
    -H "jsonpaths: [\"$.k2\", \"$.k1\", \"$.k3.k1\", \"$.k3.k1_nested.k1\"]" \
    -H "columns: k2, k1, k1_nested1, k1_nested2" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load
```

Load result:
```text
+------+------+------------+------------+
| k2   | k1   | k1_nested1 | k1_nested2 |
+------+------+------------+------------+
|    2 |    1 |         31 |         32 |
+------+------+------------+------------+
```

## Usage Examples

This section demonstrates the usage of JSON format in different loading methods.

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
