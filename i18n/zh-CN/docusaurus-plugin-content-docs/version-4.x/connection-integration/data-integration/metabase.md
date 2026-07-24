---
{
    "title": "Metabase",
    "language": "zh-CN",
    "description": "使用 Doris Driver 将 Metabase 连接到 Apache Doris，配置数据源、构建仪表盘，并使用 Catalog 和参数化 SQL。",
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

该驱动是独立的 Metabase 社区驱动，未内置于 Metabase。

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
| Metabase | 下载并安装 Metabase `0.59.6.3` 及以上版本。安装方法请参见 [Metabase 安装文档](https://www.metabase.com/docs/latest/installation-and-operation/installing-metabase) |
| Java | 运行 Metabase 需要 Java 21 |
| Apache Doris | 准备可访问的 Apache Doris 集群 |
| Doris 驱动程序 | 下载 [Metabase Doris Driver](https://github.com/xylaaaaa/metabase-doris-driver/releases/tag/v1.0.0) |

### 下载并校验驱动程序

下载 Release JAR 及其校验文件：

```bash
curl -LO https://github.com/xylaaaaa/metabase-doris-driver/releases/download/v1.0.0/doris.metabase-driver-v1.0.0.jar
curl -LO https://github.com/xylaaaaa/metabase-doris-driver/releases/download/v1.0.0/doris.metabase-driver-v1.0.0.jar.sha256
sha256sum -c doris.metabase-driver-v1.0.0.jar.sha256
```

预期的 SHA-256 摘要如下：

```text
b23e82f19a7f9226343e42566e1e192b6df7a0dfc48a73d2101fc74bfec243f3
```

### 常规部署安装驱动程序

如果 Metabase 通过常规方式部署，请按以下步骤安装 Doris 驱动程序：

1. 按照前文说明下载并校验驱动程序 Release 文件。

2. 如果 Metabase 插件目录不存在，请创建该目录：

    ```bash
    mkdir -p /path/to/metabase/plugins
    ```

3. 将 Release JAR 复制到插件目录：

    ```bash
    cp doris.metabase-driver-v1.0.0.jar /path/to/metabase/plugins/doris.metabase-driver.jar
    ```

4. 重启 Metabase 服务。

5. 检查 Metabase 启动日志，确认 `doris` 驱动程序已注册。在 **Admin Settings** > **Databases** > **Add database** 中，应当能够看到 **Apache Doris** 数据库类型。

### Docker 部署安装驱动程序

如果使用 Docker 启动 Metabase，建议通过挂载 `doris.metabase-driver.jar` 的方式启动。Docker 容器内的插件路径为 `/plugins/`。

1. 下载并校验驱动程序 Release 文件。

2. 使用符合前置要求的 Metabase 镜像启动容器：

    ```bash
    docker run -d \
      -p 3000:3000 \
      --name metabase \
      -v "$(pwd)/doris.metabase-driver-v1.0.0.jar:/plugins/doris.metabase-driver.jar:ro" \
      metabase/metabase
    ```

## 配置 Doris 数据源

{/* 知识类型: 配置参数 */}
{/* 适用场景: 在 Metabase 管理页面新增 Apache Doris 数据库连接 */}

安装 Metabase 和 `metabase-doris-driver` 后，可以在 Metabase 中新增一个连接到 Doris `tpch` 数据库的数据源。

### 连接参数

连接 Apache Doris 时需要配置以下字段：

| 参数 | 含义 | 示例 |
|------|------|------|
| **Display Name** | 数据源显示名称 | Doris-TPCH |
| **Host** | Doris FE 节点地址 | 127.0.0.1 |
| **Port** | Doris Query Port（MySQL 协议端口），默认为 `9030` | 9030 |
| **Catalog** | Catalog 名称。可选，默认为 `internal` | internal |
| **Database (optional)** | 所选 Catalog 中的数据库。可选；留空时会发现该 Catalog 中所有可见数据库 | tpch |
| **Username** | 用户名 | root |
| **Password** | 密码 | your_password |
| **SSL** | 启用 JDBC TLS。该驱动会使用 MariaDB `sslMode=trust`，不会校验服务器证书或主机名 | false |
| **Sync Schemas Include** | 可选。当 **Database (optional)** 为空时使用，以逗号分隔的数据库白名单 | tpch |
| **Sync Schemas Exclude** | 可选。当 **Database (optional)** 为空时使用，以逗号分隔的数据库黑名单。排除规则优先于包含规则 | information_schema |
| **Additional JDBC connection string options** | 其他 MariaDB JDBC URL 参数 | connectTimeout=10000 |

按以下方式选择 Catalog 和数据库范围：

- **内表**：将 **Catalog** 保持为 `internal`，并填写 `tpch` 等数据库。
- **外表**：填写外部 Catalog，以及该 Catalog 中可见的数据库。
- **多个数据库**：将 **Database (optional)** 留空。驱动程序会发现配置账号可见的数据库，并在列出其中的表之前应用包含和排除列表。

当 **Database (optional)** 为空时，驱动程序默认排除 `information_schema`、`__internal_schema` 和 `mysql`。包含和排除规则匹配时不区分大小写；如果同一数据库同时出现在两个列表中，排除规则优先。如果显式设置了 **Database (optional)**，同步范围将限定在该数据库中，包含和排除设置不会改变同步范围。

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
    | **Catalog** | internal |
    | **Database (optional)** | tpch |
    | **Username** | admin |
    | **Password** | ****** |

![填写连接信息](/images/next/connection-integration/data-integration/metabase/metabase-04.png)

6. 点击 **Save** 保存配置。

7. Metabase 会测试连接并开始同步数据库元数据。如果连接成功，会显示成功提示。

![连接成功](/images/next/connection-integration/data-integration/metabase/metabase-05.png)

完成数据源配置后，即可在 Metabase 中构建可视化。

## 构建可视化仪表盘

{/* 知识类型: 操作步骤 */}
{/* 适用场景: 使用 Doris TPC-H 数据在 Metabase 中创建 Question 和 Dashboard */}

本示例使用 TPC-H 数据作为数据源。Doris TPC-H 数据源构建方式请参见 [Doris TPC-H 基准测试文档](../../lakehouse/best-practices/tpch.md)。

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

1. 点击右上角的 **view sql**，然后点击 **convert this question to SQL** 编辑 SQL。

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

    - 点击 **Settings** 图标，可以调整颜色、标签和图例位置等。
    - 在 **Display** 标签页中，可以设置坐标轴标题和数值格式等。

4. 图表配置完成后，点击右上角的 **Save** 保存。

5. 输入问题名称 **my-tpch**，选择要保存到的集合（Collection）。

![命名问题](/images/next/connection-integration/data-integration/metabase/metabase-11.png)

### 创建 Dashboard

1. 点击 **+ New** > **Dashboard** 创建新仪表盘，输入仪表盘名称 **my-tpch**。

![创建仪表盘](/images/next/connection-integration/data-integration/metabase/metabase-12.png)

2. 点击 **Add a chart** 将已保存的 Question 添加到仪表盘。

![添加问题](/images/next/connection-integration/data-integration/metabase/metabase-13.png)

3. 调整图表位置和大小，点击右上角的 **Save** 保存仪表盘。

![保存仪表盘](/images/next/connection-integration/data-integration/metabase/metabase-14.png)

至此，已经成功将 Metabase 连接到 Apache Doris，并完成数据分析和可视化仪表盘制作。

## 驱动程序能力与限制

下表汇总了该驱动的能力和当前支持边界。

| 能力 | 支持状态与边界 |
|------|----------------|
| Internal Catalog | 支持同步和查询 Doris 内部表 |
| Native SQL | 支持。SQL 使用配置的 Doris 账号权限执行；驱动程序不强制语句只读 |
| Query Builder | 支持分组聚合和按天分桶 |
| External Catalog | 支持同步和查询 Doris External Catalog 中的数据；可用范围和元数据完整性取决于具体连接器 |
| Native 模板参数 | 支持数值、文本和可选块 |
| 复杂类型 | 顶层 `ARRAY`、`MAP`、`JSON` 和不透明复杂字段仍然可见；不展开嵌套子字段 |
| 键与索引元数据 | 不同步主键、外键、索引和表权限 |
| Metabase 写入功能 | 不支持数据上传、回写、Actions、数据编辑和持久化模型 |

## 高级使用场景

{/* 知识类型: 功能说明 */}
{/* 适用场景: 访问外部数据源、创建交互式仪表盘和优化查询性能 */}

### 使用 Catalog 访问外部数据

在连接页面设置 **Catalog** 和 **Database (optional)**，以同步 Doris 外部 Catalog 中的表：

| 配置项 | 示例值 | 说明 |
|--------|--------|------|
| `Catalog` | `hive_catalog` | 选择名为 `hive_catalog` 的 Doris Catalog |
| `Database (optional)` | `warehouse` | 选择该 Catalog 中的 `warehouse` 数据库 |

![配置 Catalog](/images/next/connection-integration/data-integration/metabase/metabase-15.png)

在 SQL 查询中显式指定 Catalog：

```sql
SELECT * FROM hive.warehouse.orders LIMIT 100;
```

### 使用参数化查询

驱动程序支持基本的 Native SQL 模板参数。以下示例使用数值参数、文本参数和可选块：

```sql
SELECT
  category,
  COUNT(*) AS row_count,
  SUM(amount) AS total_amount
FROM orders
WHERE amount > {{min_amount}}
[[AND category = {{category}}]]
GROUP BY category
```

当 `category` 没有值时，Metabase 会移除整个可选块。

| 模板能力 | 支持状态 |
|----------|----------|
| 数值变量 | 支持 |
| 文本变量 | 支持 |
| 可选块 `[[ ... ]]` | 支持 |
| 字段过滤器 | 不支持 |
| `{{#card-id}}` 等卡片引用 | 不支持 |
| 动态表引用 | 不支持 |

### 数据类型

在元数据同步过程中，驱动程序按照下表将 Doris 类型映射为 Metabase 基础类型：

| Doris 类型 | Metabase 基础类型 |
|------------|-------------------|
| `BOOLEAN` | `type/Boolean` |
| `TINYINT`、`SMALLINT`、`INT`、`INTEGER`，包括 `INT(11)` 等显示宽度 | `type/Integer` |
| `BIGINT`、`LARGEINT`，包括 `BIGINT(20)` 等显示宽度 | `type/BigInteger` |
| `FLOAT`、`DOUBLE` | `type/Float` |
| `DECIMAL` | `type/Decimal` |
| `DATE`、`DATEV2` | `type/Date` |
| `TIME`，包括小数秒精度 | `type/Time` |
| `DATETIME`、`DATETIMEV2`、`TIMESTAMP` | `type/DateTime` |
| `TIMESTAMPTZ` | `type/DateTimeWithTZ` |
| `CHAR`、`VARCHAR`、`STRING`、`TEXT` | `type/Text` |
| `JSON`、`JSONB` | `type/JSON` |
| `ARRAY` | `type/Array` |
| `MAP` | `type/Dictionary` |
| `STRUCT`、`VARIANT`、`HLL`、`BITMAP` | `type/*` |

`ARRAY`、`MAP`、`JSON`、`STRUCT` 或 `VARIANT` 值中的嵌套字段不会展开为 Metabase 子字段。`LARGEINT` 会映射为 `type/BigInteger`，不要求转换为字符串。

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
