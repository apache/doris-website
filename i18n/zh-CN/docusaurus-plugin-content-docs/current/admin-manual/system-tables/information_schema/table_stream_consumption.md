---
{
    "title": "table_stream_consumption",
    "language": "zh-CN",
    "description": "记录每个 Table Stream 在基表各分区上的消费位点、积压和最近消费时间"
}
---

## 概述

记录每个 Table Stream 在基表各分区上的消费位点、积压和最近消费时间。每行对应一个 Stream 的一个消费单元（基表分区）。使用方法见 [Table Stream 进阶](../../../data-operate/incremental/table-stream-advanced#分区级消费位点)。

## 所属数据库

`information_schema`

## 表信息

| 列名 | 类型 | 说明 |
| :--- | :--- | :--- |
| DB_NAME | varchar(64) | Stream 所在的数据库 |
| STREAM_NAME | varchar(64) | Stream 名称 |
| STREAM_ID | bigint | Stream ID |
| UNIT | varchar(64) | 消费单元，即基表分区名。未显式分区的表只有一个与表同名的分区 |
| CONSUMPTION_STATUS | varchar(64) | 该分区已消费到的提交时间戳（TSO）；`N/A` 表示该分区尚未消费过 |
| LAG | varchar(64) | 该分区最新提交的 TSO 与已消费 TSO 的差值，`0` 表示没有积压；`N/A` 表示分区有数据但尚未消费过。TSO 的低 18 位为逻辑计数，`LAG` 除以 262144 约等于积压的毫秒数 |
| LAST_CONSUMPTION_TIME | bigint | 最近一次消费该分区的时间（毫秒时间戳），`-1` 表示尚未消费过 |

## 示例

```sql
SELECT UNIT, CONSUMPTION_STATUS, LAG, LAST_CONSUMPTION_TIME
FROM information_schema.table_stream_consumption
WHERE DB_NAME = 'demo' AND STREAM_NAME = 'orders_stream'
ORDER BY UNIT;
```

```text
+-----------+--------------------+-----------+-----------------------+
| UNIT      | CONSUMPTION_STATUS | LAG       | LAST_CONSUMPTION_TIME |
+-----------+--------------------+-----------+-----------------------+
| p20260913 | 469041123123200000 | 0         |         1789267206000 |
| p20260914 | 469067681628160003 | 262144000 |         1789351206000 |
| p20260915 | N/A                | 0         |                    -1 |
+-----------+--------------------+-----------+-----------------------+
```
