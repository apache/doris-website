---
{
    "title": "Load Data Convert",
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

## Usage Scenarios

During the import process, Doris supports some transformations on the source data, including mapping, conversion, preceding filtering, and post-filtering.

- Mapping: Import column A from the source data into column B in the target table.

- Conversion: Calculate the values in the target column based on the columns in the source data using an expression. Custom functions are supported in the expression.

- Preceding Filtering: Filter rows in the source data and only import rows that meet the filtering conditions.

- Post-Filtering: Filter rows in the result and only import rows that meet the filtering conditions.

## Quick Start

### BROKER LOAD

```sql
LOAD LABEL example_db.label1
(
    DATA INFILE("bos://bucket/input/file")
    INTO TABLE `my_table`
    (k1, k2, tmpk3)
    PRECEDING FILTER k1 = 1
    SET (
        k3 = tmpk3 + 1
    )
    WHERE k1 > k2
)
WITH BROKER bos
(
    ...
);
```

### STREAM LOAD

```bash
curl
--location-trusted
-u user:passwd
-H "columns: k1, k2, tmpk3, k3 = tmpk3 + 1"
-H "where: k1 > k2"
-T file.txt
http://host:port/api/testDb/testTbl/_stream_load
```

### ROUTINE LOAD

```sql
CREATE ROUTINE LOAD example_db.label1 ON my_table
COLUMNS(k1, k2, tmpk3, k3 = tmpk3 + 1),
PRECEDING FILTER k1 = 1,
WHERE k1 > k2
...
```

## Reference Manual

### Loading Syntax

**Stream Load**

Add `columns` and `where` parameters in the HTTP header.

- `columns` specify column mapping and value transformation.

- `where` specify post-filtering.

Stream load does not support preceding filtering.

Example:

```bash
curl
--location-trusted
-u user:passwd
-H "columns: k1, k2, tmpk3, k3 = tmpk3 + 1"
-H "where: k1 > k2"
-T file.txt
http://host:port/api/testDb/testTbl/_stream_load
```

**Broker Load**

Define data transformation in the SQL statement, including:

- `(k1, k2, tmpk3)` specifies column mapping.

- `PRECEDING FILTER` specifies preceding filtering.

- `SET` specifies column transformation.

- `WHERE` specifies post-filtering.

```sql
LOAD LABEL example_db.label1
(
    DATA INFILE("bos://bucket/input/file")
    INTO TABLE `my_table`
    (k1, k2, tmpk3)
    PRECEDING FILTER k1 = 1
    SET (
        k3 = tmpk3 + 1
    )
    WHERE k1 > k2
)
WITH BROKER bos
(
    ...
);
```

**Routine Load**

Define data transformation in the SQL statement, including:

- `COLUMNS` specifies column mapping and column transformation.

- `PRECEDING FILTER` specifies preceding filtering.

- `WHERE` specifies post-filtering.

```sql
CREATE ROUTINE LOAD example_db.label1 ON my_table
COLUMNS(k1, k2, tmpk3, k3 = tmpk3 + 1),
PRECEDING FILTER k1 = 1,
WHERE k1 > k2
...
```

**Insert Into**

Insert Into can perform data transformation directly in the `SELECT` statement, and add a `WHERE` clause for data filtering.


### Column Mapping

The purpose of column mapping is to describe the information of each column in the load file, which is equivalent to defining names for the columns in the source data. By describing the column mapping relationship, we can load source files with different column orders and column numbers into Doris. Let's illustrate it through examples:

Suppose the source file has 4 columns with the following contents (the column names in the table header are for illustration purposes only and are not actually present in the file):

| Column 1 | Column 2 | Column 3   | Column 4 |
| -------- | -------- | ---------- | -------- |
| 1        | 100      | beijing    | 1.1      |
| 2        | 200      | shanghai   | 1.2      |
| 3        | 300      | guangzhou  | 1.3      |
| 4        | \N       | chongqing  | 1.4      |

:::note
Note: `\N` represents null in the source file.
:::

1. Adjusting Mapping Order

2. Suppose there are 4 columns in the table: `k1, k2, k3, k4`. The desired load mapping is as follows:

```Plain
Column 1 -> k1
Column 2 -> k3
Column 3 -> k2
Column 4 -> k4
```

3. The order of column mapping should be as follows:

```Plain
(k1, k3, k2, k4)
```

4. The number of columns in the source file is greater than the number of columns in the table.

5. Suppose there are 3 columns in the table: `k1, k2, k3`. The desired load mapping is as follows:

```Plain
Column 1 -> k1
Column 2 -> k3
Column 3 -> k2
```

6. The order of column mapping should be as follows:

```Plain
(k1, k3, k2, tmpk4)
```

7. Here, `tmpk4` is a custom column name that doesn't exist in the table. Doris will ignore this non-existing column name.

8. The number of columns in the source file is less than the number of columns in the table, and default values will be used to fill the missing columns.

9. Suppose there are 5 columns in the table: `k1, k2, k3, k4, k5`. The desired load mapping is as follows:

```Plain
Column 1 -> k1
Column 2 -> k3
Column 3 -> k2
```

10. Here, only the first 3 columns from the source file will be used. The columns `k4` and `k5` are expected to be filled with default values.

11. The order of column mapping should be as follows:

```Plain
(k1, k3, k2)
```

12. If the columns `k4` and `k5` have default values, they will be filled accordingly. Otherwise, if the columns are nullable, they will be filled with `null` values. Otherwise, the loading job will report an error.

### Pre-filtering

Pre-filtering is a process of filtering the raw data that is read. Currently, it is only supported in BROKER LOAD and ROUTINE LOAD.

Pre-filtering can be applied in the following scenarios:

1. Filtering before transformation: It allows filtering of data before performing column mapping and transformation. This way, unnecessary data can be filtered out in advance.

2. Filtering columns that do not exist in the table: It can be used as a filtering identifier when certain columns are not present in the table.

3. Handling data from multiple tables: For example, if the source data contains data from multiple tables (or data from multiple tables is written to the same Kafka message queue), each row may include a column name that identifies which table the data belongs to. Users can use pre-filtering conditions to select and load the corresponding table data.

### Column Transformation

Column transformation enables users to modify the values of columns in the source files. Currently, Doris supports the use of built-in functions and user-defined functions for transformation.

:::note
Note: User-defined functions belong to a specific database, and when using custom functions for transformation, users need to have read permissions on that database.
:::

Transformation operations are typically defined in conjunction with column mapping. In the following example, we illustrate the process:

Assume that the source file has 4 columns with the following content (the column names in the header are for descriptive purposes only and are not actually present in the file):

| Column 1 | Column 2 | Column 3    | Column 4 |
| -------- | -------- | ----------- | -------- |
| 1        | 100      | beijing     | 1.1      |
| 2        | 200      | shanghai    | 1.2      |
| 3        | 300      | guangzhou   | 1.3      |
| \N       | 400      | chongqing   | 1.4      |

1. Load the transformed column values into the table from the source file.

2. Assuming the table has 4 columns: `k1`, `k2`, `k3`, `k4`, and we want the following mapping and transformation relationships:

```Plain
Column 1       -> k1
Column 2 * 100 -> k3
Column 3       -> k2
Column 4       -> k4
```

3. The order of column mapping should be as follows:

```Plain
(k1, tmpk3, k2, k4, k3 = tmpk3 * 100)
```

4. Here, we rename the second column in the source file as `tmpk3` and specify that the value of column `k3` in the table is `tmpk3 * 100`. The final data in the table would be as follows:

| k1   | k2        | k3    | k4   |
| ---- | --------- | ----- | ---- |
| 1    | beijing   | 10000 | 1.1  |
| 2    | shanghai  | 20000 | 1.2  |
| 3    | guangzhou | 30000 | 1.3  |
| null | chongqing | 40000 | 1.4  |

5. Perform conditional column transformation using the `case when` function.

6. Assuming the table has 4 columns: `k1`, `k2`, `k3`, `k4`, and we want to transform the values `beijing`, `shanghai`, `guangzhou`, `chongqing` in the source data to their corresponding region IDs before loading:

```Plain
Column 1                 -> k1
Column 2                 -> k2
Column 3 with region ID  -> k3
Column 4                 -> k4
```

7. The order of column mapping should be as follows:

```Plain
(k1, k2, tmpk3, k4, k3 = case tmpk3 when "beijing" then 1 when "shanghai" then 2 when "guangzhou" then 3 when "chongqing" then 4 else null end)
```

8. The final data in the table would be as follows:

| k1   | k2   | k3   | k4   |
| ---- | ---- | ---- | ---- |
| 1    | 100  | 1    | 1.1  |
| 2    | 200  | 2    | 1.2  |
| 3    | 300  | 3    | 1.3  |
| null | 400  | 4    | 1.4  |

9. Transform null values in the source file to 0 during load. Also, perform the region ID transformation as shown in example 2.

10. Assuming the table has `k1, k2, k3, k4` as its four columns. While performing the region ID conversion, we also want to convert null values in the k1 column of the source data to 0 during load:

```Plain
If Column 1 is null, then convert it to 0 -> k1
Column 2                                  -> k2
Column 3                                  -> k3
Column 4                                  -> k4
```

11. The order of column mapping should be as follows:

```Plain
(tmpk1, k2, tmpk3, k4, k1 = ifnull(tmpk1, 0), k3 = case tmpk3 when "beijing" then 1 when "shanghai" then 2 when "guangzhou" then 3 when "chongqing" then 4 else null end)
```

12. The final data in the table would be as follows:

| k1   | k2   | k3   | k4   |
| ---- | ---- | ---- | ---- |
| 1    | 100  | 1    | 1.1  |
| 2    | 200  | 2    | 1.2  |
| 3    | 300  | 3    | 1.3  |
| 0    | 400  | 4    | 1.4  |

### Post-Filtering

After column mapping and transformation, we can filter out data that we don't want to load into Doris using filtering conditions. Let's illustrate this with an example:

Assume that the source file has 4 columns with the following content (the column names in the table header are for descriptive purposes only and are not actually present):

| Column 1 | Column 2 | Column 3   | Column 4 |
| -------- | -------- | ---------- | -------- |
| 1        | 100      | beijing    | 1.1      |
| 2        | 200      | shanghai   | 1.2      |
| 3        | 300      | guangzhou  | 1.3      |
| null     | 400      | chongqing  | 1.4      |

1. Filtering with default column mapping and transformation.

2. Suppose the table has 4 columns: `k1, k2, k3, k4`. We can define filtering conditions directly without column mapping and transformation. For example, if we only want to load data rows from the source file where the value in the 4th column is greater than 1.2, the filtering condition would be:

```sql
where k4 > 1.2
```

3. The final data in the table would be as follows:

| k1   | k2   | k3        | k4   |
| ---- | ---- | --------- | ---- |
| 3    | 300  | guangzhou | 1.3  |
| null | 400  | chongqing | 1.4  |

4. In the default case, Doris performs column mapping in sequential order, so the 4th column in the source file is automatically mapped to the `k4` column in the table.

5. Filtering transformed data.

6. Suppose the table has 4 columns: `k1, k2, k3, k4`. In the column transformation example, we converted province names to IDs. Now, let's say we want to filter out data with an ID of 3. The transformation and filtering conditions would be as follows:

```Plain
(k1, k2, tmpk3, k4, k3 = case tmpk3 when "beijing" then 1 when "shanghai" then 2 when "guangzhou" then 3 when "chongqing" then 4 else null end)
where k3 != 3
```

7. The final data in the table would be as follows:

| k1   | k2   | k3   | k4   |
| ---- | ---- | ---- | ---- |
| 1    | 100  | 1    | 1.1  |
| 2    | 200  | 2    | 1.2  |
| null | 400  | 4    | 1.4  |

8. Here, we can observe that the column values used for filtering are the final transformed column values, not the original data.

9. Filtering with multiple conditions.

10. Suppose the table has 4 columns: `k1, k2, k3, k4`. We want to filter out data where the `k1` column is null and the `k4` column is less than 1.2. The filtering condition would be:

```Plain
where k1 is not null and k4 >= 1.2
```

11. The final data in the table would be as follows:

| k1   | k2   | k3   | k4   |
| ---- | ---- | ---- | ---- |
| 2    | 200  | 2    | 1.2  |
| 3    | 300  | 3    | 1.3  |

## Best Practices

### Data Quality Issues and Filtering Threshold

The rows of data processed in the load job can be classified into the following three categories:

- Filtered Rows: Data rows that are filtered out due to data quality issues. Data quality issues can include type errors, precision errors, strings exceeding length limits, mismatched file column counts, and data rows filtered out due to missing corresponding partitions.

- Unselected Rows: These are data rows filtered out due to `preceding filter` or `where` column filtering conditions.

- Loaded Rows: Data rows that are successfully loaded.

Doris's load task allows users to set a maximum error rate (`max_filter_ratio`). If the error rate of the loaded data is below the threshold, the error rows will be ignored, and the other correct data will be loaded.

The error rate is calculated as follows:

```Plain
#Filtered Rows / (#Filtered Rows + #Loaded Rows)
```

This means that `Unselected Rows` are not included in the error rate calculation.