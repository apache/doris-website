---
{
    "title": "使用 UPDATE 命令更新数据",
    "language": "zh-CN",
    "description": "在 Doris 主键模型表中使用 UPDATE 命令修改数据，支持小规模行级更新与字段级 ETL 批量更新。"
}
---

<!-- 知识类型: 操作指南 -->
<!-- 适用场景: 行级数据修正 / 字段批量更新 / ETL 处理 -->

本文介绍如何在 Apache Doris 中使用 `UPDATE` 命令修改主键模型（Unique Key Model）表中的数据，包括适用场景、工作原理、性能影响因素及完整使用示例。

`UPDATE` 命令仅适用于主键模型（Unique Key Model）表。

## 适用场景

在以下两类典型场景中，推荐使用 `UPDATE` 命令完成数据修改：

| 场景 | 描述 | 示例 |
| --- | --- | --- |
| 小规模数据更新 | 修正少量记录中的错误字段，或更新特定字段状态 | 修正订单状态、修复个别字段错误数据 |
| 字段级 ETL 批量处理 | 对某个字段进行大规模更新，常见于 ETL 场景 | 批量重算风险等级、批量刷新标签字段 |

:::caution 注意
大规模数据更新应是不频繁的操作，避免高频触发。
:::

## 工作原理

<!-- 知识类型: 概念说明 -->

`UPDATE` 的核心执行流程如下：

1. 查询引擎根据 `WHERE` 条件，过滤出需要更新的行。
2. 基于主键模型的 Value 列覆盖逻辑，用新数据替换旧数据。
3. 修改后的行重新写入表中，从而实现行级更新。

### 同步性

Doris 的 `UPDATE` 语法是同步执行的：一旦 `UPDATE` 语句成功返回，更新操作即已完成，数据立即可见。

### 性能

`UPDATE` 语句的性能主要由两方面因素决定：

| 影响因素 | 说明 | 优化建议 |
| --- | --- | --- |
| 需要更新的行数 | 行数越多，执行越慢 | 小规模更新可与 `INSERT INTO` 同等频率使用；大规模更新仅适用于低频调用 |
| 查询条件的效率 | `UPDATE` 会先读取满足条件的行 | 条件列应命中索引或分区/分桶裁剪，避免全表扫描 |

:::tip 提示
强烈建议不要在 `WHERE` 条件中包含 Value 列，以确保查询条件能够高效利用主键或索引。
:::

## 使用示例

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 金融风控 / 风险等级批量更新 -->

下面以金融风控场景为例，演示如何使用 `UPDATE` 批量更新交易记录的风险等级。

### 第 1 步：建表

创建一张交易明细表 `transaction_details`，使用 Unique Key 模型并启用 Merge-on-Write：

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
    "replication_num" = "3",                       -- 副本数，默认为 3
    "enable_unique_key_merge_on_write" = "true"    -- 启用 MOW 模式，支持合并更新
);
```

### 第 2 步：查看初始数据

假设表中已有以下交易数据，`risk_level` 字段尚未赋值：

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

### 第 3 步：定义风控规则

按照以下优先级规则，对当日所有交易记录批量打风险等级标签：

| 优先级 | 规则 | 风险等级 |
| --- | --- | --- |
| 1 | 存在争议历史的交易 | high |
| 2 | 来自高风险地区（如 `high_risk_region1`、`high_risk_region2`）的交易 | high |
| 3 | 异常金额（超过日均金额 5 倍）的交易 | high |
| 4 | 最近 7 天交易次数 > 50 次 | high |
| 5 | 最近 7 天交易次数在 20 到 50 次之间 | medium |
| 6 | 非工作时间（凌晨 2 点到 4 点）的交易 | medium |
| 7 | 其他默认情况 | low |

### 第 4 步：执行 UPDATE

将上述规则转换为一条 `UPDATE` 语句，使用 `CASE WHEN` 实现多条件判断：

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

### 第 5 步：验证更新结果

执行完成后，再次查询数据，可看到 `risk_level` 已按照规则被更新：

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

- 完整语法参考：[UPDATE](../../sql-manual/sql-statements/data-modification/DML/UPDATE) 命令手册。
- 命令行帮助：在 MySQL 客户端执行 `HELP UPDATE` 查看在线说明。
