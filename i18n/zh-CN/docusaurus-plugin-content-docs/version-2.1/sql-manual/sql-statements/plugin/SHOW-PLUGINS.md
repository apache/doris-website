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

|描述|版本|Java 版本|类名|共享对象名称|来源|状态|属性|
|-----------|-------|-----------|---------|------|-------|------|----------|
|内置审计加载器，用于将审计日志加载到内部表中|2.1.0|1.8.31|org.apache.doris.plugin.audit.AuditLoader||内置|已安装|{}|
|内置审计记录器|0.12.0|1.8.31|org.apache.doris.plugin.audit.AuditLogBuilder||内置|已安装|{}|
|内置 SQL 方言转换器|2.1.0|1.8.31|org.apache.doris.plugin.dialect.HttpDialectConverterPlugin||内置|已安装|{}|

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限         | 对象   | 说明            |
|:-----------|:-----|:--------------|
| Admin_priv | 整个集群 | 需要对整个集群具有管理权限 |

## 示例

- 展示已安装的插件：

    ```SQL
    SHOW PLUGINS;
    ```
