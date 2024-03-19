---
{
    "title": "主键模型的 Update 更新",
    "language": "zh-CN"
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

主要讲述如何使用 Update 命令来更新 Doris 中的数据。Update 命令只能在 Unique 数据模型的表中执行。

## 适用场景

- 对满足某些条件的行，修改其取值

- 这个适合少量数据，不频繁的更新

## 基本原理

利用查询引擎自身的 where 过滤逻辑，从待更新表中筛选出需要被更新的行。再利用 Unique 模型自带的 Value 列新数据替换旧数据的逻辑，将待更新的行变更后，再重新插入到表中，从而实现行级别更新。

### 同步

Update 语法在 Doris 中是一个同步语法，即 Update 语句执行成功，更新操作也就完成了，数据是可见的。

### 性能

Update 语句的性能和待更新的行数以及 condition 的检索效率密切相关。

- 待更新的行数：待更新的行数越多，Update 语句的速度就会越慢。Update 更新比较合适偶发更新的场景，比如修改个别行的值。Update 并不适合大批量的修改数据。

- condition 的检索效率：Update 实现原理是先将满足 condition 的行做读取处理，所以如果 condition 的检索效率高，则 Update 的速度也会快。condition 列最好能命中索引或者分区分桶裁剪，这样 Doris 就不需要扫全表，可以快速定位到需要更新的行，从而提升更新效率。强烈不推荐 condition 列中包含 value 列。

## 使用示例

假设 Doris 中存在一张订单表，其中订单 id 是 Key 列，订单状态，订单金额是 Value 列。数据状态如下：

| 订单 id | 订单金额 | 订单状态 |
| ------ | -------- | -------- |
| 1      | 100      | 待付款   |

```SQL
+----------+--------------+--------------+
| order_id | order_amount | order_status |
+----------+--------------+--------------+
| 1        |          100 | 待付款       |
+----------+--------------+--------------+
1 row in set (0.01 sec)
```

这时候，用户点击付款后，Doris 系统需要将订单 id 为 '1' 的订单状态变更为 '待发货'，就需要用到 Update 功能。

```SQL
mysql> UPDATE test_order SET order_status = '待发货' WHERE order_id = 1;
Query OK, 1 row affected (0.11 sec)
{'label':'update_20ae22daf0354fe0-b5aceeaaddc666c5', 'status':'VISIBLE', 'txnId':'33', 'queryId':'20ae22daf0354fe0-b5aceeaaddc666c5'}
```

更新后结果如下

```SQL
+----------+--------------+--------------+
| order_id | order_amount | order_status |
+----------+--------------+--------------+
| 1        |          100 | 待发货       |
+----------+--------------+--------------+
1 row in set (0.01 sec)
```

## 更多帮助

关于数据更新使用的更多详细语法，请参阅 [update](../../sql-manual/sql-reference/Data-Manipulation-Statements/Manipulation/UPDATE) 命令手册，也可以在 MySQL 客户端命令行下输入 `HELP UPDATE` 获取更多帮助信息。