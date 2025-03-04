---
{
"title": "BITMAP_INTERSECT",
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

聚合函数，用于计算分组后的 bitmap 交集。常见使用场景如：计算用户留存率。

## 语法

```sql
BITMAP_INTERSECT(BITMAP <value>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<value>` | 支持 bitmap 的数据类型 |

## 返回值

返回值的数据类型为 BITMAP。

## 举例

表结构

```
KeysType: AGG_KEY
Columns: tag varchar, date datetime, user_id bitmap bitmap_union

```

```
求今天和昨天不同 tag 下的用户留存
select tag, bitmap_intersect(user_id) from (select tag, date, bitmap_union(user_id) user_id from table where date in ('2020-05-18', '2020-05-19') group by tag, date) a group by tag;
```

和 bitmap_to_string 函数组合使用可以获取交集的具体数据

```
求今天和昨天不同 tag 下留存的用户都是哪些
select tag, bitmap_to_string(bitmap_intersect(user_id)) from (select tag, date, bitmap_union(user_id) user_id from table where date in ('2020-05-18', '2020-05-19') group by tag, date) a group by tag;
```

