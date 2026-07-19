---
{
    "title": "快速开始",
    "language": "zh-CN",
    "description": "通过四步快速搭建 Doris CCR 跨集群数据同步：开启 binlog、部署 Syncer、配置库表 binlog、向 Syncer 发起同步任务。",
    "keywords": [
        "CCR 快速开始",
        "CCR Syncer 部署",
        "Doris 跨集群同步",
        "enable_feature_binlog",
        "binlog.enable",
        "create_ccr",
        "跨集群复制",
        "Cross Cluster Replication",
        "库级同步",
        "表级同步"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 首次部署 CCR / 跨集群数据同步上手 -->

本文介绍如何在 Apache Doris 中快速搭建 CCR (Cross Cluster Replication) 跨集群数据同步，覆盖从开启 binlog 到提交同步任务的完整流程。读者按顺序执行四个步骤后，即可在源集群与目标集群之间建立库级或表级同步链路。

## 适用场景

| 场景 | 说明 |
| --- | --- |
| 库级同步 | 将源集群中某个数据库下的所有表整库同步到目标集群 |
| 表级同步 | 仅将源集群中某一张表同步到目标集群 |
| 容灾备份、读写分离 | 通过 CCR 在备集群保留实时副本，参见 [跨集群数据同步概述](../ccr/overview) |

## 前置条件

- 已部署可访问的源集群与目标集群，且 Syncer 与上下游 FE、BE 网络互通。
- 拥有源集群与目标集群的可用账号（用于 Syncer 开启事务与拉取数据），权限要求详见 [操作手册](../ccr/manual)。
- 已确认 Doris 版本符合 CCR 要求（建议使用 2.0.15 / 2.1.6 或更新版本）。

## 流程总览

1. 在源集群与目标集群同时开启 binlog 总开关。
2. 下载并部署 CCR Syncer。
3. 在源集群打开待同步库或表的 binlog。
4. 通过 HTTP 接口向 Syncer 发起同步任务。

## 1. 打开源和目标集群的 binlog 配置

<!-- 知识类型: 配置参数 -->

在源集群和目标集群的 `fe.conf` 和 `be.conf` 中配置如下信息：

```sql
enable_feature_binlog=true
```

修改完成后需重启对应的 FE、BE 进程使配置生效。

## 2. 部署 Syncer

<!-- 知识类型: 操作步骤 -->

### 2.1 下载 Syncer 安装包

从如下链接下载最新的包：

`https://download.selectdb.com/ccr-release/ccr-syncer-3.0.6-rc07-x64.tar.xz`

### 2.2 启动和停止 Syncer

```shell
# 启动
cd bin && sh start_syncer.sh --daemon

# 停止
sh stop_syncer.sh
```

启动后 Syncer 默认监听 `9190` 端口，用于接收同步任务管理请求。

## 3. 打开源集群中同步库 / 表的 Binlog

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 库级同步 / 表级同步 -->

根据同步粒度选择不同的开启方式：

- **整库同步**：在 Syncer 的 `bin` 目录下执行脚本，会为指定库下的所有表打开 `binlog.enable`。

    ```shell
    ./enable_db_binlog.sh --host $host --port $port --user $user --password $password --db $db
    ```

- **单表同步**：只需要在源集群上对目标表执行 `ALTER TABLE`，打开该表的 `binlog.enable`。

    ```sql
    ALTER TABLE enable_binlog SET ("binlog.enable" = "true");
    ```

## 4. 向 Syncer 发起同步任务

<!-- 知识类型: 操作步骤 -->

通过 HTTP 接口向 Syncer 提交同步任务：

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "ccr_test",
    "src": {
      "host": "localhost",
      "port": "9030",
      "thrift_port": "9020",
      "user": "root",
      "password": "",
      "database": "your_db_name",
      "table": "your_table_name"
    },
    "dest": {
      "host": "localhost",
      "port": "9030",
      "thrift_port": "9020",
      "user": "root",
      "password": "",
      "database": "your_db_name",
      "table": "your_table_name"
    }
}' http://127.0.0.1:9190/create_ccr
```

### 同步任务参数说明

| 参数 | 说明 |
| --- | --- |
| `name` | CCR 同步任务的名称，唯一即可；同一个 `name` 只能创建一次 |
| `host`、`port` | 对应集群 Master FE 的 host 和 MySQL (JDBC) 端口 |
| `thrift_port` | 对应集群 FE 的 Thrift 端口 |
| `user`、`password` | Syncer 以何种身份去开启事务、拉取数据等 |
| `database`、`table` | 库级别同步时填入 `your_db_name`，`your_table_name` 留空；表级别同步时同时填入 `your_db_name` 与 `your_table_name` |

## 常见问题

### Q: 修改 `enable_feature_binlog=true` 后未生效怎么办？

确认源集群与目标集群的 FE、BE 均已重启。

### Q: 整库同步时部分表未同步怎么办？

确认 `enable_db_binlog.sh` 已在该库的所有表上成功开启 `binlog.enable`。

### Q: 同一任务 `name` 重复创建报错怎么办？

`name` 仅能使用一次，请更换任务名后重试。

### Q: 如何了解更多配置项与功能矩阵？

参见 [配置说明](../ccr/config) 与 [功能详情](../ccr/feature)。
