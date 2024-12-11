---
{
    "title": "操作手册",
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

## 使用限制

### 网络约束

- 需要 Syncer 与上下游的 FE 和 BE 是互通的

- 下游 BE 与上游 BE 通过 Doris BE 进程使用的 IP （`show frontends/backends` 看到的） 是直通的。


## 启动 Syncer

根据配置选项启动 Syncer，并且在默认或指定路径下保存一个 pid 文件，pid 文件的命名方式为`host_port.pid`。

**输出路径下的文件结构**

在编译完成后的输出路径下，文件结构大致如下所示：

```sql
output_dir
    bin
        ccr_syncer
        enable_db_binlog.sh
        start_syncer.sh
        stop_syncer.sh
    db
        [ccr.db] # 默认配置下运行后生成
    log
        [ccr_syncer.log] # 默认配置下运行后生成
```

:::caution
**后文中的 start_syncer.sh 指的是该路径下的 start_syncer.sh！！！**
:::

**启动选项**

1. --daemon

后台运行 Syncer，默认为 false

```sql
bash bin/start_syncer.sh --daemon
```

2. --db_type

Syncer 目前能够使用两种数据库来保存自身的元数据，分别为`sqlite3`（对应本地存储）和`mysql`（本地或远端存储）

```sql
bash bin/start_syncer.sh --db_type mysql
```

默认值为 sqlite3

在使用 mysql 存储元数据时，Syncer 会使用`CREATE IF NOT EXISTS`来创建一个名为`ccr`的库，ccr 相关的元数据表都会保存在其中

3. --db_dir

**这个选项仅在 db 使用 `sqlite3` 时生效**

可以通过此选项来指定 sqlite3 生成的 db 文件名及路径。

```sql
bash bin/start_syncer.sh --db_dir /path/to/ccr.db
```

默认路径为`SYNCER_OUTPUT_DIR/db`，文件名为`ccr.db`

4. --db_host & db_port & db_user & db_password

**这个选项仅在 db 使用 `mysql` 时生效**

```sql
bash bin/start_syncer.sh --db_host 127.0.0.1 --db_port 3306 --db_user root --db_password "qwe123456"
```

db_host、db_port 的默认值如例子中所示，db_user、db_password 默认值为空

5. --log_dir

日志的输出路径

```sql
bash bin/start_syncer.sh --log_dir /path/to/ccr_syncer.log
```

默认路径为`SYNCER_OUTPUT_DIR/log`，文件名为`ccr_syncer.log`

6. --log_level

用于指定 Syncer 日志的输出等级。

```sql
bash bin/start_syncer.sh --log_level info
```

日志的格式如下，其中 hook 只会在`log_level > info`的时候打印：

```sql
#        time         level        msg                  hooks
[2023-07-18 16:30:18] TRACE This is trace type. ccrName=xxx line=xxx
[2023-07-18 16:30:18] DEBUG This is debug type. ccrName=xxx line=xxx
[2023-07-18 16:30:18]  INFO This is info type. ccrName=xxx line=xxx
[2023-07-18 16:30:18]  WARN This is warn type. ccrName=xxx line=xxx
[2023-07-18 16:30:18] ERROR This is error type. ccrName=xxx line=xxx
[2023-07-18 16:30:18] FATAL This is fatal type. ccrName=xxx line=xxx
```

在--daemon 下，log_level 默认值为`info`

在前台运行时，log_level 默认值为`trace`，同时日志会通过 tee 来保存到 log_dir

6. --host && --port

用于指定 Syncer 的 host 和 port，其中 host 只起到在集群中的区分自身的作用，可以理解为 Syncer 的 name，集群中 Syncer 的名称为`host:port`

```sql
bash bin/start_syncer.sh --host 127.0.0.1 --port 9190
```

host 默认值为 127.0.0.1，port 的默认值为 9190

7. --pid_dir

用于指定 pid 文件的保存路径

pid 文件是 stop_syncer.sh 脚本用于停止 Syncer 的凭据，里面保存了对应 Syncer 的进程号，为了方便 Syncer 的集群化管理，可以指定 pid 文件的保存路径

```sql
bash bin/start_syncer.sh --pid_dir /path/to/pids
```

默认值为`SYNCER_OUTPUT_DIR/bin`

## 停止 Syncer

根据默认或指定路径下 pid 文件中的进程号停止对应 Syncer，pid 文件的命名方式为`host_port.pid`。

**输出路径下的文件结构**

在编译完成后的输出路径下，文件结构大致如下所示：

```shell
output_dir
    bin
        ccr_syncer
        enable_db_binlog.sh
        start_syncer.sh
        stop_syncer.sh
    db
        [ccr.db] # 默认配置下运行后生成
    log
        [ccr_syncer.log] # 默认配置下运行后生成
```
:::caution
**后文中的 stop_syncer.sh 指的是该路径下的 stop_syncer.sh！！！**
:::

**停止选项**

有三种停止方法：

1. 停止目录下单个 Syncer

​    指定要停止 Syncer 的 host && port，注意要与 start_syncer 时指定的 host 一致

2. 批量停止目录下指定 Syncer

​    指定要停止的 pid 文件名，以空格分隔，用`" "`包裹

3. 停止目录下所有 Syncer

​    默认即可

1. --pid_dir

指定 pid 文件所在目录，上述三种停止方法都依赖于 pid 文件的所在目录执行

```shell
bash bin/stop_syncer.sh --pid_dir /path/to/pids
```

例子中的执行效果就是停止`/path/to/pids`下所有 pid 文件对应的 Syncer（**方法 3**），`--pid_dir`可与上面三种停止方法组合使用。

默认值为`SYNCER_OUTPUT_DIR/bin`

2. --host && --port

停止 pid_dir 路径下 host:port 对应的 Syncer

```shell
bash bin/stop_syncer.sh --host 127.0.0.1 --port 9190
```

host 的默认值为 127.0.0.1，port 默认值为空

即，单独指定 host 时**方法 1**不生效，会退化为**方法 3**。

host 与 port 都不为空时**方法 1**才能生效

3. --files

停止 pid_dir 路径下指定 pid 文件名对应的 Syncer

```shell
bash bin/stop_syncer.sh --files "127.0.0.1_9190.pid 127.0.0.1_9191.pid"
```

文件之间用空格分隔，整体需要用`" "`包裹住

## Syncer 操作列表

**请求的通用模板**

```shell
curl -X POST -H "Content-Type: application/json" -d {json_body} http://ccr_syncer_host:ccr_syncer_port/operator
```

json_body: 以 json 的格式发送操作所需信息

operator：对应 Syncer 的不同操作

所以接口返回都是 json, 如果成功则是其中 success 字段为 true, 类似，错误的时候，是 false，然后存在`ErrMsgs`字段

```JSON
{"success":true}

or

{"success":false,"error_msg":"job ccr_test not exist"}
```

### 创建任务

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "ccr_test",
    "src": {
    "host": "localhost",
    "port": "9030",
    "thrift_port": "9020",
    "user": "root",
    "password": "",
    "database": "demo",
    "table": "example_tbl"
    },
    "dest": {
    "host": "localhost",
    "port": "9030",
    "thrift_port": "9020",
    "user": "root",
    "password": "",
    "database": "ccrt",
    "table": "copy"
    }
}' http://127.0.0.1:9190/create_ccr
```

- name: CCR 同步任务的名称，唯一即可

- host、port：对应集群 master 的 host 和 mysql(jdbc) 的端口

- thrift_port：对应 FE 的 rpc_port

- user、password：Syncer 以何种身份去开启事务、拉取数据等

- database、table：

  - 如果是 库级别的同步，则填入 dbName，tableName 为空

  - 如果是表级别同步，则需要填入 dbName、tableName

### 查看同步进度

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/get_lag
```

job_name 是 create_ccr 时创建的 name。

### 暂停任务

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/pause
```

### 恢复任务

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/resume
```

### 删除任务

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/delete
```

### 获取版本

```shell
curl http://ccr_syncer_host:ccr_syncer_port/version

# > return
{"version": "2.0.1"}
```

### 查看任务状态

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/job_status

{
"success": true,
"status": {
    "name": "ccr_db_table_alias",
    "state": "running",
    "progress_state": "TableIncrementalSync"
}
}
```

### 结束同步

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/desync
```

### 获取任务列表

```shell
curl http://ccr_syncer_host:ccr_syncer_port/list_jobs

{"success":true,"jobs":["ccr_db_table_alias"]}
```

### 开启库中所有表的 binlog

**输出路径下的文件结构**

在编译完成后的输出路径下，文件结构大致如下所示：

```shell
output_dir
    bin
        ccr_syncer
        enable_db_binlog.sh
        start_syncer.sh
        stop_syncer.sh
    db
        [ccr.db] # 默认配置下运行后生成
    log
        [ccr_syncer.log] # 默认配置下运行后生成
```
:::caution
**后文中的 enable_db_binlog.sh 指的是该路径下的 enable_db_binlog.sh！！！**
:::

**使用说明**

```shell
bash bin/enable_db_binlog.sh -h host -p port -u user -P password -d db
```

## Syncer 高可用

Syncer 高可用依赖 mysql，如果使用 mysql 作为后端存储，Syncer 可以发现其它 Syncer，如果一个 crash 了，其他会分担他的任务

## 权限要求

1. Select_priv 对数据库、表的只读权限。

2. Load_priv 对数据库、表的写权限。包括 Load、Insert、Delete 等。

3. Alter_priv 对数据库、表的更改权限。包括重命名 库/表、添加/删除/变更 列、添加/删除 分区等操作。

4. Create_priv 创建数据库、表、视图的权限。

5. drop_priv 删除数据库、表、视图的权限。

加上 Admin 权限 (之后考虑彻底移除), 这个是用来检测 enable binlog config 的，现在需要 admin


### 版本要求

版本最低要求：v2.0.15


## Feature

### 限速

BE 端配置参数：

```shell
download_binlog_rate_limit_kbs=1024 # 限制单个 BE 节点从源集群拉取 Binlog（包括 Local Snapshot）的速度为 1 MB/s
```

详细参数加说明：

1. `download_binlog_rate_limit_kbs` 参数在源集群 BE 节点配置，通过设置该参数能够有效限制数据拉取速度。

2. `download_binlog_rate_limit_kbs` 参数主要用于设置单个 BE 节点的速度，若计算集群整体速率一般需要参数值乘以集群个数。



## IS_BEING_SYNCED 属性

从 Doris v2.0 "is_being_synced" = "true"

CCR 功能在建立同步时，会在目标集群中创建源集群同步范围中表（后称源表，位于源集群）的副本表（后称目标表，位于目标集群），但是在创建副本表时需要失效或者擦除一些功能和属性以保证同步过程中的正确性。

如：

- 源表中包含了可能没有被同步到目标集群的信息，如`storage_policy`等，可能会导致目标表创建失败或者行为异常。

- 源表中可能包含一些动态功能，如动态分区等，可能导致目标表的行为不受 Syncer 控制导致 partition 不一致。

在被复制时因失效而需要擦除的属性有：

- `storage_policy`

- `colocate_with`

在被同步时需要失效的功能有：

- 自动分桶

- 动态分区

### 实现

在创建目标表时，这条属性将会由 Syncer 控制添加或者删除，在 CCR 功能中，创建一个目标表有两个途径：

1. 在表同步时，Syncer 通过 backup/restore 的方式对源表进行全量复制来得到目标表。

2. 在库同步时，对于存量表而言，Syncer 同样通过 backup/restore 的方式来得到目标表，对于增量表而言，Syncer 会通过携带有 CreateTableRecord 的 binlog 来创建目标表。

综上，对于插入`is_being_synced`属性有两个切入点：全量同步中的 restore 过程和增量同步时的 getDdlStmt。

在全量同步的 restore 过程中，Syncer 会通过 rpc 发起对原集群中 snapshot 的 restore，在这个过程中为会为 RestoreStmt 添加`is_being_synced`属性，并在最终的 restoreJob 中生效，执行`isBeingSynced`的相关逻辑。在增量同步时的 getDdlStmt 中，为 getDdlStmt 方法添加参数`boolean getDdlForSync`，以区分是否为受控转化为目标表 ddl 的操作，并在创建目标表时执行`isBeingSynced`的相关逻辑。

对于失效属性的擦除无需多言，对于上述功能的失效需要进行说明：

- 自动分桶 自动分桶会在创建表时生效，计算当前合适的 bucket 数量，这就可能导致源表和目的表的 bucket 数目不一致。因此在同步时需要获得源表的 bucket 数目，并且也要获得源表是否为自动分桶表的信息以便结束同步后恢复功能。当前的做法是在获取 distribution 信息时默认 autobucket 为 false，在恢复表时通过检查`_auto_bucket`属性来判断源表是否为自动分桶表，如是则将目标表的 autobucket 字段设置为 true，以此来达到跳过计算 bucket 数量，直接应用源表 bucket 数量的目的。

- 动态分区 动态分区则是通过将`olapTable.isBeingSynced()`添加到是否执行 add/drop partition 的判断中来实现的，这样目标表在被同步的过程中就不会周期性的执行 add/drop partition 操作。

### 注意

在未出现异常时，`is_being_synced`属性应该完全由 Syncer 控制开启或关闭，用户不要自行修改该属性。
