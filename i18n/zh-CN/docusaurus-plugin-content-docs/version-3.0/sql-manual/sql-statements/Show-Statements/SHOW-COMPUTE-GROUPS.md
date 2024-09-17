---
{
    "title": "SHOW COMPUTE GROUPS",
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

SHOW COMPUTE GROUPS 命令用于显示系统中所有已配置的计算组的信息。计算组是用于管理和组织计算资源的逻辑单元，可以帮助用户更有效地分配和使用系统资源。

此命令可以帮助管理员和用户快速了解系统中现有的计算组配置，包括每个计算组的名称、属性和其他相关信息。这对于资源管理、性能优化和系统监控非常有用。

## 语法

```sql
    SHOW COMPUTE GROUPS
```

## 返回值

此命令返回一个结果集，包含以下列：

- `Name`: 计算组的名称。
- `IsCurrent`: 是否当前工作计算组。
- `Users`: 显示有权限使用该计算组的用户列表。
- `BackendNum`: 显示当前分配给该计算组的后端（计算节点）数量。

## 相关命令

- [ALTER SYSTEM ADD BACKEND](../Administration-Statements/ALTER-SYSTEM-ADD-BACKEND.md)
- [GRANT](../Account-Management-Statements/GRANT.md)
- [REVOKE](../Account-Management-Statements/REVOKE.md)
- [SET DEFAULT COMPUTE GROUP](../Administration-Statements/SET-DEFAULT-COMPUTE-GROUP.md)

## Keywords

    SHOW, COMPUTE GROUPS
