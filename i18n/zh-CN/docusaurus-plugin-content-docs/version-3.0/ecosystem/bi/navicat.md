---
{
    "title": "Navicat",
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

## 介绍

Navicat 是一个功能强大的数据库管理工具，支持多种主流数据库系统，包括 MySQL、MariaDB、SQL Server、PostgreSQL 和 Apache Doris 等。它提供了直观的用户界面和丰富的功能，使得数据库管理、开发和维护变得更加高效和便捷。

Apache Doris 高度兼容 MySQL 协议，可以使用 Navicat 的 MySQL 连接方法连接 Apache Doris，并查询 internal catalog 和 external catalog 中的数据。

## 添加数据源

:::info 备注
当前验证使用 Navicat Premium 15.0.25 版本
:::

1. 启动 Navicat
2. 在 Navicat 窗口左上角点击 Connection 图标，在点击后弹出的数据库连接选项中选择 MySQL。

   ![add connection 1](/images/bi-navicat-en-1.png)

3. 配置Doris连接信息与测试连接

   在 Connection Settings 窗口的 main 标签页，配置以下连接信息：

 - Connection Name: 本次连接的连接名。
 - Host: Doris集群的 FE主机IP地址。
 - Port: Doris 集群的 FE 查询端口。
 - User name: Doris 集群登陆的用户名。
 - Password: Doris 集群中该用户的登录密码。

   填写对应的Doris连接信息后点击测试连接，若填写信息无误且网络连通会提示连接成功

   ![test connection](/images/bi-navicat-en-2.png)

4. 连接数据库

   数据库连接建立后，可以在左侧的数据库连接导航看到已创建的数据源连接，并且可以通过 Navicat 点击新建查询连接并管理数据库。

   ![new query](/images/bi-navicat-en-3.png)
