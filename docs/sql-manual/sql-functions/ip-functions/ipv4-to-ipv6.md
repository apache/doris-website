---
{
"title": "IPV4_TO_IPV6",
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

## IPV4_TO_IPV6

IPV4_TO_IPV6

### Description

#### Syntax

`IPV6 IPV4_TO_IPV6(IPV4 ipv4)`

accept an IPv4 type address and return the converted IPv6 type address.

### Example

```sql
mysql [(none)]>select ipv6_num_to_string(ipv4_to_ipv6(to_ipv4('192.168.0.1')));
+----------------------+
| '::ffff:192.168.0.1' |
+----------------------+
| ::ffff:192.168.0.1   |
+----------------------+
1 row in set (0.02 sec)
```

### Keywords

IPV4_TO_IPV6, IP
