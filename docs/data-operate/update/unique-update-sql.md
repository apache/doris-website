---
{
    "title": "Updating Data with UPDATE Command",
    "language": "en",
    "description": "This document explains how to use the UPDATE command to modify data in Doris."
}
---

This document explains how to use the `UPDATE` command to modify data in Doris. The `UPDATE` command is only applicable to tables with a Unique data model.

## Applicable Scenarios

- Small-scale data updates: Ideal for scenarios where a small amount of data needs to be corrected, such as fixing erroneous fields in certain records or updating the status of specific fields (e.g., order status updates).

- ETL batch processing of certain fields: Suitable for large-scale updates of a specific field, commonly seen in ETL processing scenarios. Note: Large-scale data updates should be infrequent.

## How It Works

The query engine uses its own filtering logic to identify the rows that need to be updated. Then, using the Unique model's Value column logic to replace old data with new data. The rows to be updated are modified and reinserted into the table to achieve row-level updates.

### Synchronization

The `UPDATE` syntax in Doris is synchronous, meaning that once the `UPDATE` statement is successfully executed, the update operation is completed and the data is immediately visible.

### Performance

The performance of the `UPDATE` statement is closely related to the number of rows to be updated and the efficiency of the query conditions.

- Number of rows to be updated: The more rows that need to be updated, the slower the `UPDATE` statement will be. For small-scale updates, Doris supports a frequency similar to `INSERT INTO` statements. For large-scale updates, due to the long execution time, it is only suitable for infrequent calls.

- Efficiency of query conditions: The `UPDATE` implementation first reads the rows that meet the query conditions. Therefore, if the query conditions are efficient, the `UPDATE` speed will be fast. Ideally, the condition columns should hit the index or partition bucket pruning, so Doris does not need to scan the entire table and can quickly locate the rows that need to be updated, thereby improving update efficiency. It is strongly recommended not to include value columns in the condition columns. 

## Usage Example

Assume there is a transaction details table with the following structure in a financial risk control scenario:

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
  "enable_unique_key_merge_on_write" = "true"  -- Enable MOW mode, support merge updates
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

Update the risk level of all daily transaction records according to the following risk control rules:
1. Transactions with a dispute history have a risk level of high.
2. Transactions in high-risk regions have a risk level of high.
3. Transactions with abnormal amounts (exceeding 5 times the daily average) have a risk level of high.
4. Frequent transactions in the last 7 days:
  a. Transactions > 50 times have a risk level of high.
  b. Transactions between 20 and 50 times have a risk level of medium.
5. Transactions during non-working hours (2 AM to 4 AM) have a risk level of medium.
6. The default risk level is low.

```sql
UPDATE transaction_details
SET risk_level = CASE
  -- Transactions with a dispute history or in high-risk regions
  WHEN has_dispute_history = TRUE THEN 'high'
  WHEN transaction_region IN ('high_risk_region1', 'high_risk_region2') THEN 'high'

  -- Abnormal transaction amount
  WHEN transaction_amount > 5 * average_daily_amount THEN 'high'

  -- High transaction frequency in the last 7 days
  WHEN recent_transaction_count > 50 THEN 'high'
  WHEN recent_transaction_count BETWEEN 20 AND 50 THEN 'medium'

  -- Transactions during non-working hours
  WHEN HOUR(transaction_time) BETWEEN 2 AND 4 THEN 'medium'

  -- Default risk level
  ELSE 'low'
END
WHERE transaction_date = '2024-11-24';
```

The updated data is as follows:

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

## More Help

For more detailed syntax on data updates, please refer to the [UPDATE](../../sql-manual/sql-statements/data-modification/DML/UPDATE) command manual. You can also enter `HELP UPDATE` in the MySQL client command line for more help.

