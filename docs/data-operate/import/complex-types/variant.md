---
{
    "title": "VARIANT",
    "language": "en",
    "description": "How do you load CSV and JSON data into a Doris VARIANT column? Provides the full steps for table creation, Stream Load commands, and type inference verification.",
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
| Choose between the default mode, Sparse, DOC mode, or Schema Template | [VARIANT Usage and Configuration Guide](../../../sql-manual/basic-element/sql-data-types/semi-structured/variant-workload-guide) |
| Look up VARIANT query syntax, indexes, limitations, or configuration reference | [VARIANT](../../../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT) |

## Limitations

- Currently, only **CSV** and **JSON** data formats are supported for loading into a `VARIANT` column.

## Storage format recommendation (V3)

<!-- Knowledge type: Architecture selection decision -->

For newly created `VARIANT` tables, especially for wide JSON scenarios, use **Storage Format V3** directly unless you have a clear reason to use another format. For the design rationale, see [Storage Format V3](../../../table-design/storage-format).

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

``` sql
mysql> desc github_events;
+------------------------------------------------------------+------------+------+-------+---------+-------+
| Field                                                      | Type       | Null | Key   | Default | Extra |
+------------------------------------------------------------+------------+------+-------+---------+-------+
| id                                                         | BIGINT     | No   | true  | NULL    |       |
| type                                                       | VARCHAR(*) | Yes  | false | NULL    | NONE  |
| actor                                                      | VARIANT    | Yes  | false | NULL    | NONE  |
| created_at                                                 | DATETIME   | Yes  | false | NULL    | NONE  |
| payload                                                    | VARIANT    | Yes  | false | NULL    | NONE  |
| public                                                     | BOOLEAN    | Yes  | false | NULL    | NONE  |
+------------------------------------------------------------+------------+------+-------+---------+-------+
6 rows in set (0.07 sec)
```

After enabling `describe_extend_variant_column`, you can view the subcolumn types inferred from the VARIANT column:

``` sql
mysql> set describe_extend_variant_column = true;
Query OK, 0 rows affected (0.01 sec)

mysql> desc github_events;
+------------------------------------------------------------+------------+------+-------+---------+-------+
| Field                                                      | Type       | Null | Key   | Default | Extra |
+------------------------------------------------------------+------------+------+-------+---------+-------+
| id                                                         | BIGINT     | No   | true  | NULL    |       |
| type                                                       | VARCHAR(*) | Yes  | false | NULL    | NONE  |
| actor                                                      | VARIANT    | Yes  | false | NULL    | NONE  |
| actor.avatar_url                                           | TEXT       | Yes  | false | NULL    | NONE  |
| actor.display_login                                        | TEXT       | Yes  | false | NULL    | NONE  |
| actor.id                                                   | INT        | Yes  | false | NULL    | NONE  |
| actor.login                                                | TEXT       | Yes  | false | NULL    | NONE  |
| actor.url                                                  | TEXT       | Yes  | false | NULL    | NONE  |
| created_at                                                 | DATETIME   | Yes  | false | NULL    | NONE  |
| payload                                                    | VARIANT    | Yes  | false | NULL    | NONE  |
| payload.action                                             | TEXT       | Yes  | false | NULL    | NONE  |
| payload.before                                             | TEXT       | Yes  | false | NULL    | NONE  |
| payload.comment.author_association                         | TEXT       | Yes  | false | NULL    | NONE  |
| payload.comment.body                                       | TEXT       | Yes  | false | NULL    | NONE  |
....
+------------------------------------------------------------+------------+------+-------+---------+-------+
406 rows in set (0.07 sec)
```

You can also display the inference results per partition:

``` sql
DESCRIBE ${table_name} PARTITION ($partition_name);
```

## FAQ

### Q1: Which data formats does VARIANT support for loading?

Currently, loading into a `VARIANT` column is only supported for **CSV** and **JSON** formats. Other formats must be converted before loading.

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
| CSV | `-H "column_separator:|"` |
| JSON | `-H "format:json"` |

### Q5: How do you confirm whether a Stream Load succeeded?

Check the `Status` field in the returned JSON:

- `Status` of `Success` indicates a successful load.
- `NumberLoadedRows` should equal `NumberTotalRows`, and `NumberFilteredRows` should be `0`.
