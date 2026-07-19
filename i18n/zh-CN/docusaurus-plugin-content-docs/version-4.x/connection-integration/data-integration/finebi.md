---
{
    "title": "FineBI",
    "language": "zh-CN",
    "description": "通过 MySQL 协议将 FineBI 连接到 Apache Doris，完成数据建模、表导入与可视化分析的完整配置流程。"
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: BI 工具对接 / 可视化分析 -->

FineBI 是一款商业智能产品，提供数据处理、即时分析、多维度分析 Dashboard 等多种能力。它支持丰富的数据源连接以及多视图的表分析管理，可以顺利支持 Apache Doris 内部数据和外部数据的建模与可视化处理。

本文介绍如何在 FineBI 中接入 Apache Doris 数据源，并完成从连接配置到数据建模的完整流程。

## 适用场景

| 场景 | 说明 |
| --- | --- |
| BI 报表分析 | 基于 Doris 中的业务数据构建仪表盘与报表 |
| 即时多维分析 | 利用 FineBI 的多维分析能力探索 Doris 数据 |
| 内外部数据建模 | 将 Doris 的内部表与外部表统一接入 FineBI 进行建模 |

## 前置条件

- 已安装 FineBI 5.0 及以上版本，下载地址：[https://www.finebi.com/](https://www.finebi.com/)
- 已部署 Apache Doris 集群，并已知以下连接信息：
    - FE 主机 IP 地址
    - FE 查询端口（默认 9030）
    - 具备访问权限的用户名与密码
    - 目标数据库名称

## 操作步骤

### 第一步：登录 FineBI

1. 创建 FineBI 登录账户，并使用该账户登录。

    ![login page](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-1.png)

2. 选择内置数据库作为 FineBI 的信息存储库。如需使用外部数据库，可参考官方文档：[https://help.fanruan.com/finebi/doc-view-437.html](https://help.fanruan.com/finebi/doc-view-437.html)

    :::info 说明
    建议选择内置数据库作为帆软 BI 的信息存储库。此处选择的数据库类型并非用于查询分析的目标库，而是用于存储和维护 FineBI 模型、仪表盘等元信息的数据库，FineBI 需要对其进行增删改查操作。
    :::

    ![select database](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-2.png)

### 第二步：创建 Doris 数据连接

1. 进入「管理系统」，选择「数据连接」中的「数据库连接」，点击新建数据库连接。

    ![data connection](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-3.png)

2. 在数据库连接类型选择界面中选择 **MySQL**。

    ![select connection](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-4.png)

3. 填写 Doris 数据库的连接信息，参数说明如下：

    | 参数 | 说明 |
    | --- | --- |
    | Username | 用于登录 Doris 集群的用户名，如 `admin` |
    | Password | 用于登录 Doris 集群的用户密码 |
    | Host | Doris 集群的 FE 主机 IP 地址 |
    | Port | Doris 集群的 FE 查询端口，如 `9030` |
    | Coding | Doris 集群中的编码格式 |
    | Name Database | Doris 集群中的目标数据库 |

    ![connection information](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-5.png)

4. 点击「测试连接」。若连接信息填写正确，将弹出连接成功提示。

    ![connection test](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-6.png)

### 第三步：创建数据模型

1. 在「公共数据」中点击新建数据集。添加 Doris 数据集时，选择「数据库表」。

    ![new dataset](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-7.png)

2. 在已建立的数据库连接下，选择需要导入的表。

    ![select table](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-8.png)

3. 表导入完成后，需要对每个导入的表执行刷新操作。只有刷新后才能在分析主题中对该表进行数据分析。

    ![refresh table](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-9.png)

4. 在分析主题中添加导入的公共数据，即可按照业务逻辑进行罗盘分析与配置。

    ![data analysis](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-10.png)

## 常见问题

**Q：连接测试失败应如何排查？**

可按以下顺序检查：

- 确认 Doris FE 节点的 IP 与查询端口（默认 `9030`）可从 FineBI 所在主机访问。
- 确认登录用户具备访问目标数据库的权限。
- 确认连接类型选择为 MySQL，而非其他数据库类型。

**Q：为什么导入表后无法在主题中进行分析？**

需要在「公共数据」中对每个导入的表执行刷新操作，刷新完成后才可以在分析主题中使用。
