---
{
    "title": "快速开始",
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


使用非常简单，只需把 Syncer 服务启动，给他发一个命令，剩下的交给 Syncer 完成就行。

## 第一步. 部署源 Doris 集群

## 第二步. 部署目标 Doris 集群

## 第三步. 打开源和目标集群的 binlog 配置

在源集群和目标集群的 fe.conf 和 be.conf 中配置如下信息：

```sql
enable_feature_binlog=true
```

## 第四步. 部署 Syncer

4.1. 构建 CCR Syncer

    ```shell
    git clone https://github.com/selectdb/ccr-syncer

    cd ccr-syncer

    bash build.sh <-j NUM_OF_THREAD> <--output SYNCER_OUTPUT_DIR>

    cd SYNCER_OUTPUT_DIR# 联系相关同学免费获取 ccr 二进制包
    ```

4.2. 启动和停止 Syncer

    ```shell
    # 启动
    cd bin && sh start_syncer.sh --daemon

    # 停止
    sh stop_syncer.sh
    ```

## 第五步. 打开源集群中同步库/表的 Binlog

```shell
-- 如果是整库同步，可以执行如下脚本，使得该库下面所有的表都要打开 binlog.enable
vim shell/enable_db_binlog.sh
修改源集群的 host、port、user、password、db
或者 ./enable_db_binlog.sh --host $host --port $port --user $user --password $password --db $db

-- 如果是单表同步，则只需要打开 table 的 binlog.enable，在源集群上执行：
ALTER TABLE enable_binlog SET ("binlog.enable" = "true");
```

## 第六步. 向 Syncer 发起同步任务

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

同步任务的参数说明：

```shell
name: CCR同步任务的名称，唯一即可
host、port：对应集群 Master FE的host和mysql(jdbc) 的端口
user、password：syncer以何种身份去开启事务、拉取数据等
database、table：
如果是库级别的同步，则填入your_db_name，your_table_name为空
如果是表级别同步，则需要填入your_db_name，your_table_name
向syncer发起同步任务中的name只能使用一次
```
