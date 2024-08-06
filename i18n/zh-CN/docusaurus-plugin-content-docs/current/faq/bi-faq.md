---
{
    "title": "常见BI问题",
    "language": "zh-CN"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

# 常见BI问题

## Power BI

### Q1. JDBC拉取表到Desktop Power BI 时报错 Timeout expired. The timeout period elapsed prior to completion of the operation or the server is not responding.

通常这是Power BI在拉取数据源的时间超时，在填写数据源服务器和数据库时点击高级选项，其中有个超时时间，把该时间配置的较高。

### Q2. 2.1.x版本JDBC连接Power BI时报错读取数据时报错，给定的关键字目前不在字典中。

先在数据库中执行show collation，一般情况下会只有utf8mb4_900_bin，charset为utf8mb4 这一行结果。该报错的主要原因是在连接Power BI时需要找33号ID，即需要该表中有33ID的行，需要升级至2.1.5版本以上。

### Q3. 连接时报错从提供程序读取数据时出错：索引和计数必须引用该字符串内的位置。

该问题原因是连接过程会加载全局参数，该SQL出现了列名和values 相同的情况

```
SELECT
@@max_allowed_packet  as max_allowed_packet, @@character_set_client ,@@character_set_connection ,
@@license,@@sql_mode ,@@lower_case_table_names , @@autocommit ;
```

可以在当前版本关闭新优化器也可以升级到2.0.7或者2.1.6及以上版本。

### Q4. JDBC连接2.1.x版本报错从提供读取数据时出错："Character set 'utf8mb3' is not supported by .Net.Framework"。

该问题易在2.1.x版本遇到，如果遇到该问题则需要把JDBC Driver升级到8.0.32。

## Tableau

### Q1. 2.0.x报错Tableau无法连接到数据源，错误代码：37CE01A3。

在当前版本关闭新优化器或者升级至2.0.7及以上版本。

### Q2. 报错SSL connection error:protocol version mismatch 无法连接到MySQL服务器。

该报错原因是Doris开启了SSL验证，但是连接过程中未使用SSL连接，需要在fe.conf里面关闭enable_ssl变量。

### Q3. 连接时报错Unsupported command(COM_STMT_PREPARED)。

MySQL驱动版本安装不恰当，需要改安装为MySQL5.1.x版本的连接驱动。