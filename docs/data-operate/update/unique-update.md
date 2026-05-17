---
{
    "title": "UPDATE on the Unique Key Model",
    "language": "en",
    "description": "How to use the UPDATE statement for row-level data updates on the Apache Doris Unique Key model, including applicable scenarios, principles, and practical examples."
}
---

<!-- Knowledge type: How-to guide -->
<!-- Applicable scenarios: Data correction / ETL field batch processing / Business state changes -->

After data is written into Doris, the business often needs to modify existing data: order statuses change, ETL jobs need to backfill certain fields, or some historical records are found to be incorrect and need to be fixed. For these needs, Doris provides the standard `UPDATE` statement on the Unique Key model, supporting condition-based row-level data updates.

This document describes the applicable scenarios, basic principles, and typical usage of the `UPDATE` command in Doris. Note: **the `UPDATE` command applies only to tables that use the Unique data model**.

## Applicable scenarios

The `UPDATE` command primarily targets the following two typical scenarios:

| Scenario type     | Description                                                                                            | Frequency recommendation       |
| ----------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------ |
| Small-scope update | Fix wrong fields in a small number of records, or update the status of a small number of records (such as order status changes). | Frequency similar to INSERT.   |
| ETL batch processing | Bulk-update a certain field, common in ETL processing scenarios where some columns need to be backfilled or recomputed. | Suitable only for low-frequency calls. |

## Basic principles

<!-- Knowledge type: Principle explanation -->

The execution flow of the `UPDATE` command is as follows:

1. Use the query engine's own `WHERE` filtering logic to select the rows that need to be updated from the target table.
2. Modify the target columns of these rows in memory.
3. Use the Unique model's mechanism of "new data on Value columns replacing old data" to reinsert the changed rows into the table, achieving row-level updates.

### Synchronous execution

`UPDATE` is a **synchronous statement** in Doris: when the `UPDATE` statement returns successfully, the update is complete and the new data is immediately visible.

### Performance characteristics

The performance of the `UPDATE` statement mainly depends on two factors:

- **Number of rows to be updated**: the more rows to be updated, the slower the `UPDATE` statement runs.
    - Small-scope updates: Doris supports a frequency similar to `INSERT INTO`.
    - Large-scope updates: a single `UPDATE` takes a long time and is suitable only for low-frequency calls.

- **Retrieval efficiency of the query condition**: the `UPDATE` implementation first reads the rows that match the query condition, so the more efficient the query condition retrieval, the faster the `UPDATE`.
    - Recommended: have the condition columns hit indexes when possible, or be usable for partition or bucket pruning, to avoid full table scans.
    - **Strongly not recommended**: include Value columns in the condition columns.

## Usage example

<!-- Knowledge type: Operating steps -->
<!-- Applicable scenarios: Financial risk control / Field batch processing -->

The following example uses a financial risk control scenario to demonstrate how to use the `UPDATE` command to bulk-backfill risk levels in a transaction detail table.

### 1. Create the table

Create a transaction detail table that uses the Unique Key model and enables the MOW (Merge-on-Write) mode:

```sql
CREATE TABLE transaction_details (
    transaction_id BIGINT NOT NULL,        -- Unique transaction ID
    user_id BIGINT NOT NULL,               -- User ID
    transaction_date DATE NOT NULL,        -- Transaction date
    transaction_time DATETIME NOT NULL,    -- Transaction time
    transaction_amount DECIMAL(18, 2),     -- Transaction amount
    transaction_device STRING,             -- Transaction device
    transaction_region STRING,             -- Transaction region
    average_daily_amount DECIMAL(18, 2),   -- Average daily transaction amount in the last 3 months
    recent_transaction_count INT,          -- Number of transactions in the last 7 days
    has_dispute_history BOOLEAN,           -- Whether there is a chargeback record
    risk_level STRING                      -- Risk level
)
UNIQUE KEY(transaction_id)
DISTRIBUTED BY HASH(transaction_id) BUCKETS 16
PROPERTIES (
    "replication_num" = "3",                     -- Number of replicas, default 3
    "enable_unique_key_merge_on_write" = "true"  -- Enable MOW mode to support merge updates
);
```

### 2. Initial data

The table already contains the following transaction data, with the `risk_level` field not yet populated:

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

### 3. Risk control rules

Update the risk level of all transaction records of the day according to the following risk control rules:

| No. | Rule                                          | Risk level |
| --- | --------------------------------------------- | ---------- |
| 1   | Has a chargeback record                       | high       |
| 2   | In a high-risk region                         | high       |
| 3   | Abnormal transaction amount (more than 5x the daily average) | high       |
| 4   | More than 50 transactions in the last 7 days  | high       |
| 5   | 20 to 50 transactions in the last 7 days      | medium     |
| 6   | Off-hours transaction (between 2 AM and 4 AM) | medium     |
| 7   | Other (default)                               | low        |

### 4. Run UPDATE

Use a `CASE WHEN` expression to apply all the rules above to the day's records in one statement:

```sql
UPDATE transaction_details
SET risk_level = CASE
    -- Transactions with a chargeback record or in a high-risk region
    WHEN has_dispute_history = TRUE THEN 'high'
    WHEN transaction_region IN ('high_risk_region1', 'high_risk_region2') THEN 'high'

    -- Sudden abnormal transaction amount
    WHEN transaction_amount > 5 * average_daily_amount THEN 'high'

    -- Very high transaction frequency in the last 7 days
    WHEN recent_transaction_count > 50 THEN 'high'
    WHEN recent_transaction_count BETWEEN 20 AND 50 THEN 'medium'

    -- Off-hours transactions
    WHEN HOUR(transaction_time) BETWEEN 2 AND 4 THEN 'medium'

    -- Default risk
    ELSE 'low'
END
WHERE transaction_date = '2024-11-24';
```

### 5. Update result

After `UPDATE` runs successfully, querying the table shows that the `risk_level` field has been populated according to the rules:

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

## More help

For the complete syntax of the `UPDATE` command, see the [UPDATE](../../sql-manual/sql-statements/data-modification/DML/UPDATE) command manual, or run `HELP UPDATE` in the MySQL client command line for more information.
