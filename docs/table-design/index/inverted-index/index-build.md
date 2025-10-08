---
{
    "title": "Building Inverted Index",
    "language": "en"
}
---

## BUILD INDEX

The `CREATE / ADD INDEX` operation only adds the index definition. New data written after this operation will generate inverted indexes, but existing data requires using `BUILD INDEX` to trigger indexing:

```sql
-- Syntax 1, by default, builds the index for all partitions in the table
BUILD INDEX index_name ON table_name;
-- Syntax 2, you can specify partitions, one or more
BUILD INDEX index_name ON table_name PARTITIONS(partition_name1, partition_name2);
```

To check the progress of `BUILD INDEX`, use `SHOW BUILD INDEX`:

```sql
SHOW BUILD INDEX [FROM db_name];
-- Example 1, view the progress of all BUILD INDEX tasks
SHOW BUILD INDEX;
-- Example 2, view the progress of BUILD INDEX tasks for a specific table
SHOW BUILD INDEX where TableName = "table1";
```

To cancel `BUILD INDEX`, use `CANCEL BUILD INDEX`:

```sql
CANCEL BUILD INDEX ON table_name;
CANCEL BUILD INDEX ON table_name (job_id1, job_id2, ...);
```

:::tip

`BUILD INDEX` creates an asynchronous task executed by multiple threads on each BE. The number of threads can be set using the BE config `alter_index_worker_count`, with a default value of 3.

In versions before 2.0.12 and 2.1.4, `BUILD INDEX` would keep retrying until it succeeded. Starting from these versions, failure and timeout mechanisms prevent endless retries. 3.0 (Cloud Mode) does not support this command as this moment.

1. If the majority of replicas for a tablet fail to `BUILD INDEX`, the entire `BUILD INDEX` operation fails.
2. If the time exceeds `alter_table_timeout_second`, the `BUILD INDEX` operation times out.
3. Users can trigger `BUILD INDEX` multiple times; indexes that have already been built successfully will not be rebuilt.

:::
