---
{
    "title": "QuickSight",
    "language": "zh-CN",
    "description": "QuickSight 可以通过官方 MySQL 数据源以 Directly query 或 Import 模式连接到 Apache Doris"
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

## 将 QuickSight 连接到 Apache Doris

首先，访问 [https://quicksight.aws.amazon.com](https://quicksight.aws.amazon.com/)，导航到数据集并点击“新建数据集”：

![](/images/ecomsystem/quicksight/Cm8EbaeoIoYDeAxGDR8cuSFhns1.png)

![](/images/ecomsystem/quicksight/XngnbqKxhouZHIxgVYhcyta5n3f.png)

搜索 QuickSight 捆绑的官方 MySQL 连接器：

![](/images/ecomsystem/quicksight/Pjf5bRheroLmtKxcZ2PcFYMkn7d.png)

指定您的连接详细信息。请注意，MySQL 接口端口默认为 9030，具体取决于您的 Fe `query_port` 配置可能会有所不同。

![](/images/ecomsystem/quicksight/DlJobTycDoqhDOxdUtCcqZCxnkc.png)

现在，您可以从列表中选择一个表：

![](/images/ecomsystem/quicksight/LAFXbSSnwop5C7xn3kPcEcBZnmc.png)

这里推荐您选择 “Directly query” 模式：

![](/images/ecomsystem/quicksight/RN4fbtJU5o89gQxePQKcOGRBnyh.png)

此外，通过点击 “Edit/Preview data”，您应该能够看到内部结构的表结构或调整自定义 SQL ，并且可以在此处进行 数据集的调整：

![](/images/ecomsystem/quicksight/DoVOMbQTxBrRBpx3Bbgn2gcUXLd.png)

现在，您可以继续发布数据集并创建新的可视化！

![](/images/ecomsystem/quicksight/MXgObQbdDoLBVTxBrRBcUpx3n2g.png)

## 在 QuickSight 中构建可视化

我们选择 TPC-H 数据作为数据源，Doris TPC-H 数据源构建方式参考[此文档](../../benchmark/tpch)

现在我们在 QuickSight 中配置了 Doris 数据源，让我们可视化数据...

由于Doris 在多表关联场景下的出色性能，我们选择一个设计多表关联的场景，假设我们需要知道各个国家不同状态的订单统计，接下来按照此需求进行看板构建

1. 使用上述步骤创建的 Data source 添加以下表作为 Dataset

- customer
- nation
- orders

2. 点击 创建数据集

![](/images/ecomsystem/quicksight/LDeebS3RdoB6hPxcYkacV88VnMd.png)

3. 选用上述步骤创建的数据源

![](/images/ecomsystem/quicksight/LQlLb26gZoXOurxO3AJc0xCBnqd.png)

4. 选择需要的表

![](/images/ecomsystem/quicksight/W7bDb42r4ovxr3xGDU0cRxmbnsf.png)

选择 Directly query 模式

![](/images/ecomsystem/quicksight/Nllyb7GkJo8ToCxXSuDc4gNgnvg.png)

点击 Visualize 创建数据源，按照此步骤为其他表也创建数据源

5. 进入仪表盘制作工作台，点击当前 Dataset 下拉框，选择 添加新的数据集

![](/images/ecomsystem/quicksight/D18HbY2PWoQvMOxlJTRcOfZenEh.png)

6. 将所有的数据集依次勾选，点击 Select，添加入该仪表盘

![](/images/ecomsystem/quicksight/TzM6boK9No1wD0xBBeAcaJGcnDd.png)

7. 完成后点击 nation 的操作界面 进入编辑数据集界面，我们接下来为数据集进行列关联

![](/images/ecomsystem/quicksight/Y0GpbCY0oo6xeYxfufAcPAC6n1e.png)

8. 如图点击 Add data 添加 数据源

![](/images/ecomsystem/quicksight/ZNKgbdPivoM3y7xwr8kcZbWPn8c.png)

9. 将三张表添加进去后，进行关联键，关联关系如下：
    - **customer** ：c_nationkey  --  **nation** : n_nationkey
    - **customer** ：c_custkey  --  **orders** : o_custkey

![](/images/ecomsystem/quicksight/HVNIbL0yDouA8axQmIocXFhFnmc.png)

10. 最终关联完成，点击右上角 Save & publish 发布

![](/images/ecomsystem/quicksight/CD9pbqFIOouYFtxUrs9cMlyAnph.png)

11. 回到刚刚添加三个数据源的 Analyses 界面，点击 n_name 出现按 国家名称的订单总数统计图

![](/images/ecomsystem/quicksight/D6Yrb7Igwo5520x3WBbcZ8T9n9f.png)

12. 点击 VALUE 选中 o_orderkey ， 点击 GROUP/COLOR 选中 o_orderstatus ，即可得到需求看板

![](/images/ecomsystem/quicksight/Sl8nbfrszok2bexesfwcsNqbngc.png)

13. 点击右上角 Publish 即可完成 看板发布

至此，已经成功将 QuickSight 连接到 Apache Doris，并实现了数据分析和可视化看板制作。
