---
{
    "title": "LEAD",
    "language": "zh-CN"
}
---

<!--  Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements.  See the NOTICE file distributed with this work for additional information regarding copyright ownership.  The ASF licenses this file to you under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the License for the specific language governing permissions and limitations under the License. -->

## 描述

LEAD() 是一个窗口函数，用于访问当前行之后的行数据，而无需进行自连接。它可以获取分区内当前行之后第 N 行的值。

## 语法

```sql
LEAD ( <expr> [ , <offset> [ , <default> ] ] )
```

## 参数
| 参数                | 说明                                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| expr                | 需要获取值的表达式                                                                                                |
| offset              | 可选。向后偏移的行数。默认值为 1。|
| default             | 可选。当偏移超出窗口范围时返回的默认值。默认为 NULL                                                               |

## 返回值

返回与输入表达式相同的数据类型。

## 举例

计算每个销售员当前销售额与下一天销售额的差值：

```sql
select stock_symbol, closing_date, closing_price,    
case   
(lead(closing_price,1, 0)   
over (partition by stock_symbol order by closing_date)-closing_price) > 0   
when true then "higher"   
when false then "flat or lower"    
end as "trending"   
from stock_ticker    
order by closing_date;
```

```text
+--------------+---------------------+---------------+---------------+
| stock_symbol | closing_date        | closing_price | trending      |
| ------------ | ------------------- | ------------- | ------------- |
| JDR          | 2014-09-13 00:00:00 | 12.86         | higher        |
| JDR          | 2014-09-14 00:00:00 | 12.89         | higher        |
| JDR          | 2014-09-15 00:00:00 | 12.94         | flat or lower |
| JDR          | 2014-09-16 00:00:00 | 12.55         | higher        |
| JDR          | 2014-09-17 00:00:00 | 14.03         | higher        |
| JDR          | 2014-09-18 00:00:00 | 14.75         | flat or lower |
| JDR          | 2014-09-19 00:00:00 | 13.98         | flat or lower |
+--------------+---------------------+---------------+---------------+
```