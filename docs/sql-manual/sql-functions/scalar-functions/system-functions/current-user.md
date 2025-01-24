---
{
    "title": "CURRENT_USER",
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

Get the current username and its IP rule whitelist.

## Syntax

```sql
CURRENT_USER()
```

## Return Value

Returns the current username and its IP whitelist.

Format:`<user_name>@<ip_white_list>`

## Examples

- root user, no IP restrictions
```sql
select current_user();
```

```text
+----------------+
| current_user() |
+----------------+
| 'root'@'%'     |
+----------------+
```

- doris user, IP whitelist is 192.168.*
```sql
select current_user();
```

```text
+---------------------+
| current_user()      |
+---------------------+
| 'doris'@'192.168.%' |
+---------------------+
```

