---
{
    "title": "IS_IP_ADDRESS_IN_RANGE",
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
判断IP（IPv4或IPv6）地址是否包含在以CIDR表示法表示的网络中。

## 语法
```sql
IS_IP_ADDRESS_IN_RANGE(ip_str, cidr_prefix)
```

## 参数
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ip_str>`      | 字符串类型的ipv4或者ipv6地址 |
| `<cidr_prefix>`      | cidr前缀 |

## 返回值
如果IP（IPv4或IPv6）地址是包含在以CIDR表示法表示的网络中，则返回true，否则返回false。
- 如果输入值为NULL, 则返回NULL

## 举例
```sql
SELECT is_ip_address_in_range('127.0.0.1', '127.0.0.0/8') as v4, is_ip_address_in_range('::ffff:192.168.0.1', '::ffff:192.168.0.4/128') as v6, is_ip_address_in_range('127.0.0.1', NULL) as nil;
```
```text
+------+------+------+
| v4   | v6   | nil  |
+------+------+------+
|    1 |    0 | NULL |
+------+------+------+
```
