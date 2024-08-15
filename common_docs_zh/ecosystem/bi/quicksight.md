---
{
    "title": "QuickSight",
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


## QuickSight 介绍
QuickSight 是一个强大的数据可视化分析平台，致力于将数据计算与美观的图表完美融合。它不要求用户具备编程技能，仅需通过拖放操作，就能迅速获取数据洞察。QuickSight 提供了多种视图选项，方便用户从不同角度探索数据。此外，它还支持轻松整合多个数据源，使得数据展示、探索和分析变得更加简单高效。这个平台不仅让数据处理变得快捷，还使分析过程更加直观和易于理解，极大地提升了用户的工作效率和分析能力。

## 数据配置

1. 注册账号后登录 QuickSight，然后选择数据集。

   ![dataset select](/images/bi-quicksight-en-1.png)

2. 在数据集选择的页面中选择 MySQL。

   ![database select](/images/bi-quicksight-en-2.png)

3. 在数据连接页面中填写对应 Doris 的 IP、端口、数据库名称、登录的用户名和密码。填写后点击连接测试，测试成功后创建链接。

   ![connection information](/images/bi-quicksight-en-3.png)

4. 创建数据源之后选择需要产生看板的表。

   ![jdbc connector download](/images/bi-quicksight-en-4.png)

5. QuickSight 有两种导入表的方式，可以根据自己的需求选择对应的导入方式。

   ![table select](/images/bi-quicksight-en-5.png)

6. 导入表之后，即可以创建所需要的看板。

   ![table import](/images/bi-quicksight-en-6.png)
