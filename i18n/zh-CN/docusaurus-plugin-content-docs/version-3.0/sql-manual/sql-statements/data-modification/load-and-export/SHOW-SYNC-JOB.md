---
{
    "title": "SHOW SYNC JOB",
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

此语句用于显示所有数据库中的常驻数据同步作业状态。

## 语法

```sql
SHOW SYNC JOB [FROM db_name]
```

## 可选参数
**1. `<db_name>`**
> 显示指定数据库下的所有数据同步作业状态。

## 权限控制  
执行此 SQL 命令的用户必须至少具有以下权限之一：  

| 权限                                                                 | 对象         | 说明                                      |  
|--------------------------------------------------------------------|------------|-----------------------------------------|  
| ADMIN_PRIV, SELECT_PRIV, LOAD_PRIV, ALTER_PRIV, CREATE_PRIV, DROP_PRIV, SHOW_VIEW_PRIV | 数据库 `db_name` | 执行此操作需至少拥有上述权限中的一项。 | 

## 示例

1. 显示当前数据库的所有数据同步作业状态。

   ```sql
   SHOW SYNC JOB;
   ```

2. 显示 `test_db` 数据库下的所有数据同步作业状态。

   ```sql
   SHOW SYNC JOB FROM `test_db`;
   ```