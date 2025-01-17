---
{
    "title": "VERSION",
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

No practical meaning, for compatibility with MySQL protocol.

## Syntax

```sql
VERSION()
```

## Return Value

Compatible with MySQL protocol, fixed return value is "5.7.99".

## Examples

```sql
select version();
```

```text
+-----------+
| version() |
+-----------+
| 5.7.99    |
+-----------+
```

