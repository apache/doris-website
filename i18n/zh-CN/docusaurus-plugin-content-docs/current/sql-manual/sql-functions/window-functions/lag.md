---
{
    "title": "LAG",
    "language": "zh-CN"
}
---

<!--  Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements.  See the NOTICE file distributed with this work for additional information regarding copyright ownership.  The ASF licenses this file to you under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the License for the specific language governing permissions and limitations under the License. -->

## 描述

LAG() 是一个窗口函数，用于访问当前行之前的行数据，而无需进行自连接。它可以获取分区内当前行之前第 N 行的值。

## 语法

```sql
LAG ( <expr> [, <offset> [, <default> ] ] )
```

## 参数
| 参数                | 说明                                                                   |
| ------------------- | ---------------------------------------------------------------------- |
| expr                | 需要获取值的表达式                                                     |
| offset              | 可选。向前偏移的行数。默认值为 1。|
| default             | 可选。当偏移超出窗口范围时返回的默认值。默认为 NULL                    |

## 返回值

返回与输入表达式相同的数据类型。

## 举例

计算每个销售员当前销售额与前一天销售额的差值：

```sql
select stock_symbol, closing_date, closing_price,    
lag(closing_price,1, 0) over (partition by stock_symbol order by closing_date) as "yesterday closing"   
from stock_ticker   
order by closing_date;
```

```text
+--------------+---------------------+---------------+-------------------+
| stock_symbol | closing_date        | closing_price | yesterday closing |
| ------------ | ------------------- | ------------- | ----------------- |
| JDR          | 2014-09-13 00:00:00 | 12.86         | 0                 |
| JDR          | 2014-09-14 00:00:00 | 12.89         | 12.86             |
| JDR          | 2014-09-15 00:00:00 | 12.94         | 12.89             |
| JDR          | 2014-09-16 00:00:00 | 12.55         | 12.94             |
| JDR          | 2014-09-17 00:00:00 | 14.03         | 12.55             |
| JDR          | 2014-09-18 00:00:00 | 14.75         | 14.03             |
| JDR          | 2014-09-19 00:00:00 | 13.98         | 14.75             |
+--------------+---------------------+---------------+-------------------+
```