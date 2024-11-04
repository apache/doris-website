---
{
    "title": "HOUR",
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

## Description


获得日期中的小时的信息。

参数为 Date 或者 Datetime，Time 类型

当参数为 Date 或者 Datetime，返回值范围从 0-23。当参数为 Time，返回值可以大于 24

## Syntax
`INT HOUR(DATETIME date)`

## Example

```sql
mysql> select hour('2018-12-31 23:59:59');
+-----------------------------+
| hour('2018-12-31 23:59:59') |
+-----------------------------+
|                          23 |
+-----------------------------+
mysql> select cast(4562632 as time),hour(cast(4562632 as time)), minute(cast(4562632 as time)),second(cast(4562632 as time));
+-----------------------+-----------------------------+-------------------------------+-------------------------------+
| cast(4562632 as TIME) | hour(cast(4562632 as TIME)) | minute(cast(4562632 as TIME)) | second(cast(4562632 as TIME)) |
+-----------------------+-----------------------------+-------------------------------+-------------------------------+
| 456:26:32             |                         456 |                            26 |                            32 |
+-----------------------+-----------------------------+-------------------------------+-------------------------------+
```
## Keywords
    HOUR
