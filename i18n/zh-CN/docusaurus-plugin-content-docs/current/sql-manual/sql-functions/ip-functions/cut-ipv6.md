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

## CUT_IPV6

CUT_IPV6

### Description

#### Syntax

`STRING CUT_IPV6(IPV4 ipv4, TinyInt cut_ipv6_bytes, TinyInt cut_ipv4_bytes)`


接受一个 IPv6 类型的地址，并以文本格式返回一个包含指定字节数的地址的字符串。


### Example

```sql
mysql [(none)]>select cut_ipv6(to_ipv6('2001:0DB8:AC10:FE01:FEED:BABE:CAFE:F00D'), 10, 0);
+-------------------+
| '2001:db8:ac10::' |
+-------------------+
| 2001:db8:ac10::   |
+-------------------+
1 row in set (0.00 sec)
```

### Keywords

CUT_IPV6, IP
