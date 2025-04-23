---
{
    "title": "IS_IPV6_STRING",
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
接收一个表示形式为字符串的 IPv6 地址作为参数，如果为格式正确且合法的 IPv6 地址，返回 true；反之，返回 false。

## 语法
```sql
IS_IPV6_STRING(<ipv6_str>)
```

## 参数
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv6_str>`      | 字符串类型的 ipv6 地址 |

## 返回值
如果为格式正确且合法的 IPv6 地址，返回 1 (true)；反之，返回 0 (false)。
- 如果输入为 NULL, 则返回 NULL

## 举例
```sql
CREATE TABLE `test_is_ipv6_string` (
      `id` int,
      `ip_v6` string
    ) ENGINE=OLAP
    DISTRIBUTED BY HASH(`id`) BUCKETS 4
    PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
    );
    
insert into test_is_ipv6_string values(0, NULL), (1, '::'), (2, ''), (3, '2001:1b70:a1:610::b102:2'), (4, 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffffg');

select id, ip_v6, is_ipv6_string(ip_v6) from test_is_ipv6_string order by id;
```
```text
+------+------------------------------------------+-----------------------+
| id   | ip_v6                                    | is_ipv6_string(ip_v6) |
+------+------------------------------------------+-----------------------+
|    0 | NULL                                     |                  NULL |
|    1 | ::                                       |                     1 |
|    2 |                                          |                     0 |
|    3 | 2001:1b70:a1:610::b102:2                 |                     1 |
|    4 | ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffffg |                     0 |
+------+------------------------------------------+-----------------------+
```
