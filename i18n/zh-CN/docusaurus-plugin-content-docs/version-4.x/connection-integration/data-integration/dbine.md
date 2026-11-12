---
{
    "title": "DBine",
    "language": "zh-CN",
    "description": "使用免费、开源的桌面数据库管理工具 DBine，通过其 Doris 连接类型连接 Apache Doris，浏览数据库和表并执行 SQL。"
}
---

<!-- 知识类型: 场景说明 -->
<!-- 适用场景: 使用 DBine 连接并查询 Apache Doris -->

## 概述

[DBine](https://dbine.com) 是一款免费、开源（Apache 2.0 许可）的桌面数据库管理工具，支持 Windows、macOS 和 Linux，可以在同一个窗口中使用 130 多种数据库和云服务。它提供 Apache Doris 连接类型，通过 MySQL 协议连接 FE。

阅读本文后，你可以完成以下任务：

- 安装 DBine，并创建一个 Doris 连接。
- 浏览 internal catalog 中的数据库、表、视图和列，并对 Doris 执行 SQL 查询。
- 了解与 MySQL 服务器的不同之处，避免在使用前产生误判。

## 使用前准备

<!-- 知识类型: 前置条件 -->
<!-- 适用场景: 连接前检查 DBine 与 Doris 的连接要求 -->

- 已安装 DBine。可从 [发布页面](https://github.com/addlayer-io/dbine/releases) 下载。
- FE 必须能够从运行 DBine 的电脑访问。请为 Doris 用户授予目标数据库和表所需的权限。
- 已准备好 Doris 集群的连接信息：FE 主机地址、FE 的 MySQL 协议端口（默认 `9030`）、目标数据库、用户名和密码。

## 连接 Doris

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 在 DBine 中创建 Doris 连接 -->

### 1. 新增连接

在 DBine 中点击 **New connection**，然后在引擎列表中选择 **Apache Doris**。

### 2. 配置 Doris 连接

填写连接表单：

| 字段 | 说明 |
| --- | --- |
| Server | Doris 集群的 FE 主机地址。 |
| Port | FE 的 MySQL 协议端口，默认为 `9030`。 |
| Database | Doris 集群 internal catalog 中的目标数据库。可选。 |
| User | Doris 集群的用户名。 |
| Password | Doris 集群的密码。 |

如果集群启用了 TLS，请打开 **SSL/TLS** 选项卡并勾选 **Encrypt the connection (TLS)**。

### 3. 测试并保存连接

点击 **Test connection** 进行验证，然后点击 **Save and connect**。Test connection 会显示 `Connection successful`，连接随后出现在 **Explorer** 中。

![配置连接](/images/next/connection-integration/data-integration/dbine/dbine-connection-form.png)

### 4. 浏览与查询

在 **Explorer** 中展开连接，可以看到 Doris 的数据库；展开数据库，可以看到其中的表、视图和列。右键点击数据库并选择 **New query** 打开 SQL 编辑器，然后点击 **Run**。例如：

```sql
SELECT @@version_comment AS doris_version;
```

```text
+--------------------------------------------+
| doris_version                              |
+--------------------------------------------+
| doris version doris-4.1.3-rc02-7126cf65d96 |
+--------------------------------------------+
```

![浏览并查询 Doris](/images/next/connection-integration/data-integration/dbine/dbine-editor.png)

## 已知限制

以下结果基于 Doris 4.1.3（`apache/doris:all-in-one-4.1.3`）验证。

| 方面 | 状态 | 说明 |
| --- | --- | --- |
| 浏览与查询 | 正常 | 可以列出数据库、表、视图和列，并以用户自身的权限查询 internal catalog：仅被授予某个数据库 `SELECT_PRIV` 权限的用户，只能看到该数据库以及 `information_schema` 和 `mysql`。 |
| Explain | 正常 | `EXPLAIN` 以文本形式返回 Doris 自身的 Nereids 执行计划。 |
| 服务器版本 | MySQL 版本 | 连接测试和状态栏显示 `5.7.99`，即 Doris 通过 `version()` 报告的 MySQL 版本。运行 `SELECT @@version_comment` 可查看 Doris 的构建版本。 |

关于 DBine 的更多用法，请参阅 [DBine 仓库](https://github.com/addlayer-io/dbine)。
