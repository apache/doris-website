---
{
    "title": "IPV4_STRING_TO_NUM_OR_DEFAULT",
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
获取包含 IPv4 地址的字符串，格式为 A.B.C.D（点分隔的十进制数字）。返回一个 BIGINT 数字，表示相应的大端 IPv4 地址。

## 语法
```sql
IPV4_STRING_TO_NUM_OR_DEFAULT(<ipv4_string>)
```

## 参数
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv4_string>`      | 字符串类型的 ipv4 地址，例如 'A.B.C.D'  |

## 返回值
返回一个 BIGINT 数字，表示相应的大端 IPv4 地址
- 如果输入字符串不是有效的 IPv4 地址或者 `NULL`，将返回 `0`

## 举例
```sql
select ipv4_string_to_num_or_default('192.168.0.1');
```
```text
+----------------------------------------------+ 
| ipv4_string_to_num_or_default('192.168.0.1') | 
+----------------------------------------------+ 
| 3232235521                                   | 
+----------------------------------------------+ 
```

```sql
select str, ipv4_string_to_num_or_default(str) from ipv4_str; 
```
```text
+-----------------+------------------------------------+ 
|str              | ipv4_string_to_num_or_default(str) | 
+-----------------+------------------------------------+ 
| 0.0.0.0         | 0                                  | 
| 127.0.0.1       | 2130706433                         | 
| 255.255.255.255 | 4294967295                         | 
| invalid         | 0                                  | 
+-----------------+------------------------------------+ 
```
