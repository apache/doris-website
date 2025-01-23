---
{
    "title": "SHOW PLUGINS",
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

该语句用于展示已安装的插件

## 语法

```sql
SHOW PLUGINS
```

## 返回值

| Description | Version | JavaVersion | ClassName | SoName   | Sources | Status | Properties |
|--------|---------|-------------|------|----------|------|------|-------|
| 对应插件描述 | 插件对应版本号 | 对应 Java 版本号 | 程序类名 | 程序共享对象名称 | 插件来源 | 安装状态 | 插件属性  |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限         | 对象   | 说明            |
|:-----------|:-----|:--------------|
| ADMIN_PRIV | 整个集群 | 需要对整个集群具有管理权限 |

## 示例

- 展示已安装的插件：

    ```SQL
    SHOW PLUGINS;
    ```

    ```text
    |Description|Version|JavaVersion|ClassName|SoName|Sources|Status|Properties|
    |-----------|-------|-----------|---------|------|-------|------|----------|
    |builtin audit loader, to load audit log to internal table|2.1.0|1.8.31|org.apache.doris.plugin.audit.AuditLoader||Builtin|INSTALLED|{}|
    |builtin audit logger|0.12.0|1.8.31|org.apache.doris.plugin.audit.AuditLogBuilder||Builtin|INSTALLED|{}|
    |builtin sql dialect converter|2.1.0|1.8.31|org.apache.doris.plugin.dialect.HttpDialectConverterPlugin||Builtin|INSTALLED|{}|
    ```
