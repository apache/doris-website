---
{
    "title": "CUT_TO_FIRST_SIGNIFICANT_SUBDOMAIN",
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

The CUT_TO_FIRST_SIGNIFICANT_SUBDOMAIN function extracts the effective part of a domain from a URL, including the top-level domain up to the "first significant subdomain". If the input URL is invalid, it returns an empty string.

## Syntax

```sql
VARCHAR CUT_TO_FIRST_SIGNIFICANT_SUBDOMAIN(VARCHAR url)
```

## Parameters
| Parameter | Description                                   |
| --------- | --------------------------------------------- |
| url       | The URL string to be processed. Type: VARCHAR |

## Return Value

Returns VARCHAR type, representing the extracted domain part.

Special cases:
- If url is NULL, returns NULL
- If url is not a valid domain format, returns an empty string

## Examples

1. Basic domain processing
```sql
SELECT cut_to_first_significant_subdomain('www.baidu.com');
```
```text
+-----------------------------------------------------+
| cut_to_first_significant_subdomain('www.baidu.com')  |
+-----------------------------------------------------+
| baidu.com                                            |
+-----------------------------------------------------+
```

2. Multi-level domain processing
```sql
SELECT cut_to_first_significant_subdomain('www.google.com.cn');
```
```text
+---------------------------------------------------------+
| cut_to_first_significant_subdomain('www.google.com.cn')   |
+---------------------------------------------------------+
| google.com.cn                                             |
+---------------------------------------------------------+
```

3. Invalid domain processing
```sql
SELECT cut_to_first_significant_subdomain('wwwwwwww');
```
```text
+------------------------------------------------+
| cut_to_first_significant_subdomain('wwwwwwww')  |
+------------------------------------------------+
|                                                 |
+------------------------------------------------+
```