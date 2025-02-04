---
{
    "title": "FineBI",
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

## FineBI 介绍

FineBI 是一款商业智能产品，其具有数据处理、即时分析、多维度分析Dashboard 等多种功能系统架构，FineBI支持丰富的数据源连接、多种视图对表的分析管理。FineBI 可以顺利支持Apache Doris 的内部数据和外部数据的建模与可视化处理。

## 前置条件

安装FineBI 5.0及以上版本，下载链接：https://www.finebi.com/

## 登录与连接

1. 创建登录的账户，并使用该账户登录FineBI

   ![login page](/images/bi-finebi-en-1.png)

2. 这里选择内置数据库，若需要选择外部数据库配置文档可参考：https://help.fanruan.com/finebi/doc-view-437.html

   :::info Note
   这里建议选择内置数据库作为帆软BI 的信息存储库，这里选择的数据库类型不是查询分析数据的目标库，而是存储维护帆软BI 模型、仪表盘等信息的数据库，帆软需要对其进行增删改查的操作。
   :::

   ![select database](/images/bi-finebi-en-2.png)

3. 点击管理系统按钮之后选择数据连接中的数据库连接，进而创建一个新的数据库连接

   ![data connection](/images/bi-finebi-en-3.png)

4. 在新数据库连接选择界面选择MySQL

   ![select connection](/images/bi-finebi-en-4.png)

5. 填写Doris数据库的相关连接信息

    - 参数说明如下：

        - Username：用于登录 Doris 集群的用户名，如 admin。

        - Password：用于登录 Doris 集群的用户密码。

        - Host：Doris 集群的 FE 主机 IP 地址。

        - Port：Doris 集群的 FE 查询端口，如 9030。

        - Coding：Doris 集群中的编码格式。

        - Name Database：Doris 集群中的目标数据库。

   ![connection information](/images/bi-finebi-en-5.png)

6. 点击测试链接。如果输入的连接信息正确则会弹出连接成功

   ![connection test](/images/bi-finebi-en-6.png)

## 创建数据模型

1. 在公共数据中点击创建一个新的数据集，添加Doris 数据集时可点击数据库表

   ![new dataset](/images/bi-finebi-en-7.png)

2. 选择已有数据库连接下需要导入的表

   ![select table](/images/bi-finebi-en-8.png)

3. 导入表后需要对每个导入的表进行刷新，只有刷新后才可以在主题中对该表进行数据分析

   ![refresh table](/images/bi-finebi-en-9.png)

4. 在编辑的主题中添加导入的公共数据，然后即可按照业务逻辑进行罗盘分析与配置。

   ![data analysis](/images/bi-finebi-en-10.png)