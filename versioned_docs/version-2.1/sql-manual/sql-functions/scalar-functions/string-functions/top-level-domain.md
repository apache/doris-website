---
{
    "title": "TOP_LEVEL_DOMAIN",
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

The TOP_LEVEL_DOMAIN function is used to extract the top-level domain from a URL. If the input URL is invalid, it returns an empty string.

## Syntax

```sql
TOP_LEVEL_DOMAIN(<url>)
```

## Parameters
| Parameter | Description                                                              |
| --------- | ------------------------------------------------------------------------ |
| `<url>` | The URL string from which to extract the top-level domain. Type: VARCHAR |

## Return Value

Returns VARCHAR type, representing the extracted top-level domain.

Special cases:
- Returns NULL if url is NULL
- Returns an empty string if url is not a valid URL format
- For multi-level domains (e.g., .com.cn), returns the last level domain

## Examples

1. Basic domain processing
```sql
SELECT top_level_domain('www.baidu.com');
```
```text
+-----------------------------------+
| top_level_domain('www.baidu.com') |
+-----------------------------------+
| com                               |
+-----------------------------------+
```

2. Multi-level domain processing
```sql
SELECT top_level_domain('www.google.com.cn');
```
```text
+---------------------------------------+
| top_level_domain('www.google.com.cn') |
+---------------------------------------+
| cn                                    |
+---------------------------------------+
```

3. Invalid URL processing
```sql
SELECT top_level_domain('wwwwwwww');
```
```text
+------------------------------+
| top_level_domain('wwwwwwww') |
+------------------------------+
|                              |
+------------------------------+
```