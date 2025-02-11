---
{
    "title": "FORMAT",
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

Returns a formatted string using the specified [format](https://fmt.dev/11.1/syntax/#format-specification-mini-language) string and arguments:

## Syntax

```sql
FORMAT(<format>, <args> [, ...])
```

## Parameters  

| Parameter | Description |  
| -- | -- |  
| `<format>` | The value is to be format mode |  
| `<args>` | The value is to be format within string | 

## Return Value  

The formatted string using a format mode. 

## Example

```sql
select format("{:.5}",pi());
```

```text
+-----------------------+
| format('{:.5}', pi()) |
+-----------------------+
| 3.1416                |
+-----------------------+
```

```sql
select format("{:08.2}",pi());
```

```text
+-------------------------+
| format('{:08.2}', pi()) |
+-------------------------+
| 000003.1                |
+-------------------------+
```

```sql
select format("{0}-{1}","second","first");
```

```text
+--------------------------------------+
| format('{0}-{1}', 'second', 'first') |
+--------------------------------------+
| second-first                         |
+--------------------------------------+
```
