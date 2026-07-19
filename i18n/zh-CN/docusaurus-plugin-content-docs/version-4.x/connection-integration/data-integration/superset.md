---
title: Superset
description: 详解如何在 Apache Superset 3.1 中配置 Apache Doris 作为数据源，实现数据可视化和仪表盘构建。涵盖安装配置、连接步骤、可视化示例及常见问题解决。
keywords:
  - Apache Superset 连接 Doris
  - Superset 数据源配置
  - Doris 可视化
  - BI 工具集成
  - SQLAlchemy Doris 连接
---

<!-- 知识类型: 操作指南 -->
<!-- 适用场景: 数据可视化配置 / BI 工具集成 -->

[Apache Superset](https://superset.apache.org/) 是一个开源的数据挖掘平台，支持丰富的数据源连接、多种可视化方式，并提供细粒度的用户权限控制。其核心功能包括自助分析、自定义仪表盘、分析结果可视化导出、用户/角色权限控制，以及内置 SQL 编辑器。

**本文目标**：在 Apache Superset 3.1 中配置 Apache Doris 数据源，实现数据查询和可视化。

<!-- 知识类型: 版本要求 -->
| 组件 | 推荐版本 | 说明 |
|------|----------|------|
| Apache Superset | 3.1 及以上 | 官方支持 Apache Doris 连接 |
| Apache Doris | 2.0.4 及以上 | 推荐使用 |
| Python | 3.9 / 3.10 / 3.11 | 建议使用稳定版本 |
| pydoris | 1.1.0 | Doris Python 客户端 |

---

## 准备工作

在开始配置前，请确保完成以下准备工作：

1. 安装 Apache Superset 3.1 或更高版本

    参考 [Superset 官方安装指南](https://superset.apache.org/docs/installation/installing-superset-from-pypi)。

2. 安装 Apache Doris 的 Python 客户端：

    ```bash
    pip install pydoris
    ```

3. 验证安装结果：

    ```bash
    pip list | grep pydoris
    # 预期输出：
    # pydoris                       1.1.0
    ```

---

## 步骤一：配置 Doris 数据源

完成环境准备后，按照以下步骤在 Superset 中添加 Doris 数据源。

### 1. 获取 SQLAlchemy 连接字符串

Doris 使用以下格式的 SQLAlchemy URI：

```
doris://<用户名>:<密码>@<主机地址>:<端口>/<Catalog>.<数据库名>
```

**参数说明：**

| 参数 | 含义 | 示例 |
|------|------|------|
| 用户名 | Doris 连接用户名 | testuser |
| 密码 | 用户密码 | xxxxxx |
| 主机地址 | 数据库 host | 127.0.1.28 |
| 端口 | Query port | 9030 |
| Catalog | Doris Catalog，内部表用 `internal`，外部表查询数据湖时指定对应 Catalog | internal |
| 数据库名 | 数据库名称 | tpch |

### 2. 在 Superset 中添加数据源

1. 访问 Superset Web 界面，点击右上角 **Settings** → **Database Connectors**。

    ![进入数据库连接器](/images/next/connection-integration/superset/02-superset-connect.png)

2. 点击 **+ Add Database**，在 **Connect a Database** 弹窗中选择 **Apache Doris**。

    ![选择 Apache Doris](/images/next/connection-integration/superset/03-superset-choose-db.png)

3. 在连接信息中填写 SQLAlchemy URI，完成连接验证后，点击 **Connect**。

    ![填写连接信息](/images/next/connection-integration/superset/04-superset-choose-test-connect.png)

4. 添加成功后，界面将显示已添加的数据源。

    ![添加成功](/images/next/connection-integration/superset/05-superset-after-connect.png)

---

## 步骤二：构建可视化图表

数据源配置完成后，开始构建数据可视化。

本文以 TPC-H 数据集为例，演示如何分析不同货运方式的订单金额随时间变化曲线。

> **前提条件**：已在 Apache Doris 中加载 TPC-H 数据集，参考 [TPC-H 数据构建文档](../../lakehouse/best-practices/tpch.md)。

### 1. 创建 Dataset

1. 点击左侧导航栏 **Datasets** → **+ Add Dataset**。

    ![添加 Dataset](/images/next/connection-integration/superset/06-superset-add-dataset.png)

2. 依次选择配置后，点击右下角 **Create dataset and create chart**：

    - **Database**：Doris
    - **Schema**：tpch
    - **Table**：lineitem

    ![选择数据表](/images/next/connection-integration/superset/07-superset-add-db.png)

### 2. 添加自定义指标

1. 在 Dataset 编辑页面，点击 **Metrics** → **Add item**，添加计算指标：

    - **Metric Key**：Revenue
    - **SQL Expression**：`SUM(l_extendedprice * (1 - l_discount))`

    ![添加指标](/images/next/connection-integration/superset/09-superset-metrics.png)

### 3. 创建图表

1. 进入 **Chart** 页面，点击 **+ Add Chart**，选择 **lineitem** 作为数据集，**Line Chart** 作为图表类型。

    ![选择图表类型](/images/next/connection-integration/superset/10-superset-add-chart.png)

2. 配置图表参数：

    - 将 **l_shipdate** 拖拽到 X 轴，设置时间粒度
    - 将 **Revenue** 指标拖拽到 **Metrics** 区域
    - 将 **l_shipmode** 列拖拽到 **Dimensions** 区域

    ![配置图表](/images/next/connection-integration/superset/11-superset-edit-chart.png)

3. 点击 **Update chart** 预览图表，确认无误后点击 **Save** 保存看板。

    ![保存看板](/images/next/connection-integration/superset/12-superset-edit-save-chart.png)

---

## 常见问题与使用技巧

<!-- 知识类型: 故障排查 / 最佳实践 -->

### 前提条件

- 必须在 Superset 环境中预先安装 `pydoris`，否则在创建数据库时无法选择 Apache Doris 选项。

### 性能优化

| 优化项 | 说明 |
|--------|------|
| 表结构设计 | 根据实际需求合理创建 Doris 库表，按时间分区分桶 |
| 谓词下推 | 有效减少谓词过滤和数据传输量 |
| 网络安全 | 建议使用 VPC 私有连接，避免公网访问引入安全风险 |
| 权限控制 | 细化 Doris 用户账号角色和访问权限，避免过度下放权限 |

### 故障排查

**Q: 在添加数据库时没有看到 Apache Doris 选项**

A: 检查是否已在新环境中安装 `pydoris`。Superset 需要在运行时检测到 Doris 驱动程序才会显示该选项。安装后可能需要重启 Superset 服务。

**Q: 连接验证失败**

A: 检查 SQLAlchemy URI 格式是否正确，确认 Host、Port、用户名、密码是否可访问。可使用 Doris BE 或 MySQL Client 先验证连接。
