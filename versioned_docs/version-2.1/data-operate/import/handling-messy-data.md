---
{
    "title": "Handling Data Issues",
    "language": "en-US",
    "description": "When loading data, sometimes the types of data in the source and target columns don't match. The system tries to fix these mismatches,"
}
---

When loading data, sometimes the types of data in the source and target columns don't match. The system tries to fix these mismatches, but problems like wrong types, too long fields, or wrong precision can cause errors.

To deal with these problems, Doris has two key settings:

- Strict Mode (strict_mode): Decide if rows with errors should be removed.
- Max Filter Ratio (max_filter_ratio): Sets the highest allowed percentage of data that can be removed during loading.

This makes it easier to handle data loading problems and keeps data management strong and simple.

## Strict Mode

Strict mode serves two primary purposes:
1. Filtering out data rows where column type conversion fails during load
2. Restricting updates to existing columns only in partial column update scenarios

### Filtering Strategy for Column Type Conversion Failures

The system employs different strategies based on the strict mode setting:

- When strict mode is OFF: Fields that fail conversion are set to NULL, and rows containing these NULL values are loaded along with the correct data rows.

- When strict mode is ON: The system filters out rows with conversion failures and only loads correct data rows. Here, "conversion failure" specifically refers to cases where the original data is non-NULL but becomes NULL after column type conversion. Note that NULL values resulting from function calculations are not included in this type of conversion.

- Handling NULL values: Both correct and abnormal data rows may contain NULL values. If the target column is defined as NOT NULL, all rows containing NULL values will be filtered out.

**1. Example with TinyInt column type:**

| Original Data Type | Original Data Example | Value After TinyInt Conversion | Strict Mode | Result |
| ----------------- | -------------------- | ----------------------------- | ----------- | ------ |
| NULL              | \N                   | NULL                          | ON/OFF      | NULL   |
| Non-NULL          | "abc" or 2000       | NULL                          | ON          | Invalid (Filtered) |
| Non-NULL          | "abc"               | NULL                          | OFF         | NULL    |
| Non-NULL          | 1                   | 1                             | ON/OFF      | Loaded Successfully |

:::tip
1. The column in the table allows NULL values

2. Both `abc` and `2000` become NULL after conversion to TinyInt due to type or precision issues. When strict mode is ON, such data will be filtered out. When OFF, NULL will be loaded.
:::

**2. Example with Decimal(1,0) type:**

| Original Data Type | Original Data Example | Value After Decimal Conversion | Strict Mode | Result |
| ----------------- | -------------------- | ---------------------------- | ----------- | ------ |
| NULL              | \N                   | NULL                         | ON/OFF      | NULL   |
| Non-NULL          | aaa                 | NULL                         | ON          | Invalid (Filtered) |
| Non-NULL          | aaa                 | NULL                         | OFF         | NULL    |
| Non-NULL          | 1 or 10             | 1 or 10                      | ON/OFF      | Loaded Successfully |

:::tip
1. The column in the table allows NULL values

2. `abc` becomes NULL after conversion to Decimal due to type issues. When strict mode is ON, such data will be filtered out. When OFF, NULL will be loaded.

3. Although `10` exceeds the range, since its type meets decimal requirements, strict mode does not affect it.
:::

### Restricting Partial Column Updates to Existing Columns Only

In strict mode, each row in a partial column update must have its Key already exist in the table. In non-strict mode, partial column updates can both update existing rows (where Key exists) and insert new rows (where Key doesn't exist).

For example, given a table structure as follows:
```sql
CREATE TABLE user_profile
(
    id               INT,
    name             VARCHAR(10),
    age              INT,
    city             VARCHAR(10),
    balance          DECIMAL(9, 0),
    last_access_time DATETIME
) ENGINE=OLAP
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "enable_unique_key_merge_on_write" = "true"
);
```

The table contains one record as follows:
```sql
mysql> select * from user_profile;
+------+-------+------+----------+---------+---------------------+
| id   | name  | age  | city     | balance | last_access_time   |
+------+-------+------+----------+---------+---------------------+
|    1 | kevin |   18 | shenzhen |     400 | 2023-07-01 12:00:00|
+------+-------+------+----------+---------+---------------------+
```

When using Insert Into with strict mode to perform partial column updates, the insertion will fail because the second and third rows with keys `(3)` and `(18)` do not exist in the original table:
```sql
SET enable_unique_key_partial_update=true;
SET enable_insert_strict = true;
INSERT INTO user_profile (id, balance, last_access_time) VALUES
(1, 500, '2023-07-03 12:00:01'),
(3, 23, '2023-07-03 12:00:02'),
(18, 9999999, '2023-07-03 12:00:03');
ERROR 1105 (HY000): errCode = 2, detailMessage = Insert has filtered data in strict mode
```

When using Insert Into with non-strict mode to perform partial column updates:
```sql
SET enable_unique_key_partial_update=true;
SET enable_insert_strict = false;
INSERT INTO user_profile (id, balance, last_access_time) VALUES 
(1, 500, '2023-07-03 12:00:01'),
(3, 23, '2023-07-03 12:00:02'),
(18, 9999999, '2023-07-03 12:00:03');
```

The existing record will be updated, and two new records will be inserted. For columns not specified in the insert statement, if a default value is defined, it will be used; if the column allows NULL values, NULL will be used; otherwise, the insertion will fail.

The query result is as follows:
```sql
mysql> select * from user_profile;
+------+-------+------+----------+---------+---------------------+
| id   | name  | age  | city     | balance | last_access_time    |
+------+-------+------+----------+---------+---------------------+
|    1 | kevin |   18 | shenzhen |     500 | 2023-07-03 12:00:01 |
|    3 | NULL  | NULL | NULL     |      23 | 2023-07-03 12:00:02 |
|   18 | NULL  | NULL | NULL     | 9999999 | 2023-07-03 12:00:03 |
+------+-------+------+----------+---------+---------------------+
```

### Enable Strict Mode

Strict mode (strict_mode) defaults to False. Here's how to set it for different load methods:

**Stream Load**
```shell
curl --location-trusted -u user:passwd \
-H "strict_mode: true" \
-T data.txt \
http://host:port/api/example_db/test_table/_stream_load
```

**Broker Load**
```sql
LOAD LABEL example_db.label_1
(
    DATA INFILE("s3://bucket/data.txt")
    INTO TABLE test_table
)
WITH S3 (...)
PROPERTIES
(
    "strict_mode" = "true"
);
```

**Routine Load**
```sql
CREATE ROUTINE LOAD example_db.job1 ON test_table
PROPERTIES
(
    "strict_mode" = "true"
)
FROM KAFKA (...);
```

**MySQL Load**
```sql
LOAD DATA LOCAL INFILE 'data.txt'
INTO TABLE test_table
PROPERTIES
(
    "strict_mode" = "true"
);
```

**Insert Into**
```sql
SET enable_insert_strict = true;
INSERT INTO test_table ...;
```

## Maximum Filter Ratio

Maximum Filter Ratio (max_filter_ratio) is a crucial load control parameter that defines the maximum allowable ratio of filtered data to total data during load. If the actual filter ratio is below the set maximum, the load task will continue and filtered data will be ignored; if it exceeds this ratio, the load task fails.

### Filter Ratio Calculation Method

- Filtered Rows: Data filtered out due to quality issues, including type errors, precision errors, string length exceeding limits, file column count mismatches, and rows filtered due to missing corresponding partitions.

- Unselected Rows: Data rows filtered out due to [Pre-filtering](./load-data-convert.md#pre-filtering) or [Post-filtering](./load-data-convert.md#post-filtering) conditions.

- Loaded Rows: Data rows successfully loaded.

The filter ratio is calculated as:
```Plain
#Filtered Rows / (#Filtered Rows + #Loaded Rows)
```

Note that `Unselected Rows` are not included in the filter ratio calculation.

### Configuring the Maximum Filter Ratio
The maximum filter ratio (max_filter_ratio) defaults to 0, meaning no filtered data is allowed. Here's how to set it for different load methods:

**Stream Load**
```shell
curl --location-trusted -u user:passwd \
-H "max_filter_ratio: 0.1" \
-T data.txt \
http://host:port/api/example_db/test_table/_stream_load
```

**Broker Load**
```sql
LOAD LABEL example_db.label_1
(
    DATA INFILE("s3://bucket/data.txt")
    INTO TABLE test_table
)
WITH S3 (...)
PROPERTIES
(
    "max_filter_ratio" = "0.1"
);
```

**Routine Load**
```sql
CREATE ROUTINE LOAD example_db.job1 ON test_table
PROPERTIES
(
    "max_filter_ratio" = "0.1"
)
FROM KAFKA (...);
```

**MySQL Load**
```sql
LOAD DATA LOCAL INFILE 'data.txt'
INTO TABLE test_table
PROPERTIES
(
    "max_filter_ratio" = "0.1"
);
```

**Insert Into**
```sql
SET insert_max_filter_ratio = 0.1;
INSERT INTO test_table FROM S3/HDFS/LOCAL();```

:::tip
For Insert Into statements, `insert_max_filter_ratio` only takes effect when `enable_insert_strict = false`, and only applies to `INSERT INTO FROM S3/HDFS/LOCAL()` syntax. The default value is 1.0, which means that all abnormal data are allowed to be filtered.
:::
