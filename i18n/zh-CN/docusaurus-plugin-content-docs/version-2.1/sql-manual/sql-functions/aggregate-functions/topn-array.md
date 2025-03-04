---
{
    "title": "TOPN_ARRAY",
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

TOPN_ARRAY 函数返回指定列中出现频率最高的 N 个值的数组。与 TOPN 函数不同，TOPN_ARRAY 返回一个数组类型，便于后续处理和分析。

## 语法

```sql
TOPN_ARRAY(<expr>, <top_num> [, <space_expand_rate>])
```

## 参数
| 参数 | 说明 |
| -- | -- |
| `<expr>` | 要统计的列或表达式 |
| `<top_num>` | 要返回的最高频率值的数量，必须是正整数 |
| `<space_expand_rate>` | 可选项，该值用来设置 Space-Saving 算法中使用的 counter 个数`counter_numbers = top_num * space_expand_rate` space_expand_rate 的值越大，结果越准确，默认值为 50 |

## 返回值
返回一个数组，包含出现频率最高的 N 个值。

## 举例
```sql
-- 创建示例表
CREATE TABLE page_visits (
    page_id INT,
    user_id INT,
    visit_date DATE
) DISTRIBUTED BY HASH(page_id)
PROPERTIES (
    "replication_num" = "1"
);

-- 插入测试数据
INSERT INTO page_visits VALUES
(1, 101, '2024-01-01'),
(2, 102, '2024-01-01'),
(1, 103, '2024-01-01'),
(3, 101, '2024-01-01'),
(1, 104, '2024-01-01'),
(2, 105, '2024-01-01'),
(1, 106, '2024-01-01'),
(4, 107, '2024-01-01');

-- 查找访问量最高的前 3 个页面
SELECT TOPN_ARRAY(page_id, 3) as top_pages
FROM page_visits;
```

```text
+-----------+
| top_pages |
+-----------+
| [1, 2, 4] |
+-----------+
```
