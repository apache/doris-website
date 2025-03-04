---
{
    "title": "IPV4_CIDR_TO_RANGE",
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
接收一个 IPv4 和一个包含 CIDR 的 Int16 值。返回一个结构体，其中包含两个 IPv4 字段分别表示子网的较低范围（min）和较高范围（max）。

## 语法
```sql
IPV4_CIDR_TO_RANGE(<ip_v4>, <cidr>)
```

## 参数
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ip_v4>`      | 字符串类型的 ipv4 地址 |
| `<cidr>`      | cidr 值 |

## 返回值
返回一个结构体，其中包含两个 IPv4 字段分别表示子网的较低范围（min）和较高范围（max）
- 如果输入为 NULL，则返回 NULL

## 举例

```sql
SELECT ipv4_cidr_to_range(ipv4_string_to_num('192.168.5.2'), 16) as re1, ipv4_cidr_to_range(to_ipv4('192.168.5.2'), 16) as re2, ipv4_cidr_to_range(NULL, NULL) as re3;
```
```text
+------------------------------------------------+------------------------------------------------+------+
| re1                                            | re2                                            | re3  |
+------------------------------------------------+------------------------------------------------+------+
| {"min":"192.168.0.0", "max":"192.168.255.255"} | {"min":"192.168.0.0", "max":"192.168.255.255"} | NULL |
+------------------------------------------------+------------------------------------------------+------+
```
