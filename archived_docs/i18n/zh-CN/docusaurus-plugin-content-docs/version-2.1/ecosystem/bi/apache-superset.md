---
{
    "title": "Apache Superset",
    "language": "zh-CN",
    "description": "Apache Superset 是一个开源的数据挖掘平台，支持丰富的数据源连接，多种可视化方式，并能够对用户实现细粒度的权限控制。该工具主要特点是可自助分析、自定义仪表盘、分析结果可视化（导出）、用户/角色权限控制，还集成了一个 SQL 编辑器，可以进行 SQL 编辑查询等。"
}
---

Apache Superset 是一个开源的数据挖掘平台，支持丰富的数据源连接，多种可视化方式，并能够对用户实现细粒度的权限控制。该工具主要特点是可自助分析、自定义仪表盘、分析结果可视化（导出）、用户/角色权限控制，还集成了一个 SQL 编辑器，可以进行 SQL 编辑查询等。

在 Apache Superset 3.1 版本中，提供了官方连接方式，正式支持了 Apache Doris 的内部数据和外部数据进行查询和可视化处理。推荐使用 Apache Doris 2.0.4 及以上版本。

通过这个连接方式，Superset 可以将 Apache Doris 数据库和表作为数据源进行集成。要启用此功能，请遵循下面的设置指南：

- 使用前所需的设置
- 在 Apache Superset 中配置 Apache Doris 数据源
- 在 Apache Superset 中构建可视化
- 连接和使用技巧

## 安装 Superset 和 Doris Python 客户端

1. 安装 Python3，建议版本为 3.1.11。
2. 安装 Apache Superset 3.1 及其以上的版本。具体参见 [安装 Superset 从 PyPI 库](https://superset.apache.org/docs/installation/installing-superset-from-pypi)。
3. 在 Apache Superset 服务器上安装 Apache Doris 的 Python 客户端，可以参考如下命令：

```
pip install pydoris
```

校验安装结果：

```
-> pip list | grep pydoris
pydoris                       1.1.0
```

环境确认无误后，接下来，就可以在 Superset 中配置一个 Doris 数据源并开始构建数据可视化！

## 在 Superset 中配置 Doris 数据源

现在您已安装了 **Pydoris** 和 **Apache Superset** 驱动程序，让我们来看一下如何在 Superset 中定义一个连接到 Doris 中 tpch 数据库的数据源。

1. 要通过 pydoris 连接到 Apache Doris，您需要配置 SQLAlchemy URI 连接字符串：

按此格式完成配置：

`doris://<User>:<Password>@<Host>:<Port>/<Catalog>.<Database>`

URI 参数说明如下：

| 参数 | 含义 | 示例 |
|------|------|------|
| **User** | 用户名 | testuser |
| **Password** | 密码 | xxxxxx |
| **Host** | 数据库 host | 127.0.1.28 |
| **Port** | 数据库 query port | 9030 |
| **Catalog** | Doris Catalog，查询外表和数据湖时使用，内表为 internal | internal |
| **Database** | 数据库名 | tpch |

2. 对 Superset 进行访问。

![](/images/ecomsystem/superset/OXIbbtkncoLHDUxjfdCcAmaenJm.png)

3. 完成登录后，点击右上角 Settings -> Database Connectors

![](/images/ecomsystem/superset/ELzsb6xMaoqcAYxnVuzcP3hhnbg.png)

4. 点击 添加 Database，在 Connect  a database 弹窗上，选择 Apache Doris：

![](/images/ecomsystem/superset/TQpibvPYEoyKltx34G5c8B5AnGg.png)

5. 在连接信息中填写 SQLAlchemy URI，行连接验证无误后，点击 Connect。

![](/images/ecomsystem/superset/FndlbO7Fgo4ppixTFWIc0UQUnFb.png)

6. 自此添加数据源完成

![](/images/ecomsystem/superset/GsClbUlmsooSdMx994tcjqm1nre.png)

接下来，就可以在 Superset 中构建一些可视化了！


## 在 Superset 中构建可视化

我们选择 TPC-H 数据作为数据源，Doris TPC-H 数据源构建方式参考[此文档](../../benchmark/tpch)

现在我们在 Superset 中配置了 Doris 数据源，让我们可视化数据...

假设我们需要分析不同货运方式的订单的金额随时间增长曲线用以成本分析

1. 点击 Datasets 添加 Dataset

![](/images/ecomsystem/superset/C55Kbstx1ogXOtxadBccEavLnOf.png)

2. 依次选择 ，然后点击右下角 Create dataset and create chart
    - Database：Doris
    - Schema： tpch
    - Table：lineitem

![](/images/ecomsystem/superset/AAlebfk9ro0SkCxLKXFcq2Scnov.png)

3. 编辑 lineitem 这个 Dateset

![](/images/ecomsystem/superset/BHIObcQrboRQWSx4yatcoo4enxc.png)

4. 点击 Metrics  -> Add item ，为其添加计算指标
    - Metric Key : Revenue
    - SQL expression :  `SUM(`l_extendedprice` * (1 - `l_discount`))`

![](/images/ecomsystem/superset/DUOvbeQPdojk9YxAsbGcfKT2nOe.png)

5. 进入 Chart -> 添加 Chart，dateset 选中 lineitem ，chart 类型选中 Line Chart

![](/images/ecomsystem/superset/KKndbObRCoVBDQxOgMNcJLYanUz.png)

6. 将 l_shipdate 拖拽到 X 轴，并且设置时间粒度，同时依次将 Revenum 自定义指标和 数据列 l_shipmode 分别拖拽到 Metrcs 和 Dimensions 处

![](/images/ecomsystem/superset/Aewqbeul9oFZekx3vOUcZ3ranAf.png)

7. 点击 Update chart 即可查看看板内容。点击Save 保存看板

![](/images/ecomsystem/superset/WwYLbzgatoYuLzx9jjmc1STOnwb.png)

至此，已经成功将 Superset 连接到 Apache Doris，并实现了数据分析和可视化看板制作。

## 连接和使用技巧

- 在 Superset 环境下预先安装 pydoris，才可以在 创建数据库的时候选择 Apache Doris
- 根据实际需求，合理创建 doris 库表，按时间分区分桶，可有效减少谓词过滤和大部分数据传输
- 建议使用 VPC 私有连接，避免公网访问引入安全风险。
- 细化 Doris 用户账号角色和访问权限，避免过度下放权限。
