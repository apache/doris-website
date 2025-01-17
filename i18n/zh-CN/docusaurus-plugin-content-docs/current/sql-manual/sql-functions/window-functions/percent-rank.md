---
{
    "title": "WINDOW_FUNCTION_PERCENT_RANK",
    "language": "zh-CN"
}
---

<!--  Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements.  See the NOTICE file distributed with this work for additional information regarding copyright ownership.  The ASF licenses this file to you under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the License for the specific language governing permissions and limitations under the License. -->

## 描述

PERCENT_RANK() 是一个窗口函数，用于计算分区或结果集中行的相对排名，返回值范围从 0.0 到 1.0。对于给定的行，其计算公式为：(rank - 1) / (total_rows - 1)，其中 rank 是当前行的排名，total_rows 是分区中的总行数。

## 语法

```sql
PERCENT_RANK() OVER ( 
    [ PARTITION BY <expr1> ] 
    ORDER BY <expr2> [ ASC | DESC ] 
    [ <window_frame> ]
)
```

## 参数
| 参数         | 说明                                                                                   |
| ------------ | -------------------------------------------------------------------------------------- |
| expr1        | 可选。用于指定分区的表达式。例如，如果要在每个州内对农民按产量进行排名，则按州进行分区 |
| expr2        | 必需。用于指定排序的表达式。这决定了如何计算百分比排名                                 |
| window_frame | 可选。窗口框架子句，支持固定范围的窗口框架                                             |

## 返回值

返回 DOUBLE 类型的数值，范围从 0.0 到 1.0：
- 对于分区内的第一行，始终返回 0
- 对于分区内的最后一行，始终返回 1
- 对于相同的值，返回相同的百分比排名

## 举例

```sql
CREATE TABLE test_percent_rank (
    productLine VARCHAR,
    orderYear INT,
    orderValue DOUBLE,
    percentile_rank DOUBLE
) ENGINE=OLAP
DISTRIBUTED BY HASH(`orderYear`) BUCKETS 4
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```

```sql
INSERT INTO test_percent_rank (productLine, orderYear, orderValue, percentile_rank) VALUES
('Motorcycles', 2003, 2440.50, 0.00),
('Trains', 2003, 2770.95, 0.17),
('Trucks and Buses', 2003, 3284.28, 0.33),
('Vintage Cars', 2003, 4080.00, 0.50),
('Planes', 2003, 4825.44, 0.67),
('Ships', 2003, 5072.71, 0.83),
('Classic Cars', 2003, 5571.80, 1.00),
('Motorcycles', 2004, 2598.77, 0.00),
('Vintage Cars', 2004, 2819.28, 0.17),
('Planes', 2004, 2857.35, 0.33),
('Ships', 2004, 4301.15, 0.50),
('Trucks and Buses', 2004, 4615.64, 0.67),
('Trains', 2004, 4646.88, 0.83),
('Classic Cars', 2004, 8124.98, 1.00),
('Ships', 2005, 1603.20, 0.00),
('Motorcycles', 2005, 3774.00, 0.17),
('Planes', 2005, 4018.00, 0.50),
('Vintage Cars', 2005, 5346.50, 0.67),
('Classic Cars', 2005, 5971.35, 0.83),
('Trucks and Buses', 2005, 6295.03, 1.00);
```

```sql
SELECT
    productLine,
    orderYear,
    orderValue,
    ROUND(
    PERCENT_RANK()
    OVER (
        PARTITION BY orderYear
        ORDER BY orderValue
    ),2) percentile_rank
FROM
    test_percent_rank
ORDER BY
    orderYear;
```

```text
+------------------+-----------+------------+-----------------+
| productLine      | orderYear | orderValue | percentile_rank |
+------------------+-----------+------------+-----------------+
| Motorcycles      |      2003 |     2440.5 |               0 |
| Trains           |      2003 |    2770.95 |            0.17 |
| Trucks and Buses |      2003 |    3284.28 |            0.33 |
| Vintage Cars     |      2003 |       4080 |             0.5 |
| Planes           |      2003 |    4825.44 |            0.67 |
| Ships            |      2003 |    5072.71 |            0.83 |
| Classic Cars     |      2003 |     5571.8 |               1 |
| Motorcycles      |      2004 |    2598.77 |               0 |
| Vintage Cars     |      2004 |    2819.28 |            0.17 |
| Planes           |      2004 |    2857.35 |            0.33 |
| Ships            |      2004 |    4301.15 |             0.5 |
| Trucks and Buses |      2004 |    4615.64 |            0.67 |
| Trains           |      2004 |    4646.88 |            0.83 |
| Classic Cars     |      2004 |    8124.98 |               1 |
| Ships            |      2005 |     1603.2 |               0 |
| Motorcycles      |      2005 |       3774 |             0.2 |
| Planes           |      2005 |       4018 |             0.4 |
| Vintage Cars     |      2005 |     5346.5 |             0.6 |
| Classic Cars     |      2005 |    5971.35 |             0.8 |
| Trucks and Buses |      2005 |    6295.03 |               1 |
+------------------+-----------+------------+-----------------+
```