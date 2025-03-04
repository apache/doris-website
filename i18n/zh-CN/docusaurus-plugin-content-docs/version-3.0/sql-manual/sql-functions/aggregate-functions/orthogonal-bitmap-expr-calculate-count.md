---
{
    "title": "ORTHOGONAL_BITMAP_EXPR_CALCULATE_COUNT",
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

ORTHOGONAL_BITMAP_EXPR_CALCULATE_COUNT 函数返回对 Bitmap 表达式进行交并差计算后集合中的元素数量

## 语法

```sql
ORTHOGONAL_BITMAP_EXPR_CALCULATE_COUNT(<bitmap_column>, <column_to_filter>, <input_string>)
```

## 参数说明

| 参数 | 说明 |
| -- | -- |
| `bitmap_column` | 需要获取值的 Bitmap 类型表达式 |
| `column_to_filter` | 过滤的维度列，即计算的 Key 列 |
| `input_string` | 计算表达式字符串，含义是依据 Key 列进行 Bitmap 交并差集表达式计算，表达式支持的计算符：& 代表交集计算，\| 代表并集计算，- 代表差集计算，^ 代表异或计算，\ 代表转义字符 |

## 返回值

返回 BIGINT 类型的值。

## 举例
```sql
select orthogonal_bitmap_expr_calculate_count(user_id, tag, '(833736|999777)&(1308083|231207)&(1000|20000-30000)') from user_tag_bitmap where tag in (833736,999777,130808,231207,1000,20000,30000);
注：1000、20000、30000 等整形tag，代表用户不同标签
```

```text
+-----------------------------------------------------------------------------------------------------------------+
| orthogonal_bitmap_expr_calculate_count(`user_id`, `tag`, '(833736|999777)&(1308083|231207)&(1000|20000-30000)') |
+-----------------------------------------------------------------------------------------------------------------+
|                                                                                                            1000 |
+-----------------------------------------------------------------------------------------------------------------+
```

```sql
select orthogonal_bitmap_expr_calculate_count(user_id, tag, '(A:a/b|B:2\\-4)&(C:1-D:12)&E:23') from user_str_tag_bitmap where tag in ('A:a/b', 'B:2-4', 'C:1', 'D:12', 'E:23');
 注：'A:a/b', 'B:2-4'等是字符串类型tag，代表用户不同标签, 其中'B:2-4'需要转义成'B:2\\-4'
```

```text
+---------------------------------------------------------------------------------------------+
| orthogonal_bitmap_expr_calculate_count(`user_id`, `tag`, '(A:a/b|B:2\\-4)&(C:1-D:12)&E:23') |
+---------------------------------------------------------------------------------------------+
|                                                                                          30 |
+---------------------------------------------------------------------------------------------+
```