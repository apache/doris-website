---
{
    "title": "Power BI",
    "language": "zh-CN",
    "description": "了解如何在 Power BI Desktop 中连接 Apache Doris，配置 DirectQuery 或 Import 模式，并基于 Doris 数据构建可视化仪表盘。",
    "keywords": [
        "Power BI 连接 Doris",
        "Apache Doris Power BI",
        "Doris Power BI Connector",
        "Power BI DirectQuery Doris",
        "Power BI Import Doris"
    ]
}
---

<!-- 知识类型: 操作指南 -->
<!-- 适用场景: 使用 Power BI Desktop 连接 Apache Doris 并构建可视化仪表盘 -->

Microsoft Power BI 可以从 Apache Doris 查询数据，也可以将数据加载到内存中。通过 Power BI Desktop，您可以连接 Apache Doris 数据源，创建报表、仪表板和可视化分析。

本文从用户使用流程出发，介绍如何完成以下操作：

| 使用场景 | 用户目标 | 主要操作 |
|----------|----------|----------|
| 准备连接环境 | 让 Power BI Desktop 具备连接 Doris 的能力 | 安装 MySQL ODBC 驱动，安装 Doris Power BI 连接器 |
| 连接 Doris 数据源 | 在 Power BI Desktop 中访问 Apache Doris 实例 | 填写 Doris Data Source、Database、认证信息和数据连接模式 |
| 选择查询方式 | 根据数据量和分析方式选择连接模式 | 使用 DirectQuery 直接查询 Doris，或使用 Import 将少量数据加载到 Power BI |
| 构建可视化看板 | 基于 Doris 中的 TPC-H 数据制作分析报表 | 创建表关系，拖拽字段，生成并保存仪表盘 |

## 准备连接环境

<!-- 知识类型: 部署前检查 -->
<!-- 适用场景: 安装 Power BI Desktop 并准备 Doris 连接信息 -->

### 安装 Power BI Desktop

本文假定您已经在 Windows 计算机上安装 Microsoft Power BI Desktop。未安装时，可以访问 [Power BI Desktop 下载页面](https://www.microsoft.com/en-us/download/details.aspx?id=58494) 下载并安装。

建议将 Power BI Desktop 更新到最新版本。

### 准备 Doris 连接信息

连接 Apache Doris 前，请先收集以下信息：

| 参数 | 含义 | 示例 |
|------|------|------|
| **Doris Data Source** | 数据库连接串，格式为 `host:port` | `127.0.1.28:9030` |
| **Database** | 数据库名 | `test_db` |
| **Data Connectivity Mode** | 数据连接模式，包含 `Import` 和 `DirectQuery` | `DirectQuery` |
| **SQL Statement** | SQL 语句，必须包含 Database，仅适用于 `Import` 模式 | `select * from database.table` |
| **User Name** | 用户名 | `admin` |
| **Password** | 密码 | `xxxxxx` |

## 安装 MySQL ODBC 驱动

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 让 Power BI Desktop 通过 MySQL ODBC 驱动连接 Doris -->

要在 Power BI Desktop 中连接 Doris，需要先安装 MySQL ODBC 驱动。

### 安装驱动

1. 下载并安装 [MySQL ODBC](https://downloads.mysql.com/archives/c-odbc/)。

2. 选择并配置 5.3 版本。

3. 执行下载得到的 `.msi` 安装程序，并按照安装向导完成安装。

![](/images/next/connection-integration/data-integration/powerbi/WYRLb9JmcoEHeuxr41Ec8yMQnff.png)

![](/images/next/connection-integration/data-integration/powerbi/LYh9bi780o3DaCxwF3BcuPrknlh.png)

![](/images/next/connection-integration/data-integration/powerbi/E1i7buBzHoquRCxT6VAc1FjCnNf.png)

安装完成后，会显示如下界面。

![](/images/next/connection-integration/data-integration/powerbi/PURIbSCFhoara3xodBBc5xaNnjc.png)

### 验证驱动

驱动安装完成后，可以按以下步骤验证安装是否成功：

1. 在 Windows 开始菜单中输入 `ODBC`，选择 **ODBC 数据源 (64 位)**。

![](/images/next/connection-integration/data-integration/powerbi/QhVVbjalNoIwvdxd1u7cX3UAnEf.png)

2. 确认 MySQL 驱动已出现在驱动列表中。

![](/images/next/connection-integration/data-integration/powerbi/OzVSbojxto9SpRxP3sLcnqHmnme.png)

## 安装 Doris Power BI 连接器

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 在 Power BI Desktop 中加载 Doris 自定义连接器 -->

当前 Power BI 自定义连接器认证通道暂时关闭，因此 Doris 提供的自定义连接器属于未经认证的连接器。对于未认证连接器，需要参考 [Power BI 自定义连接器配置文档](https://learn.microsoft.com/en-us/power-bi/connect-data/desktop-connector-extensibility#custom-connectors) 完成以下配置。

### 放置连接器文件

1. 假定 `power_bi_path` 为 Windows 操作系统中 Power BI Desktop 的安装目录，一般默认为：

    ```text
    power_bi_path = C:\Program Files\Power BI Desktop
    ```

2. 参考 `%power_bi_path%\Custom Connectors folder` 路径，放置 [Doris.mez](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/PowerBI/latest/Doris.mez) 自定义连接器文件。

3. 如果上述路径不存在，请按需手动创建。

### 允许加载未认证连接器

1. 在 Power BI Desktop 中，选择 **File**。

![](/images/next/connection-integration/data-integration/powerbi/YeQDbcIoQoI5RtxU0mjcNXuJnrg.png)

2. 选择 **Options and settings** > **Options**。

![](/images/next/connection-integration/data-integration/powerbi/LV6Tbdw54o5pqtxC2bCctM30nbe.png)

3. 进入 **Options** 界面，选择 **GLOBAL** > **Security**。在 **Data Extensions** 下，勾选 **(Not Recommended) Allow any extension to load without validation or warning**，用于屏蔽未认证连接器的限制。

![](/images/next/connection-integration/data-integration/powerbi/Tg5cbS75HoBGIMxpcKScJ9WXnRg.png)

4. 选择 **OK**，然后重启 Power BI Desktop。

## 在 Power BI Desktop 中连接 Doris

<!-- 知识类型: 操作步骤 + 配置参数 -->
<!-- 适用场景: 在 Power BI Desktop 中选择 Doris 连接器并填写连接信息 -->

安装驱动和连接器后，可以在 Power BI Desktop 中查找 Doris 连接器并创建 Doris 数据源。

### 查找 Doris 连接器

1. 启动 Power BI Desktop。

2. 在 Power BI Desktop 打开界面点击 **新建报表**。如果已经有本地报表，也可以选择打开已有报表。

![](/images/next/connection-integration/data-integration/powerbi/FuXNb5hb2oOq7cxNpPEcR1dKnyg.png)

3. 点击 **获取数据**，在弹出窗口中选择 Doris 数据库。

![](/images/next/connection-integration/data-integration/powerbi/G9UWbT1P6otb53xlgj4cljUInz1.png)

### 填写连接信息

选择 Doris 连接器后，输入 Doris 实例凭据：

| 参数 | 是否必填 | 说明 |
|------|----------|------|
| **Doris Data Source** | 必填 | Doris 实例域名、地址或 `host:port` |
| **Database** | 必填 | Doris 数据库名 |
| **SQL statement** | 可选 | 预先执行的 SQL 语句，仅在 `Import` 模式下可用 |
| **数据连接模式** | 必填 | 选择 `DirectQuery` 或 `Import` |

![](/images/next/connection-integration/data-integration/powerbi/KiM2bVPWhoYBg5xGQUQcJFNcntg.png)

连接模式选择建议如下：

| 模式 | 适用场景 | 说明 |
|------|----------|------|
| **DirectQuery** | 推荐用于直接查询 Doris | Power BI 不加载完整数据集，而是直接向 Doris 发起查询 |
| **Import** | 适用于少量数据场景 | 整个数据集会加载到 Power BI |

:::note

建议选择 `DirectQuery` 以直接查询 Doris。如果您的用例只涉及少量数据，可以选择 `Import` 模式。

:::

### 输入用户名和密码

指定 Doris 用户名和密码。

![](/images/next/connection-integration/data-integration/powerbi/KZXxbDPTBo2O3FxqgZdcE9I6ndc.png)

### 加载表结构和预览数据

在导航器视图中，您应该可以看到数据库和表。选择所需的表，然后单击 **加载**，从 Apache Doris 加载表结构和预览数据。

![](/images/next/connection-integration/data-integration/powerbi/J7xObwqSYoTdTQx3hjgcAjQznS5.png)

导入完成后，Doris 数据即可在 Power BI 中正常访问。接下来可以配置所需的统计罗盘。

![](/images/next/connection-integration/data-integration/powerbi/JvIgbbyo2oWPlgxcb6Cct5ssnld.png)

## 在 Power BI 中构建可视化看板

<!-- 知识类型: 操作示例 -->
<!-- 适用场景: 使用 Doris TPC-H 数据在 Power BI 中创建订单营收统计看板 -->

本示例选择 TPC-H 数据作为数据源。Doris TPC-H 数据源构建方式请参考 [Doris TPC-H Benchmark 文档](../../benchmark/tpch)。

假设需要统计各个地区的订单营收，可以按以下流程构建看板。

### 创建表模型关系

1. 点击 **Model view**，进入表模型关系配置界面。

![](/images/next/connection-integration/data-integration/powerbi/V7PsbP3oKoJpLjxK5HdcPsnLnKf.png)

2. 按需拖拽，将 `customer`、`nation`、`orders` 和 `region` 四张表放置在同一屏幕下，然后拖拽关联字段。

![](/images/next/connection-integration/data-integration/powerbi/FZL5b2kJcoifIaxI7Eocpak7nvf.png)

![](/images/next/connection-integration/data-integration/powerbi/UxL2b1OV2or1LhxZjHsc0JG7ntb.png)

四张表的关联关系如下：

| 源表 | 源字段 | 目标表 | 目标字段 |
|------|--------|--------|----------|
| `customer` | `c_nationkey` | `nation` | `n_nationkey` |
| `customer` | `c_custkey` | `orders` | `o_custkey` |
| `nation` | `n_regionkey` | `region` | `r_regionkey` |

3. 关联完成后，结果如下。

![](/images/next/connection-integration/data-integration/powerbi/LomhbQTPPoZr58xp8f3cxcTen8d.png)

### 配置订单营收看板

1. 返回 **Report view** 工作台，开始构建仪表盘。

2. 将 `orders` 表中的 `o_totalprice` 拖拽到仪表盘。

![](/images/next/connection-integration/data-integration/powerbi/MB34bks6woK3mDx0eVccivKEngc.png)

3. 将 `region` 表中的 `r_name` 拖拽到 X 列。

![](/images/next/connection-integration/data-integration/powerbi/JxpJbihDHoHGwixjWQScNyxvn4e.png)

4. 此时可以得到预期看板内容。

![](/images/next/connection-integration/data-integration/powerbi/CfGWb6oaYoj4LyxpPIGcz3Binzb.png)

5. 点击工作台左上角保存按钮，将创建好的统计罗盘保存至本地。

![](/images/next/connection-integration/data-integration/powerbi/WozGbmqAOoP2mqxq2NmcJRFyntc.png)

至此，已经成功将 Power BI 连接到 Apache Doris，并完成数据分析和可视化看板制作。
