---
{
   "title": "Power BI",
   "language": "zh-CN"
}
---

Microsoft Power BI 可以从 Apache Doris 查询或加载到内存数据。

您可以使用 Power BI Desktop，用于创建仪表板和可视化的 Windows 桌面应用程序。

本教程将指导您完成以下过程：

- 安装 mysql ODBC 驱动程序
- 将 Doris Power BI 连接器安装到 Power BI Desktop
- 从 Doris 查询数据以在 Power BI Desktop 中可视化

## 前提条件

### Power BI 安装

本教程假定您已经在 Windows 计算机上安装了 Microsoft Power BI Desktop。您可以在 [这里](https://www.microsoft.com/en-us/download/details.aspx?id=58494) 下载并安装 Power BI Desktop。

我们建议您更新到最新版本的 Power BI。

### 连接信息

收集您的 Apache Doris 连接详细信息

您需要以下详细信息以连接到您的 Apache Doris 实例：

| 参数 | 含义 | 示例 |
| ---- | ---- | ---- |
| **Doris Data Source** | 数据库连接串，host + port | 127.0.1.28:9030 |
| **Database** | 数据库名 | test_db |
| **SQL Statement** | SQL 语句，必须包含 Database，仅适用于Import 模式 | select * from database.table |
| **Data Connectivity Mode** | 数据连接模式，包含 Import 和 DirectQuery |  |
| **User Name** | 用户名 |  |
| **Password** | 密码 |  |

## Power BI Desktop

要开始在 Power BI Desktop 中查询数据，您需要完成以下步骤：

1. 安装 Mysql ODBC 驱动程序
2. 查找 Doris 连接器
3. 连接到 Doris
4. 查询和可视化数据

### 安装 ODBC 驱动程序

下载安装 [Mysql ODBC](https://downloads.mysql.com/archives/c-odbc/)，并配置 （版本为 5.3）。

执行提供的 `.msi` 安装程序并按照向导进行操作。

![](/images/ecomsystem/powerbi/WYRLb9JmcoEHeuxr41Ec8yMQnff.png)

![](/images/ecomsystem/powerbi/LYh9bi780o3DaCxwF3BcuPrknlh.png)

![](/images/ecomsystem/powerbi/E1i7buBzHoquRCxT6VAc1FjCnNf.png)

安装完成

![](/images/ecomsystem/powerbi/PURIbSCFhoara3xodBBc5xaNnjc.png)

#### 验证 ODBC 驱动程序

当驱动程序安装完成后，您可以通过以下方式验证安装是否成功：

在开始菜单中输入  'ODBC'  并选择 "ODBC 数据源 (64 位)"。

![](/images/ecomsystem/powerbi/QhVVbjalNoIwvdxd1u7cX3UAnEf.png)

验证 mysql 驱动程序是否列出。

![](/images/ecomsystem/powerbi/OzVSbojxto9SpRxP3sLcnqHmnme.png)

### 安装 Doris 连接器

当前 Power BI 自定义 Connector  暂时关闭认证通道，因此 Doris 提供的 自定义 Connector 是属于未经认证的，对于未认证连接器，配置方式([https://learn.microsoft.com/en-us/power-bi/connect-data/desktop-connector-extensibility#custom-connectors](https://learn.microsoft.com/en-us/power-bi/connect-data/desktop-connector-extensibility#custom-connectors))如下：

1. 参考此处路径：`\Power BI Desktop\Custom Connectors folder`，放置 `Doris.mez` 自定义连接器文件（如果路径不存在，按需手动创建）。
2. 在 Power BI Desktop 中，选择 `File` > `Options and settings` > `Options` > `Security`，在 `Data Extensions` 下，勾选 `(Not Recommended) Allow any extension to load without validation or warning` 。可以屏蔽掉未认证连接器的限制。

首先，选择 `File`

![](/images/ecomsystem/powerbi/YeQDbcIoQoI5RtxU0mjcNXuJnrg.png)

然后，选择 ` Options and settings` > `Options`

![](/images/ecomsystem/powerbi/LV6Tbdw54o5pqtxC2bCctM30nbe.png)

进入 `Options` 界面，`GLOBAL` >`Security`，在 `Data Extensions` 下，

勾选 `(Not Recommended) Allow any extension to load without validation or warning` 选项 。

![](/images/ecomsystem/powerbi/Tg5cbS75HoBGIMxpcKScJ9WXnRg.png)

1. 选择 `ok` ，然后重启 Power BI Desktop。

### 查找 Doris 连接器

1. 启动 Power BI Desktop
2. 在 Power BI Desktop 打开界面点击新建报表。若已有本地报表可以选择打开已有报表

![](/images/ecomsystem/powerbi/FuXNb5hb2oOq7cxNpPEcR1dKnyg.png)

1. 点击获取数据，在弹出窗口中选择 Doris 数据库

![](/images/ecomsystem/powerbi/G9UWbT1P6otb53xlgj4cljUInz1.png)

### 连接到 Doris

选择连接器，并输入 Doris 实例凭据：

- Doris Data Source（必填） - 您的实例域名/地址或者 host:port。
- Database（必填） - 您的数据库名。
- SQL statement - 预先执行的 sql 语句（仅在 ‘Import’ 模式下可用）
- 数据连接模式 - DirectQuery/Import

![](/images/ecomsystem/powerbi/KiM2bVPWhoYBg5xGQUQcJFNcntg.png)

**备注**

我们建议选择 DirectQuery 以直接查询 Doris。

如果您有少量数据的用例，可以选择导入模式，整个数据将加载到 Power BI。

- 指定用户名和密码

![](/images/ecomsystem/powerbi/KZXxbDPTBo2O3FxqgZdcE9I6ndc.png)

### 查询和可视化数据

最后，您应该在导航器视图中看到数据库和表。选择所需的表并单击 "加载" 以从 Apache Doris 导入数据。

![](/images/ecomsystem/powerbi/J7xObwqSYoTdTQx3hjgcAjQznS5.png)

导入完成后，您的 Doris 数据应在 Power BI 中如常访问。

![](/images/ecomsystem/powerbi/JvIgbbyo2oWPlgxcb6Cct5ssnld.png)

配置需要的统计罗盘

![](/images/ecomsystem/powerbi/ClEJb1iuyoUBYvx4BJYcfDWCnqc.png)

把创建好的统计罗盘保存至本地

![](/images/ecomsystem/powerbi/Mpeib5CoeoHZGIxrxDYcdeUwnAe.png)


