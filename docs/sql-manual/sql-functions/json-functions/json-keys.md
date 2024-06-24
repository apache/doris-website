---
{
    "title": "JSON_KEYS",
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

## Json_keys
### Description
#### Syntax

`ARRAY<STRING> json_keys(JSON, [VARCHAR path])`


Returns the keys from the top-level value of a JSON object as a JSON array, or, if a path argument is given, the top-level keys from the selected path. Returns NULL if any argument is NULL, the json_doc argument is not an object, or path, if given, does not locate an object. An error occurs if the json_doc argument is not a valid JSON document or the path argument is not a valid path expression

> Note:
>
> The result array is empty if the selected object is empty. If the top-level value has nested subobjects, the return value does not include keys from those subobjects.
### Example

```

mysql> SELECT JSON_KEYS('{"a": 1, "b": {"c": 30}}');
+-----------------------------------------------------+
| json_keys(cast('{"a": 1, "b": {"c": 30}}' as JSON)) |
+-----------------------------------------------------+
| ["a", "b"]                                          |
+-----------------------------------------------------+
1 row in set (0.35 sec)

mysql> SELECT JSON_KEYS('{"a": 1, "b": {"c": 30}}', '$.b');
+------------------------------------------------------------+
| json_keys(cast('{"a": 1, "b": {"c": 30}}' as JSON), '$.b') |
+------------------------------------------------------------+
| ["c"]                                                      |
+------------------------------------------------------------+
1 row in set (0.07 sec)

mysql> SELECT JSON_KEYS('{}');
+-------------------------------+
| json_keys(cast('{}' as JSON)) |
+-------------------------------+
| []                            |
+-------------------------------+
1 row in set (0.07 sec)

mysql> SELECT JSON_KEYS('[1,2]');
+----------------------------------+
| json_keys(cast('[1,2]' as JSON)) |
+----------------------------------+
| NULL                             |
+----------------------------------+
1 row in set (0.07 sec)

mysql> SELECT JSON_KEYS('[]');
+-------------------------------+
| json_keys(cast('[]' as JSON)) |
+-------------------------------+
| NULL                          |
+-------------------------------+
1 row in set (0.07 sec)
```
### Keywords
json,json_keys
