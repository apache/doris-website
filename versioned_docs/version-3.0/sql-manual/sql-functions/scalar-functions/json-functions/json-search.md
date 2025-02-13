---
{
    "title": "json_search",
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

The `JSON_SEARCH` function is used to search for a specified value within a JSON document. If the value is found, it returns the path to the value. If the value is not found, it returns `NULL`. This function can recursively search through the JSON data structure.

## Syntax

```sql
JSON_SEARCH(<str>, <one_or_all>, <search_value> [, <start_path> [, <escape_char>]])
```

## Required Parameters

| parameters| described|
|------|------|
| `<str>`| The JSON document to search (can be a JSON string or JSON object). |
| `<one_or_all>` | Specifies whether to find all matching values. It can be 'one' or 'all'. |
|`<search_value>`|The value to search for.|

## Optional Parameters

| parameters| described|
|------|------|
| `<start_path>`| Specifies the path to start searching from. If not provided, the search starts from the entire JSON document. |
| `<escape_char>` | Specifies the character to escape special characters in the path. |

## Return Value

- If a matching value is found, it returns a JSON path (as a string) pointing to the matched value.
- If no matching value is found, it returns NULL.

## Usage Notes
The one_or_all parameter determines whether to find all matching values. 'one' returns the first matching path, while 'all' returns all matching paths.
If no matching values are found, the function returns NULL.
The start_path parameter can limit the search range, making the query more efficient.

## Examples
1. Search for a value (one):

```sql
SELECT JSON_SEARCH('{"name": "John", "age": 30}', 'one', 'John');

```
```sql
+-----------------------------------------------+
| JSON_SEARCH('{"name": "John", "age": 30}', 'one', 'John') |
+-----------------------------------------------+
| $.name                                         |
+-----------------------------------------------+

```
2. Search for multiple matching values (all):

```sql
SELECT JSON_SEARCH('{"person": {"name": "John", "age": 30}, "name": "John"}', 'all', 'John');


```
```sql
+---------------------------------------------------------------+
| JSON_SEARCH('{"person": {"name": "John", "age": 30}, "name": "John"}', 'all', 'John') |
+---------------------------------------------------------------+
| $.name                                                       |
| $.person.name                                                |
+---------------------------------------------------------------+
```
3. No matching value found:

```sql
SELECT JSON_SEARCH('{"name": "John", "age": 30}', 'one', 'Alice');

```
```sql
+-----------------------------------------------+
| JSON_SEARCH('{"name": "John", "age": 30}', 'one', 'Alice') |
+-----------------------------------------------+
| NULL                                          |
+-----------------------------------------------+

```

4. Specify the starting search path:

```sql
SELECT JSON_SEARCH('{"person": {"name": "John", "age": 30}}', 'one', 'John', '$.person');

```
```sql
+---------------------------------------------------------------+
| JSON_SEARCH('{"person": {"name": "John", "age": 30}}', 'one', 'John', '$.person') |
+---------------------------------------------------------------+
| $.name                                                         |
+---------------------------------------------------------------+


```