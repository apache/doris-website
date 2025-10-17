---
{
   "title": "Tableau",
   "language": "zh-CN"
}
---

VeloDB 提供了一个官方的 Tableau Doris 连接器。 该连接器基于 MySQL JDBC Driver 实现访问数据。

该连接器通过 [TDVT framework](https://tableau.github.io/connector-plugin-sdk/docs/tdvt) 测试，通过率为 100%。

通过这个连接器，Tableau 可以将 Apache Doris 数据库和表作为数据源进行集成。要启用此功能，请遵循下面的设置指南：

- 安装 Tableau 和 Doris connector
- 在 Tableau 中配置 Apache Doris 数据源
- 在 Tableau 中构建可视化
- 连接和使用技巧
- 总结

## 安装 Tableau 和 Doris connector


1. 下载并安装 [Tableau desktop](https://www.tableau.com/products/desktop/download)。
2. 获取 [tableau-doris](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/Tableau/latest/doris_jdbc-latest.taco) 自定义连接器 connector（doris_jdbc-***.taco）。
3. 获取 [MySQL JDBC](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/Tableau/latest/mysql-connector-j-8.3.0.jar) （版本为 8.3.0）。
4. Connector 和 JDBC 驱动放置路径
   MacOS:
    - 参考此处路径：`~/Documents/My Tableau Repository/Connectors`，放置 `doris_jdbc-latest.taco` 自定义连接器文件（如果路径不存在，按需手动创建）。
    - JDBC 驱动 jar 包放置路径：`~/Library/Tableau/Drivers`
      Windows:
      假定 `tableau_path` 为 windows 操作系统中 tableau 的安装目录，
      一般默认为：`tableau_path = C:\Program Files\Tableau`
    - 参考此处路径：`%tableau_path%``\Connectors\`，放置 `doris_jdbc-latest.taco` 自定义连接器文件（如果路径不存在，按需手动创建）。
    - JDBC 驱动 jar 包放置路径：`%tableau_path%\Drivers\`

接下来，就可以在 Tableau 中配置一个 Doris 数据源并开始构建数据可视化！

## 在 Tableau 中配置 Doris 数据源


现在您已安装并设置了 **JDBC 和 Connector** 驱动程序，让我们来看一下如何在 Tableau 中定义一个连接到 Doris 中 tpch 数据库的数据源。

1. 收集您的连接详细信息

要通过 JDBC 连接到 Apache Doris，您需要以下信息：

| 参数                 | 含义                                                                 | 示例                          |
| -------------------- | -------------------------------------------------------------------- | ----------------------------- |
| Server               | 数据库 host                                                           | 127.0.1.28                    |
| Port                 | 数据库 MySQL 端口                                                     | 9030                          |
| Catalog              | Doris Catalog，查询外表和数据湖时使用，在高级配置（Advanced）中设置 | internal                      |
| Database             | 数据库名                                                               | tpch                          |
| Authentication       | 选择数据库访问权限方式，可选择：Username / Username and Password     | Username and Password         |
| Username             | 用户名                                                                 | testuser                      |
| Password             | 密码                                                                   | 留空                           |
| Init SQL Statement   | 初始化 SQL 语句                                                         | `select * from database.table` |


2. 启动 Tableau。（如果您在放置 connector 之前已经在运行它，请重新启动。）
3. 从左侧菜单中，点击 **To a Server** 部分下的 **More**。在可用连接器列表中搜索 **Doris JDBC by VeloDB**：

![](/images/ecomsystem/tableau/p01.png)

4. 点击 **Doris by VeloDB ，将会弹出以下对话框：**

![](/images/ecomsystem/tableau/p02.png)

5. 按照对话框提示输入相应的连接信息。
6. 可选进阶配置：

   - 可以在 Initial SQL 中输入预置 SQL 来定义数据源
       ![](/images/ecomsystem/tableau/p03.png)
   - 在 Advanced 中，可以使用 Catalog 来实现数据湖数据源的访问，默认值为 internal,
       ![](/images/ecomsystem/tableau/p04.png)
7. 在上述输入框完成后，即可点击 **Sign In** 按钮，您应该会看到一个新的 Tableau 工作簿：
   ![](/images/ecomsystem/tableau/p05.png)

接下来，就可以在 Tableau 中构建一些可视化了！

## 在 Tableau 中构建可视化

我们选择 TPC-H 数据作为数据源，Doris TPC-H 数据源构建方式参考[此文档](../../benchmark/tpch.md)

现在我们在 Tableau 中配置了 Doris 数据源，让我们可视化数据

1. 将 customer 表 和 orders 表拖到工作簿中。并在下方为他们选定表关联字段 Custkey

![](/images/ecomsystem/tableau/p06.png)

2. 将 nation 表拖到工作簿中 并 与 customer 表 选定表关联字段 Nationkey
   ![](/images/ecomsystem/tableau/p07.png)
3. 现在您已经将 customer 表、 orders 表 和 nation 表关联为数据源，因此您可以利用此关系处理有关数据的问题。选择工作簿底部的 `Sheet 1` 选项卡，进入工作台。
   ![](/images/ecomsystem/tableau/p08.png)
4. 假设您想知道每年的用户量汇总。将 OrderDate 从 orders 拖动到 `Columns` 区域（水平字段），然后将 customer(count) 从 customer 拖到 `Rows`。Tableau 将生成以下折线图：
   ![](/images/ecomsystem/tableau/p09.png)

一张简单的折线图就制作完成了，但该数据集是通过 tpch 脚本和默认规则自动生成的非实际数据，不具备参考性，旨在测试可用与否。

5. 假设您想知道按地域（国别）和年份计算的平均订单金额（美元）：
    - 点击 `New Worksheet` 选项卡创建新表
    - 将 Name 从 nation 表拖入 `Rows`
    - 将 OrderDate 从 orders 表 拖入 `Columns`

您应该会看到以下内容：
![](/images/ecomsystem/tableau/p10.png)

6. 注意：`Abc` 值只是填充值，因为您未将聚合逻辑定义到该图标，因此需要您拖动度量到表格上。将 Totalprice 从 orders 表拖到表格中间。请注意默认的计算是对 Totalprices 进行 SUM：
   ![](/images/ecomsystem/tableau/p11.png)
7. 点击 `SUM` 并将 `Measure` 更改为 `Average`。
   ![](/images/ecomsystem/tableau/p12.png)
8. 从同一下拉菜单中选择 `Format ` 将 `Numbers` 更改为 `Currency (Standard)`：
   ![](/images/ecomsystem/tableau/p13.png)
9. 得到一张符合预期的表格：
   ![](/images/ecomsystem/tableau/p14.png)

至此，已经成功将 Tableau 连接到 Apache Doris，并实现了数据分析和可视化看板制作。

## 连接和使用技巧

**性能优化**

- 根据实际需求，合理创建 doris 库表，按时间分区分桶，可有效减少谓词过滤和大部分数据传输
- 适当的数据预聚合，可以通过 Doris 侧创建物化视图的方式。
- 设置合理的刷新计划，均衡刷新的计算资源消耗 和 看板数据时效性

**安全配置**

- 建议使用 VPC 私有连接，避免公网访问引入安全风险。
- 配置 安全组 限制访问。
- 启用 SSL/TLS 连接等访问方式。
- 细化 Doris 用户账号角色和访问权限，避免过度下放权限。

## 总结

这个连接器简化了通用 ODBC/JDBC 驱动程序的连接器 连接设置流程，为 Apache Doris 提供了更好兼容的连接器。如果您在使用连接器时遇到任何问题，请随时在 [GitHub](https://github.com/apache/doris/issues) 联系我们。

