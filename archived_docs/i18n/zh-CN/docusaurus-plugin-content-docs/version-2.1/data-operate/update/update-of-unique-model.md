---
{
    "title": "主键模型的导入更新",
    "language": "zh-CN",
    "description": "这篇文档主要介绍 Doris 主键模型基于导入的更新。"
}
---

这篇文档主要介绍 Doris 主键模型基于导入的更新。

## 整行更新

使用 Doris 支持的 Stream Load、Broker Load、Routine Load、Insert Into 等导入方式，向主键模型（Unique 模型）导入数据时，如果没有相应主键的数据行，则插入新数据；如果有相应主键的数据行，则进行更新。也就是说，Doris 主键模型的导入是一种“upsert”模式。基于导入，对已有记录的更新，默认和导入一个新记录是完全一样的，因此可以参考数据导入的文档部分。

## 部分列更新

部分列更新是指直接更新表中某些字段值，而不是全部字段值。可以使用 Update 语句进行更新，这种 Update 语句通常先读取整行数据，然后更新部分字段值，再写回。这种读写事务非常耗时，不适合大批量数据写入。Doris 在主键模型的导入更新中，提供了直接插入或更新部分列数据的功能，不需要先读取整行数据，从而大幅提升更新效率。

:::caution 注意

1. 2.0 版本仅在 Unique Key 的 Merge-on-Write 实现中支持部分列更新能力。
2. 从 2.0.2 版本开始，支持使用 INSERT INTO 进行部分列更新。
3. 不支持在有同步物化视图的表上进行部分列更新。
4. 不支持在进行 Schema Change 的表上进行部分列更新。
:::

### 适用场景

- 实时动态列更新，需要在表中实时高频更新某些字段值。例如用户标签表中有一些关于用户最新行为信息的字段需要实时更新，以便广告/推荐系统能够据此进行实时分析和决策。
- 将多张源表拼接成一张大宽表。
- 数据修正。

### 使用示例

假设 Doris 中存在一张订单表 order_tbl，其中订单 id 是 Key 列，订单状态和订单金额是 Value 列。数据状态如下：

| 订单 id | 订单金额 | 订单状态 |
| ------ | -------- | -------- |
| 1      | 100      | 待付款   |

```sql
+----------+--------------+--------------+
| order_id | order_amount | order_status |
+----------+--------------+--------------+
| 1        |          100 | 待付款        |
+----------+--------------+--------------+
1 row in set (0.01 sec)
```

此时，用户点击付款后，Doris 系统需要将订单 id 为 '1' 的订单状态变更为 '待发货'。

#### 可以使用以下导入方式进行部分列更新

**StreamLoad/BrokerLoad/RoutineLoad**

准备如下 csv 文件：

```
1,待发货
```

在导入时添加如下 header：

```sql
partial_columns:true
```

同时在 `columns` 中指定要导入的列（必须包含所有 key 列，否则无法更新）。下面是一个 Stream Load 的例子：

```sql
curl --location-trusted -u root: -H "partial_columns:true" -H "column_separator:," -H "columns:order_id,order_status" -T /tmp/update.csv http://127.0.0.1:8030/api/db1/order_tbl/_stream_load
```

**INSERT INTO**

在所有数据模型中，`INSERT INTO` 给定部分列时默认行为是整行写入。为了防止误用，在 Merge-on-Write 实现中，`INSERT INTO` 默认仍然保持整行 UPSERT 的语义。如果需要开启部分列更新的语义，需要设置如下 session variable：

```sql
SET enable_unique_key_partial_update=true;
INSERT INTO order_tbl (order_id, order_status) VALUES (1, '待发货');
```

需要注意的是，控制 insert 语句是否开启严格模式的会话变量 `enable_insert_strict` 的默认值为 true，即 insert 语句默认开启严格模式。在严格模式下进行部分列更新不允许更新不存在的 key。所以，在使用 insert 语句进行部分列更新时，如果希望能插入不存在的 key，需要在 `enable_unique_key_partial_update` 设置为 true 的基础上，同时将 `enable_insert_strict` 设置为 false。

**Flink Connector**

如果使用 Flink Connector，需要添加如下配置：

```sql
'sink.properties.partial_columns' = 'true',
```

同时在 `sink.properties.column` 中指定要导入的列（必须包含所有 key 列，否则无法更新）。

#### 更新结果

更新后结果如下：

```sql
+----------+--------------+--------------+
| order_id | order_amount | order_status |
+----------+--------------+--------------+
| 1        |          100 | 待发货        |
+----------+--------------+--------------+
1 row in set (0.01 sec)
```

### 使用注意

由于 Merge-on-Write 实现需要在数据写入时进行整行数据的补齐，以保证最优的查询性能，因此使用 Merge-on-Write 实现进行部分列更新会导致部分导入性能下降。

写入性能优化建议：

- 使用配备 NVMe 的 SSD，或者极速 SSD 云盘。因为补齐数据时会大量读取历史数据，产生较高的读 IOPS 以及读吞吐。
- 开启行存能够大大减少补齐数据时产生的 IOPS，导入性能提升明显。用户可以在建表时通过如下 property 来开启行存：

```Plain
"store_row_column" = "true"
```

目前，同一批次数据写入任务（无论是导入任务还是 `INSERT INTO`）的所有行只能更新相同的列。如果需要更新不同列的数据，则需要分不同批次进行写入。

在未来版本中，将支持灵活的列更新，用户可以在同一批导入中，每一行更新不同的列。
