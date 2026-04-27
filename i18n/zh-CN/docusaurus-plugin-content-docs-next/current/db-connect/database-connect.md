---
{
    "title": "通过 MySQL 协议连接",
    "language": "zh-CN",
    "description": "介绍通过 MySQL Client、JDBC、DBeaver 和内置 Web 控制台连接 Apache Doris 的四种方式与步骤。"
}
---

Apache Doris 采用 MySQL 网络连接协议，兼容 MySQL 生态的命令行工具、JDBC/ODBC 驱动和各种可视化工具。此外，Apache Doris 还内置 Web 控制台（即 Doris FE 内置 Web UI），无需安装额外客户端即可进行 SQL 查询和集群管理。

> Doris FE 默认在 `9030` 端口提供 MySQL 协议服务，在 `8030` 端口提供内置 Web 控制台。

本文介绍以下四种主流连接方式，可根据使用场景选择：

| 连接方式 | 适用场景 | 是否需安装客户端 |
| --- | --- | --- |
| MySQL Client | 命令行操作、运维排查、脚本调用 | 是 |
| MySQL JDBC Connector | 应用程序集成（如 Java 应用） | 是（引入驱动依赖） |
| DBeaver | 可视化查询、数据浏览与管理 | 是 |
| Doris 内置 Web 控制台 | 快速 SQL 查询、root 账户管理 | 否 |

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 首次连接 Doris / 命令行运维 -->

## 通过 MySQL Client 连接

适用于命令行操作、运维排查及脚本化调用等场景。

### 1. 下载并解压 MySQL 客户端

从 [MySQL 官网](https://dev.mysql.com/downloads/mysql/) 下载 Linux 版 MySQL 客户端。Doris 主要兼容 MySQL 5.7 及以上版本的客户端。

解压后，可在 `bin/` 目录下找到 `mysql` 命令行工具。

### 2. 连接 Doris

执行下面的命令连接 Doris：

```shell
# FE_IP：FE 的监听地址
# FE_QUERY_PORT：FE 的 MySQL 协议服务端口，对应 fe.conf 中的 query_port，默认为 9030
mysql -h FE_IP -P FE_QUERY_PORT -u USER_NAME
```

### 3. 验证登录

登录成功后，将显示如下信息：

```shell
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 236
Server version: 5.7.99 Doris version doris-2.0.3-rc06-37d31a5

Copyright (c) 2000, 2018, Oracle and/or its affiliates. All rights reserved.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

mysql>
```

<!-- 知识类型: 操作步骤 / 配置参数 -->
<!-- 适用场景: 应用程序集成 Doris -->

## 通过 MySQL JDBC Connector 连接

适用于 Java 等应用程序集成 Doris 的场景。

### 1. 下载 JDBC Connector

请在 MySQL 官方网站下载相应版本的 JDBC Connector。

### 2. 编写连接代码

连接代码示例如下：

```java
String user = "user_name";
String password = "user_password";
String newUrl = "jdbc:mysql://FE_IP:FE_PORT/demo?useUnicode=true&characterEncoding=utf8&useTimezone=true&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true";
try {
    Connection myCon = DriverManager.getConnection(newUrl, user, password);
    Statement stmt = myCon.createStatement();
    ResultSet result = stmt.executeQuery("show databases");
    ResultSetMetaData metaData = result.getMetaData();
    int columnCount = metaData.getColumnCount();
    while (result.next()) {
        for (int i = 1; i <= columnCount; i++) {
            System.out.println(result.getObject(i));
        }
    }
} catch (SQLException e) {
    log.error("get JDBC connection exception.", e);
}
```

### 3. 关键 JDBC URL 参数说明

JDBC URL 中常用参数如下：

| 参数 | 含义 | 推荐值 / 示例 | 是否必需 |
| --- | --- | --- | --- |
| `useUnicode` | 是否使用 Unicode 字符集 | `true` | 否 |
| `characterEncoding` | 字符编码 | `utf8` | 否 |
| `useTimezone` | 是否启用时区转换 | `true` | 否 |
| `serverTimezone` | 服务器时区 | `Asia/Shanghai` | 否 |
| `useSSL` | 是否使用 SSL 连接 | `false` | 否 |
| `allowPublicKeyRetrieval` | 是否允许从服务器获取公钥（MySQL 8 驱动通常需要） | `true` | 否 |
| `sessionVariables` | 连接建立时初始化的会话变量 | `key1=val1,key2=val2` | 否 |

### 4. 初始化会话变量（可选）

如果需要在连接时初始化会话变量（Session Variables），可使用如下 URL 格式：

```text
jdbc:mysql://FE_IP:FE_PORT/demo?sessionVariables=key1=val1,key2=val2
```

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 可视化查询 / 数据浏览与管理 -->

## 通过 DBeaver 连接

适用于可视化查询、数据浏览与管理场景。

### 1. 创建到 Apache Doris 的 MySQL 连接

![创建到 Apache Doris 的 MySQL 连接](/images/DBeaver.png)

### 2. 在 DBeaver 中执行查询

![DBeaver Connect](/images/DBeaver-query.png)

<!-- 知识类型: 操作步骤 / 配置参数 -->
<!-- 适用场景: 免客户端快速查询 / root 账户管理 -->

## 通过 Doris 内置 Web 控制台连接

Doris FE 内置 Web 控制台，用户无须安装 MySQL 客户端，即可通过浏览器进行 SQL 查询和其他相关信息的查看。

### FE 常用端口

打开内置 Web 控制台或排查连接问题时，可参考下表中的 FE 常用端口：

| 配置项 | 默认端口 | 用途 |
| --- | --- | --- |
| `http_port` | `8030` | FE HTTP 服务端口，内置 Web 控制台访问入口 |
| `query_port` | `9030` | FE MySQL 协议服务端口（供 MySQL Client、JDBC 等使用） |
| `rpc_port` | `9020` | FE Thrift Server 端口，BE 与 FE 通信使用 |
| `edit_log_port` | `9010` | FE 之间元数据（BDBJE）通信端口 |

### 1. 打开内置 Web 控制台

在浏览器中访问 `http://fe_ip:fe_port`，例如 `http://172.20.63.118:8030`，即可打开 Doris 内置 Web 控制台。

内置 Web 控制台主要供集群 root 账户使用，默认安装后 root 账户密码为空。

![WebUI](/images/Doris-WebUI.png)

### 2. 在 Playground 中执行 SQL

进入 Playground 后即可执行 SQL 语句。例如，下面的语句可完成对 BE 节点的添加：

```sql
ALTER SYSTEM ADD BACKEND "be_host_ip:heartbeat_service_port";
```

![Playground](/images/Doris-WebUI-Playground.png)

### 使用限制

:::caution

- 在 Playground 中执行与具体数据库/表无关的语句时，必须先在左侧库栏中任选一个数据库，否则无法执行成功（该限制后续会去除）。
- 当前内置 Web 控制台暂不支持执行 SET 类型的 SQL 语句，因此暂不能在控制台中执行类似 `SET PASSWORD FOR 'user' = PASSWORD('user_password')` 的语句。

:::
