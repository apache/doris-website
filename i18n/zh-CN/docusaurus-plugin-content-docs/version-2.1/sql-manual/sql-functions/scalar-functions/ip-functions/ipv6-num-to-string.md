---
{
    "title": "IPV6_NUM_TO_STRING",
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
接受字符串类型的二进制格式的 IPv6 地址。以文本格式返回此地址的字符串。


## 别名
INET6_NTOA

## 语法
```sql
IPV6_NUM_TO_STRING(<ipv6_num>)
```

## 参数
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv6_num>`      | 以字符串类型呈现的 ipv6 地址的二进制编码值  |

## 返回值
以文本格式返回 ipv6 地址的字符串。
- 如果输入字符串不是有效的 IPv6 地址的二进制编码，将返回 `NULL`。

## 举例
```sql
select ipv6_num_to_string(unhex('2A0206B8000000000000000000000011')) as addr, ipv6_num_to_string("-23vno12i34nlfwlsj");
```
```text
+--------------+------------------------------------------+
| addr         | ipv6_num_to_string('-23vno12i34nlfwlsj') |
+--------------+------------------------------------------+
| 2a02:6b8::11 | NULL                                     |
+--------------+------------------------------------------+
```
