---
{
    "title": "IS_IPV4_MAPPED",
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


## Description
This function takes an IPv6 address represented in numeric form as a binary string, as returned by INET6_ATON().INET6_ATON is also named IPV6_STRING_TO_NUM_OR_NULL.
- IPv4-mapped addresses have the form `::ffff:ipv4_address`.

## Syntax
```sql
IS_IPV4_MAPPED(INET6_ATON(VARCHAR <ipv4_addr>))
```

## Parameters
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv4_addr>`      | An IPv4-compatible addresses, it is like '::ipv4_address'  |


## Return Value
Returns 1 if the argument is a valid IPv4-mapped IPv6 address, 0 otherwise.
- If input is NULL, the function returns NULL.


## Example
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
