---
{
    "title": "通过 MySQL 协议连接",
    "language": "zh-CN",
    "description": "Apache Doris 采用 MySQL 网络连接协议，兼容 MySQL 生态的命令行工具、JDBC/ODBC 和各种可视化工具。同时 Apache Doris 也内置了一个简单的 Web UI，方便使用。"
}
---

Apache Doris 采用 MySQL 网络连接协议，兼容 MySQL 生态的命令行工具、JDBC/ODBC 和各种可视化工具。同时 Apache Doris 也内置了一个简单的 Web UI，方便使用。下面分别介绍如何通过 MySQL Client、MySQL JDBC Connector、DBeaver 和 Doris 内置的 Web UI 来连接 Doris。

## MySQL Client

从 [MySQL 官网](https://dev.mysql.com/downloads/mysql/) 下载 Linux 版 MySQL 客户端。目前 Doris 主要兼容 MySQL 5.7 及以上版本的客户端。

解压下载的 MySQL 客户端，在 `bin/` 目录下可以找到 `mysql` 命令行工具。然后执行下面的命令连接 Doris。

```shell
# FE_IP 为 FE 的监听地址，FE_QUERY_PORT 为 FE 的 MYSQL 协议服务的端口，在 fe.conf 中对应 query_port, 默认为 9030.
mysql -h FE_IP -P FE_QUERY_PORT -u USER_NAME 
```

登录后，显示如下。

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

## MySQL JDBC Connector

请在 MySQL 官方网站下载相应的 JDBC Connector。

连接代码示例如下：

```Java
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

如果需要在连接时初始换会话变量（Session Variables），可以使用下列格式：

```
jdbc:mysql://FE_IP:FE_PORT/demo?sessionVariables=key1=val1,key2=val2
```

## DBeaver

创建一个到 Apache Doris 的 MySQL 连接：


![创建到 Apache Doris 的 MySQL 连接](/images/DBeaver.png)

在 DBeaver 中进行查询：

![DBeaver Connect](/images/DBeaver-query.png)

## Doris 内置的 Web UI

Doris FE 内置 Web UI。用户无须安装 MySQL 客户端，即可通过内置的 Web UI 进行 SQL 查询和其它相关信息的查看。

在浏览器中输入 http://fe_ip:fe_port,  比如 `http://172.20.63.118:8030`，打开 Doris 内置的 Web 控制台。

内置 Web 控制台，主要供集群 root 账户使用，默认安装后 root 账户密码为空。

![WebUI](/images/Doris-WebUI.png)

比如，在 Playground 中，执行如下语句，可以完成对 BE 节点的添加。

```sql
ALTER SYSTEM ADD BACKEND "be_host_ip:heartbeat_service_port";
```

![Playground](/images/Doris-WebUI-Playground.png)

:::caution
Playground 中执行这种和具体数据库/表没有关系的语句，务必在左侧库栏里随意选择一个数据库，才能执行成功，这个限制，稍后会去掉。

当前内置的 Web 控制台，还不能执行 SET 类型的 SQL 语句，所以，在 Web 控制台，当前还不能通过执行 SET PASSWORD FOR 'user' = PASSWORD('user_password') `类似语句。
:::
