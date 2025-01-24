---
{
    "title": "SPLIT_BY_REGEXP",
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

Split the input string into an array of strings according to the specified regular expression.

## Syntax

```sql
SPLIT_BY_REGEXP ( <str>, <pattern> [, <max_limit>] )
```

## Parameters

| Parameter      | Description                           |
|---------|------------------------------|
| `<str>` | The string to be split                     |
| `<pattern>` | Regular expression                        |
| `<max_limit>` | Optional parameter, whether to limit the number of elements in the returned string array. The default is no limit |

## Return Value

Return an array of strings split according to the specified regular expression. Special cases:

- If any of the parameters is NULL, NULL is returned.

## Examples

```sql
SELECT split_by_regexp('abcde',"");
```

```text
+------------------------------+
| split_by_regexp('abcde', '') |
+------------------------------+
| ["a", "b", "c", "d", "e"]    |
+------------------------------+
```

```sql
select split_by_regexp('a12bc23de345f',"\\d+");
```

```text
+-----------------------------------------+
| split_by_regexp('a12bc23de345f', '\d+') |
+-----------------------------------------+
| ["a", "bc", "de", "f"]                  |
+-----------------------------------------+
```
