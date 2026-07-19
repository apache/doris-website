---
{
    "title": "Tableau",
    "language": "zh-CN",
    "description": "通过 Tableau 官方 MySQL 连接器，借助 MySQL JDBC Driver 接入 Apache Doris，实现数据源连接、可视化分析与看板制作。",
    "keywords": [
        "Tableau",
        "Apache Doris",
        "BI",
        "数据可视化",
        "MySQL JDBC",
        "数据源接入"
    ],
    "sidebar_label": "Tableau"
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 在 Tableau 中接入 Apache Doris 进行数据可视化与看板制作 -->

# Tableau

[Tableau](https://www.tableau.com/) 是业界主流的商业智能（BI）与数据可视化工具。Apache Doris 兼容 MySQL 协议，因此可直接通过 Tableau 官方提供的 **MySQL 连接器**（基于 MySQL JDBC Driver）接入，无需额外的专属插件。

本文面向以下典型场景：

- 已有 Apache Doris 集群，希望在 Tableau 中进行数据探查与报表开发
- 需要将 Doris 中的明细数据或聚合结果作为 Tableau 工作簿的数据源
- 希望通过 Tableau 看板对外输出 Doris 中的分析结果

完成本文档操作后，你将能够：

1. 在本地环境完成 Tableau Desktop 与 MySQL JDBC 驱动的安装配置。
2. 在 Tableau 中创建到 Apache Doris 的数据源连接。
3. 基于 Doris 数据源在 Tableau 中构建可视化图表与看板。

## 前置准备

在开始之前，请确认满足以下条件：

| 项目              | 要求                                                              |
| ----------------- | ----------------------------------------------------------------- |
| Apache Doris 集群 | 可访问，且 FE 已开放 MySQL 协议端口（默认 `9030`）                |
| 数据库账号        | 拥有目标数据库的读取权限                                          |
| Tableau Desktop   | 已安装最新版本（[下载地址](https://www.tableau.com/products/desktop/download)） |
| MySQL JDBC Driver | 8.3.0 版本（[下载链接](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/Tableau/latest/mysql-connector-j-8.3.0.jar)） |

## 步骤一：安装 Tableau 与 JDBC 驱动

1. 下载并安装 [Tableau Desktop](https://www.tableau.com/products/desktop/download)。
2. 下载 [MySQL JDBC Driver 8.3.0](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/Tableau/latest/mysql-connector-j-8.3.0.jar)。
3. 将 JDBC 驱动 jar 包放置到 Tableau 指定的驱动目录：

    | 操作系统 | 驱动放置路径                                                                  |
    | -------- | ----------------------------------------------------------------------------- |
    | macOS    | `~/Library/Tableau/Drivers`                                                   |
    | Windows  | `%tableau_path%\Drivers\`（默认 `tableau_path = C:\Program Files\Tableau`） |

4. 重启 Tableau Desktop，使驱动生效。

## 步骤二：在 Tableau 中配置 Apache Doris 数据源

完成驱动安装后，可在 Tableau 中创建一个连接到 Doris（示例使用 `tpch` 数据库）的数据源。

### 1. 准备连接信息

通过 JDBC 连接 Apache Doris 所需的参数如下：

| 参数               | 含义                              | 示例                              |
| ------------------ | --------------------------------- | --------------------------------- |
| Server             | Doris FE 的主机地址               | `127.0.0.1`                       |
| Port               | Doris FE 的 MySQL 协议端口        | `9030`                            |
| Database           | 数据库名                          | `tpch`                            |
| Username           | 用户名                            | `testuser`                        |
| Password           | 密码                              | （根据账号填写）                   |
| Init SQL Statement | 连接建立后自动执行的初始化 SQL    | `select * from database.table`    |

### 2. 创建连接

1. 启动 Tableau Desktop（若已运行，请重启以加载驱动）。
2. 在左侧菜单 **To a Server** 区域点击 **More**，在连接器列表中搜索 **MySQL**：

    ![搜索 MySQL 连接器](/images/next/connection-integration/data-integration/tableau/QSrsbadm0oEiuHxyGv3clFhTnLh.png)

3. 点击 **MySQL**，弹出连接配置对话框：

    ![MySQL 连接配置对话框](/images/next/connection-integration/data-integration/tableau/DN47bCp5ZovHCmxH0DAc3fBonR3.png)

4. 按对话框提示填入上一步准备好的连接信息。
5. 点击 **Sign In**。连接成功后，将进入新的 Tableau 工作簿：

    ![Tableau 工作簿](/images/next/connection-integration/data-integration/tableau/LJK9bPMptoAGjGxzoCtcY8Agnye.png)

## 步骤三：在 Tableau 中构建可视化

下面以 TPC-H 数据集为例，演示如何基于 Doris 数据源构建可视化。TPC-H 数据的构建方式可参考 [TPC-H Benchmark 文档](../../lakehouse/best-practices/tpch.md)。

### 1. 关联数据表

1. 将 `customer` 表与 `orders` 表拖入工作簿，并在下方设置关联字段为 `Custkey`：

    ![关联 customer 与 orders](/images/next/connection-integration/data-integration/tableau/ZJuBbDBc5o2Gnyxhn7icv30xnXw.png)

2. 将 `nation` 表拖入工作簿，并与 `customer` 表设置关联字段为 `Nationkey`：

    ![关联 nation 与 customer](/images/next/connection-integration/data-integration/tableau/GPXQbcNUnobHtLx5sIocMHAwn2d.png)

3. 三张表关联后，即构成一个可分析的数据源。点击工作簿底部的 `Sheet 1` 选项卡，进入工作台：

    ![进入工作台](/images/next/connection-integration/data-integration/tableau/FsHmbUOKIoFT5YxWmGecLArLnjd.png)

### 2. 场景示例 A：每年用户量汇总（折线图）

将 `OrderDate`（来自 `orders`）拖入 `Columns`，将 `customer(count)`（来自 `customer`）拖入 `Rows`，Tableau 将生成折线图：

![每年用户量折线图](/images/next/connection-integration/data-integration/tableau/I9SCbCFzoo7TgLx6BP1cHdtRnWc.png)

:::note
TPC-H 数据集由脚本按默认规则生成，并非真实业务数据，结果仅用于功能演示与连通性验证。
:::

### 3. 场景示例 B：按地域与年份计算平均订单金额

1. 点击 `New Worksheet` 创建新表。
2. 将 `Name`（来自 `nation`）拖入 `Rows`。
3. 将 `OrderDate`（来自 `orders`）拖入 `Columns`。

    此时表格内显示 `Abc` 占位值，因为尚未指定聚合度量。

4. 将 `Totalprice`（来自 `orders`）拖入表格中央，默认聚合方式为 `SUM`：

    ![默认 SUM 聚合](/images/next/connection-integration/data-integration/tableau/Am9IbyUo4o30DixVi2ccoZvKn8b.png)

5. 点击 `SUM`，将 `Measure` 修改为 `Average`：

    ![改为 Average](/images/next/connection-integration/data-integration/tableau/AaFwbMOKTo86NaxU54mcVYs1nJd.png)

6. 在同一下拉菜单选择 `Format`，将 `Numbers` 设置为 `Currency (Standard)`：

    ![格式化为货币](/images/next/connection-integration/data-integration/tableau/ZmRDbjws9o5Ampx4YZYcS6Umnqf.png)

7. 最终得到符合预期的报表：

    ![最终报表](/images/next/connection-integration/data-integration/tableau/MNb0bjoB2ozn4kxfKx9cVj2hnhb.png)

至此，已成功将 Tableau 接入 Apache Doris，并完成了数据分析与可视化看板的制作。

## 最佳实践

### 性能优化

- **合理设计表结构**：根据查询场景对 Doris 表进行分区与分桶设计，可有效减少扫描数据量并降低数据传输开销。
- **使用物化视图**：对高频聚合查询，可在 Doris 端创建物化视图，将聚合计算前置，加速 Tableau 看板响应。
- **设置合理的刷新计划**：均衡刷新频率与计算资源消耗，兼顾看板时效性与集群负载。

### 安全配置

- **网络隔离**：建议使用 VPC 私有连接，避免通过公网直接访问 Doris。
- **访问控制**：通过安全组限制 Doris 端口的访问来源。
- **传输加密**：启用 SSL/TLS 加密连接。
- **最小权限原则**：精细化配置 Doris 用户的角色与权限，避免过度授权。
