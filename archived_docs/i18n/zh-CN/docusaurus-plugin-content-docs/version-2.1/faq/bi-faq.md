---
{
    "title": "常见 BI 问题",
    "language": "zh-CN",
    "description": "通常这是 Power BI 在拉取数据源的时间超时，在填写数据源服务器和数据库时点击高级选项，其中有个超时时间，把该时间配置的较高。"
}
---

## Power BI

### Q1. JDBC 拉取表到 Desktop Power BI 时报错 Timeout expired. The timeout period elapsed prior to completion of the operation or the server is not responding.

通常这是 Power BI 在拉取数据源的时间超时，在填写数据源服务器和数据库时点击高级选项，其中有个超时时间，把该时间配置的较高。

### Q2. 2.1.x 版本 JDBC 连接 Power BI 时报错读取数据时报错，给定的关键字目前不在字典中。

先在数据库中执行 show collation，一般情况下会只有 utf8mb4_900_bin，charset 为 utf8mb4 这一行结果。该报错的主要原因是在连接 Power BI 时需要找 33 号 ID，即需要该表中有 33 ID 的行，需要升级至 2.1.5 版本以上。

### Q3. 连接时报错从提供程序读取数据时出错：索引和计数必须引用该字符串内的位置。

该问题原因是连接过程会加载全局参数，该 SQL 出现了列名和 values 相同的情况

```
SELECT
@@max_allowed_packet  as max_allowed_packet, @@character_set_client ,@@character_set_connection ,
@@license,@@sql_mode ,@@lower_case_table_names , @@autocommit ;
```

可以在当前版本关闭新优化器也可以升级到 2.0.7 或者 2.1.6 及以上版本。

### Q4. JDBC 连接 2.1.x 版本报错从提供读取数据时出错："Character set 'utf8mb3' is not supported by .Net.Framework"。

该问题易在 2.1.x 版本遇到，如果遇到该问题则需要把 JDBC Driver 升级到 8.0.32。

## Tableau

### Q1. 2.0.x 报错 Tableau 无法连接到数据源，错误代码：37CE01A3。

在当前版本关闭新优化器或者升级至 2.0.7 及以上版本。

### Q2. 报错 SSL connection error:protocol version mismatch 无法连接到 MySQL 服务器。

该报错原因是 Doris 开启了 SSL 验证，但是连接过程中未使用 SSL 连接，需要在 fe.conf 里面关闭 enable_ssl 变量。

### Q3. 连接时报错 Unsupported command ( COM_STMT_PREPARED )。

MySQL 驱动版本安装不恰当，需要改安装为 MySQL5.1.x 版本的连接驱动。