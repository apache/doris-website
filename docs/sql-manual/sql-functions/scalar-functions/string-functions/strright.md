---
{
    "title": "STRRIGHT",
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

The STRRIGHT function returns a specified number of characters from the right side of a string. The length is measured in UTF8 characters.

## Alias

RIGHT

## Syntax

```sql
VARCHAR STRRIGHT(VARCHAR str, INT len)
```

## Parameters
| Parameter | Description                                   |
| --------- | --------------------------------------------- |
| str       | The string to extract from. Type: VARCHAR     |
| len       | The number of characters to return. Type: INT |

## Return Value

Returns VARCHAR type, representing the extracted substring.

Special cases:
- Returns NULL if any argument is NULL
- If len is negative, returns the substring starting from the abs(len)th character from the right
- Returns the entire string if len is greater than the string length

## Examples

1. Basic usage
```sql
SELECT strright('Hello doris', 5);
```
```text
+-------------------------+
| strright('Hello doris', 5) |
+-------------------------+
| doris                   |
+-------------------------+
```

2. Handling negative length
```sql
SELECT strright('Hello doris', -7);
```
```text
+--------------------------+
| strright('Hello doris', -7) |
+--------------------------+
| doris                    |
+--------------------------+
```

3. Handling NULL parameter
```sql
SELECT strright('Hello doris', NULL);
```
```text
+----------------------------+
| strright('Hello doris', NULL) |
+----------------------------+
| NULL                       |
+----------------------------+
```

4. Handling NULL string
```sql
SELECT strright(NULL, 5);
```
```text
+----------------+
| strright(NULL, 5) |
+----------------+
| NULL           |
+----------------+
```