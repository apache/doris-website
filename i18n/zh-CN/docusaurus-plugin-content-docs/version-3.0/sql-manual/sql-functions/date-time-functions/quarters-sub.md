---
{
    "title": "QUARTERS_SUB",
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
## 语法

`DATE/DATETIME QUARTERS_SUB(DATE/DATETIME date, INT years)`

对给定日期减去指定数量的季度

参数 `date` 可以是 `DATETIME` 或者 `DATE` 类型，返回类型与参数 `date` 的类型一致。
## 举例

```sql
mysql> select quarters_sub("2020-01-31 02:02:02", 1);
+---------------------------------------------------------------+
| quarters_sub(cast('2020-01-31 02:02:02' as DATETIMEV2(0)), 1) |
+---------------------------------------------------------------+
| 2019-10-31 02:02:02                                           |
+---------------------------------------------------------------+
1 row in set (0.10 sec)
```

### keywords
  QUARTERS, SUB, QUARTERS_SUB
