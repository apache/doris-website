---
{
    "title": "Updating Data with the UPDATE Command",
    "language": "en",
    "description": "Use the UPDATE command on Doris Unique Key Model tables to modify data, supporting small-scale row-level updates and field-level ETL batch updates."
}
---

<!-- Knowledge type: How-to guide -->
<!-- Applicable scenarios: Row-level data correction / Field batch update / ETL processing -->

This document describes how to use the `UPDATE` command in Apache Doris to modify data in tables that use the Unique Key Model, including applicable scenarios, how it works, performance factors, and a complete usage example.

The `UPDATE` command applies only to tables that use the Unique Key Model.

## Applicable Scenarios

The `UPDATE` command is recommended for the following two typical scenarios:

| Scenario | Description | Example |
| --- | --- | --- |
| Small-scale data update | Correct incorrect fields in a small number of records, or update the status of specific fields | Correct order status, fix incorrect data in individual fields |
| Field-level ETL batch processing | Apply a large-scale update to a particular field, common in ETL scenarios | Batch recompute risk levels, batch refresh tag fields |

:::caution Note
Large-scale data updates should be infrequent operations. Avoid triggering them at high frequency.
:::

## How It Works

<!-- Knowledge type: Concept -->

The core execution flow of `UPDATE` is as follows:

1. The query engine filters the rows that need to be updated based on the `WHERE` condition.
2. Based on the Unique Key Model's Value column overwrite logic, the new data replaces the old data.
3. The modified rows are written back to the table, achieving row-level updates.

### Synchronicity

The Doris `UPDATE` statement is executed synchronously: as soon as the `UPDATE` statement returns successfully, the update operation is complete and the data is immediately visible.

### Performance

The performance of an `UPDATE` statement is determined mainly by two factors:

| Factor | Description | Optimization Suggestion |
| --- | --- | --- |
| Number of rows to update | The more rows, the slower the execution | Small-scale updates can be used at the same frequency as `INSERT INTO`; large-scale updates are suitable only for low-frequency calls |
| Efficiency of the query condition | `UPDATE` first reads the rows that match the condition | The condition columns should hit an index or partition/bucket pruning to avoid full table scans |

:::tip Tip
It is strongly recommended not to include Value columns in the `WHERE` condition, to ensure that the query condition can efficiently leverage the primary key or indexes.
:::

## Usage Example

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Financial risk control / Batch update of risk levels -->

The following example uses a financial risk control scenario to demonstrate how to use `UPDATE` to batch-update the risk levels of transaction records.

### Step 1: Create the Table

Create a transaction details table `transaction_details` that uses the Unique Key Model with Merge-on-Write enabled:

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
    "replication_num" = "3",                       -- Number of replicas, default is 3
    "enable_unique_key_merge_on_write" = "true"    -- Enable MOW mode to support merge updates
);
```

### Step 2: View the Initial Data

Suppose the table already contains the following transaction data, with the `risk_level` field not yet assigned:

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

### Step 3: Define the Risk Control Rules

Apply the following priority rules to batch-tag the risk level for all transaction records of the day:

| Priority | Rule | Risk Level |
| --- | --- | --- |
| 1 | Transactions with a dispute history | high |
| 2 | Transactions from high-risk regions (such as `high_risk_region1`, `high_risk_region2`) | high |
| 3 | Transactions with abnormal amounts (more than 5 times the average daily amount) | high |
| 4 | More than 50 transactions in the last 7 days | high |
| 5 | Between 20 and 50 transactions in the last 7 days | medium |
| 6 | Transactions during off-hours (2 AM to 4 AM) | medium |
| 7 | Other default cases | low |

### Step 4: Execute UPDATE

Translate the rules above into a single `UPDATE` statement, using `CASE WHEN` to express the multi-condition logic:

```sql
UPDATE transaction_details
SET risk_level = CASE
    -- Transactions with a dispute history or from high-risk regions
    WHEN has_dispute_history = TRUE THEN 'high'
    WHEN transaction_region IN ('high_risk_region1', 'high_risk_region2') THEN 'high'

    -- Abnormal transaction amount
    WHEN transaction_amount > 5 * average_daily_amount THEN 'high'

    -- High-frequency transactions in the last 7 days
    WHEN recent_transaction_count > 50 THEN 'high'
    WHEN recent_transaction_count BETWEEN 20 AND 50 THEN 'medium'

    -- Transactions during off-hours
    WHEN HOUR(transaction_time) BETWEEN 2 AND 4 THEN 'medium'

    -- Default risk level
    ELSE 'low'
END
WHERE transaction_date = '2024-11-24';
```

### Step 5: Verify the Update Results

After execution, query the data again. The `risk_level` field has been updated according to the rules:

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

- Full syntax reference: see the [UPDATE](../../sql-manual/sql-statements/data-modification/DML/UPDATE) command manual.
- Command-line help: run `HELP UPDATE` in the MySQL client to view the inline documentation.
