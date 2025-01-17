---
{
    "title": "CURRENT_USER",
    "language": "zh-CN"
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

## 描述

获取当前的用户名及其 IP 白名单规则。

## 语法

```sql
current_user()
```

## 参数

无

## 返回值

返回当前的用户名及其 IP 白名单，string。

格式：`<user_name>@<ip_white_list>`

## 举例

- root 用户，无 IP 限制
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

- doris 用户，IP 白名单为 192.168.*
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

