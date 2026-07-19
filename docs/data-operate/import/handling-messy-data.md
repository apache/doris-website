---
{
    "title": "Handling Messy Data",
    "language": "en",
    "description": "How to handle type conversion failures, oversized fields, and precision overflow during data import? Use strict_mode and max_filter_ratio to flexibly control dirty data.",
    "keywords": [
        "Doris messy data handling",
        "strict_mode",
        "max_filter_ratio",
        "import data type conversion failure",
        "dirty data filtering",
        "Stream Load messy data",
        "Broker Load data filtering",
        "Routine Load strict_mode",
        "Insert Into enable_insert_strict"
    ]
}
---

<!-- Knowledge type: Configuration parameters + Operational steps -->
<!-- Applicable scenarios: Data import / Dirty data governance / Troubleshooting -->

During the import process, the data types of source columns and target columns may be inconsistent. Doris converts inconsistent types during import, but the conversion process may encounter the following issues that prevent some data from being correctly loaded:

- Field type mismatch (for example, writing the string `"abc"` into a `TinyInt` column)
- Field too long (for example, writing 11 characters into a `char(10)` column)
- Precision mismatch / numeric overflow (for example, writing `10` into a `Decimal(1,0)` column)

To handle such exceptions, Doris provides two core import control parameters:

| Parameter | Function | Default value |
| --- | --- | --- |
| `strict_mode` | Controls whether to filter out data rows that fail column type conversion | `false` |
| `max_filter_ratio` | Sets the maximum tolerable ratio of abnormal data to total data | `0` |

> By combining these two parameters, you can flexibly trade off between "strictly guaranteeing data quality" and "tolerating a small amount of dirty data".

## Strict Mode (strict_mode)

<!-- Knowledge type: Configuration parameter description -->

The main function of strict mode (`strict_mode`) is to filter out data rows whose **column type conversion fails** during the import process.

### Filtering Strategy for Column Type Conversion Failures

Depending on the strict mode setting, the system applies different processing strategies:

- **Strict mode disabled**: Fields that fail conversion are set to `NULL`, and abnormal data rows containing these `NULL` values are imported together with the correct data rows.
- **Strict mode enabled**: The system filters out data rows that fail conversion and only imports correct data rows. Here, "conversion failure" specifically means: the original data is not `NULL`, but the result is `NULL` after column type conversion. Note that the column type conversion here does not include `NULL` values produced by function computation.
- **NULL value handling**: Both correct data rows and abnormal data rows may contain `NULL` values. If the target column is defined as not allowing `NULL` values, data rows containing `NULL` values are filtered out.

The following three typical column type examples illustrate the behavioral differences when strict mode is enabled versus disabled.

#### Example 1: Column Type TinyInt

| Source data type | Source data example | Value after conversion to TinyInt | Strict mode | Result |
| ------------ | ---------------- | --------------------- | ------------ | ---------------- |
| Null value | `\N` | `NULL` | Enabled or disabled | `NULL` |
| Non-null value | `"abc"` or `2000` | `NULL` | Enabled | Invalid value (filtered) |
| Non-null value | `"abc"` or `2000` | `NULL` | Disabled | `NULL` |
| Non-null value | `1` | `1` | Enabled or disabled | Imported correctly |

:::tip
1. The columns in the table allow null values to be imported.
2. After being converted to `TinyInt`, `abc` and `2000` become `NULL` due to type or precision issues. When strict mode is enabled, this kind of data is filtered out; when it is disabled, `NULL` is imported.
:::

#### Example 2: Column Type Decimal(1,0)

| Source data type | Source data example | Value after conversion to Decimal | Strict mode | Result |
| ------------ | ------------ | --------------------- | ------------ | ---------------- |
| Null value | `\N` | `NULL` | Enabled or disabled | `NULL` |
| Non-null value | `aaa` | `NULL` | Enabled | Invalid value (filtered) |
| Non-null value | `aaa` | `NULL` | Disabled | `NULL` |
| Non-null value | `10` | `NULL` (overflow) | Enabled | Filtered |
| Non-null value | `10` | `NULL` (overflow) | Disabled | `NULL` |

:::tip
1. The columns in the table allow null values to be imported.
2. After being converted to `Decimal`, `aaa` becomes `NULL` due to type issues. When strict mode is enabled, this kind of data is filtered out; when it is disabled, `NULL` is imported.
3. `10` is a value that exceeds the range of `Decimal(1, 0)` and is converted to `NULL`. When strict mode is enabled, it is filtered out; when strict mode is disabled, `NULL` is imported.
:::

#### Example 3: Column Type char(10)

| Source data type | Source data example | Value after conversion to char(10) | Strict mode | Result |
| ------------ | -------------- | ---------------------- | -------- | ------------------- |
| Null value | `\N` | `NULL` | Enabled or disabled | `NULL` |
| Non-null value | `a1234567890` | `a1234567890` | Enabled | Too long, filtered |
| Non-null value | `a1234567890` | `a1234567890` | Disabled | `a123456789` (truncated) |

:::tip
The columns in the table allow null values to be imported.
:::

### Enabling Strict Mode

`strict_mode` defaults to `false`. Examples of enabling strict mode for various import methods are as follows:

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

## Maximum Filter Ratio (max_filter_ratio)

<!-- Knowledge type: Configuration parameter description -->

The maximum filter ratio (`max_filter_ratio`) is an important import control parameter that defines the maximum tolerable ratio of abnormal data to total data during the import process:

- If the actual filter ratio is **lower than** the configured maximum filter ratio, the import job continues and the abnormal data is ignored.
- If the actual filter ratio **exceeds** the configured maximum filter ratio, the import job fails.

### How the Filter Ratio Is Calculated

During import, data rows are divided into the following three categories:

| Category | Description |
| --- | --- |
| **Filtered Rows** | Rows filtered out due to data quality issues. Data quality issues include type errors, precision errors, oversized string length, mismatched column counts in files, and other data format problems, as well as data rows filtered out because no corresponding partition exists. |
| **Unselected Rows** | Data rows filtered out by [pre-filter](./load-data-convert.md#pre-filtering) or [post-filter](./load-data-convert.md#post-filtering) conditions. |
| **Loaded Rows** | Data rows that are imported correctly. |

The filter ratio is calculated as follows:

```Plain
#Filtered Rows / (#Filtered Rows + #Loaded Rows)
```

In other words, `Unselected Rows` are not included in the filter ratio calculation.

### Setting the Maximum Filter Ratio

`max_filter_ratio` defaults to `0`, which means no abnormal data is allowed. Examples for various import methods are as follows:

**Stream Load**

```shell
curl --location-trusted -u user:passwd \
    -H "max_filter_ratio: 0.1" \
    -T data.txt \
    http://host:port/api/example_db/my_table/_stream_load
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
INSERT INTO test_table FROM S3/HDFS/LOCAL();
```

:::tip
For Insert Into statements, `insert_max_filter_ratio` only takes effect when `enable_insert_strict = false`. Its default value is `1.0`, which means all abnormal data is allowed to be filtered.
:::

## FAQ

<!-- Knowledge type: FAQ -->

**Q1: How should `strict_mode` and `max_filter_ratio` be used together?**

- If you require **strict data quality**: enable `strict_mode = true` and set `max_filter_ratio` to a small value (such as `0`). Any conversion failure causes the import to fail.
- If you want to **tolerate a small amount of dirty data**: disable `strict_mode` (or keep the default value) and set `max_filter_ratio` to an acceptable ratio (such as `0.1`). Abnormal data is filtered out without affecting the overall import.

**Q2: Are `NULL` values produced by function computation filtered by strict mode?**

No. Strict mode only targets the case where "the original data is not NULL, but the result is NULL after column type conversion". `NULL` values produced by function computation do not fall into this category.

**Q3: Are data rows filtered by pre-filter or post-filter conditions counted toward `max_filter_ratio`?**

No. `Unselected Rows` are not included in the filter ratio calculation. The filter ratio is based only on `Filtered Rows` and `Loaded Rows`.

**Q4: What is the relationship between `enable_insert_strict` and `insert_max_filter_ratio` in Insert Into?**

`insert_max_filter_ratio` only takes effect when `enable_insert_strict = false`. Its default value is `1.0`, which means all abnormal data is allowed to be filtered.

**Q5: What is the behavioral difference between strict mode and non-strict mode when a `char(10)` column encounters oversized data?**

- Strict mode enabled: oversized data is filtered out.
- Strict mode disabled: oversized data is truncated and then imported (for example, `a1234567890` is truncated to `a123456789`).
