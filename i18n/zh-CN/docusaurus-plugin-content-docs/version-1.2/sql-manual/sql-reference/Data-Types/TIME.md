---
{
    "title": "TIME",
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

## TIME

### name

TIME

### description

TIME 类型
    时间类型，可以作为查询结果出现，不支持建表存储与手动 CAST 产生。
    当不使用常量折叠进行计算时，表示范围为 `[-838:59:59, 838:59:59]`。

### example

```sql
mysql [(none)]> select timediff('2020-01-01', '2000-01-01');
+--------------------------------------------------------+
| timediff('2020-01-01 00:00:00', '2000-01-01 00:00:00') |
+--------------------------------------------------------+
| 175320:00:00                                           |
+--------------------------------------------------------+
1 row in set (0.00 sec)
```

### keywords

    TIME
