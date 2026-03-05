---
{
    "title": "主键模型的 Update 更新",
    "language": "zh-CN",
    "description": "主要介绍如何使用 Update 命令来更新 Doris 中的数据。Update 命令仅适用于 Unique 数据模型的表。"
}
---

主要介绍如何使用 Update 命令来更新 Doris 中的数据。Update 命令仅适用于 Unique 数据模型的表。

## 适用场景

- 小范围数据更新：适用于更新少量数据的场景，例如修复某些记录中的错误字段，或更新某些字段的状态（如订单状态更新等）。

- ETL 批量加工部分字段：适用于大批量更新某个字段，常见于 ETL 加工场景。注意：大范围数据更新仅适合低频调用。

## 基本原理

利用查询引擎自身的 where 过滤逻辑，从待更新表中筛选出需要被更新的行。再利用 Unique 模型自带的 Value 列新数据替换旧数据的逻辑，将待更新的行变更后，再重新插入到表中，从而实现行级别更新。

### 同步

Update 语法在 Doris 中是一个同步语法，即 Update 语句执行成功，更新操作也就完成了，数据是可见的。

### 性能

Update 语句的性能和待更新的行数以及查询条件的检索效率密切相关。

- 待更新的行数：待更新的行数越多，Update 语句的速度就会越慢。对于小范围更新，Doris 支持的频率与`INSERT INTO`语句类似，对于大范围更新，由于单个 update 执行的时间较长，仅适用于低频调用。

- 查询条件的检索效率：Update 实现原理是先将满足查询条件的行做读取处理，所以如果查询条件的检索效率高，则 Update 的速度也会快。条件列最好能命中索引或者分区分桶裁剪，这样 Doris 就不需要全表扫描，可以快速定位到需要更新的行，从而提升更新效率。强烈不推荐条件列中包含 value 列。

## 使用示例

假设在金融风控场景中，存在如下结构的交易明细表：

```sql
CREATE TABLE transaction_details (
    transaction_id BIGINT NOT NULL,        -- 唯一交易编号
    user_id BIGINT NOT NULL,               -- 用户编号
    transaction_date DATE NOT NULL,        -- 交易日期
    transaction_time DATETIME NOT NULL,    -- 交易时间
    transaction_amount DECIMAL(18, 2),     -- 交易金额
    transaction_device STRING,             -- 交易设备
    transaction_region STRING,             -- 交易地区
    average_daily_amount DECIMAL(18, 2),   -- 最近 3 个月日均交易金额
    recent_transaction_count INT,          -- 最近 7 天交易次数
    has_dispute_history BOOLEAN,           -- 是否有拒付记录
    risk_level STRING                      -- 风险等级
)
UNIQUE KEY(transaction_id)
DISTRIBUTED BY HASH(transaction_id) BUCKETS 16
PROPERTIES (
    "replication_num" = "3",               -- 副本数量，默认 3
    "enable_unique_key_merge_on_write" = "true"  -- 启用 MOW 模式，支持合并更新
);
```

存在如下交易数据：

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

按照如下风控规则来更新每日所有交易记录的风险等级：
1. 有拒付记录，风险为 high。
2. 在高风险地区，风险为 high。
3. 交易金额异常（超过日均 5 倍），风险为 high。
4. 最近 7 天交易频繁：
  a. 交易次数 > 50，风险为 high。
  b. 交易次数在 20-50 之间，风险为 medium。
5. 非工作时间交易（凌晨 2 点到 4 点），风险为 medium。
6. 默认风险为 low。

```sql
UPDATE transaction_details
SET risk_level = CASE
    -- 有拒付记录或在高风险地区的交易
    WHEN has_dispute_history = TRUE THEN 'high'
    WHEN transaction_region IN ('high_risk_region1', 'high_risk_region2') THEN 'high'

    -- 突然异常交易金额
    WHEN transaction_amount > 5 * average_daily_amount THEN 'high'

    -- 最近 7 天交易频率很高
    WHEN recent_transaction_count > 50 THEN 'high'
    WHEN recent_transaction_count BETWEEN 20 AND 50 THEN 'medium'

    -- 非工作时间交易
    WHEN HOUR(transaction_time) BETWEEN 2 AND 4 THEN 'medium'

    -- 默认风险
    ELSE 'low'
END
WHERE transaction_date = '2024-11-24';
```

更新之后的数据为

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

关于数据更新使用的更多详细语法，请参阅 [UPDATE](../../sql-manual/sql-statements/data-modification/DML/UPDATE) 命令手册，也可以在 MySQL 客户端命令行下输入 `HELP UPDATE` 获取更多帮助信息。