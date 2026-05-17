---
{
    "title": "Metabase",
    "language": "zh-CN",
    "description": "在 Metabase 中通过 Apache Doris Driver 连接 Doris，配置数据源、使用 SQL 构建可视化仪表盘，并查看 Catalog、参数化查询和性能优化建议。",
    "keywords": [
        "Metabase 连接 Doris",
        "Apache Doris Metabase Driver",
        "Doris 可视化仪表盘",
        "Metabase Doris 数据源"
    ]
}
---

{/* 知识类型: 操作步骤 */}
{/* 适用场景: 在 Metabase 中连接 Apache Doris 并构建可视化仪表盘 */}

Metabase 是一个开源商业智能工具，提供数据分析、数据可视化、交互式仪表盘、数据钻取、SQL 查询编辑和数据导出等能力。通过 Metabase Apache Doris Driver，Metabase 可以将 Apache Doris 数据库和表集成为数据源，用于查询 Doris 内部数据和外部数据，并构建可视化看板。

本文从用户使用场景出发，介绍如何完成以下操作：

| 使用场景 | 用户目标 | 主要操作 |
|----------|----------|----------|
| 准备 Metabase 环境 | 让 Metabase 识别 Apache Doris 数据源 | 安装 Metabase，下载并安装 Doris 驱动程序 |
| 配置 Doris 数据源 | 在 Metabase 中连接 Doris 的 `tpch` 数据库 | 填写 FE 节点、Query Port、Catalog、数据库、用户名和密码 |
| 构建可视化分析 | 分析不同货运方式的订单金额随时间变化情况 | 创建 Question，编写 SQL，配置折线图并保存到仪表盘 |
| 使用高级能力 | 访问外部数据源并提升查询体验 | 使用 Catalog、参数化查询、分区裁剪、物化视图和缓存 |

## 准备 Metabase 环境

### 前置要求

开始配置前，请确认已准备以下环境：

| 项目 | 要求 |
|------|------|
| Metabase | 下载并安装 Metabase 0.48.0 及以上版本。具体参见 [Metabase 安装文档](https://www.metabase.com/docs/latest/installation-and-operation/installing-metabase) |
| Apache Doris | 准备可访问的 Apache Doris 集群 |
| Doris 驱动程序 | 下载最新的 [metabase-doris-driver](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/Metabase/latest/doris.metabase-driver.jar) |

### 常规部署安装驱动程序

如果 Metabase 通过常规方式部署，请按以下步骤安装 Doris 驱动程序：

1. 下载 Doris Driver。

2. 创建 Metabase 插件目录（如果不存在）：

    ```bash
    mkdir -p $path_metabase/plugins
    ```

3. 将 JAR 文件复制到插件目录：

    ```bash
    cp doris.metabase-driver.jar $path_metabase/plugins
    ```

4. 重启 Metabase 服务。

### Docker 部署安装驱动程序

如果 Metabase 使用 Docker 启动，建议通过挂载 `doris.metabase-driver.jar` 的方式启动。Docker 容器内部的插件路径为 `/plugins/`。

1. 下载 Doris Driver。

2. 参考如下命令启动 Metabase：

    ```bash
    docker run -d -p 3000:3000 --name metabase -v $host_path/doris.metabase-driver.jar:/plugins/doris.metabase-driver.jar metabase/metabase
    ```

## 配置 Doris 数据源

{/* 知识类型: 配置参数 */}
{/* 适用场景: 在 Metabase 管理页面新增 Apache Doris 数据库连接 */}

安装 Metabase 和 `metabase-doris-driver` 后，可以在 Metabase 中新增一个连接到 Doris `tpch` 数据库的数据源。

### 连接参数

连接 Apache Doris 时需要配置以下参数：

| 参数 | 含义 | 示例 |
|------|------|------|
| **Display Name** | 数据源显示名称 | Doris-TPCH |
| **Host** | Doris FE 节点地址 | 127.0.0.1 |
| **Port** | Doris Query Port（MySQL 协议端口） | 9030 |
| **Catalog name** | Catalog 名。可选，默认为 `internal` | internal |
| **Database name** | 数据库名。必填 | tpch |
| **Username** | 用户名 | root |
| **Password** | 密码 | your_password |

数据库名称填写方式如下：

- **查询内表**：直接填写数据库名，例如 `tpch`。系统会自动使用 `internal` Catalog。
- **查询外表或数据湖**：填写 Catalog 配置。如果只连接内表，则无需关注此项。

### 配置步骤

1. 启动 Metabase 并完成登录。

2. 点击右上角的齿轮图标，选择 **Admin Settings**（管理设置）。

![Metabase 管理设置](/images/next/connection-integration/data-integration/metabase/metabase-01.png)

3. 在左侧菜单中选择 **Databases**（数据库），点击右上角的 **Add database** 按钮。

![添加数据库](/images/next/connection-integration/data-integration/metabase/metabase-02.png)

4. 在 **Database type** 下拉框中选择 **Apache Doris**。

![选择 Apache Doris](/images/next/connection-integration/data-integration/metabase/metabase-03.png)

5. 填写连接信息：

    | 参数 | 示例值 |
    |------|--------|
    | **Display name** | Doris-TPCH |
    | **Host** | 127.0.0.1 |
    | **Port** | 9030 |
    | **Database name** | tpch |
    | **Username** | admin |
    | **Password** | ****** |

![填写连接信息](/images/next/connection-integration/data-integration/metabase/metabase-04.png)

6. 点击 **Save** 保存配置。

7. Metabase 会自动测试连接并同步数据库元数据。如果连接成功，会显示成功提示。

![连接成功](/images/next/connection-integration/data-integration/metabase/metabase-05.png)

完成数据源配置后，即可在 Metabase 中构建可视化。

## 构建可视化仪表盘

{/* 知识类型: 操作步骤 */}
{/* 适用场景: 使用 Doris TPC-H 数据在 Metabase 中创建 Question 和 Dashboard */}

本示例使用 TPC-H 数据作为数据源。Doris TPC-H 数据源构建方式请参考 [Doris TPC-H 基准测试文档](../../benchmark/tpch)。

假设需要分析不同货运方式的订单金额随时间增长曲线，用于成本分析，可以按以下流程完成可视化配置。

### 创建 Question

1. 点击主页右上角的 **New +** 按钮，选择 **Question**。

![新建问题](/images/next/connection-integration/data-integration/metabase/metabase-06.png)

2. 选择数据源：

    | 参数 | 示例值 |
    |------|--------|
    | **Database** | Doris TPCH |
    | **Table** | lineitem |

![选择数据表](/images/next/connection-integration/data-integration/metabase/metabase-07.png)

### 使用 SQL 构建自定义指标

为了计算收入（Revenue），需要使用自定义 SQL 表达式。

1. 点击右上角切换 **view sql**，然后点击 **convert this question to SQL** 编辑 SQL。

![切换到 SQL 模式](/images/next/connection-integration/data-integration/metabase/metabase-08.png)

2. 输入以下 SQL 查询：

    ```sql
    SELECT
      DATE_FORMAT(l_shipdate, '%Y-%m') AS ship_month,
      l_shipmode,
      SUM(l_extendedprice * (1 - l_discount)) AS revenue
    FROM lineitem
    WHERE l_shipdate >= '1995-01-01'
      AND l_shipdate < '1997-01-01'
    GROUP BY
      DATE_FORMAT(l_shipdate, '%Y-%m'),
      l_shipmode
    ORDER BY ship_month, l_shipmode
    ```

3. 点击右下角的 **Visualize** 按钮查看结果。

![查看结果](/images/next/connection-integration/data-integration/metabase/metabase-09.png)

### 配置可视化图表

1. 默认结果显示为表格。点击左下角的 **Visualization** 按钮，选择 **Line** 图表类型。

![选择折线图](/images/next/connection-integration/data-integration/metabase/metabase-10.png)

2. 可按需配置图表参数。Metabase 会自动生成如下配置：

    | 配置项 | 示例值 | 含义 |
    |--------|--------|------|
    | **X-axis** | ship_month | 发货月份 |
    | **Y-axis** | revenue | 收入 |
    | **Series** | l_shipmode | 货运方式 |

3. 自定义图表样式：

    - 点击 **Settings** 图标，可以调整颜色、标签、图例位置等。
    - 在 **Display** 标签页可以设置坐标轴标题、数值格式等。

4. 图表配置完成后，点击右上角的 **Save** 保存。

5. 输入问题名称 **my-tpch**，选择保存到的集合（Collection）。

![命名问题](/images/next/connection-integration/data-integration/metabase/metabase-11.png)

### 创建 Dashboard

1. 点击 **+ New** > **Dashboard** 创建新仪表盘，输入仪表盘名称 **my-tpch**。

![创建仪表盘](/images/next/connection-integration/data-integration/metabase/metabase-12.png)

2. 点击 **Add a chart** 将已保存的 Question 添加到仪表盘。

![添加问题](/images/next/connection-integration/data-integration/metabase/metabase-13.png)

3. 调整图表位置和大小，点击右上角 **Save** 保存仪表盘。

![保存仪表盘](/images/next/connection-integration/data-integration/metabase/metabase-14.png)

至此，已经成功将 Metabase 连接到 Apache Doris，并完成数据分析和可视化看板制作。

## 高级使用场景

{/* 知识类型: 功能说明 */}
{/* 适用场景: 访问外部数据源、创建交互式仪表盘和优化查询性能 */}

### 使用 Catalog 访问外部数据

Doris 支持多 Catalog 功能，可以查询外部数据源，也可以进行跨数据源查询。在 Metabase 中使用 Catalog 时，可以选择以下任一方式。

1. 在连接配置界面配置 `Catalog`，并在 `Database` 中配置该 Catalog 下的外表数据库。例如：

    | 配置项 | 示例值 | 说明 |
    |--------|--------|------|
    | `catalog` | `hive_catalog` | 访问名为 `hive_catalog` 的 Catalog |
    | `database` | `warehouse` | 访问该 Catalog 下的 `warehouse` 数据库 |

![配置 Catalog](/images/next/connection-integration/data-integration/metabase/metabase-15.png)

2. 在 SQL 查询中显式指定 Catalog：

    ```sql
    SELECT * FROM hive.warehouse.orders LIMIT 100;
    ```

### 使用参数化查询

Metabase 支持在 SQL 查询中使用变量，方便创建交互式仪表盘：

```sql
SELECT
  l_shipmode,
  SUM(l_extendedprice * (1 - l_discount)) AS revenue
FROM lineitem
WHERE l_shipdate BETWEEN {{start_date}} AND {{end_date}}
  AND l_shipmode = {{ship_mode}}
GROUP BY l_shipmode
```

保存后，可以在仪表盘中通过下拉框或日期选择器动态筛选数据。

### 性能优化建议

| 建议 | 说明 |
|------|------|
| 使用分区裁剪 | 在 `WHERE` 子句中添加分区列的过滤条件，例如 `WHERE date >= '2024-01-01' AND date < '2024-02-01'` |
| 利用物化视图 | 对于复杂的聚合查询，可以在 Doris 中创建物化视图加速查询 |
| 控制结果集大小 | 使用 `LIMIT` 限制返回行数，避免一次性加载过多数据 |
| 使用查询缓存 | Metabase 会自动缓存查询结果，合理设置缓存时间可以提升性能 |

### 连接和使用技巧

| 场景 | 建议 |
|------|------|
| 驱动安装 | 确保将 `doris.metabase-driver.jar` 放在 Metabase 的 `plugins` 目录下，并重启 Metabase |
| 时区设置 | 如果遇到时区问题，可以在 JDBC 连接字符串中添加 `serverTimezone=Asia/Shanghai` |
| 分区表优化 | 合理创建 Doris 分区表，按时间分区分桶，可有效减少查询扫描的数据量 |
| 网络连接 | 建议使用 VPC 私有连接，避免公网访问引入安全风险 |
| 权限控制 | 细化 Doris 用户账号角色和访问权限，遵循最小权限原则 |
| 元数据同步 | 当 Doris 中的表结构发生变化时，在 Metabase 管理页面点击 **Sync database schema now** 手动同步 |
| 性能监控 | 对于慢查询，可以在 Doris 中使用 `SHOW QUERY PROFILE` 分析性能瓶颈 |

### 数据类型显示异常

如果 Metabase 中的数据类型显示异常，请先确认使用的是最新版本的 Doris Driver。对于 Doris `largeint` 类型，需要在 SQL 中显式转换：

```sql
SELECT CAST(large_int_col AS STRING) FROM table
```
