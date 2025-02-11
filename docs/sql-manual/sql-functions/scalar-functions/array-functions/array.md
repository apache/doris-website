---
{
    "title": "ARRAY",
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
construct an array with variadic elements and return it, T could be column or literal

## Syntax

```sql
ARRAY([ <element> [, ...] ])
```

## Parameters
| Parameter | Description |
|---|---|
| `<element>` | The parameter can be multiple columns or constants |

## Return Value
Returns an array.


## Example

```sql
select array("1", 2, 1.1);
```
```text
+------------------------------------------------+
| array('1', cast(2 as TEXT), cast(1.1 as TEXT)) |
+------------------------------------------------+
| ["1", "2", "1.1"]                              |
+------------------------------------------------+
```

```sql
select array(null, 1);
```
```text
+----------------+
| array(NULL, 1) |
+----------------+
| [NULL, 1]      |
+----------------+
```

```sql
select array(1, 2, 3);
```
```text
+----------------+
| array(1, 2, 3) |
+----------------+
| [1, 2, 3]      |
+----------------+
```

```sql
select array(qid, creationDate, null) from nested  limit 4;
```
```text
+-------------------------------------------------------+
| array(cast(qid as DATETIMEV2(0)), creationDate, NULL) |
+-------------------------------------------------------+
| [null, "2009-06-16 07:40:56", null]                   |
| [null, "2009-06-16 07:50:05", null]                   |
| [null, "2009-06-16 08:09:18", null]                   |
| [null, "2009-06-16 08:15:45", null]                   |
+-------------------------------------------------------+
```