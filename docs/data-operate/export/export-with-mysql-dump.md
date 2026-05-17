---
{
    "title": "MySQL Dump",
    "language": "en",
    "description": "Use the mysqldump tool to export table schemas and data from Apache Doris. Suitable for development, testing, and small-scale migration scenarios.",
    "keywords": [
        "mysqldump",
        "Doris export",
        "schema export",
        "data export",
        "no-tablespaces",
        "source import"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Development and testing / Small-scale export and import / Schema backup -->

`mysqldump` is the official logical export tool provided by MySQL. Starting from **version 0.15**, Apache Doris is compatible with `mysqldump`. You can use it to export table schemas (DDL) or data (DML), and then re-import them into Doris with the `source` command.

### Applicable Scenarios

| Scenario | Recommended | Notes |
| --- | --- | --- |
| Data migration in development and testing environments | Recommended | Simple to operate, the tool is widely available |
| Schema backup and migration | Recommended | Use `--no-data` to export only DDL |
| Small-scale data export | Recommended | Several MB to hundreds of MB |
| Large-scale data export in production environments | **Not recommended** | Performance and stability are limited. Use `EXPORT` or `OUTFILE` instead |

## Prerequisites

- Doris version >= 0.15
- `mysqldump` is installed in the client environment
- You have read permission on the target databases and tables (the default FE MySQL protocol port is `9030`)

## Usage Examples

### Export Data or Schema

The following examples all connect to the FE at `127.0.0.1:9030` using the `root` account, and must include the `--no-tablespaces` parameter (see "Notes" below for the reason).

1. **Export the schema and data of a specified table**

    ```shell
    mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces \
        --databases test --tables table1
    ```

2. **Export only the schema of a specified table (without data)**

    ```shell
    mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces \
        --databases test --tables table1 --no-data
    ```

3. **Export all tables under multiple databases**

    ```shell
    mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces \
        --databases test1 test2
    ```

4. **Export all databases and all tables**

    ```shell
    mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces \
        --all-databases
    ```

For more parameters, refer to the [official MySQL mysqldump manual](https://dev.mysql.com/doc/refman/8.0/en/mysqldump.html).

### Import the Exported Result into Doris

The output of `mysqldump` can be redirected to a `.sql` file, and then imported via the `source` command in the Doris client:

```shell
# 1. Export to a file
mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces \
    --databases test --tables table1 > table1.sql

# 2. Log in to Doris and run source to import
mysql -h127.0.0.1 -P9030 -uroot
```

```sql
source table1.sql;
```

## Notes

1. **The `--no-tablespaces` parameter is required**: Doris does not support the MySQL tablespace concept. Without this parameter, the export will fail.
2. **Only suitable for development, testing, or small-scale scenarios**: `mysqldump` is a single-threaded logical export tool. Its performance and stability are not ideal for large data volumes. **Do not use it for large-scale data in production environments.** For data export in production environments, use one of the following approaches:
    - [`EXPORT` statement](../../sql-manual/sql-statements/data-modification/load-and-export/EXPORT.md): asynchronously export to object storage or HDFS
    - [`SELECT INTO OUTFILE`](../../sql-manual/sql-statements/data-modification/load-and-export/OUTFILE.md): synchronously export query results to a file
