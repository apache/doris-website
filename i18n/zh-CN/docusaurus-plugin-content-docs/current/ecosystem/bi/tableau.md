---
{
    "title": "Tableau",
    "language": "zh-CN",
    "description": "对于在 Tableau 上实现 Apache Doris 访问，Tableau 官方的 MySQL 连接器可以满足需求。 该连接器基于 MySQL JDBC Driver 实现访问数据。"
}
---

对于在 Tableau 上实现 Apache Doris 访问，Tableau 官方的 MySQL 连接器可以满足需求。 该连接器基于 MySQL JDBC Driver 实现访问数据。

通过 MySQL 连接器，Tableau 可以将 Apache Doris 数据库和表作为数据源进行集成。要启用此功能，请遵循下面的设置指南：

- 使用前所需的设置
- 在 Tableau 中配置 Apache Doris 数据源
- 在 Tableau 中构建可视化
- 连接和使用技巧

## 安装 Tableau 和 JDBC 驱动

1. 下载并安装 [Tableau desktop](https://www.tableau.com/products/desktop/download)。
2. 获取 [MySQL JDBC](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/Tableau/latest/mysql-connector-j-8.3.0.jar) （版本为 8.3.0）。
3. JDBC 驱动放置路径
   - MacOS：JDBC 驱动 jar 包放置路径：`~/Library/Tableau/Drivers`
   - Windows：假定 `tableau_path` 为 windows 操作系统中 tableau 的安装目录，一般默认为：`tableau_path = C:\Program Files\Tableau` 则，JDBC 驱动 jar 包放置路径：`%tableau_path%\Drivers\`

接下来，就可以在 Tableau 中配置一个 Doris 数据源并开始构建数据可视化！

## 在 Tableau 中配置 Doris 数据源

现在您已安装并设置了 **JDBC 和 Connector** 驱动程序，让我们来看一下如何在 Tableau 中定义一个连接到 Doris 中 tpch 数据库的数据源。

1. 收集您的连接详细信息

要通过 JDBC 连接到 Apache Doris，您需要以下信息：

| 参数                 | 含义                                                                 | 示例                       |
| -------------------- | -------------------------------------------------------------------- | ------------------------- |
| Server               | 数据库 host                                                           | 127.0.1.28                |
| Port                 | 数据库 MySQL 端口                                                     | 9030                      |
| Database             | 数据库名                                                               | tpch                      |
| Username             | 用户名                                                                 | testuser                  |
| Password             | 密码                                                                   |                          |
| Init SQL Statement   | 初始化 SQL 语句                                                         | `select * from database.table` |


2. 启动 Tableau。（如果您已经在运行它，请重新启动。）
3. 从左侧菜单中，点击 **To a Server** 部分下的 **More**。在可用连接器列表中搜索 **mysql **

![](/images/ecomsystem/tableau/QSrsbadm0oEiuHxyGv3clFhTnLh.png)

4. 点击 **MySql **，将会弹出以下对话框：

![](/images/ecomsystem/tableau/DN47bCp5ZovHCmxH0DAc3fBonR3.png)

5. 按照对话框提示输入相应的连接信息。
6. 在上述输入框完成后，即可点击 **Sign In** 按钮，您应该会看到一个新的 Tableau 工作簿：
   ![](/images/ecomsystem/tableau/LJK9bPMptoAGjGxzoCtcY8Agnye.png)

接下来，就可以在 Tableau 中构建一些可视化了！

## 在 Tableau 中构建可视化

我们选择 TPC-H 数据作为数据源，Doris TPC-H 数据源构建方式参考[此文档](../../benchmark/tpch.md)

现在我们在 Tableau 中配置了 Doris 数据源，让我们可视化数据

1. 将 customer 表 和 orders 表拖到工作簿中。并在下方为他们选定表关联字段 Custkey
   ![](/images/ecomsystem/tableau/ZJuBbDBc5o2Gnyxhn7icv30xnXw.png)
2. 将 nation 表拖到工作簿中 并 与 customer 表 选定表关联字段 Nationkey
   ![](/images/ecomsystem/tableau/GPXQbcNUnobHtLx5sIocMHAwn2d.png)
3. 现在您已经将 customer 表、 orders 表 和 nation 表关联为数据源，因此您可以利用此关系处理有关数据的问题。选择工作簿底部的 `Sheet 1` 选项卡，进入工作台。
   ![](/images/ecomsystem/tableau/FsHmbUOKIoFT5YxWmGecLArLnjd.png)
4. 假设您想知道每年的用户量汇总。将 OrderDate 从 orders 拖动到 `Columns` 区域（水平字段），然后将 customer(count) 从 customer 拖到 `Rows`。Tableau 将生成以下折线图：
   ![](/images/ecomsystem/tableau/I9SCbCFzoo7TgLx6BP1cHdtRnWc.png)

一张简单的折线图就制作完成了，但该数据集是通过 tpch 脚本和默认规则自动生成的非实际数据，不具备参考性，旨在测试可用与否。

5. 假设您想知道按地域（国别）和 年份计算的平均订单金额（美元）：
    - 点击 `New Worksheet` 选项卡创建新表
    - 将 Name 从 nation 表拖入 `Rows`
    - 将 OrderDate 从 orders 表 拖入 `Columns`

您应该会看到以下内容：

6. 注意：`Abc` 值只是填充值，因为您未将聚合逻辑定义到该图标，因此需要您拖动度量到表格上。将 Totalprice 从 orders 表拖到表格中间。请注意默认的计算是对 Totalprices 进行 SUM：
   ![](/images/ecomsystem/tableau/Am9IbyUo4o30DixVi2ccoZvKn8b.png)
7. 点击 `SUM` 并将 `Measure` 更改为 `Average`。
   ![](/images/ecomsystem/tableau/AaFwbMOKTo86NaxU54mcVYs1nJd.png)
8. 从同一下拉菜单中选择 `Format ` 将 `Numbers` 更改为 `Currency (Standard)`：
   ![](/images/ecomsystem/tableau/ZmRDbjws9o5Ampx4YZYcS6Umnqf.png)
9. 得到一张符合预期的表格：
   ![](/images/ecomsystem/tableau/MNb0bjoB2ozn4kxfKx9cVj2hnhb.png)

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
