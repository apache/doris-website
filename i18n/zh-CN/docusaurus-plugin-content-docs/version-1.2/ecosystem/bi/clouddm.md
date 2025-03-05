---
{
  "title": "CloudDM",
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

CloudDM 是 ClouGence 出品的适用于关系数据库和 NoSQL 数据库的跨平台数据库工具。

CloudDM 对 Apache Doris 进行了适配，通过添加 Doris 数据源进行数据查询等操作。

## 前置条件

已安装 CloudDM
可以访问 https://www.clougence.com/clouddm-personal 下载安装 CloudDM

## 添加数据源

:::info 备注
当前验证使用 CloudDM 3.0.1 版本
:::

1. 启动 CloudDM
2. 在 CloudDM 点击上方的数据源管理后，点击 (**+新增数据源**) 图标

   ![添加数据源](/images/clouddm1.png)

3. 配置 Doris 连接

   在 新增数据源 页面，选择 Doris 数据源配置以下连接信息：

    - Client地址：Doris 集群的 FE 主机地址，如 192.0.0.1:9030。
    - 账号：用于登录 Doris 集群的用户名，如 admin。
    - 密码：用于登录 Doris 集群的用户密码。
      ![配置连接](/images/clouddm2.png)

4. 添加数据源
   在填写完连接信息后，单击下方 新增数据源。CloudDM 跳转如下页面则添加成功。然后单击查看数据源跳转到数据查询页面。
   ![添加数据源](/images/clouddm3.png)


5. 使用数据库

   数据库连接建立以后，可以在左侧的数据库连接导航看到已创建的数据源连接，并且可以通过 CloudDM 连接并管理数据库。

   ![数据查询](/images/clouddm4.png)

## 功能支持

- 完全支持
    - 可视化查看类
        - Databases
            - Tables
            - Views
            - Functions
    - 操作类
        - SQL 控制台
        - 可视化创建表
        - 可视化修改表结构
        - 可视化创建 Schema
        - 可视化增删改查

- 不支持

  不支持部分意为使用 CloudDM 管理 Doris 进行某些可视化操作时可能会报错，或者某些可视化操作未经验证
  如 增删改查未经验证的数据类型、系统信息等
