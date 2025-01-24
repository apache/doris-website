---
{
    "title": "FROM_UNIXTIME",
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

将 unix 时间戳转化为对应的 time 格式。特殊情况：
- 目前支持的 `unix_timestamp` 范围为 `[0, 32536771199]`，超出范围的 `unix_timestamp` 将会得到 NULL

## 语法

```sql
FROM_UNIXTIME(<unix_timestamp> [, <string_format>])
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<unix_timestamp>` | unix 时间戳 |
| `<string_format>` | format 格式，默认为 %Y-%m-%d %H:%i:%s|

## 返回值

返回指定格式的日期。

## 举例

```
mysql> select from_unixtime(1196440219);
+---------------------------+
| from_unixtime(1196440219) |
+---------------------------+
| 2007-12-01 00:30:19       |
+---------------------------+

mysql> select from_unixtime(1196440219, 'yyyy-MM-dd HH:mm:ss');
+--------------------------------------------------+
| from_unixtime(1196440219, 'yyyy-MM-dd HH:mm:ss') |
+--------------------------------------------------+
| 2007-12-01 00:30:19                              |
+--------------------------------------------------+

mysql> select from_unixtime(1196440219, '%Y-%m-%d');
+-----------------------------------------+
| from_unixtime(1196440219, '%Y-%m-%d') |
+-----------------------------------------+
| 2007-12-01                              |
+-----------------------------------------+

mysql> select from_unixtime(1196440219, '%Y-%m-%d %H:%i:%s');
+--------------------------------------------------+
| from_unixtime(1196440219, '%Y-%m-%d %H:%i:%s') |
+--------------------------------------------------+
| 2007-12-01 00:30:19                              |
+--------------------------------------------------+
```