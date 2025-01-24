---
{
   "title": "UNSET DEFAULT STORAGE VAULT",
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

取消已指定的默认 Storage Vault

## 语法

```sql
UNSET DEFAULT STORAGE VAULT
```

## 权限控制

| 权限（Privilege） | 对象（Object） | 说明（Notes）                   |
| :---------------- | :------------- | :------------------------------ |
| ADMIN_PRIV        | Storage Vault  | 只有 admin 用户有权限执行该语句 |

## 示例

```sql
UNSET DEFAULT STORAGE VAULT
```