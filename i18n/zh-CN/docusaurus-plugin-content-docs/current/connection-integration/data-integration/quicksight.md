---
{
    "title": "QuickSight",
    "language": "zh-CN",
    "description": "在 Amazon QuickSight 中通过 MySQL 数据源连接 Apache Doris，配置 Directly query 数据集，并基于 TPC-H 数据构建可视化看板。",
    "keywords": [
        "QuickSight 连接 Doris",
        "Amazon QuickSight Apache Doris",
        "Doris 可视化分析",
        "QuickSight Directly query"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: BI 工具对接 / 可视化分析 -->

QuickSight 可以通过官方 MySQL 数据源连接 Apache Doris，并支持 **Directly query** 或 **Import** 模式。本文面向希望在 QuickSight 中分析 Doris 数据的用户，介绍连接准备、数据集创建，以及基于 TPC-H 数据构建多表关联可视化看板的流程。

## 适用场景

| 使用场景 | 用户目标 | 操作结果 |
| --- | --- | --- |
| 接入 Doris 数据源 | 在 QuickSight 中通过官方 MySQL 数据源连接 Apache Doris | QuickSight 可以访问 Doris 集群中的数据 |
| 创建分析数据集 | 基于 Doris 表创建 QuickSight Dataset | 数据集可用于后续分析和可视化 |
| 构建多表关联看板 | 使用 TPC-H 的 `customer`、`nation`、`orders` 表进行关联分析 | 生成按国家和订单状态统计订单数量的看板 |

## 操作流程

| 阶段 | 操作目标 | 说明 |
| --- | --- | --- |
| 第一步 | 完成连接前准备 | 确认 Doris 版本、网络连通性和 MySQL 兼容版本 |
| 第二步 | 创建 QuickSight 数据源 | 使用 QuickSight 官方 MySQL 连接器连接 Apache Doris |
| 第三步 | 创建 Dataset | 选择 Doris 表并使用 **Directly query** 模式创建数据集 |
| 第四步 | 构建可视化看板 | 添加多个 Dataset，配置表关联，并发布分析看板 |

## 前提条件

开始配置前，请确认以下条件已经满足：

| 准备项 | 要求 |
| --- | --- |
| Doris 版本 | Apache Doris 版本不低于 3.1.2 |
| 网络连通性 | 根据 Doris 部署环境配置 VPC 和安全组，确保 AWS 服务器可以访问 Doris 集群 |
| MySQL 兼容版本 | 在连接 Doris 的 MySQL client 上声明 MySQL 兼容版本 |

在连接 Doris 的 MySQL client 上执行以下 SQL，声明 MySQL 兼容版本：

```sql
SET GLOBAL version = '8.3.99';
```

执行以下 SQL 校验配置结果：

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

本节介绍如何在 QuickSight 中创建 Doris 数据源，并基于 Doris 表创建 Dataset。

### 第一步：新建 QuickSight 数据集

访问 [QuickSight 控制台](https://quicksight.aws.amazon.com/)，进入数据集页面，并点击 **新建数据集**。

![进入 QuickSight 数据集页面](/images/next/connection-integration/data-integration/quicksight/Cm8EbaeoIoYDeAxGDR8cuSFhns1.png)

![新建 QuickSight 数据集](/images/next/connection-integration/data-integration/quicksight/XngnbqKxhouZHIxgVYhcyta5n3f.png)

### 第二步：选择 MySQL 连接器

搜索并选择 QuickSight 内置的官方 MySQL 连接器。

![选择 QuickSight MySQL 连接器](/images/next/connection-integration/data-integration/quicksight/Pjf5bRheroLmtKxcZ2PcFYMkn7d.png)

### 第三步：填写 Doris 连接信息

按页面要求填写 Doris 连接信息。MySQL 接口端口默认为 `9030`，实际端口以 Doris FE 的 `query_port` 配置为准。

![填写 Doris 连接信息](/images/next/connection-integration/data-integration/quicksight/DlJobTycDoqhDOxdUtCcqZCxnkc.png)

### 第四步：选择 Doris 表和查询模式

从列表中选择需要分析的 Doris 表。

![选择 Doris 表](/images/next/connection-integration/data-integration/quicksight/LAFXbSSnwop5C7xn3kPcEcBZnmc.png)

建议选择 **Directly query** 模式。

![选择 Directly query 模式](/images/next/connection-integration/data-integration/quicksight/RN4fbtJU5o89gQxePQKcOGRBnyh.png)

点击 **Edit/Preview data** 后，可以查看表结构、调整自定义 SQL，并在此处修改 Dataset。

![预览和编辑 QuickSight Dataset](/images/next/connection-integration/data-integration/quicksight/DoVOMbQTxBrRBpx3Bbgn2gcUXLd.png)

### 第五步：发布 Dataset 并创建可视化

完成 Dataset 配置后，可以继续发布数据集并创建新的可视化。

![发布 QuickSight Dataset](/images/next/connection-integration/data-integration/quicksight/MXgObQbdDoLBVTxBrRBcUpx3n2g.png)

## 在 QuickSight 中构建可视化

本节以 TPC-H 数据作为数据源，演示如何在 QuickSight 中构建基于多表关联的可视化看板。Doris TPC-H 数据源的构建方式请参考 [TPC-H 基准测试文档](../../benchmark/tpch)。

示例目标是统计各个国家在不同订单状态下的订单数量。由于 Doris 在多表关联场景下具有较好的查询性能，本文使用 `customer`、`nation` 和 `orders` 三张表进行关联分析。

### 第一步：基于 Doris 表创建 Dataset

1. 使用前面创建的 Data source 添加以下表作为 Dataset：

    - `customer`
    - `nation`
    - `orders`

2. 点击 **创建数据集**。

    ![创建 QuickSight 数据集](/images/next/connection-integration/data-integration/quicksight/LDeebS3RdoB6hPxcYkacV88VnMd.png)

3. 选择前面创建的数据源。

    ![选择已创建的数据源](/images/next/connection-integration/data-integration/quicksight/LQlLb26gZoXOurxO3AJc0xCBnqd.png)

4. 选择需要的表。

    ![选择需要分析的表](/images/next/connection-integration/data-integration/quicksight/W7bDb42r4ovxr3xGDU0cRxmbnsf.png)

5. 选择 **Directly query** 模式。

    ![为 Dataset 选择 Directly query 模式](/images/next/connection-integration/data-integration/quicksight/Nllyb7GkJo8ToCxXSuDc4gNgnvg.png)

6. 点击 **Visualize** 创建数据源，并按照相同步骤为其他表创建数据源。

### 第二步：向分析中添加多个 Dataset

1. 进入仪表盘制作工作台，点击当前 Dataset 下拉框，选择 **添加新的数据集**。

    ![在分析中添加新的数据集](/images/next/connection-integration/data-integration/quicksight/D18HbY2PWoQvMOxlJTRcOfZenEh.png)

2. 勾选所有需要使用的数据集，点击 **Select**，将其添加到当前仪表盘。

    ![选择多个 Dataset](/images/next/connection-integration/data-integration/quicksight/TzM6boK9No1wD0xBBeAcaJGcnDd.png)

### 第三步：配置 Dataset 关联关系

1. 添加完成后，点击 `nation` 的操作入口，进入编辑数据集界面。

    ![进入 nation 数据集编辑界面](/images/next/connection-integration/data-integration/quicksight/Y0GpbCY0oo6xeYxfufAcPAC6n1e.png)

2. 点击 **Add data** 添加数据源。

    ![添加数据源到 Dataset](/images/next/connection-integration/data-integration/quicksight/ZNKgbdPivoM3y7xwr8kcZbWPn8c.png)

3. 将三张表添加进去后，配置关联键。关联关系如下：

    | 左表 | 左字段 | 右表 | 右字段 |
    | --- | --- | --- | --- |
    | `customer` | `c_nationkey` | `nation` | `n_nationkey` |
    | `customer` | `c_custkey` | `orders` | `o_custkey` |

    ![配置三张表的关联关系](/images/next/connection-integration/data-integration/quicksight/HVNIbL0yDouA8axQmIocXFhFnmc.png)

4. 关联完成后，点击右上角 **Save & publish** 发布。

    ![发布关联后的 Dataset](/images/next/connection-integration/data-integration/quicksight/CD9pbqFIOouYFtxUrs9cMlyAnph.png)

### 第四步：配置图表并发布看板

1. 回到已添加三个数据源的 **Analyses** 界面，点击 `n_name`，生成按国家名称统计订单总数的图表。

    ![按国家名称统计订单总数](/images/next/connection-integration/data-integration/quicksight/D6Yrb7Igwo5520x3WBbcZ8T9n9f.png)

2. 在 **VALUE** 中选择 `o_orderkey`，在 **GROUP/COLOR** 中选择 `o_orderstatus`，即可得到按国家和订单状态统计订单数量的看板。

    ![按国家和订单状态统计订单数量](/images/next/connection-integration/data-integration/quicksight/Sl8nbfrszok2bexesfwcsNqbngc.png)

3. 点击右上角 **Publish**，完成看板发布。

## 完成结果

至此，已经成功将 QuickSight 连接到 Apache Doris，并实现了数据分析和可视化看板制作。
