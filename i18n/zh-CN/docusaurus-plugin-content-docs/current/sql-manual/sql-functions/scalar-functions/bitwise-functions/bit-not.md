---
{
"title": "BITNOT",
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
用于对整数进行按位取反操作。

整数范围：TINYINT、SMALLINT、INT、BIGINT、LARGEINT。

## 语法
```sql
BITNOT( <x>)
```

## 参数
| 参数    | 说明     |
|-------|--------|
| `<x>` | 参与运算整数 |

## 返回值
返回一个整数取反运算的结果

## 举例
```sql
select BITNOT(7), BITNOT(-127);
```
```text
+-------+----------+
| (~ 7) | (~ -127) |
+-------+----------+
|    -8 |      126 |
+-------+----------+
```