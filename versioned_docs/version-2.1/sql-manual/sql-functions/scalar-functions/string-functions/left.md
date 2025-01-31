---
{
    "title": "LEFT",
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

Returns the substring starting at the specified offset from the left side of string s.

## Syntax

```sql
LEFT ( <str> , <offset> )
```

## Parameters

| Parameter  | Description |
|------------|---------------|
| `<str>`    | String to search for |
| `<offset>` | Offset to calculate from the left side |

## Return Value

The substring starting at the specified offset from the left side of string `<str>`.

## Example

```sql
SELECT LEFT('Hello', 3)
```

```text
+------------------+
| left('Hello', 3) |
+------------------+
| Hel              |
+------------------+
```
