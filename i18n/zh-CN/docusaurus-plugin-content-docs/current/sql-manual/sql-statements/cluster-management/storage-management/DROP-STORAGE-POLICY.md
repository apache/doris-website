---
{
    "title": "DROP STORAGE POLICY",
    "language": "zh-CN",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4
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

删除存储策略。存储策略的详细说明，请参阅“存储策略”章节。

## 语法

```sql
DROP STORAGE POLICY <policy_name>
```

## 必选参数

**<policy_name>**

> 存储策略名称

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes） |
| :---------------- | :------------- | :------------ |
| ADMIN_PRIV        | 全局           |               |

## 示例

1. 删除名字为 policy1 的存储策略

```sql
DROP STORAGE POLICY policy1
```