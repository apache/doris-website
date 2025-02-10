---
{
    "title": "TO_IPV4_OR_DEFAULT",
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
This function like ipv4_string_to_num that takes a string form of IPv4 address and returns value of IPv4 type, which is binary equal to value returned by ipv4_string_to_num.

## Syntax
```sql
TO_IPV4_OR_DEFAULT(<ipv4_str>)
```

## Parameters
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv4_str>`      | An IPv4 address of type String |


## Return Value
Returns value of IPv4 type.
- If the IPv4 address has an invalid format, returns 0.0.0.0 (0 as IPv4).


## Example
```sql
SELECT to_ipv4_or_default('255.255.255.255'), to_ipv4_or_default('.'), to_ipv4_or_default(NULL);
```
```text
+---------------------------------------+-------------------------+--------------------------+
| to_ipv4_or_default('255.255.255.255') | to_ipv4_or_default('.') | to_ipv4_or_default(NULL) |
+---------------------------------------+-------------------------+--------------------------+
| 255.255.255.255                       | 0.0.0.0                 | 0.0.0.0                  |
+---------------------------------------+-------------------------+--------------------------+
```

