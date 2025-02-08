---
{
    "title": "UCASE",
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

Used to convert a string to uppercase letters
## Alias

- UPPER

## Syntax

```sql
UCASE( <str> )
```

## Required Parameters
| Parameters | Description |
|------|------|
| `<str>` | The string to convert to uppercase

## Return Value

The value after converting the uppercase

## Example

```sql
SELECT ucase("aBc123");
```
```sql
+-----------------+
| ucase('aBc123') |
+-----------------+
| ABC123          |
+-----------------+
```