---
{
    "title": "Power BI",
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

## Power BI 介绍

Power BI 是软件服务、应用连接器的集合，其可以连接到多种数据源，包括 Excel、SQL Server、Azure、Google Analytics 等，以便用户可以轻松得整合和清洗数据。通过 Power BI 的数据建模，用户可以创建关系模型、数据分析表达式和数据关系，以支持高级的数据分析和可视化。 Power BI 提供了丰富的可视化选项，包括图标、地图、仪表盘和自定义可视化工具，以帮助用户更直观地理解数据。

Apache Doris 高度兼容 MySQL 协议，可以通过 MySQL 驱动器连接 Power BI 与 Apache Doris，当前 Power BI 中已经正式支持了 Apache Doris 的内部数据建模以及数据查询与可视化处理。

## 前置条件

未安装 Power BI Desktop 可以访问 https://www.microsoft.com/zh-cn/power-platform/products/power-bi/desktop 下载安装 Power BI。

## Power BI与Doris的Connector配置

:::info Note
选择8.0.26版本的 MySQL JDBC Connector
:::

MySQL Connector 下载

下载链接：https://downloads.mysql.com/archives/c-net/ 

## 本地加载数据与创建模型

1. 启动 Power BI Desktop
2. 在 Power BI Desktop 打开界面点击新建报表。若已有本地报表可以选择打开已有报表

   ![start page](/images/powerbi/bi-powerbi-en-2.png)

3. 点击获取数据，在弹出窗口中选择MySQL数据库

   ![get data](/images/powerbi/bi-powerbi-en-3.png)

4. 配置数据库连接信息，在服务器输入框中输入ip:port。Doris默认的端口号为9030

   ![connection information](/images/powerbi/bi-powerbi-en-4.png)

5. 上一步点击确定后在新的连接窗口处选择"数据库"连接，并在用户名与密码处填写Doris的连接信息。

   ![uname and pwd](/images/powerbi/bi-powerbi-en-5.png)

6. 加载选中的表，使其表中数据至 Power BI Desktop

   ![load data](/images/powerbi/bi-powerbi-en-6.png)

7. 配置需要的统计罗盘

   ![create compass](/images/powerbi/bi-powerbi-en-7.png)

8. 把创建好的统计罗盘保存至本地

   ![savie file](/images/powerbi/bi-powerbi-en-8.png)

## 设置数据自动刷新

1. 下载On-premises data gateway。下载地址：https://learn.microsoft.com/en-us/power-bi/connect-data/service-gateway-personal-mode
2. 安装On-premises data gateway

   ![gateway install](/images/powerbi/bi-powerbi-en-9.png)

3. 登陆 Power BI Online，在个人的工作区中把刚保存的本地模型进行导入

   ![upload](/images/powerbi/bi-powerbi-en-10-zh.png)

4. 点击模型配置自动刷新时间

   ![click module](/images/powerbi/bi-powerbi-en-11-zh.png)

5. 数据刷新的配置需要有gataway连接，本地开启网关后可以在网关连接中看到本地启动的网关，选取本地的网关即可。更多关于gateway：https://learn.microsoft.com/zh-cn/power-bi/connect-data/service-gateway-onprem

   ![config gateway](/images/powerbi/bi-powerbi-en-12-zh.png)

6. 配置相关刷新计划即可完成 Power BI自动数据刷新

   ![make plan](/images/powerbi/bi-powerbi-en-13.png)

