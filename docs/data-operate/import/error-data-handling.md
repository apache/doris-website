---
{
    "title": "Error Data Handling",
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

During the import process, the data types of the original columns may not be completely consistent with the target columns. The import process will convert the values of the original columns with inconsistent data types. During the conversion process, failures such as field type mismatch, field overflow, and precision mismatch may occur.

Strict mode (strict_mode) is used to control whether to filter out these conversion failure error rows during the import process.

The maximum error rate (max_filter_ratio) is used to control the maximum proportion of filtered error rows that can be tolerated.

## Strict Mode

Strict mode has two purposes: filtering out error rows with failed column type conversions during the import process, and limiting partial column updates to only update existing columns.

### Filtering of Failed Column Type Conversions

The filtering strategy of strict mode is as follows:

- When strict mode is disabled, the failed converted error fields will be converted to NULL values, and these error rows containing NULL values will be imported together with the correct data rows.

- When strict mode is enabled, the failed error rows with conversion failures will be filtered out, and only the correct data rows will be imported. Here, the error rows refer to the rows where the original data is not NULL, but the result after column type conversion is NULL. The term "column type conversion" does not include NULL values calculated by functions.

- Both correct data rows and error data rows may contain NULL values. If the target column does not allow NULL values, these data rows containing NULL values will also be filtered out.

For columns with range restrictions in the import, if the original data can be successfully converted by the type conversion but fails the range restriction, strict mode does not have any impact on it. For example, if the type is `decimal(1,0)` and the original data is 10, it can be converted by the type conversion but is not within the range declared by the column. Strict mode does not have any impact on this kind of data.

**1. Example with column type TinyInt:**

| Original Data Type | Original Data Example | Value after Conversion to TinyInt | Strict Mode | Result           |
| ------------------ | -------------------- | --------------------------------- | ----------- | ---------------- |
| NULL               | \N                   | NULL                              | Enabled or Disabled | NULL             |
| Non-NULL           | "abc" or 2000        | NULL                              | Enabled     | Invalid value (filtered out) |
| Non-NULL           | "abc"                | NULL                              | Disabled    | NULL             |
| Non-NULL           | 1                    | 1                                 | Enabled or Disabled | Correct import   |

:::tip
1. The columns in the table allow importing NULL values.

2. `abc` and `2000` will be converted to NULL after being converted to TinyInt due to type or precision issues. In the case of strict mode being enabled, these data will be filtered out. If it is disabled, `null` will be imported.
:::

**2. Example with column type Decimal(1,0):**

| Original Data Type | Original Data Example | Value after Conversion to Decimal | Strict Mode | Result           |
| ------------------ | -------------------- | --------------------------------- | ----------- | ---------------- |
| NULL               | \N                   | null                              | Enabled or Disabled | NULL             |
| Non-NULL           | aaa                  | NULL                              | Enabled     | Invalid value (filtered out) |
| Non-NULL           | aaa                  | NULL                              | Disabled    | NULL             |
| Non-NULL           | 1 or 10              | 1 or 10                           | Enabled or Disabled | Correct import   |

:::tip
1. The columns in the table allow importing NULL values.

2. `abc` will be converted to NULL after being converted to Decimal due to type issues. In the case of strict mode being enabled, these data will be filtered out. If it is disabled, `null` will be imported.

3. Although `10` is a value that exceeds the range, it is not affected by strict mode because its type meets the requirements of decimal. `10` will be filtered out in other import processing flows, but not by strict mode.
:::


### Limiting Partial Column Updates to Existing Columns

In strict mode, each row of data inserted through partial column updates must have a Key that already exists in the table. In non-strict mode, partial column updates can update rows with existing Keys or insert new rows with non-existing Keys.

For example, consider the following table structure:
```
mysql> desc user_profile;
+------------------+-----------------+------+-------+---------+-------+
| Field            | Type            | Null | Key   | Default | Extra |
+------------------+-----------------+------+-------+---------+-------+
| id               | INT             | Yes  | true  | NULL    |       |
| name             | VARCHAR(10)     | Yes  | false | NULL    | NONE  |
| age              | INT             | Yes  | false | NULL    | NONE  |
| city             | VARCHAR(10)     | Yes  | false | NULL    | NONE  |
| balance          | DECIMALV3(9, 0) | Yes  | false | NULL    | NONE  |
| last_access_time | DATETIME        | Yes  | false | NULL    | NONE  |
+------------------+-----------------+------+-------+---------+-------+
```

There is a data record in the table as follows:

```sql
1,"kevin",18,"shenzhen",400,"2023-07-01 12:00:00"
```

When users use non-strict mode of Stream Load for partial column updates to insert the following data into the table:

```sql
1,500,2023-07-03 12:00:01
3,23,2023-07-03 12:00:02
18,9999999,2023-07-03 12:00:03
```

```shell
curl  --location-trusted -u root -H "partial_columns:true" -H "strict_mode:false" -H "column_separator:," -H "columns:id,balance,last_access_time" -T /tmp/test.csv http://host:port/api/db1/user_profile/_stream_load
```

One existing data record in the table will be updated, and two new data records will be inserted into the table. For columns in the inserted data where the user does not specify a value, if the column has a default value, it will be filled with the default value. Otherwise, if the column allows NULL values, it will be filled with NULL. If neither of these conditions is met, the insertion will fail.

When users use strict mode of Stream Load for partial column updates to insert the above data into the table, the import will fail because strict mode is enabled and the keys (`(3)`, `(18)`) of the second and third rows are not present in the original table.

```shell
curl  --location-trusted -u root -H "partial_columns:true" -H "strict_mode:true" -H "column_separator:," -H "columns:id,balance,last_access_time" -T /tmp/test.csv http://host:port/api/db1/user_profile/_stream_load
```

### Configuration Method
By default, strict mode is set to False, which means it is disabled. The method of setting strict mode varies depending on the import method.

[STREAM LOAD](./import-way/stream-load-manual.md)

   ```shell
   curl --location-trusted -u user:passwd \
   -H "strict_mode: true" \
   -T 1.txt \
   http://host:port/api/example_db/my_table/_stream_load
   ```

[BROKER LOAD](./import-way/broker-load-manual.md)

   ```sql
   LOAD LABEL example_db.example_label_1
   (
       DATA INFILE("s3://your_bucket_name/your_file.txt")
       INTO TABLE load_test
       COLUMNS TERMINATED BY ","
   )
   WITH S3
   (
       "AWS_ENDPOINT" = "AWS_ENDPOINT",
       "AWS_ACCESS_KEY" = "AWS_ACCESS_KEY",
       "AWS_SECRET_KEY"="AWS_SECRET_KEY",
       "AWS_REGION" = "AWS_REGION"
   )
   PROPERTIES
   (
        "strict_mode" = "true"
   );
   ```
[ROUTINE LOAD](./import-way/routine-load-manual.md)

   ```sql
   CREATE ROUTINE LOAD example_db.test_job ON my_table
   PROPERTIES
   (
       "strict_mode" = "true"
   ) 
   FROM KAFKA
   (
       "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
       "kafka_topic" = "my_topic"
   );
   ```

[MySQL Load](./import-way/mysql-load-manual.md)

   ```sql
   LOAD DATA LOCAL
   INFILE 'testData'
   INTO TABLE testDb.testTbl
   PROPERTIES
   (
       "strict_mode" = "true"
   );
   ```

[INSERT INTO](./import-way/insert-into-manual.md)

   ```sql
   SET enable_insert_strict = true;
   INSERT INTO my_table ...;
   ```

## Maximum Error Rate

The import task allows users to set a maximum error rate (`max_filter_ratio`). If the error rate of the imported data is below the maximum error rate, these error rows will be ignored and the other correct data will be imported. Otherwise, the import will fail.

### Error Rate Calculation Method
The data rows processed in the import job can be divided into the following three categories:

- Filtered Rows: Data that is filtered out due to data quality issues. Data quality issues include type errors, precision errors, string length exceeding the limit, mismatched file column count, and data rows filtered out due to missing partitions.

- Unselected Rows: Data rows that are filtered out due to [pre-filtering](./load-data-convert.md) or [post-filtering](./load-data-convert.md) conditions.

- Loaded Rows: Data rows that are successfully imported.

The error rate is calculated as:

```Plain
#Filtered Rows / (#Filtered Rows + #Loaded Rows)
```

In other words, `Unselected Rows` will not be included in the error rate calculation.

### Configuration Method
The default value of `max_filter_ratio` is 0, which means that if there is any error data, the entire import task will fail.

[Stream Load](./import-way/stream-load-manual.md)

   ```shell
   curl --location-trusted -u user:passwd \
   -H "max_filter_ratio: 0.1" \
   -T 1.txt \
   http://host:port/api/example_db/my_table/_stream_load
   ```

[Broker Load](./import-way/broker-load-manual.md)

   ```sql
   LOAD LABEL example_db.example_label_1
   (
        DATA INFILE("s3://your_bucket_name/your_file.txt")
        INTO TABLE load_test
        COLUMNS TERMINATED BY ","
   )
   WITH S3
   (
        "AWS_ENDPOINT" = "AWS_ENDPOINT",
        "AWS_ACCESS_KEY" = "AWS_ACCESS_KEY",
        "AWS_SECRET_KEY"="AWS_SECRET_KEY",
        "AWS_REGION" = "AWS_REGION"
   )
   PROPERTIES
   (
        "max_filter_ratio" = "0.1"
   );
   ```
[Routine Load](./import-way/routine-load-manual.md)

   ```sql
   CREATE ROUTINE LOAD example_db.test_job ON my_table
   PROPERTIES
   (
        "max_filter_ratio" = "0.1"
   ) 
   FROM KAFKA
   (
        "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
        "kafka_topic" = "my_topic"
   );
   ```

[MySQL Load](./import-way/mysql-load-manual.md)

   ```sql
   LOAD DATA LOCAL
   INFILE 'testData'
   INTO TABLE testDb.testTbl
   PROPERTIES (
        "max_filter_ratio"="0.1"
    );
   ```

[INSERT INTO](./import-way/insert-into-manual.md)

   ```sql
   SET insert_max_filter_ratio = 0.1;
   INSERT INTO my_table FROM S3/HDFS/LOCAL();
   ```
:::tip
The `insert_max_filter_ratio` only takes effect when the value of `enable_insert_strict` is `false`, and it is used to control the maximum error rate of `INSERT INTO FROM S3/HDFS/LOCAL()`. The default value is 1.0, which means tolerating all errors.
:::
