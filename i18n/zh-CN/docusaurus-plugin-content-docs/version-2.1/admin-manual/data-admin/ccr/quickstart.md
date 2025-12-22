---
{
    "title": "快速开始",
    "language": "zh-CN",
    "description": "在源集群和目标集群的 fe.conf 和 be.conf 中配置如下信息："
}
---

## 1. 打开源和目标集群的 binlog 配置

在源集群和目标集群的 fe.conf 和 be.conf 中配置如下信息：

```sql
enable_feature_binlog=true
```

## 2. 部署 Syncer

2.1. 从如下链接下载最新的包

`https://apache-doris-releases.oss-accelerate.aliyuncs.com/ccr-release/ccr-syncer-3.0.6-rc04-x64.tar.xz`

2.2. 启动和停止 Syncer

```shell
# 启动
cd bin && sh start_syncer.sh --daemon

# 停止
sh stop_syncer.sh
```

## 3. 打开源集群中同步库/表的 Binlog

```shell
-- 如果是整库同步，可以执行如下脚本，使得该库下面所有的表都要打开 binlog.enable
./enable_db_binlog.sh --host $host --port $port --user $user --password $password --db $db

-- 如果是单表同步，则只需要打开 table 的 binlog.enable，在源集群上执行：
ALTER TABLE enable_binlog SET ("binlog.enable" = "true");
```

## 4. 向 Syncer 发起同步任务

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
