---
{
    "title": "Updating Data with UPDATE Command",
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

The main topic is how to use the UPDATE command to update data in Doris. The UPDATE command can only be executed on tables in the Unique data model.

## Use Cases

- Modify the values of rows that meet certain conditions.

- Suitable for updating a small amount of data that is not frequently updated.

## Basic Principles

By utilizing the filtering logic of the query engine's WHERE clause, the UPDATE command selects the rows that need to be updated from the target table. Then, using the built-in logic of the Value column in the Unique model, the old data is replaced with the new data, and the updated rows are reinserted into the table, thus achieving row-level updates.

### Synchronization

The UPDATE syntax in Doris is synchronous, meaning that when an UPDATE statement is executed successfully, the update operation is completed, and the data is immediately visible.

### Performance

The performance of the UPDATE statement depends on the number of rows to be updated and the efficiency of the condition retrieval.

- Number of rows to be updated: The more rows that need to be updated, the slower the UPDATE statement will be. The UPDATE command is suitable for scenarios where occasional updates are required, such as modifying values for individual rows. It is not suitable for bulk data modifications.

- Efficiency of condition retrieval: The UPDATE operation reads the rows that satisfy the condition first. Therefore, if the condition retrieval is efficient, the UPDATE operation will be faster. It is recommended to have the condition column indexed or utilize partitioning and bucketing pruning to quickly locate the rows to be updated, thus improving the update efficiency. It is strongly advised not to include the value column in the condition column.

## Example

Assuming in a financial risk control scenario, there is a transaction details table with the following structure:

```sql
CREATE TABLE transaction_details (
  transaction_id BIGINT NOT NULL,        -- Unique transaction ID
  user_id BIGINT NOT NULL,               -- User ID
  transaction_date DATE NOT NULL,        -- Transaction date
  transaction_time DATETIME NOT NULL,    -- Transaction time
  transaction_amount DECIMAL(18, 2),     -- Transaction amount
  transaction_device STRING,             -- Transaction device
  transaction_region STRING,             -- Transaction region
  average_daily_amount DECIMAL(18, 2),   -- Average daily transaction amount over the last 3 months
  recent_transaction_count INT,          -- Number of transactions in the last 7 days
  has_dispute_history BOOLEAN,           -- Whether there is a dispute history
  risk_level STRING                      -- Risk level
)
UNIQUE KEY(transaction_id)
DISTRIBUTED BY HASH(transaction_id) BUCKETS 16
PROPERTIES (
  "replication_num" = "3",               -- Number of replicas, default is 3
  "enable_unique_key_merge_on_write" = "true"  -- Enable MOW mode, support merge update
);
```

The following transaction data exists:

```sql
+----------------+---------+------------------+---------------------+--------------------+--------------------+--------------------+----------------------+--------------------------+---------------------+------------+
| transaction_id | user_id | transaction_date | transaction_time    | transaction_amount | transaction_device | transaction_region | average_daily_amount | recent_transaction_count | has_dispute_history | risk_level |
+----------------+---------+------------------+---------------------+--------------------+--------------------+--------------------+----------------------+--------------------------+---------------------+------------+
|           1001 |    5001 | 2024-11-24       | 2024-11-24 14:30:00 |             100.00 | iPhone 12          | New York           |               100.00 |                       10 |                   0 | NULL       |
|           1002 |    5002 | 2024-11-24       | 2024-11-24 03:30:00 |             120.00 | iPhone 12          | New York           |               100.00 |                       15 |                   0 | NULL       |
|           1003 |    5003 | 2024-11-24       | 2024-11-24 10:00:00 |             150.00 | Samsung S21        | Los Angeles        |               100.00 |                       30 |                   0 | NULL       |
|           1004 |    5004 | 2024-11-24       | 2024-11-24 16:00:00 |             300.00 | MacBook Pro        | high_risk_region1  |               200.00 |                        5 |                   0 | NULL       |
|           1005 |    5005 | 2024-11-24       | 2024-11-24 11:00:00 |            1100.00 | iPad Pro           | Chicago            |               200.00 |                       10 |                   0 | NULL       |
+----------------+---------+------------------+---------------------+--------------------+--------------------+--------------------+----------------------+--------------------------+---------------------+------------+
```

Update the risk level of all transactions on a daily basis according to the following risk control rules:
1. If there is a dispute history, the risk is high.
2. If in a high-risk region, the risk is high.
3. If the transaction amount is abnormal (more than 5 times the daily average), the risk is high.
4. Frequent transactions in the last 7 days:
  a. If the number of transactions > 50, the risk is high.
  b. If the number of transactions is between 20 and 50, the risk is medium.
5. Transactions during non-working hours (2 AM to 4 AM), the risk is medium.
6. The default risk is low.

```sql
UPDATE transaction_details
SET risk_level = CASE
  -- Transactions with dispute history or in high-risk regions
  WHEN has_dispute_history = TRUE THEN 'high'
  WHEN transaction_region IN ('high_risk_region1', 'high_risk_region2') THEN 'high'

  -- Abnormal transaction amount
  WHEN transaction_amount > 5 * average_daily_amount THEN 'high'

  -- High transaction frequency in the last 7 days
  WHEN recent_transaction_count > 50 THEN 'high'
  WHEN recent_transaction_count BETWEEN 20 AND 50 THEN 'medium'

  -- Transactions during non-working hours
  WHEN HOUR(transaction_time) BETWEEN 2 AND 4 THEN 'medium'

  -- Default risk
  ELSE 'low'
END
WHERE transaction_date = '2024-11-24';
```

The updated data is:

```sql
+----------------+---------+------------------+---------------------+--------------------+--------------------+--------------------+----------------------+--------------------------+---------------------+------------+
| transaction_id | user_id | transaction_date | transaction_time    | transaction_amount | transaction_device | transaction_region | average_daily_amount | recent_transaction_count | has_dispute_history | risk_level |
+----------------+---------+------------------+---------------------+--------------------+--------------------+--------------------+----------------------+--------------------------+---------------------+------------+
|           1001 |    5001 | 2024-11-24       | 2024-11-24 14:30:00 |             100.00 | iPhone 12          | New York           |               100.00 |                       10 |                   0 | low        |
|           1002 |    5002 | 2024-11-24       | 2024-11-24 03:30:00 |             120.00 | iPhone 12          | New York           |               100.00 |                       15 |                   0 | medium     |
|           1003 |    5003 | 2024-11-24       | 2024-11-24 10:00:00 |             150.00 | Samsung S21        | Los Angeles        |               100.00 |                       30 |                   0 | medium     |
|           1004 |    5004 | 2024-11-24       | 2024-11-24 16:00:00 |             300.00 | MacBook Pro        | high_risk_region1  |               200.00 |                        5 |                   0 | high       |
|           1005 |    5005 | 2024-11-24       | 2024-11-24 11:00:00 |            1100.00 | iPad Pro           | Chicago            |               200.00 |                       10 |                   0 | high       |
+----------------+---------+------------------+---------------------+--------------------+--------------------+--------------------+----------------------+--------------------------+---------------------+------------+
```

## More Details

For more detailed syntax on data updates, please refer to the [UPDATE](../../sql-manual/sql-statements/data-modification/DML/UPDATE) command manual. You can also enter `HELP UPDATE` in the MySQL client command line for more information and assistance.