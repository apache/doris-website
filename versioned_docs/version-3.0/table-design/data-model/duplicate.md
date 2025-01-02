---
{
    "title": "明细模型",
    "language": "zh-CN"
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

In Doris, the **Detail Model** is the default table model, and it can be used to store every individual raw data record. The `Duplicate Key` specified during table creation determines the columns by which the data is sorted and stored, which can be used to optimize common queries. It is generally recommended to choose no more than three columns as the sort key. For more specific selection guidelines, refer to [Sort Key](../index/prefix-index). The Detail Model has the following characteristics:

* **Preserving Raw Data**: The Detail Model retains all original data, making it suitable for storing and querying raw data. For use cases that require detailed data analysis later on, it is recommended to use the Detail Model to avoid the risk of data loss.

* **No Deduplication or Aggregation**: Unlike the Aggregate and Primary Key models, the Detail Model does not perform deduplication or aggregation. Every data insertion, even if two records are identical, will be fully retained.

* **Flexible Data Querying**: The Detail Model retains the complete original data, which allows detailed extraction from the full data set. This enables aggregation operations across any dimension on the full dataset, allowing for metadata auditing and fine-grained analysis.

## Use Cases

In the Detail Model, data is generally only appended, and old data is not updated. The Detail Model is typically used in scenarios where full raw data is required:

* **Log Storage**: Used for storing various types of application logs, such as access logs, error logs, etc. Each piece of data needs to be detailed for future auditing and analysis.

* **User Behavior Data**: When analyzing user behavior, such as click data or user access paths, it is necessary to retain detailed user actions. This helps in building user profiles and conducting detailed analysis of behavior patterns.

* **Transaction Data**: For storing transaction or order data, once a transaction is completed, there is typically no need for data changes...


## Table Creation Instructions

When creating a table, the **DUPLICATE KEY** keyword can be used to specify the Detail Model. The Detail table must specify the Key columns, which are used to sort the data during storage. In the following example, the Detail table stores log information and sorts the data based on the `log_time`, `log_type`, and `error_code` columns:


![columnar_storage](/images/table-desigin/columnar-storage.png)

```sql
CREATE TABLE IF NOT EXISTS example_tbl_duplicate
(
    log_time        DATETIME       NOT NULL,
    log_type        INT            NOT NULL,
    error_code      INT,
    error_msg       VARCHAR(1024),
    op_id           BIGINT,
    op_time         DATETIME
)
DUPLICATE KEY(log_time, log_type, error_code)
DISTRIBUTED BY HASH(log_type) BUCKETS 10;
```

## Data Insertion and Storage

In a Detail table, data is not deduplicated or aggregated; inserting data directly stores it. The Key columns in the Detail Model are used for sorting.

![columnar_storage](/images/table-desigin/duplicate-table-insert.png)

In the example above, there are initially 4 rows of data in the table. After inserting 2 rows, the data is appended (APPEND) to the table, resulting in a total of 6 rows stored in the Detail table.

```sql
-- 4 rows raw data
INSERT INTO example_tbl_duplicate VALUES
('2024-11-01 00:00:00', 2, 2, 'timeout', 12, '2024-11-01 01:00:00'),
('2024-11-02 00:00:00', 1, 2, 'success', 13, '2024-11-02 01:00:00'),
('2024-11-03 00:00:00', 2, 2, 'unknown', 13, '2024-11-03 01:00:00'),
('2024-11-04 00:00:00', 2, 2, 'unknown', 12, '2024-11-04 01:00:00');

-- insert into 2 rows
INSERT INTO example_tbl_duplicate VALUES
('2024-11-01 00:00:00', 2, 2, 'timeout', 12, '2024-11-01 01:00:00'),
('2024-11-01 00:00:00', 2, 2, 'unknown', 13, '2024-11-01 01:00:00');

-- check the rows of table
SELECT * FROM example_tbl_duplicate;
+---------------------+----------+------------+-----------+-------+---------------------+
| log_time            | log_type | error_code | error_msg | op_id | op_time             |
+---------------------+----------+------------+-----------+-------+---------------------+
| 2024-11-02 00:00:00 |        1 |          2 | success   |    13 | 2024-11-02 01:00:00 |
| 2024-11-01 00:00:00 |        2 |          2 | timeout   |    12 | 2024-11-01 01:00:00 |
| 2024-11-03 00:00:00 |        2 |          2 | unknown   |    13 | 2024-11-03 01:00:00 |
| 2024-11-04 00:00:00 |        2 |          2 | unknown   |    12 | 2024-11-04 01:00:00 |
| 2024-11-01 00:00:00 |        2 |          2 | unknown   |    13 | 2024-11-01 01:00:00 |
| 2024-11-01 00:00:00 |        2 |          2 | timeout   |    12 | 2024-11-01 01:00:00 |
+---------------------+----------+------------+-----------+-------+---------------------+
```

