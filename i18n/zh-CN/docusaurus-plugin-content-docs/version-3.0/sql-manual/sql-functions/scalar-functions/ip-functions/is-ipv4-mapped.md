---
{
    "title": "IS_IPV4_MAPPED",
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
该函数采用以数字形式表示的二进制字符串形式的 lPv6 地址，由 INET6_ATON 返回。INET6_ATON 是 IPV6_STRING_TO_NUM_OR_NULL 的别名
- IPv4 映射地址的格式为`::ffff:ipv4_address`

## 语法
```sql
IS_IPV4_MAPPED(INET6_ATON(<ipv4_addr>))
```

## 参数
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv4_addr>`      | 兼容 ipv4 的地址，例如 '::ipv4_address'   |


## 返回值
如果参数是有效的 IPv4 映射 IPv6 地址，则返回 1，否则返回 0，
- 如果输入为 NULL, 则返回 NULL


## 举例
```sql
SELECT IS_IPV4_MAPPED(INET6_ATON('::ffff:10.0.5.9')) AS re1, IS_IPV4_MAPPED(INET6_ATON('::10.0.5.9')) AS re2;
```
```text
+------+------+
| re1  | re2  |
+------+------+
|    1 |    0 |
+------+------+
```
