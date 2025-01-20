---
{
    "title": "SET DEFAULT STORAGE VAULT",
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

该语句用于在 Doris 中设置默认存储库。默认存储库用于存储内部或系统表的数据。如果未设置默认存储库，Doris 将无法正常运行。一旦设置了默认存储库，就无法移除它。

## 语法

```sql
SET vault_name DEFAULT STORAGE VAULT
```

> 注意：
>
> 1. 只有 ADMIN 用户可以设置默认存储库

## 示例

1. 将名为 s3_vault 的存储库设置为默认存储库

   ```sql
   SET s3_vault AS DEFAULT STORAGE VAULT;
   ```

## 相关命令

## 关键词

    SET, DEFAULT, STORAGE, VAULT