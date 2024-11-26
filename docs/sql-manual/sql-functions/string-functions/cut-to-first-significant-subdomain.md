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

## Syntax

`VARCHAR  cut_to_first_significant_subdomain(VARCHAR url)`

Extract the part of the domain in the URL from the top-level subdomain down to the "first valid subdomain." If invalid, return an empty string.

## Examples

```sql
mysql [(none)]>select cut_to_first_significant_subdomain("www.baidu.com");
+-----------------------------------------------------+
| cut_to_first_significant_subdomain('www.baidu.com') |
+-----------------------------------------------------+
| baidu.com                                           |
+-----------------------------------------------------+

mysql [(none)]>select cut_to_first_significant_subdomain("www.google.com.cn");
+---------------------------------------------------------+
| cut_to_first_significant_subdomain('www.google.com.cn') |
+---------------------------------------------------------+
| google.com.cn                                           |
+---------------------------------------------------------+

mysql [(none)]>select cut_to_first_significant_subdomain("wwwwwwww");
+------------------------------------------------+
| cut_to_first_significant_subdomain('wwwwwwww') |
+------------------------------------------------+
|                                                |
+------------------------------------------------+
```

### Keywords

CUT_TO_FIRST_SIGNIFICANT_SUBDOMAIN
