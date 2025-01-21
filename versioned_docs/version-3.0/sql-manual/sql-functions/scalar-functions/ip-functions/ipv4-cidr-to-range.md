---
{
    "title": "IPV4_CIDR_TO_RANGE",
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
Receive an IPv4 and an Int16 value containing CIDR. Returns a struct that contains two IPv4 fields representing the lower range (min) and higher range (max) of the subnet, respectively.

## Syntax
```sql
IPV4_CIDR_TO_RANGE(IPV4 <ip_v4>, INT16 <cidr>)
```

## Parameters
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ip_v4>`      | An IPv4 address of type String |
| `<cidr>`      | The cidr value |


## Return Value
Returns a struct that contains two IPv4 fields representing the lower range (min) and higher range (max) of the subnet, respectively.
- If input is NULL, the function returns NULL.


## Example
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
