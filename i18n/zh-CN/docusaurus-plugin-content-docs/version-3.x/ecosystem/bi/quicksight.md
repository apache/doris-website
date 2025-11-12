---
{
    "title": "QuickSight",
    "language": "zh-CN"
}
---

QuickSight 可以通过官方 MySQL 数据源以 Directly query 或 Import 模式连接到 Apache Doris

## 前提条件

- Apache Doris  版本要求不低于 3.1.2
- 网络连通性（VPC、安全组配置），需要结合 Doris 部署环境进行配置，以保证 AWS 服务器能访问到你的 Doris 集群。
- 在连接到 Doris 的 MySQL client 上运行如下 SQL 来调整声明 MySQL 的兼容版本 ：

  ```sql
  SET GLOBAL version = '8.3.99';
  ```
  校验结果：
  ```sql
  mysql> show variables like "version";
  +---------------+--------+---------------+---------+
  | Variable_name | Value  | Default_Value | Changed |
  +---------------+--------+---------------+---------+
  | version       | 8.3.99 | 5.7.99        | 1       |
  +---------------+--------+---------------+---------+
  1 row in set (0.01 sec)
  ```

## 将 QuickSight 连接到 ClickHouse

首先，访问 [https://quicksight.aws.amazon.com](https://quicksight.aws.amazon.com/)，导航到数据集并点击“新建数据集”：

![](/images/ecomsystem/quicksight/Cm8EbaeoIoYDeAxGDR8cuSFhns1.png)

![](/images/ecomsystem/quicksight/XngnbqKxhouZHIxgVYhcyta5n3f.png)

搜索 QuickSight 捆绑的官方 MySQL 连接器（仅命名为 **MySQL**）：

![](/images/ecomsystem/quicksight/Pjf5bRheroLmtKxcZ2PcFYMkn7d.png)

指定您的连接详细信息。请注意，MySQL 接口端口默认为 9030，具体取决于您的 Fe `query_port` 配置可能会有所不同。

![](/images/ecomsystem/quicksight/DlJobTycDoqhDOxdUtCcqZCxnkc.png)

现在，您可以从列表中选择一个表：

![](/images/ecomsystem/quicksight/LAFXbSSnwop5C7xn3kPcEcBZnmc.png)

此外，您可以指定一个自定义 SQL 来获取您的数据：

![](/images/ecomsystem/quicksight/ASnSCopmkPwncLbB5FXZcEc7xn3.png)

这里推荐您选择 “Directly query” 模式：

![](/images/ecomsystem/quicksight/RN4fbtJU5o89gQxePQKcOGRBnyh.png)

此外，通过点击 “Edit/Preview data”，您应该能够看到内部结构的表结构或调整自定义 SQL ，并且可以在此处进行 数据集的调整：

![](/images/ecomsystem/quicksight/DoVOMbQTxBrRBpx3Bbgn2gcUXLd.png)

现在，您可以继续发布数据集并创建新的可视化！

![](/images/ecomsystem/quicksight/MXgObQbdDoLBVTxBrRBcUpx3n2g.png)
