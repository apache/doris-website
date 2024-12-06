---
{
    "title": "CREATE SYNC JOB",
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



## 描述


数据同步 (Sync Job) 功能，支持用户提交一个常驻的数据同步作业，通过从指定的远端地址读取 Binlog 日志，增量同步用户在 Mysql 数据库的对数据更新操作的 CDC(Change Data Capture) 功能。


用户可通过 [SHOW SYNC JOB](../../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-SYNC-JOB) 查看数据同步作业状态。

语法：

```sql
CREATE SYNC [db.]job_name
 (
 	channel_desc,
 	channel_desc
 	...
 )
binlog_desc
```

1. `job_name`

   同步作业名称，是作业在当前数据库内的唯一标识，相同`job_name`的作业只能有一个在运行。

2. `channel_desc`

   作业下的数据通道，用来描述 mysql 源表到 Doris 目标表的映射关系。


   语法：

   ```sql
   FROM mysql_db.src_tbl INTO des_tbl
   [columns_mapping]
   ```
   
   1. `mysql_db.src_tbl`
   
      指定 mysql 端的数据库和源表。
   
   2. `des_tbl`
   
      指定 doris 端的目标表，只支持 Unique 表，且需开启表的 batch delete 功能 (开启方法请看 help alter table 的'批量删除功能')。
   
   4. `column_mapping`
   
      指定 mysql 源表和 doris 目标表的列之间的映射关系。如果不指定，FE 会默认源表和目标表的列按顺序一一对应。

      指定 mysql 端的数据库和源表。
   
      不支持 col_name = expr 的形式表示列。
   
      示例：
   
      ```

      假设目标表列为 (k1, k2, v1)，
      
      改变列 k1 和 k2 的顺序
      
      (k2, k1, v1)
      
      忽略源数据的第四列
      (k2, k1, v1, dummy_column)
      ```
   
3. `binlog_desc`


   用来描述远端数据源，目前仅支持 canal 一种。

   语法：

   ```sql
   FROM BINLOG
   (
       "key1" = "value1",
       "key2" = "value2"
   )
   ```

   Canal 数据源对应的属性，以`canal.`为前缀。
   
   1. canal.server.ip: canal server 的地址
   2. canal.server.port: canal server 的端口
   3. canal.destination: instance 的标识
   4. canal.batchSize: 获取的 batch 大小的最大值，默认 8192
   5. canal.username: instance 的用户名
   6. canal.password: instance 的密码
   7. canal.debug: 可选，设置为 true 时，会将 batch 和每一行数据的详细信息都打印出来

## 示例

1. 简单为 `test_db` 的 `test_tbl` 创建一个名为 `job1` 的数据同步作业，连接本地的 Canal 服务器，对应 Mysql 源表 `mysql_db1.tbl1`。

   ```sql
   CREATE SYNC `test_db`.`job1`
   (
   	FROM `mysql_db1`.`tbl1` INTO `test_tbl `
   )
   FROM BINLOG
   (
   	"type" = "canal",
   	"canal.server.ip" = "127.0.0.1",
   	"canal.server.port" = "11111",
   	"canal.destination" = "example",
   	"canal.username" = "",
   	"canal.password" = ""
   );
   ```


2. 为 `test_db` 的多张表创建一个名为 `job1` 的数据同步作业，一一对应多张 Mysql 源表，并显式的指定列映射。

   ```sql
   CREATE SYNC `test_db`.`job1`
   (
   	FROM `mysql_db`.`t1` INTO `test1` (k1, k2, v1),
   	FROM `mysql_db`.`t2` INTO `test2` (k3, k4, v2) 
   )
   FROM BINLOG
   (
   	"type" = "canal",
   	"canal.server.ip" = "xx.xxx.xxx.xx",
   	"canal.server.port" = "12111",
   	"canal.destination" = "example",
   	"canal.username" = "username",
   	"canal.password" = "password"
   );
   ```

## 关键词

    CREATE, SYNC, JOB

## 最佳实践
