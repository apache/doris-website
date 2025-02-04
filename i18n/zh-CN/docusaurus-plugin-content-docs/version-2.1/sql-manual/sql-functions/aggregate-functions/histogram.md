---
{
"title": "HISTOGRAM",
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


## 描述

HISTOGRAM（直方图）函数用于描述数据分布情况，它使用“等高”的分桶策略，并按照数据的值大小进行分桶，并用一些简单的数据来描述每个桶，比如落在桶里的值的个数。

## 别名

HIST

## 语法

```sql
HISTOGRAM(<expr>[, <num_buckets>])
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `expr` | 需要获取第一个值的表达式 |
| `num_buckets` | 可选。用于限制直方图桶（bucket）的数量，默认值 128 |


## 返回值

返回直方图估算后的 JSON 类型的值。特殊情况：
- 当参数<expr>为NULL时，返回 NULL。

## 举例

```sql
SELECT histogram(c_float) FROM histogram_test;
```

```text
+-------------------------------------------------------------------------------------------------------------------------------------+
| histogram(`c_float`)                                                                                                                |
+-------------------------------------------------------------------------------------------------------------------------------------+
| {"num_buckets":3,"buckets":[{"lower":"0.1","upper":"0.1","count":1,"pre_sum":0,"ndv":1},...]} |
+-------------------------------------------------------------------------------------------------------------------------------------+
```

```sql
SELECT histogram(c_string, 2) FROM histogram_test;
```

```text
+-------------------------------------------------------------------------------------------------------------------------------------+
| histogram(`c_string`)                                                                                                               |
+-------------------------------------------------------------------------------------------------------------------------------------+
| {"num_buckets":2,"buckets":[{"lower":"str1","upper":"str7","count":4,"pre_sum":0,"ndv":3},...]} |
+-------------------------------------------------------------------------------------------------------------------------------------+
```

查询结果说明：

```json
{
    "num_buckets": 3, 
    "buckets": [
        {
            "lower": "0.1", 
            "upper": "0.2", 
            "count": 2, 
            "pre_sum": 0, 
            "ndv": 2
        }, 
        {
            "lower": "0.8", 
            "upper": "0.9", 
            "count": 2, 
            "pre_sum": 2, 
            "ndv": 2
        }, 
        {
            "lower": "1.0", 
            "upper": "1.0", 
            "count": 2, 
            "pre_sum": 4, 
            "ndv": 1
        }
    ]
}
```

```text
字段说明：
- num_buckets：桶的数量
- buckets：直方图所包含的桶
  - lower：桶的上界
  - upper：桶的下界
  - count：桶内包含的元素数量
  - pre_sum：前面桶的元素总量
  - ndv：桶内不同值的个数

> 直方图总的元素数量 = 最后一个桶的元素数量（count）+ 前面桶的元素总量（pre_sum）。
```
