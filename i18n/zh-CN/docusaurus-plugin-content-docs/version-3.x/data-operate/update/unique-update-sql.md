---
{
    "title": "使用 UPDATE 命令更新数据",
    "language": "zh-CN",
    "description": "这篇文档介绍如何在 Doris 中使用 UPDATE 命令修改数据。"
}
---

这篇文档介绍如何在 Doris 中使用 `UPDATE` 命令修改数据。`UPDATE` 命令仅适用于主键模型（Unique Key Model）表。

## 适用场景

- 小规模数据更新：适用于需要修正少量数据的场景，例如修正某些记录中的错误字段，或更新特定字段的状态（如订单状态更新）。

- 某些字段的 ETL 批量处理：适用于对某个字段进行大规模更新的场景，常见于 ETL 处理场景。注意：大规模数据更新应该是不频繁的。

## 工作原理

查询引擎使用自身的过滤逻辑来识别需要更新的行。然后，使用主键模型的 Value 列逻辑，用新数据替换旧数据。需要更新的行被修改后重新插入到表中，以实现行级更新。

### 同步性

Doris 中的 `UPDATE` 语法是同步的，这意味着一旦 `UPDATE` 语句成功执行，更新操作就已完成，数据立即可见。

### 性能

`UPDATE` 语句的性能与需要更新的行数和查询条件的效率密切相关。

- 需要更新的行数：需要更新的行数越多，`UPDATE` 语句的执行速度就越慢。对于小规模更新，Doris 支持与 `INSERT INTO` 语句相似的频率。对于大规模更新，由于执行时间较长，仅适用于不频繁的调用。

- 查询条件的效率：`UPDATE` 实现首先读取满足查询条件的行。因此，如果查询条件高效，`UPDATE` 速度就会快。理想情况下，条件列应该命中索引或分区桶裁剪，这样 Doris 就不需要扫描整个表，可以快速定位需要更新的行，从而提高更新效率。强烈建议不要在条件列中包含值列。

## 使用示例

假设在金融风控场景中存在一张交易明细表，结构如下：

```sql
CREATE TABLE transaction_details (
  transaction_id BIGINT NOT NULL,        -- 唯一交易 ID
  user_id BIGINT NOT NULL,               -- 用户 ID
  transaction_date DATE NOT NULL,        -- 交易日期
  transaction_time DATETIME NOT NULL,    -- 交易时间
  transaction_amount DECIMAL(18, 2),     -- 交易金额
  transaction_device STRING,             -- 交易设备
  transaction_region STRING,             -- 交易地区
  average_daily_amount DECIMAL(18, 2),   -- 最近 3 个月的平均日交易金额
  recent_transaction_count INT,          -- 最近 7 天的交易次数
  has_dispute_history BOOLEAN,           -- 是否有争议历史
  risk_level STRING                      -- 风险等级
)
UNIQUE KEY(transaction_id)
DISTRIBUTED BY HASH(transaction_id) BUCKETS 16
PROPERTIES (
  "replication_num" = "3",               -- 副本数，默认为 3
  "enable_unique_key_merge_on_write" = "true"  -- 启用 MOW 模式，支持合并更新
);
```

存在以下交易数据：

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

根据以下风控规则更新所有当日交易记录的风险等级：
1. 有争议历史的交易风险等级为 high。
2. 高风险地区的交易风险等级为 high。
3. 异常金额（超过日均金额 5 倍）的交易风险等级为 high。
4. 最近 7 天频繁交易：
   a. 交易次数 > 50 次的交易风险等级为 high。
   b. 交易次数在 20 到 50 次之间的交易风险等级为 medium。
5. 非工作时间（凌晨 2 点到 4 点）的交易风险等级为 medium。
6. 默认风险等级为 low。

```sql
UPDATE transaction_details
SET risk_level = CASE
  -- 有争议历史或高风险地区的交易
  WHEN has_dispute_history = TRUE THEN 'high'
  WHEN transaction_region IN ('high_risk_region1', 'high_risk_region2') THEN 'high'

  -- 异常交易金额
  WHEN transaction_amount > 5 * average_daily_amount THEN 'high'

  -- 最近 7 天高频交易
  WHEN recent_transaction_count > 50 THEN 'high'
  WHEN recent_transaction_count BETWEEN 20 AND 50 THEN 'medium'

  -- 非工作时间交易
  WHEN HOUR(transaction_time) BETWEEN 2 AND 4 THEN 'medium'

  -- 默认风险等级
  ELSE 'low'
END
WHERE transaction_date = '2024-11-24';
```

更新后的数据如下：

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

## 更多帮助

有关数据更新的更详细语法，请参考 [UPDATE](../../sql-manual/sql-statements/data-modification/DML/UPDATE) 命令手册。您也可以在 MySQL 客户端命令行中输入 `HELP UPDATE` 获取更多帮助。

