---
{
    "title": "TO_IPV6_OR_DEFAULT",
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
Convert a string form of IPv6 address to IPv6 type.

## Syntax
```sql
TO_IPV6_OR_DEFAULT(STRING <ipv6_str>)
```

## Parameters
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv6_str>`      | An IPv6 address of type String |


## Return Value
Returns value of IPv6 type.
- If the IPv6 address has an invalid format, returns :: (0 as IPv6).


## Example
```sql
SELECT to_ipv6_or_default('.'), to_ipv6_or_default('2001:1b70:a1:610::b102:2');
```
```text
+-------------------------+------------------------------------------------+
| to_ipv6_or_default('.') | to_ipv6_or_default('2001:1b70:a1:610::b102:2') |
+-------------------------+------------------------------------------------+
| ::                      | 2001:1b70:a1:610::b102:2                       |
+-------------------------+------------------------------------------------+
```
