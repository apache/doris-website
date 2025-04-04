---
{
    "title": "PRINTF",
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

Returns a formatted string using the specified [printf](https://pubs.opengroup.org/onlinepubs/009695399/functions/fprintf.html) string and arguments.

## Syntax

```sql
PRINTF(<format>, [<args>, ...])
```

## Parameters  

| Parameter | Description |  
| -- | -- |  
| `<format>` | The printf format string. |  
| `<args>` | The arguments to be formatted. | 

## Return Value  

The formatted string using a printf mode. 

## Example

```sql
select printf("hello world");
```

```text
+-----------------------+
| printf("hello world") |
+-----------------------+
| hello world           |
+-----------------------+
```

```sql
select printf('%d-%s-%.2f', 100, 'test', 3.14);
```

```text
+-----------------------------------------+
| printf('%d-%s-%.2f', 100, 'test', 3.14) |
+-----------------------------------------+
| 100-test-3.14                           |
+-----------------------------------------+
```

```sql
select printf('Int: %d, Str: %s, Float: %.2f, Hex: %x', 255, 'test', 3.14159, 255);
```

```text
+-----------------------------------------------------------------------------+
| printf('Int: %d, Str: %s, Float: %.2f, Hex: %x', 255, 'test', 3.14159, 255) |
+-----------------------------------------------------------------------------+
| Int: 255, Str: test, Float: 3.14, Hex: ff                                   |
+-----------------------------------------------------------------------------+
```
