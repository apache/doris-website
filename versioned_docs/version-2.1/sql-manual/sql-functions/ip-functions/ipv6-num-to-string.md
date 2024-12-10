---
{
"title": "IPV6_NUM_TO_STRING",
"language": "en"
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

## IPV6_NUM_TO_STRING

IPV6_NUM_TO_STRING

### Description

#### Syntax

`VARCHAR IPV6_NUM_TO_STRING(VARCHAR ipv6_num)`

`VARCHAR INET6_NTOA(VARCHAR ipv6_num)`

Takes an IPv6 address in binary format of type String. Returns the string of this address in text format.
The IPv4 address mapped by IPv6 starts with ::ffff:111.222.33. 

#### Notice

If the input string is not the binary encoding of a valid IPv6 address, `NULL` is returned. This function has an alias `INET6_NTOA`.

### Example

```sql
mysql> select ipv6_num_to_string(unhex('2A0206B8000000000000000000000011')) as addr;
+--------------+
| addr         |
+--------------+
| 2a02:6b8::11 |
+--------------+
1 row in set (0.01 sec)

mysql> select ipv6_num_to_string("-23vno12i34nlfwlsj");
+------------------------------------------+
| ipv6_num_to_string('-23vno12i34nlfwlsj') |
+------------------------------------------+
| NULL                                     |
+------------------------------------------+
1 row in set (0.14 sec)
```

### Keywords

IPV6_NUM_TO_STRING, INET6_NTOA, IP
