---
{
  "title": "OceanBase",
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

Doris JDBC Catalog 支持通过标准 JDBC 接口连接 OceanBase 数据库。本文档介绍如何配置 OceanBase 数据库连接。

## 使用须知

要连接到 OceanBase 数据库，您需要

- OceanBase 3.1.0 或更高版本

- OceanBase 数据库的 JDBC 驱动程序，您可以从 [Maven 仓库](https://mvnrepository.com/artifact/com.oceanbase/oceanbase-client)下载最新或指定版本的 OceanBase JDBC 驱动程序。**推荐使用 OceanBase Connector/J 2.4.8 或以上版本。**

- Doris 每个 FE 和 BE 节点和 OceanBase 服务器之间的网络连接。

## 连接 OceanBase

```sql
CREATE CATALOG oceanbase PROPERTIES (
    "type"="jdbc",
    "user"="root",
    "password"="password",
    "jdbc_url" = "jdbc:oceanbase://host:port/db",
    "driver_url" = "oceanbase-client-2.4.8.jar",
    "driver_class" = "com.oceanbase.jdbc.Driver"
)
```

:::info 备注
`jdbc_url` 定义要传递给 OceanBase JDBC 驱动程序的连接信息和参数。
支持的 URL 的参数可在 [OceanBase JDBC 驱动配置](https://www.oceanbase.com/docs/common-oceanbase-connector-j-cn-1000000000517111) 中找到。
:::

## 模式兼容

Doris 会在创建 OceanBase Catalog 时，自动识别 OceanBase 处于 MySQL 或 Oracle 模式下，以便正确解析元数据。

不同模式下的层级映射、类型映射、查询优化，与 MySQL 或 Oracle 数据库的 Catalog 处理方式相同，可参考文档

- [MySQL Catalog](./mysql.md)
- [Oracle Catalog](./oracle.md)
