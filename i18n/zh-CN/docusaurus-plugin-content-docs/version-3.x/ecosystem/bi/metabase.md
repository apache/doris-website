---
{
    "title": "Metabase",
    "language": "zh-CN",
    "description": "Metabase 是一个开源的商业智能工具，提供简洁易用的数据分析和可视化功能，支持丰富的数据源连接，并能够快速构建交互式仪表盘。"
}
---

Metabase 是一个开源的商业智能工具，提供简洁易用的数据分析和可视化功能，支持丰富的数据源连接，并能够快速构建交互式仪表盘。该工具主要特点是界面友好、易于上手、支持自助分析、可视化看板制作、数据钻取探索，还集成了一个 SQL 查询编辑器，可以进行 SQL 查询和数据导出等。

通过 Metabase Apache Doris Driver，可以让 Metabase 连接到 Apache Doris 数据库，实现对 Doris 内部数据和外部数据的查询和可视化处理。

通过这个驱动程序，Metabase 可以将 Apache Doris 数据库和表作为数据源进行集成。要启用此功能，请遵循下面的设置指南：

- 安装和配置驱动程序
- 在 Metabase 中配置 Apache Doris 数据源
- 在 Metabase 中构建可视化
- 连接和使用技巧

## 安装 Metabase 和 Doris 驱动程序

### 前置要求

1. 下载并安装 Metabase 0.48.0 及以上版本。具体参见 [Metabase 安装文档](https://www.metabase.com/docs/latest/installation-and-operation/installing-metabase)
2. 准备 Apache Doris 集群

### 安装 Doris 驱动程序

首先需要下载最新的 [metabase-doris-driver](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/Metabase/latest/doris.metabase-driver.jar)

然后进行驱动安装，安装方式视 metabase 部署方式而定：

#### metabase 常规部署

1. 下载 Driver

2. 创建 Metabase 插件目录（如果不存在）：

```bash
mkdir -p $path_metabase/plugins
```

3. 将 JAR 文件复制到插件目录：

```bash
cp doris.metabase-driver.jar $path_metabase/plugins
```

4. 重启 Metabase 服务

#### metabase docker 部署

如果 metabase 使用的是 docker 启动，则建议通过挂载 `doris.metabase-driver.jar` 的方式启动，docker 容器内部的插件路径为 `/plugins/`

1. 下载 Driver

2. 参考如下启动命令启动 Metabase：

```bash
docker run -d -p 3000:3000 --name metabase  -v $host_path/doris.metabase-driver.jar:/plugins/doris.metabase-driver.jar  metabase/metabase
```

## 在 Metabase 中配置 Doris 数据源

现在您已安装了 **Metabase** 和 **metabase-doris-driver**，让我们来看一下如何在 Metabase 中定义一个连接到 Doris 中 tpch 数据库的数据源。

### 连接参数说明

连接 Apache Doris 时需要配置以下参数：

| 参数 | 含义 | 示例 |
|------|------|------|
| **Display Name** | 数据源显示名称 | Doris-TPCH |
| **Host** | Doris FE 节点地址 | 127.0.0.1 |
| **Port** | Doris Query Port（MySQL 协议端口） | 9030 |
| **Catalog name** | Catalog 名（可选，默认为 internal） | internal |
| **Database name** | 数据库名（必写） | tpch |
| **Username** | 用户名 | root |
| **Password** | 密码 | your_password |

**数据库名称格式说明：**

- **内表**：直接填写数据库名，如 `tpch`，系统会自动使用 `internal` catalog
- **外表/数据湖**：填写 Catalog 配置，如仅链接内表，则无需关注此项。

### 配置步骤

1. 启动 Metabase 并完成登录

2. 点击右上角的齿轮图标，选择 **Admin Settings**（管理设置）

![Metabase 管理设置](/images/ecomsystem/metabase/metabase-01.png)

3. 在左侧菜单中选择 **Databases**（数据库），点击右上角的 **Add database** 按钮

![添加数据库](/images/ecomsystem/metabase/metabase-02.png)

4. 在 **Database type** 下拉框中选择 **Apache Doris**

![选择 Apache Doris](/images/ecomsystem/metabase/metabase-03.png)

5. 填写连接信息：

- **Display name**: Doris-TPCH
- **Host**: 127.0.0.1
- **Port**: 9030
- **Database name**: tpch
- **Username**: admin
- **Password**: ******

![填写连接信息](/images/ecomsystem/metabase/metabase-04.png)

6. 点击 **Save** 保存配置

7. Metabase 会自动测试连接并同步数据库元数据。如果连接成功，会显示成功提示

![连接成功](/images/ecomsystem/metabase/metabase-05.png)

至此，数据源配置完成！接下来就可以在 Metabase 中构建可视化了。

## 在 Metabase 中构建可视化

我们选择 TPC-H 数据作为数据源，Doris TPC-H 数据源构建方式参考[此文档](../../benchmark/tpch)。

现在我们在 Metabase 中配置了 Doris 数据源，让我们可视化数据...

假设我们需要分析不同货运方式的订单金额随时间增长曲线，用以成本分析。

### 创建问题（Question）

1. 点击主页右上角的 **New +** 按钮，选择 **Question**

![新建问题](/images/ecomsystem/metabase/metabase-06.png)

2. 选择数据源：
    - **Database**: Doris TPCH
    - **Table**: lineitem

![选择数据表](/images/ecomsystem/metabase/metabase-07.png)

### 使用 SQL 构建自定义指标

为了计算收入（Revenue），我们需要使用自定义 SQL 表达式：

1. 点击右上角切换 **view sql**，然后点击 **convert this question to SQL** 编辑 SQL

![切换到 SQL 模式](/images/ecomsystem/metabase/metabase-08.png)

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

3. 点击右下角的 **Visualize** 按钮查看结果

![查看结果](/images/ecomsystem/metabase/metabase-09.png)


### 配置可视化图表

1. 默认显示为表格。点击左下角的 **Visualization** 按钮，选择 **Line** 图表类型

![选择折线图](/images/ecomsystem/metabase/metabase-10.png)

2. 可按需配置图表参数（metabase 自动配置如下）：
    - **X-axis**: ship_month（发货月份）
    - **Y-axis**: revenue（收入）
    - **Series**: l_shipmode（货运方式）

3. 自定义图表样式：
    - 点击 **Settings** 图标，可以调整颜色、标签、图例位置等
    - 在 **Display** 标签页可以设置坐标轴标题、数值格式等

4. 图表配置完成后，点击右上角的 **Save** 保存

5. 输入问题名称：**my-tpch**，选择保存到的集合（Collection）

![命名问题](/images/ecomsystem/metabase/metabase-11.png)

### 创建仪表盘（Dashboard）

1. 点击 **+ New** → **Dashboard** 创建新仪表盘，输入仪表盘名称：**my-tpch**

![创建仪表盘](/images/ecomsystem/metabase/metabase-12.png)

2. 点击 **Add a chart** 将已保存的 question 添加到仪表盘

![添加问题](/images/ecomsystem/metabase/metabase-13.png)

3. 调整图表位置和大小，点击右上角 **Save** 保存仪表盘

![保存仪表盘](/images/ecomsystem/metabase/metabase-14.png)

至此，已经成功将 Metabase 连接到 Apache Doris，并实现了数据分析和可视化看板制作！

## 高级功能

### 使用 Catalog 访问外部数据

Doris 支持多 Catalog 功能，可以查询外部数据源 和 跨数据源的数据查询。在 Metabase 中使用时：

1. 在 链接配置界面配置 `Catalog`， 在 `Database` 中配置 该 catalog 下的外表数据库，例如：  
   `catalog: hive_catalog`, `database: warehouse` - 访问 名为 hive_catalog 中的 warehouse 数据库

![配置catalog](/images/ecomsystem/metabase/metabase-14.png)



2. 或者在 SQL 查询中显式指定 Catalog：

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

保存后，在仪表盘中可以通过下拉框或日期选择器动态筛选数据。

### 性能优化建议

1. **使用分区裁剪**：在 WHERE 子句中添加分区列的过滤条件
   ```sql
   WHERE date >= '2024-01-01' AND date < '2024-02-01'
   ```

2. **利用物化视图**：对于复杂的聚合查询，可以在 Doris 中创建物化视图加速查询

3. **控制结果集大小**：使用 LIMIT 限制返回行数，避免一次性加载过多数据

4. **查询缓存**：Metabase 会自动缓存查询结果，合理设置缓存时间可以提升性能

### 连接和使用技巧

- **驱动安装**：确保将 `doris.metabase-driver.jar` 放在 Metabase 的 `plugins` 目录下，并重启 Metabase
- **时区设置**：如果遇到时区问题，可以在 JDBC 连接字符串中添加 `serverTimezone=Asia/Shanghai`
- **分区表优化**：合理创建 Doris 分区表，按时间分区分桶，可有效减少查询扫描的数据量
- **网络连接**：建议使用 VPC 私有连接，避免公网访问引入安全风险
- **权限控制**：细化 Doris 用户账号角色和访问权限，遵循最小权限原则
- **元数据同步**：当 Doris 中的表结构发生变化时，在 Metabase 管理页面点击 "Sync database schema now" 手动同步
- **性能监控**：对于慢查询，可以在 Doris 中使用 `SHOW QUERY PROFILE` 分析性能瓶颈

### 数据类型显示异常

- 确保使用最新版本的 Doris Driver
- Doris largeint 类型需要在 SQL 中显式转换：
  ```sql
  SELECT CAST(large_int_col AS STRING) FROM table
  ```
