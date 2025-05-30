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

Power BI 是软件服务、应用连接器的集合，其可以连接到多种数据源，包括 Excel、SQL Server、Azure、Google Analytics 等，以便用户可以轻松得整合和清洗数据。通过 Power BI 的数据建模，用户可以创建关系模型、数据分析表达式和数据关系，以支持高级的数据分析和可视化。Power BI 提供了丰富的可视化选项，包括图标、地图、仪表盘和自定义可视化工具，以帮助用户更直观地理解数据。

Apache Doris 社区提供了基于 Mysql ODBC 的 Power BI DirectQuery 自定义连接器，支持了 Apache Doris 的内部数据建模以及数据查询与可视化处理。

## 前置条件

- 未安装 Power BI Desktop 可以访问 [此处](https://www.microsoft.com/zh-cn/power-platform/products/power-bi/desktop)，下载安装 Power BI。
- 需要获取 [power-bi-doris](https://github.com/velodb/power-bi-doris/blob/master/Doris.mez) 自定义连接器。
- 未安装 Mysql ODBC 需要下载安装 [Mysql ODBC](https://downloads.mysql.com/archives/c-odbc/)，并配置 。

:::info Note
选择 MySQL ODBC Driver 5.3
:::

## Power BI 与 Doris 的自定义连接器配置

1. 参考此处路径：`\Power BI Desktop\Custom Connectors folder`，放置 `Doris.mez` 自定义连接器文件（如果路径不存在，按需手动创建）。
2. 在 Power BI Desktop 中，选择 `File` > `Options and settings` > `Options` > `Security`，在 `Data Extensions` 下，勾选 `(Not Recommended) Allow any extension to load without validation or warning` 。
3. 选择 `ok` ，然后重启 Power BI Desktop。

## 本地加载数据与创建模型

1. 启动 Power BI Desktop
2. 在 Power BI Desktop 打开界面点击新建报表。若已有本地报表可以选择打开已有报表

   ![start page](/images/powerbi/bi-powerbi-en-2.png)

3. 点击获取数据，在弹出窗口中选择 Doris 数据库

   ![get data](/images/powerbi/bi-powerbi-en-3-new.png)

4. 配置数据库连接信息，在服务器输入框中输入 host:port。Doris 默认的端口号为 9030

   ![connection information](/images/powerbi/bi-powerbi-en-4-new.png)

5. 上一步点击确定后在新的连接窗口处填写 Doris 的连接信息。

   ![uname and pwd](/images/powerbi/bi-powerbi-en-5-new.png)

6. 加载选中的表，使其表中数据至 Power BI Desktop

   ![load data](/images/powerbi/bi-powerbi-en-6.png)

7. 配置需要的统计罗盘

   ![create compass](/images/powerbi/bi-powerbi-en-7.png)

8. 把创建好的统计罗盘保存至本地

   ![savie file](/images/powerbi/bi-powerbi-en-8.png)

## 设置数据自动刷新

1. 下载 On-premises data gateway。下载地址：https://learn.microsoft.com/en-us/power-bi/connect-data/service-gateway-personal-mode
2. 安装 On-premises data gateway

   ![gateway install](/images/powerbi/bi-powerbi-en-9.png)

3. 登陆 Power BI Online，在个人的工作区中把刚保存的本地模型进行导入

   ![upload](/images/powerbi/bi-powerbi-en-10-zh.png)

4. 点击模型配置自动刷新时间

   ![click module](/images/powerbi/bi-powerbi-en-11-zh.png)

5. 数据刷新的配置需要有 gataway 连接，本地开启网关后可以在网关连接中看到本地启动的网关，选取本地的网关即可。更多关于 gateway：https://learn.microsoft.com/zh-cn/power-bi/connect-data/service-gateway-onprem

   ![config gateway](/images/powerbi/bi-powerbi-en-12-zh.png)

6. 配置相关刷新计划即可完成 Power BI 自动数据刷新

   ![make plan](/images/powerbi/bi-powerbi-en-13.png)

