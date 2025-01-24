---
{
    "title": "CREATE ROLE",
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

该语句用户创建一个角色

```sql
 CREATE ROLE role_name [comment];
```

该语句创建一个无权限的角色，可以后续通过 GRANT 命令赋予该角色权限。

## 示例

1. 创建一个角色

    ```sql
    CREATE ROLE role1;
    ```
2. 创建一个角色并添加注释
    
    ```sql
    CREATE ROLE role2 COMMENT "this is my first role";
    ```

## 关键词

    CREATE, ROLE

## 最佳实践

