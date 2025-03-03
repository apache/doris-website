---
{
    "title": "CRC32",
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

使用 CRC32 算法计算结果。

## 语法

```sql
CRC32( <str> )
```

## 参数
| 参数 | 说明 |
| -- | -- |
| `<str>` | 需要被计算 CRC 的值 |

## 返回值
返回字符串的 CRC 值。

## 示例

```sql
select crc32("abc"),crc32("中国");
```
```text
+--------------+-----------------+
| crc32('abc') | crc32('中国')   |
+--------------+-----------------+
|    891568578 |       737014929 |
+--------------+-----------------+
```
