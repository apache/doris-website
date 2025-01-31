---
{
    "title": "JSON_ARRAY",
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
Generate a json array containing the specified values, return empty if no values


## Syntax
```sql
JSON_ARRAY (<a>, ...)
```

## Parameters
| Parameter | Description                                                                                                   |
|------|---------------------------------------------------------------------------------------------------------------|
| `<a>, ...` | Elements to be included in the JSON array. It can be a single or multiple values of any type, including NULL. |


## Return Values
Returns a JSON array containing the specified values. If no values are specified, an empty JSON array is returned.


## Examples

```sql
select json_array();
```

```text
+--------------+
| json_array() |
+--------------+
| []           |
+--------------+
```

```sql
select json_array(null);
```

```text
+--------------------+
| json_array('NULL') |
+--------------------+
| [NULL]             |
+--------------------+
```
```sql
SELECT json_array(1, "abc", NULL, TRUE, CURTIME());
```

```text
+-----------------------------------------------+
| json_array(1, 'abc', 'NULL', TRUE, curtime()) |
+-----------------------------------------------+
| [1, "abc", NULL, TRUE, "10:41:15"]            |
+-----------------------------------------------+
```

```sql
select json_array("a", null, "c");
```

```text
+------------------------------+
| json_array('a', 'NULL', 'c') |
+------------------------------+
| ["a", NULL, "c"]             |
+------------------------------+
```

