---
{
    "title": "DATABASE",
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

Get the database of the current sql client connection.

## Alias

- SCHEMA

## Syntax

```sql
DATABASE()
```
or

```sql
SCHEMA()
```

## Return Value

The name of the database connected to the current sql client.

## Examples

```sql
select database(),schema();
```

```text
+------------+------------+
| database() | database() |
+------------+------------+
| test       | test       |
+------------+------------+
```

