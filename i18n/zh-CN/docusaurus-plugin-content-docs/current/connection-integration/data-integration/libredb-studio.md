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
- 了解哪些监控面板目前无法在 Doris 上正常显示，以及原因，避免在使用前产生误判。

## 使用前准备

<!-- 知识类型: 前置条件 -->
<!-- 适用场景: 连接前检查 LibreDB Studio 与 Doris 的连接要求 -->

- LibreDB Studio 已启动运行。最快的方式是使用 Docker：

```sh
docker run -p 3000:3000 ghcr.io/libredb/libredb-studio:latest
```

  此外还提供 Helm Chart 和 npm 包（`npx @libredb/studio`），详见 [LibreDB Studio 仓库](https://github.com/libredb/libredb-studio)。
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

点击 **Test Connection** 进行验证，再点击 **Establish Connection** 保存连接。由于概览（Overview）和健康检查（Health）面板在 Doris 上无法正常返回结果（见下方“已知限制”），按照 LibreDB Studio 自身的判定标准，这是一个降级（degraded）连接，因此保存时可能需要点击两次 **Establish Connection**：第一次点击会先提示降级状态而不是直接静默保存，第二次点击才真正保存。保存后，顶部状态标识会显示为 **Slow** 而非 Online，这反映的是健康检查失败，而不是查询延迟。

![连接已建立](/images/next/connection-integration/data-integration/libredb-studio/libredb-studio-connected.png)

### 4. 浏览与查询

在对象浏览器中展开该连接，即可查看 Doris 的数据库和表，并使用 SQL 编辑器对 internal catalog 执行查询。

![浏览并查询 Doris](/images/next/connection-integration/data-integration/libredb-studio/libredb-studio-editor.png)

## 已知限制

Apache Doris 在 LibreDB Studio 中是作为 MySQL 连接类型的一个兼容目标，而不是独立的连接类型，因此 LibreDB Studio 通过与 MySQL、MariaDB、TiDB 相同的代码路径访问 Doris。产品的大部分功能可以正常使用，以下是使用前需要了解的差异点：

| 方面 | 状态 | 详情 |
| --- | --- | --- |
| 行数与字节大小 | 正确 | 在 Doris 后台统计信息更新完成后，行数和字节大小都与 Doris 自身 `SHOW DATA` 的输出完全一致。 |
| 查询取消 | 正确 | 执行 `SELECT sleep(8)` 后真正被取消；LibreDB Studio 提示 “Query Cancelled - Query execution was cancelled.”。 |
| 权限错误 | 正确 | 一个仅被授予某张表 `SELECT_PRIV` 权限的角色，在对象浏览器中只能看到该表；查询另一张表时返回了 Doris 原始的错误文本，这里将实际的角色、数据库、表和列名替换为占位符：`Permission denied: user ['role'@'%'] does not have privilege for [...] command on [internal].[db].[table].[column]`。 |
| 概览与健康检查面板 | 失败 | 两个面板都显示 “This database could not answer this panel”，随后附带 Doris 自身返回的错误：`errCode = 2, detailMessage = mismatched input 'LIKE' expecting {<EOF>, ';'}(line 1, pos 12)`。原因是这两个面板发送的是 `SHOW STATUS LIKE '...'`，而 Doris 的语法中 `SHOW STATUS` 不支持 `LIKE` 子句。 |
| 索引列表 | 始终为空 | Doris 上 `information_schema.statistics` 为空，因此任何表都不会显示索引。 |
| 外键 | 不可见且不生效 | `ALTER TABLE ... ADD CONSTRAINT` 可以成功执行，`SHOW CONSTRAINTS` 中也能看到，但 `information_schema.KEY_COLUMN_USAGE` 中没有对应记录。因此表结构浏览器中看不到这层关系，Doris 本身也不会真正约束这个外键（插入一条引用不存在父键的记录不会报错）。 |
| Explain | 部分支持 | Explain 按钮固定发送 `EXPLAIN FORMAT='json'`，这在 Doris 上对任何查询（包括普通 `SELECT`）都会导致解析错误（`mismatched input '='`）。直接在 SQL 编辑器中手动输入 `EXPLAIN` 并执行则可以正常工作，返回 Doris 自己的文本执行计划。 |
| 维护类操作 | 部分支持 | `Analyze` 可以正常执行；`Optimize` 和 `Check` 在 Doris 的语法中完全不存在，会被当作解析错误拒绝。 |
| 刚加载完成的表 | 短暂显示为 0 | 一张表在加载 2000 行数据后立即查询显示为 0 行、0 B，大约一分钟后，随着 Doris 后台统计信息追上进度，真实数值才会显示出来，这是 Doris 自身的延迟，并不是连接过期或出错。 |

关于 LibreDB Studio 的更多用法，请参见 [LibreDB Studio 仓库](https://github.com/libredb/libredb-studio)。
