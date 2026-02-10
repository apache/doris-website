---
{
    "title": "Quick BI",
    "language": "zh-CN",
    "description": "Quick BI 是一款基于数据仓库的商业智能工具，它可以帮助企业快速搭建起酷炫的可视化分析罗盘。Quick BI 支持多种数据源，包括 MySQL、Oracle、SQL Server、Apache Doris 等数据库，以及 Excel、CSV、JSON 等文件格式。它提供了丰富的可视化组件，"
}
---

## Quick BI 介绍
Quick BI 是一款基于数据仓库的商业智能工具，它可以帮助企业快速搭建起酷炫的可视化分析罗盘。Quick BI 支持多种数据源，包括 MySQL、Oracle、SQL Server、Apache Doris 等数据库，以及 Excel、CSV、JSON 等文件格式。它提供了丰富的可视化组件，如表格、图表、地图等，用户可以通过简单的拖拽操作，轻松实现数据的可视化分析。
## 数据连接与应用
1. 登录 Quick BI 并建立一个工作区。
2. 在当前的工作区下点击新建数据源

   ![create workspace](/images/bi-quickbi-en-1.png)

3. 在新建的数据源中选择 Apache Doris，并填写对应 Doris 的连接信息。

   ![Doris information](/images/bi-quickbi-en-2.png)

4. 连接成功后，可在数据源列表中看到我们创建的数据源。

   ![data source](/images/bi-quickbi-en-3.png)

5. 在创建的数据源中创建一个数据集，此处以 TPC-H 数据集为例。创建数据集后即可设置对应的报表。

   ![Doris table](/images/bi-quickbi-en-4.png)
