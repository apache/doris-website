---
{
    "title": "INITCAP",
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

Capitalizes the first letter of the word contained in the parameter and converts the rest of the letters to lowercase. A word is a sequence of alphanumeric characters separated by non-alphanumeric characters.

## Syntax

```sql
INITCAP ( <str> )
```

## Parameters

| Parameter | Description |
|-----------|-----------|
| `<str>`   | The string to be converted |

## Return Value

The result of capitalizing the first letter of the word in the parameter `<str>` and lowering the rest of the letters.

## Example    

```sql
SELECT INITCAP('hello hello.,HELLO123HELlo')
```

```text
+---------------------------------------+
| initcap('hello hello.,HELLO123HELlo') |
+---------------------------------------+
| Hello Hello.,hello123hello            |
+---------------------------------------+
```