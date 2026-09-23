---
{
    "title": "VARIANT",
    "language": "en",
    "description": "How do you load CSV and JSON data into a Doris VARIANT column? Provides full steps for table creation, Stream Load commands, and type inference verification.",
    "keywords": [
        "Doris VARIANT load",
        "Load CSV into VARIANT",
        "Load JSON into VARIANT",
        "semi-structured data",
        "Stream Load JSON",
        "Storage Format V3",
        "describe_extend_variant_column",
        "VARIANT type inference"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Semi-structured data load / VARIANT table initialization -->

This document describes how to load CSV or JSON data into a Doris `VARIANT` column, covering the full flow from table creation to data load and result verification.

## Target audience and prerequisite reading

Before reading this document, choose the reference that best matches your needs:

| Your need | Recommended reading |
| --- | --- |
| Quickly complete a CSV / JSON load | Continue with this document |
| Choose between the default mode, Sparse, DOC mode, or Schema Template | [VARIANT Usage and Configuration Guide](../../../sql-manual/basic-element/sql-data-types/semi-structured/variant-workload-guide.md) |
| Look up VARIANT query syntax, indexes, limitations, or configuration reference | [VARIANT](../../../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT.md) |

## Limitations

- The examples below load **CSV** and **JSON** files. In a load job, any string field that is loaded into a `VARIANT` column is parsed as JSON, so other formats work the same way when the source column is a string, for example a Parquet `STRING` column.

## How loaded values are converted

- **CSV format:** the text of a `VARIANT` field is parsed as JSON. `\N` loads SQL `NULL`. Text that is not valid JSON is loaded as a VARIANT string.
- **JSON format:** the JSON value of the field is loaded as it is. If the value is a JSON string, its content is parsed again as JSON text, so `"123"` loads the number `123` and `"true"` loads the boolean `true`. A top-level JSON boolean loads the number `1` or `0`. A JSON `null` or a missing field loads SQL `NULL`.
- **Out-of-range numbers:** a document that contains an integer outside [-2^63, 2^64 - 1] or a number outside the `DOUBLE` range cannot be parsed, and the whole document is loaded as one VARIANT string.
- **`NOT NULL` columns:** a row whose VARIANT value is SQL `NULL`, including a value that failed to parse into SQL `NULL`, is filtered.
- **INSERT is different:** `INSERT` does not parse strings. `INSERT INTO t VALUES (1, '{"a": 1}')` stores the VARIANT string `{"a": 1}`, and so does `INSERT INTO ... SELECT` from `s3()`, `hdfs()`, or `local()`. Use `PARSE_TO_VARIANT` to store an object.
- **Stored values are normalized:** object members whose value is `null`, and members that are empty objects or arrays, are not stored.

For the complete rules, see [Write data](../../../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT.md#write-data) and [What storage keeps](../../../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT.md#what-storage-keeps).

## Storage format recommendation (V3)

<!-- Knowledge type: Architecture selection decision -->

For newly created `VARIANT` tables, especially for wide JSON scenarios, use **Storage Format V3** directly unless you have a clear reason to use another format. For the design rationale, see [Storage Format V3](../../../table-design/storage-format.md).

Enable it explicitly through `PROPERTIES` when creating the table:

```sql
CREATE TABLE table_v3 (
    id BIGINT,
    data VARIANT
)
DISTRIBUTED BY HASH(id) BUCKETS 32
PROPERTIES (
    "storage_format" = "V3"
);
```

## Loading CSV format

### Step 1: Prepare the data

Create a CSV file named `test_variant.csv` with the following content:

```SQL
14186154924|PushEvent|{"avatar_url":"https://avatars.githubusercontent.com/u/282080?","display_login":"brianchandotcom","gravatar_id":"","id":282080,"login":"brianchandotcom","url":"https://api.github.com/users/brianchandotcom"}|{"id":1920851,"name":"brianchandotcom/liferay-portal","url":"https://api.github.com/repos/brianchandotcom/liferay-portal"}|{"before":"abb58cc0db673a0bd5190000d2ff9c53bb51d04d","commits":[""],"distinct_size":4,"head":"91edd3c8c98c214155191feb852831ec535580ba","push_id":6027092734,"ref":"refs/heads/master","size":4}|1|2020-11-14 02:00:00
```

### Step 2: Create the table in the database

Run the following SQL statement to create the table:

```SQL
CREATE TABLE IF NOT EXISTS testdb.test_variant (
    id BIGINT NOT NULL,
    type VARCHAR(30) NULL,
    actor VARIANT NULL,
    repo VARIANT NULL,
    payload VARIANT NULL,
    public BOOLEAN NULL,
    created_at DATETIME NULL,
    INDEX idx_payload (`payload`) USING INVERTED PROPERTIES("parser" = "english") COMMENT 'inverted index for payload'
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(id) BUCKETS 10
properties("replication_num" = "1");
```

### Step 3: Load the data

Using Stream Load as an example, load the data with the following command:

```SQL
curl --location-trusted -u root:  -T test_variant.csv -H "column_separator:|" http://127.0.0.1:8030/api/testdb/test_variant/_stream_load
```

Example response on a successful load:

```SQL
{
    "TxnId": 12,
    "Label": "96cd6250-9c78-4a9f-b8b3-2b7cef0dd606",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 1,
    "NumberLoadedRows": 1,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 660,
    "LoadTimeMs": 213,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 6,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 183,
    "ReceiveDataTimeMs": 14,
    "CommitAndPublishTimeMs": 20
}
```

### Step 4: Verify the loaded data

Use the following SQL query to confirm that the data has been written:

```SQL
mysql> select * from testdb.test_variant\G
*************************** 1. row ***************************
        id: 14186154924
      type: PushEvent
     actor: {"avatar_url":"https://avatars.githubusercontent.com/u/282080?","display_login":"brianchandotcom","gravatar_id":"","id":282080,"login":"brianchandotcom","url":"https://api.github.com/users/brianchandotcom"}
      repo: {"id":1920851,"name":"brianchandotcom/liferay-portal","url":"https://api.github.com/repos/brianchandotcom/liferay-portal"}
   payload: {"before":"abb58cc0db673a0bd5190000d2ff9c53bb51d04d","commits":[""],"distinct_size":4,"head":"91edd3c8c98c214155191feb852831ec535580ba","push_id":6027092734,"ref":"refs/heads/master","size":4}
    public: 1
created_at: 2020-11-14 02:00:00
```

## Loading JSON format

### Step 1: Prepare the data

Create a JSON file named `test_variant.json` with the following content:

```SQL
{"id": "14186154924","type": "PushEvent","actor": {"id": 282080,"login":"brianchandotcom","display_login": "brianchandotcom","gravatar_id": "","url": "https://api.github.com/users/brianchandotcom","avatar_url": "https://avatars.githubusercontent.com/u/282080?"},"repo": {"id": 1920851,"name": "brianchandotcom/liferay-portal","url": "https://api.github.com/repos/brianchandotcom/liferay-portal"},"payload": {"push_id": 6027092734,"size": 4,"distinct_size": 4,"ref": "refs/heads/master","head": "91edd3c8c98c214155191feb852831ec535580ba","before": "abb58cc0db673a0bd5190000d2ff9c53bb51d04d","commits": [""]},"public": true,"created_at": "2020-11-13T18:00:00Z"}
```

### Step 2: Create the table in the database

Run the following SQL statement to create the table:

```SQL
CREATE TABLE IF NOT EXISTS testdb.test_variant (
    id BIGINT NOT NULL,
    type VARCHAR(30) NULL,
    actor VARIANT NULL,
    repo VARIANT NULL,
    payload VARIANT NULL,
    public BOOLEAN NULL,
    created_at DATETIME NULL,
    INDEX idx_payload (`payload`) USING INVERTED PROPERTIES("parser" = "english") COMMENT 'inverted index for payload'
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(id) BUCKETS 10;
```

### Step 3: Load the data

Using Stream Load as an example, load the data with the following command:

```SQL
curl --location-trusted -u root:  -T test_variant.json -H "format:json"  http://127.0.0.1:8030/api/testdb/test_variant/_stream_load
```

Example response on a successful load:

```SQL
{
    "TxnId": 12,
    "Label": "96cd6250-9c78-4a9f-b8b3-2b7cef0dd606",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 1,
    "NumberLoadedRows": 1,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 660,
    "LoadTimeMs": 213,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 6,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 183,
    "ReceiveDataTimeMs": 14,
    "CommitAndPublishTimeMs": 20
}
```

### Step 4: Verify the loaded data

Use the following SQL query to confirm that the data has been written:

```SQL
mysql> select * from testdb.test_variant\G
*************************** 1. row ***************************
        id: 14186154924
      type: PushEvent
     actor: {"avatar_url":"https://avatars.githubusercontent.com/u/282080?","display_login":"brianchandotcom","gravatar_id":"","id":282080,"login":"brianchandotcom","url":"https://api.github.com/users/brianchandotcom"}
      repo: {"id":1920851,"name":"brianchandotcom/liferay-portal","url":"https://api.github.com/repos/brianchandotcom/liferay-portal"}
   payload: {"before":"abb58cc0db673a0bd5190000d2ff9c53bb51d04d","commits":[""],"distinct_size":4,"head":"91edd3c8c98c214155191feb852831ec535580ba","push_id":6027092734,"ref":"refs/heads/master","size":4}
    public: 1
created_at: 2020-11-14 02:00:00
```

### Step 5: Verify type inference

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: VARIANT subcolumn type confirmation / schema exploration -->

By default, `DESC` only shows the top-level VARIANT column and does not expand the inner subcolumns:

```sql
mysql> desc test_variant;
+------------+---------------------------+------+-------+---------+-------+
| Field      | Type                      | Null | Key   | Default | Extra |
+------------+---------------------------+------+-------+---------+-------+
| id         | bigint                    | No   | true  | NULL    |       |
| type       | varchar(30)               | Yes  | false | NULL    | NONE  |
| actor      | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| repo       | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| payload    | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| public     | boolean                   | Yes  | false | NULL    | NONE  |
| created_at | datetime                  | Yes  | false | NULL    | NONE  |
+------------+---------------------------+------+-------+---------+-------+
7 rows in set
```

The VARIANT type string, which lists the column properties, is abbreviated here as `variant<PROPERTIES (...)>`.

After enabling `describe_extend_variant_column`, you can view the subcolumn types inferred from the VARIANT column:

```sql
mysql> set describe_extend_variant_column = true;
Query OK, 0 rows affected (0.00 sec)

mysql> desc test_variant;
+-----------------------+---------------------------+------+-------+---------+-------+
| Field                 | Type                      | Null | Key   | Default | Extra |
+-----------------------+---------------------------+------+-------+---------+-------+
| id                    | bigint                    | No   | true  | NULL    |       |
| type                  | varchar(30)               | Yes  | false | NULL    | NONE  |
| actor                 | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| repo                  | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| payload               | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| public                | boolean                   | Yes  | false | NULL    | NONE  |
| created_at            | datetime                  | Yes  | false | NULL    | NONE  |
| actor.avatar_url      | text                      | Yes  | false | NULL    | NONE  |
| actor.display_login   | text                      | Yes  | false | NULL    | NONE  |
| actor.gravatar_id     | text                      | Yes  | false | NULL    | NONE  |
| actor.id              | bigint                    | Yes  | false | NULL    | NONE  |
| actor.login           | text                      | Yes  | false | NULL    | NONE  |
| actor.url             | text                      | Yes  | false | NULL    | NONE  |
| payload.before        | text                      | Yes  | false | NULL    | NONE  |
| payload.commits       | array<text>               | Yes  | false | NULL    | NONE  |
| payload.distinct_size | bigint                    | Yes  | false | NULL    | NONE  |
| payload.head          | text                      | Yes  | false | NULL    | NONE  |
| payload.push_id       | bigint                    | Yes  | false | NULL    | NONE  |
| payload.ref           | text                      | Yes  | false | NULL    | NONE  |
| payload.size          | bigint                    | Yes  | false | NULL    | NONE  |
| repo.id               | bigint                    | Yes  | false | NULL    | NONE  |
| repo.name             | text                      | Yes  | false | NULL    | NONE  |
| repo.url              | text                      | Yes  | false | NULL    | NONE  |
+-----------------------+---------------------------+------+-------+---------+-------+
23 rows in set
```

You can also display the inference results per partition:

```sql
DESCRIBE ${table_name} PARTITION ($partition_name);
```

## FAQ

### Q1: Which data formats does VARIANT support for loading?

Load jobs parse any string field loaded into a `VARIANT` column as JSON, whatever the file format; the examples in this document use **CSV** and **JSON**. With `INSERT`, including `INSERT INTO ... SELECT` from table functions, wrap string values in `PARSE_TO_VARIANT`.

### Q2: When is Storage Format V3 required?

For newly created `VARIANT` tables, especially for wide JSON scenarios with many fields, use V3 storage format directly. Earlier storage formats are not recommended unless you have a clear reason to use them.

### Q3: Why does `DESC` not show the subcolumns inferred from VARIANT?

By default, `DESC` only displays the top-level VARIANT column. First run:

```sql
SET describe_extend_variant_column = true;
```

After that, running `DESC` again shows all inferred subcolumns and their types. You can also view them per partition with `DESCRIBE ${table_name} PARTITION ($partition_name)`.

### Q4: How do the table creation statements differ between the CSV and JSON loading methods?

The table creation statements are essentially the same. The only difference is that the CSV example explicitly declares `"replication_num" = "1"`. The load difference is in the Stream Load command:

| Format | Key Header |
| --- | --- |
| CSV | `-H "column_separator:\|"` |
| JSON | `-H "format:json"` |

### Q5: How do you confirm whether a Stream Load succeeded?

Check the `Status` field in the returned JSON:

- `Status` of `Success` indicates a successful load.
- `NumberLoadedRows` should equal `NumberTotalRows`, and `NumberFilteredRows` should be `0`.

### Q6: Why does `INSERT` store my JSON text as a string?

`INSERT` converts a string to VARIANT with `CAST(string AS VARIANT)`, which keeps the string and does not parse it. Load jobs such as Stream Load parse JSON text; with `INSERT`, wrap the text in `PARSE_TO_VARIANT`:

```sql
INSERT INTO testdb.test_variant (id, actor)
VALUES (1, PARSE_TO_VARIANT('{"id": 282080, "login": "brianchandotcom"}'));
```
