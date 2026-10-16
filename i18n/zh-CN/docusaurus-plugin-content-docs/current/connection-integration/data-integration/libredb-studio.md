---
{
    "title": "LibreDB Studio",
    "language": "zh-CN",
    "description": "通过 MySQL 协议将 LibreDB Studio 连接到 Apache Doris，浏览表结构、执行查询并监控集群，同时如实说明当前存在的限制。"
}
---

<!-- 知识类型: 场景说明 -->
<!-- 适用场景: 使用 LibreDB Studio 连接并查询 Apache Doris -->

## 概述

[LibreDB Studio](https://libredb.org) 是一款开源（MIT 许可）的 SQL IDE，在浏览器中运行，无需安装桌面客户端。它提供 Docker 镜像、Helm Chart 和 npm 包三种形式，并通过 MySQL 协议连接 Apache Doris（使用其 MySQL 连接类型，因为 LibreDB Studio 没有单独的 Doris 驱动）。

阅读本文后，你可以完成以下任务：

- 运行 LibreDB Studio，并使用 MySQL 连接类型创建一个 Doris 连接。
- 浏览 internal catalog 中的数据库和表，并对 Doris 执行 SQL 查询。
- 了解 Doris 未提供哪些指标，以及原因，避免在使用前产生误判。

## 使用前准备

<!-- 知识类型: 前置条件 -->
<!-- 适用场景: 连接前检查 LibreDB Studio 与 Doris 的连接要求 -->

- LibreDB Studio 已启动运行。最快的方式是使用 Docker：

```sh
docker run --name libredb-studio -p 3000:3000 ghcr.io/libredb/libredb-studio:latest
```

打开 `http://localhost:3000`。首次启动的管理员密码会输出到容器日志中，可运行 `docker logs libredb-studio` 查看。

  此外还提供 Helm Chart 和 npm 包（`npx @libredb/studio`），详见 [LibreDB Studio 仓库](https://github.com/libredb/libredb-studio)。
- FE 必须能够从 LibreDB Studio 服务端或容器访问。容器内的 `localhost` 指向容器自身；Doris 在宿主机运行时，应填写容器可访问的宿主机地址。请为 Doris 用户授予目标数据库和表所需的权限。
- 已准备好 Doris 集群的连接信息：FE 主机地址、FE 的 MySQL 协议端口（默认 `9030`）、目标数据库、用户名和密码。

## 连接 Doris

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 在 LibreDB Studio 中创建 Doris 连接 -->

### 1. 新增连接

在浏览器中打开 LibreDB Studio，登录后点击 **+** 按钮新增一个连接。

![新增连接](/images/next/connection-integration/data-integration/libredb-studio/libredb-studio-add-connection.png)

### 2. 配置 Doris 连接

连接类型选择 **MySQL**（Doris 使用 MySQL 协议通信，连接类型列表中没有单独的 Doris 选项），并填写以下信息：

| 字段 | 说明 |
| --- | --- |
| Host | Doris 集群的 FE 主机地址。 |
| Port | FE 的 MySQL 协议端口，默认为 `9030`（不是 MySQL 默认的 `3306`）。 |
| Database | Doris 集群 internal catalog 中的目标数据库。 |
| User | Doris 集群的用户名。 |
| Password | Doris 集群的密码。 |

![配置连接](/images/next/connection-integration/data-integration/libredb-studio/libredb-studio-connection-form.png)

### 3. 测试并建立连接

点击 **Test Connection** 进行验证，再点击 **Establish Connection** 保存连接。Test Connection 会提示 `Connected successfully`，点击一次 **Establish Connection** 即可保存该连接，保存后顶部状态标识显示为 **Online**。

![连接已建立](/images/next/connection-integration/data-integration/libredb-studio/libredb-studio-connected.png)

### 4. 浏览与查询

在对象浏览器中展开该连接，即可查看 Doris 的数据库和表，并使用 SQL 编辑器对 internal catalog 执行查询。

![浏览并查询 Doris](/images/next/connection-integration/data-integration/libredb-studio/libredb-studio-editor.png)

可以在 SQL 编辑器中执行以下查询验证连接：

```sql
SELECT 1 AS connection_test;
```

```text
+-----------------+
| connection_test |
+-----------------+
|               1 |
+-----------------+
```

## 已知限制

Doris 通过 LibreDB Studio 的 MySQL 连接类型接入。以下结果最初使用 Doris 4.1.3 验证；dev 的行为差异已单独说明，面板的具体表现还取决于 LibreDB Studio 版本。

| 方面 | 状态 | 详情 |
| --- | --- | --- |
| 行数与字节大小 | 正确 | 在 Doris 后台统计信息更新完成后，行数和字节大小都与 Doris 自身 `SHOW DATA` 的输出完全一致。 |
| 查询取消 | 正确 | 执行 `SELECT sleep(8)` 后真正被取消；LibreDB Studio 提示 “Query Cancelled - Query execution was cancelled.”。 |
| 权限错误 | 正确 | 一个仅被授予某张表 `SELECT_PRIV` 权限的角色，在对象浏览器中只能看到该表；查询另一张表时返回了 Doris 原始的错误文本，这里将实际的角色、数据库、表和列名替换为占位符：`Permission denied: user ['role'@'%'] does not have privilege for [...] command on [internal].[db].[table].[column]`。 |
| 概览与健康检查面板 | 显示信息缺失 | 两个面板都能正常返回。概览面板显示的是真实版本，取自 `@@version_comment`，而不是 `version()`（后者返回的是 Doris 对外声明的 MySQL 版本）。Doris 对不带条件的 `SHOW STATUS` 返回零行，也不提供 `max_connections` 变量，因此服务器运行时长与连接数显示为 `N/A, not published`，而不是 `0`。 |
| 索引列表 | 取决于版本 | Doris 4.1.3 的 `information_schema.statistics` 为空。dev 版本会通过该表提供兼容 MySQL 的主键、唯一键及索引元数据，客户端可以据此发现索引。请以实际 Doris 构建版本的行为为准。 |
| 外键 | 不强制约束；元数据取决于版本 | 可以通过 `ALTER TABLE ... ADD CONSTRAINT` 声明，并在 `SHOW CONSTRAINTS` 中查看。Doris 4.1.3 不在 `information_schema.KEY_COLUMN_USAGE` 中返回这些信息；dev 会在其中提供已声明的约束元数据。浏览器能否显示取决于 Doris 构建版本。Doris 不强制校验外键约束，应用需要自行保证数据满足约束。 |
| Explain | 正确 | Explain 按钮会返回 Doris 自身的 Nereids 执行计划。`EXPLAIN FORMAT='json'` 在 Doris 上会导致解析错误（`mismatched input '='`），因此 LibreDB Studio 针对该引擎发送的是普通的 `EXPLAIN`。 |
| 维护类操作 | 部分支持 | `Analyze` 可以正常执行；`Optimize` 和 `Check` 在 Doris 的语法中完全不存在，会被当作解析错误拒绝。 |
| 刚加载完成的表 | 短暂显示为 0 | 一张表在加载 2000 行数据后立即查询显示为 0 行、0 B，大约一分钟后，随着 Doris 后台统计信息追上进度，真实数值才会显示出来，这是 Doris 自身的延迟，并不是连接过期或出错。 |

关于 LibreDB Studio 的更多用法，请参见 [LibreDB Studio 仓库](https://github.com/libredb/libredb-studio)。
