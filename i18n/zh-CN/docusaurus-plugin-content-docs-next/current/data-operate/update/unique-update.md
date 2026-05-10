---
{
    "title": "主键模型的 Update 更新",
    "language": "zh-CN",
    "description": "如何在 Apache Doris 主键模型（Unique Key）中使用 UPDATE 语句进行行级数据更新，包含适用场景、原理与实战示例。"
}
---

<!-- 知识类型: 操作指南 -->
<!-- 适用场景: 数据修正 / ETL 字段批量加工 / 业务状态变更 -->

在数据写入 Doris 之后，业务上经常会遇到需要修改已有数据的场景：订单状态发生变更、ETL 任务需要回填某些字段、或者发现部分历史记录存在错误需要修复。针对这类需求，Doris 在主键模型（Unique Key）上提供了标准的 `UPDATE` 语句，支持基于条件的行级数据更新。

本文介绍 `UPDATE` 命令在 Doris 中的适用场景、基本原理与典型用法。需要注意的是：**`UPDATE` 命令仅适用于 Unique 数据模型的表**。

## 适用场景

`UPDATE` 命令主要面向以下两类典型场景：

| 场景类型     | 说明                                                                  | 频率建议         |
| ------------ | --------------------------------------------------------------------- | ---------------- |
| 小范围更新   | 修复少量记录中的错误字段，或更新少量记录的状态（如订单状态变更等）    | 频率与 INSERT 相近 |
| ETL 批量加工 | 大批量更新某个字段，常见于 ETL 加工场景中对部分列的回填或重算         | 仅适合低频调用   |

## 基本原理

<!-- 知识类型: 原理说明 -->

`UPDATE` 命令的执行流程如下：

1. 利用查询引擎自身的 `WHERE` 过滤逻辑，从待更新表中筛选出需要被更新的行。
2. 在内存中对这些行的目标列进行变更。
3. 利用 Unique 模型「Value 列新数据替换旧数据」的机制，将变更后的行重新插入到表中，从而实现行级别更新。

### 同步执行

`UPDATE` 在 Doris 中是**同步语法**：当 `UPDATE` 语句执行成功返回时，更新操作即已完成，新数据立即可见。

### 性能特征

`UPDATE` 语句的性能主要取决于两个因素：

- **待更新的行数**：待更新的行数越多，`UPDATE` 语句的执行速度越慢。
    - 小范围更新：Doris 支持的频率与 `INSERT INTO` 类似。
    - 大范围更新：单条 `UPDATE` 执行时间较长，仅适用于低频调用。

- **查询条件的检索效率**：`UPDATE` 的实现原理是先读取满足查询条件的行，因此查询条件检索效率越高，`UPDATE` 速度越快。
    - 推荐：条件列尽量命中索引或能用于分区分桶裁剪，避免全表扫描。
    - **强烈不推荐**：在条件列中包含 Value 列。

## 使用示例

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 金融风控 / 字段批量加工 -->

下面以金融风控场景为例，演示如何使用 `UPDATE` 命令对交易明细表进行风险等级的批量回填。

### 1. 建表

创建一张交易明细表，使用 Unique Key 模型，并启用 MOW（Merge-on-Write）模式：

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
    "replication_num" = "3",                     -- 副本数量，默认 3
    "enable_unique_key_merge_on_write" = "true"  -- 启用 MOW 模式，支持合并更新
);
```

### 2. 初始数据

表中已有以下交易数据，`risk_level` 字段尚未填充：

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

### 3. 风控规则

按照如下风控规则更新当日所有交易记录的风险等级：

| 序号 | 规则                                | 风险等级 |
| ---- | ----------------------------------- | -------- |
| 1    | 有拒付记录                          | high     |
| 2    | 在高风险地区                        | high     |
| 3    | 交易金额异常（超过日均 5 倍）       | high     |
| 4    | 最近 7 天交易次数 > 50              | high     |
| 5    | 最近 7 天交易次数在 20 ~ 50 之间    | medium   |
| 6    | 非工作时间交易（凌晨 2 点到 4 点）  | medium   |
| 7    | 其他（默认）                        | low      |

### 4. 执行 UPDATE

使用 `CASE WHEN` 表达式将上述规则一次性应用到当日所有记录：

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

### 5. 更新结果

`UPDATE` 执行成功后，查询表中的数据可以看到 `risk_level` 字段已经按照规则被填充：

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

关于 `UPDATE` 命令的完整语法说明，请参阅 [UPDATE](../../sql-manual/sql-statements/data-modification/DML/UPDATE) 命令手册，也可以在 MySQL 客户端命令行下输入 `HELP UPDATE` 获取更多帮助信息。
