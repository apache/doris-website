---
{
    "title": "Common Table Creation Issues",
    "language": "en",
    "description": "Apache Doris table creation troubleshooting guide: cause analysis and solutions for syntax errors, Failed to create partition timeouts, Too many open files, commands hanging without response, and other scenarios.",
    "keywords": [
        "Doris table creation failure",
        "Failed to create partition",
        "Too many open files",
        "tablet_create_timeout_second",
        "table creation timeout",
        "table creation syntax error"
    ]
}
---

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Table creation failure troubleshooting / Timeout tuning -->

This article is organized by typical scenarios users may encounter during table creation, providing cause analysis and solutions.

## Scenario 1: Syntax Errors in the CREATE TABLE Statement

When syntax errors occur in a long CREATE TABLE statement, the error messages may be incomplete. Common causes are as follows:

| Cause | Investigation and Correction Suggestions |
| --- | --- |
| Syntax structure error | Carefully read `HELP CREATE TABLE;` and check the relevant syntax structure against it |
| Use of reserved words | When a custom name conflicts with a reserved word, enclose it in backticks `` ` ``. It is recommended that all custom names be enclosed in backticks |
| Chinese characters or full-width characters | Non-utf-8 encoded Chinese characters, or hidden full-width characters (such as full-width spaces or full-width punctuation), can cause syntax errors. Use a text editor with a "show invisible characters" feature for inspection |

## Scenario 2: Table Creation Reports `Failed to create partition [xxx]. Timeout`

Doris creates tables one Partition at a time. When a Partition fails to be created, the error above is reported.

Even if the CREATE TABLE statement does not explicitly define a Partition, Doris creates an immutable default Partition for the table. Therefore, when problems occur during table creation, `Failed to create partition` is also reported.

This error is usually caused by problems encountered by the BE when creating data shards (Tablets).

### Investigation Steps

1. **Locate the failed Backend and Tablet**

    Search `fe.log` for the `Failed to create partition` log at the corresponding time point. The log contains a series of number pairs similar to `{10001-10010}`:

    - The first number (`10001`): Backend ID
    - The second number (`10010`): Tablet ID

    The example above indicates that creating Tablet ID `10010` failed on the Backend with ID `10001`.

2. **Check the BE log to locate the error message**

    Go to the `be.INFO` log of the corresponding Backend and search for logs related to the Tablet ID within the corresponding time period to find the specific error message.

3. **Handle the issue according to common errors**

### Common Causes of Tablet Creation Failure

| Error Symptom | Possible Cause | Suggested Action |
| --- | --- | --- |
| The BE did not receive the related task (no Tablet ID-related logs can be found in `be.INFO`), or the BE created the Tablet successfully but failed to report | Connectivity issues exist between FE and BE | Refer to [Installation and Deployment](../../install/deploy-manually/integrated-storage-compute-deploy-manually) to check network connectivity between FE and BE |
| Memory pre-allocation failed | The byte length of a single row in the table exceeds 100 KB | Adjust the table schema to reduce the length of single-row data |
| `Too many open files` | The number of open file handles exceeds the Linux system limit | Modify the file handle limit of the Linux system |

### Adjust the Table Creation Timeout

If data shard creation only times out, you can extend the timeout through the following two parameters in `fe.conf`:

| Parameter | Default Value | Description |
| --- | --- | --- |
| `tablet_create_timeout_second` | 1 second | Timeout for creating a single Tablet |
| `max_create_table_timeout_second` | 60 seconds | Maximum timeout for the entire table creation operation |

The overall timeout is calculated as follows:

```text
min(tablet_create_timeout_second * replication_num, max_create_table_timeout_second)
```

For detailed parameter descriptions, refer to [FE Configuration](../../admin-manual/config/fe-config).

## Scenario 3: The CREATE TABLE Command Does Not Return for a Long Time

The Doris CREATE TABLE command is synchronous. Its timeout is currently set in a relatively simple way:

```text
timeout = tablet num * replication num (seconds)
```

The corresponding symptoms and recommendations are as follows:

- If many data shards are created and some of them fail, the error may be returned only after a long timeout.
- Under normal conditions, the CREATE TABLE statement returns within a few seconds or tens of seconds.
- If it does not return after one minute, cancel the operation directly and check the FE or BE logs for related errors.

## Further Help

For more detailed information about data partitioning, refer to the following:

- See the [CREATE TABLE](../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE) command manual
