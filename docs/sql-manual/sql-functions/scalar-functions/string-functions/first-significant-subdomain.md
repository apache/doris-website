---
{
    "title": "FIRST_SIGNIFICANT_SUBDOMAIN",
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

`VARCHAR  first_significant_subdomain(VARCHAR url)`


Extract the "first valid subdomain" from a URL and return it. If the URL is invalid, return an empty string.

## Example

```sql
mysql [(none)]>select first_significant_subdomain("www.baidu.com");
+----------------------------------------------+
| first_significant_subdomain('www.baidu.com') |
+----------------------------------------------+
| baidu                                        |
+----------------------------------------------+

mysql [(none)]>select first_significant_subdomain("www.google.com.cn");
+--------------------------------------------------+
| first_significant_subdomain('www.google.com.cn') |
+--------------------------------------------------+
| google                                           |
+--------------------------------------------------

mysql [(none)]>select first_significant_subdomain("wwwwwwww");
+-----------------------------------------+
| first_significant_subdomain('wwwwwwww') |
+-----------------------------------------+
|                                         |
+-----------------------------------------+
```

### Keywords

FIRST_SIGNIFICANT_SUBDOMAIN
