---
{
    "title": "SHOW STORAGE VAULTS",
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

SHOW STORAGE VAULTS 命令用于显示系统中配置的所有storage vault的信息。storage vault用于管理数据外部存储位置。

## 语法

```sql
    SHOW STORAGE VAULTS
```

## 返回值

此命令返回一个结果集，包含以下列：

- `StorageVaultName`: storage vault 的名称。
- `StorageVaultId`: storage vault 的ID。
- `Properties`: 包含 storage vault 配置属性的JSON字符串。
- `IsDefault`: 指示该 storage vault 是否设置为默认值（TRUE或FALSE）。

## 相关命令

- [CREATE STORAGE VAULT](../Data-Definition-Statements/CREATE-STORAGE-VAULT.md)
- [GRANT](../Account-Management-Statements/GRANT.md)
- [REVOKE](../Account-Management-Statements/REVOKE.md)
- [SET DEFAULT STORAGE VAULT](../Data-Definition-Statements/SET-DEFAULT-STORAGE-VAULT.md)

## Keywords

    SHOW, STORAGE VAULTS
