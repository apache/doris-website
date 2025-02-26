---
{
    "title": "TO_IPV4",
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
输入 IPv4 地址的字符串形式，并返回 IPv4 类型的值。

## 语法
```sql
TO_IPV4(<ipv4_str>)
```

## 参数
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv4_str>`      | 字符串类型的 ipv4 地址 |

## 返回值
返回 IPv4 类型的值，该值的二进制形式等于 ipv4_string_to_num 函数返回值的二进制形式。
- 如果 IPv4 地址为非法格式，则抛出异常

## 举例
```sql
SELECT to_ipv4('255.255.255.255');
```
```text
+----------------------------+
| to_ipv4('255.255.255.255') |
+----------------------------+
| 255.255.255.255            |
+----------------------------+
```
