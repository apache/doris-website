---
{
    "title": "CUT_IPV6",
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
接受一个 IPv6 类型的地址，并以文本格式返回一个包含指定字节数的地址的字符串。

## 语法
```sql
CUT_IPV6(<ipv6>, <cut_ipv6_bytes>, <cut_ipv4_bytes>)
```

## 参数
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv6>`      | ipv6 类型的地址 |
| `<cut_ipv6_bytes>`     | 需要对 ipv6 地址剪切的字节数         |
| `<cut_ipv4_bytes>`     | 如果第一个参数是 ipv4 类型的地址，需要对 ipv4 地址剪切的字节数           |

## 返回值
返回一个包含指定字节数的地址的字符串。

## 举例
```sql
select cut_ipv6(to_ipv6('2001:0DB8:AC10:FE01:FEED:BABE:CAFE:F00D'), 10, 0);
```
```text
+---------------------------------------------------------------------+
| cut_ipv6(to_ipv6('2001:0DB8:AC10:FE01:FEED:BABE:CAFE:F00D'), 10, 0) |
+---------------------------------------------------------------------+
| 2001:db8:ac10::                                                     |
+---------------------------------------------------------------------+
```
