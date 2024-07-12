---
{
    "title": "部署前准备",
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

Doris存算分离架构部署方式示意图如下，共需要 3 个模块参与工作：

- **FE**：负责接收用户请求，负责存储库表的元数据，目前是有状态的，未来会和BE类似，演化为无状态。
- **BE**：无状态化的 Doris BE 节点，负责具体的计算任务。BE 上会缓存一部分 Tablet 元数据和数据以提高查询性能。
- **Meta Service**：存算分离模式新增模块，程序名为 `doris_cloud`，可通过启动不同参数来指定为以下两种角色之一
  - **Meta Service**：元数据管理，提供元数据操作的服务，例如创建 Tablet，新增 Rowset，Tablet 查询以及 Rowset 元数据查询等功能。
  - **Recycler**：数据回收。通过定期对记录已标记删除的数据的元数据进行扫描，实现对数据的定期异步正向回收（文件实际存储在 S3 或 HDFS 上），而无须列举数据对象进行元数据对比。

![apache-doris-in-compute-storage-decoupled-mode](/images/apache-doris-in-compute-storage-decoupled-mode.png)

Meta Service 是一种无状态化的服务，依赖了一个高性能分布式事务 KV（即 [FoundationDB](https://github.com/apple/foundationdb)）来存储元数据，大幅简化了元数据管理流程，同时提供强大的横向的扩展能力。

![deployment-of-compute-storage-decoupled-mode](/images/deployment-of-compute-storage-decoupled-mode.png)

Doris 存算分离架构依赖于两个外部开源项目，为确保部署顺利，请在开始前预先安装以下依赖：

- **FoundationDB (FDB)**
- **OpenJDK17**: 需要安装到所有部署 Meta Service 的节点上。


## 部署步骤

Doris存算分离模式部署按照模块和分工是＂从下往上＂部署：
1. 存算分离模式机器规划，这一步在[本文档](./before-deployment.md)介绍。
2. 部署fdb以及运行环境等基础的依赖，这一步不需要Doris的编译产出即可完成，在[本文档](./before-deployment.md)介绍。
3. [部署meta-service以及recycler](./compilation-and-deployment.md)
4. [部署FE以及BE](./creating-cluster.md)

注意：一套 fdb+meta-servce+recycler 基础环境可以支撑多个存算分离模式的Doris实例(多套FE+BE)。

## 部署规划

Doris存算分离模式推荐的方式是按照模块划分，尽量避免模块间相互影响。
推荐的部署方式以及规划：
* meta-service，recycler 以及 fdb 使用同一批机器。要求大于等于3台。
	* 存算分离模式要正常运行至少要部署一个 meta-service 进程以及至少一个 recycler 进程。这两种进程是无状态的，可以按需增加部署数量，一般每种进程部署3个能够满足需求。
	* 为了保证 fdb 的性能，可靠性以及扩展性，fdb 需要使用多副本部署的方式。
* FE单独部署，至少1台，可以按需实际查询需要多部署一些
* BE单独部署，至少1台，可以按需实际查询需要多部署一些


```
               host1                  host2
       .------------------.   .------------------.
       |                  |   |                  |
       |        FE        |   |        BE        |
       |                  |   |                  |
       '------------------'   '------------------'

        host3                 host4                 host5
.------------------.  .------------------.  .------------------.
|     recycler     |  |     recycler     |  |     recycler     |
|   meta-servcie   |  |   meta-servcie   |  |   meta-servcie   |
|       fdb        |  |       fdb        |  |       fdb        |
'------------------'  '------------------'  '------------------'

```


如果机器数量有限，可以使用全混部的方式，所有模块部署在同一批机器，要求机器数量大于3台。
如下是一种可行的规划。

```
        host1                  host2                  host3
.------------------.   .------------------.   .------------------.
|                  |   |                  |   |                  |
|        FE        |   |                  |   |                  |
|                  |   |        BE        |   |        BE        |
|     recycler     |   |                  |   |                  |
|   meta-servcie   |   |                  |   |                  |
|       fdb        |   |       fdb        |   |       fdb        |
|                  |   |                  |   |                  |
'------------------'   '------------------'   '------------------'
```


## 安装 FoundationDB

### 机器要求

通常情况下，需要至少 3 台机器组成一个双副本、允许单机故障的 FoundationDB 集群。

:::tip

如果仅出于开发/测试需要，使用一台机器即可。

:::

每台机器都需先安装 FoundationDB 服务。可通过[以下地址](https://github.com/apple/foundationdb/releases)选择一个版本下载 FoundationDB 安装包，目前通常推荐使用 [7.1.38](https://github.com/apple/foundationdb/releases/tag/7.1.38) 版本。

对于 CentOS (Red Hat) 和 Ubuntu 用户，以下是[下载链接](https://github.com/apple/foundationdb/releases/tag/7.1.38)：

- [clients-x86_64.rpm](https://github.com/apple/foundationdb/releases/download/7.1.38/foundationdb-clients-7.1.38-1.el7.x86_64.rpm)
- [server-x86_64.rpm](https://github.com/apple/foundationdb/releases/download/7.1.38/foundationdb-server-7.1.38-1.el7.x86_64.rpm)
- [clients-amd64.deb](https://github.com/apple/foundationdb/releases/download/7.1.38/foundationdb-clients_7.1.38-1_amd64.deb)
- [server-amd64.deb](https://github.com/apple/foundationdb/releases/download/7.1.38/foundationdb-server_7.1.38-1_amd64.deb)

如果需要更高速的下载，也可使用如下镜像链接：

- [clients-x86_64.rpm](https://selectdb-doris-1308700295.cos.ap-beijing.myqcloud.com/toolkit/fdb/foundationdb-clients-7.1.38-1.el7.x86_64.rpm)
- [server-x86_64.rpm](https://selectdb-doris-1308700295.cos.ap-beijing.myqcloud.com/toolkit/fdb/foundationdb-server-7.1.38-1.el7.x86_64.rpm)
- [clients-amd64.deb](https://selectdb-doris-1308700295.cos.ap-beijing.myqcloud.com/toolkit/fdb/foundationdb-clients_7.1.38-1_amd64.deb)
- [server-amd64.deb](https://selectdb-doris-1308700295.cos.ap-beijing.myqcloud.com/toolkit/fdb/foundationdb-server_7.1.38-1_amd64.deb)

可以使用如下命令安装 FoundationDB 程序：

```Shell
// Ubuntu 系统 user@host
$ sudo dpkg -i foundationdb-clients_7.1.23-1_amd64.deb \ foundationdb-server_7.1.23-1_amd64.deb

// CentOS 系统 
user@host$ sudo rpm -Uvh foundationdb-clients-7.1.23-1.el7.x86_64.rpm \ foundationdb-server-7.1.23-1.el7.x86_64.rpm
```

安装完毕后，在命令行输入 `fdbcli` 查看是否安装成功。若返回结果显示如下 `available` 字样，则表示安装成功：

```Plain
user@host$ fdbcli
Using cluster file `/etc/foundationdb/fdb.cluster'.

The database is available.

Welcome to the fdbcli. For help, type `help'.
```

:::info 备注

安装成功后：

- 默认将启动一个 FoundationDB 服务。
- 默认集群信息文件 `fdb.cluster`将存放在`/etc/foundationdb/fdb.cluster`，默认集群配置文件 `foundationdb.conf` 将存放在`/etc/foundationdb/foundationdb.conf`。
- 默认将数据和日志分别保存在`/var/lib/foundationdb/data/`和`/var/log/foundationdb`。
- 默认将新建一个 FoundationDB 的 `user` 和 `group`，数据和日志的路径默认已具备 FoundationDB 的访问权限。

:::

### 主机配置

从三台机器中选择一台作为主机。首先完成主机的配置，再配置其他机器。

### 更改 FoundationDB 配置

根据不同机型调整 FoundationDB 配置， 具体配置请参考 [FoundationDB 系统要求](https://apple.github.io/foundationdb/configuration.html#system-requirements)。

以下是一个基于 8 核 CPU、32GB 内存和一块 500GB SSD 数据盘的机器的`foundationdb.conf`示例（请确保正确设置 `data` 和 `log` 的存放路径；目前，数据盘一般挂载在 `mnt` 上）：

```Bash
# foundationdb.conf
##
## Configuration file for FoundationDB server processes
## Full documentation is available at
## https://apple.github.io/foundationdb/configuration.html#the-configuration-file

[fdbmonitor]
user = foundationdb
group = foundationdb

[general]
restart-delay = 60
## By default, restart-backoff = restart-delay-reset-interval = restart-delay
# initial-restart-delay = 0
# restart-backoff = 60
# restart-delay-reset-interval = 60
cluster-file = /etc/foundationdb/fdb.cluster
# delete-envvars =
# kill-on-configuration-change = true

## Default parameters for individual fdbserver processes
[fdbserver]
command = /usr/sbin/fdbserver
public-address = auto:$ID
listen-address = public
logdir = /mnt/foundationdb/log
datadir = /mnt/foundationdb/data/$ID
# logsize = 10MiB
# maxlogssize = 100MiB
# machine-id =
# datacenter-id =
# class =
# memory = 8GiB
# storage-memory = 1GiB
# cache-memory = 2GiB
# metrics-cluster =
# metrics-prefix =

## An individual fdbserver process with id 4500
## Parameters set here override defaults from the [fdbserver] section
[fdbserver.4500]
class = stateless
[fdbserver.4501]
class = stateless

[fdbserver.4502]
class = storage

[fdbserver.4503]
class = storage

[fdbserver.4504]
class = log

[backup_agent]
command = /usr/lib/foundationdb/backup_agent/backup_agent
logdir = /mnt/foundationdb/log

[backup_agent.1]
```

首先，按照已配置的 `datadir` 和 `logdir` 路径在主机上创建相应的目录，并使其具有 `foundationdb` 的访问权限：

```Shell
chown -R foundationdb:foundationdb /mnt/foundationdb/data/ /mnt/foundationdb/log
```

然后将 `/etc/foundationdb/foundationdb.conf` 的内容替换为上述相应配置。

### 配置访问权限

先设置 `/etc/foundationdb` 目录的访问权限：

```Shell
chmod -R 777 /etc/foundationdb
```

在主机中修改 `/etc/foundationdb/fdb.cluster` 中的 `ip` 地址，默认是本机地址，修改为内网地址，如：

```Shell
3OrXp9ei:diDqAjYV@127.0.0.1:4500 -> 3OrXp9ei:diDqAjYV@172.21.16.37:4500
```

然后重启 FoundationDB 服务：

```Bash
# for service
user@host$ sudo service foundationdb restart

# for systemd
user@host$ sudo systemctl restart foundationdb.service
```

### 配置新数据库

主机由于更改了 `data` 和 `log` 的存放路径，需新建 `database`。可在 `fdbcli` 中新建一个 以`ssd` 为存储引擎的 `database`。

```Shell
user@host$ fdbcli
fdb> configure new single ssd
Database created
```

最后通过 `fdbcli` 检测是否启动正常。

```Shell
user@host$ fdbcli
Using cluster file `/etc/foundationdb/fdb.cluster'.

The database is available.

Welcome to the fdbcli. For help, type `help'.
```

至此，主机的配置完成。

### 构建 FoundationDB 集群

:::tip

如果仅部署一台机器进行开发/测试，可以跳过此步骤。

:::

对于主机以外的机器，每台机器先按照主机配置步骤，创建 `data` 和 `log` 目录。

然后，设置 `/etc/foundationdb` 目录的访问权限：

```Shell
chmod -R 777 /etc/foundationdb
```

将主机的 `/etc/foundationdb/foundationdb.conf `和`/etc/foundationdb/fdb.cluster` 替换为本机的 `/etc/foundationdb/foundationdb.conf `和`/etc/foundationdb/fdb.cluster`。

随后在本机重启 FoundationDB 服务。

```Bash
# for service
user@host$ sudo service foundationdb restart

# for systemd
user@host$ sudo systemctl restart foundationdb.service
```

待所有机器操作完毕后，所有机器都已连接在同一集群上（即同一 `fdb.cluster`）。此时登录主机，配置双副本模式：

```Shell
user@host$ fdbcli
Using cluster file `/etc/foundationdb/fdb.cluster'.

The database is available.

Welcome to the fdbcli. For help, type `help'.
fdb> configure double
Configuration changed.
```

然后在主机配置 `fdb.cluster` 可被访问的机器和端口，用于容灾：

```Shell
user@host$ fdbcli
Using cluster file `/etc/foundationdb/fdb.cluster'.

The database is available.

Welcome to the fdbcli. For help, type `help'.
fdb> coordinators ${主机ip}:4500 ${从机1ip}:4500 ${从机2ip}:4500（需要填写所有机器）
Coordinators changed
```

最后，通过 `fdbcli` 中的 `status` 检测模式是否配置成功：

```Shell
[root@ip-10-100-3-91 recycler]# fdbcli
Using cluster file `/etc/foundationdb/fdb.cluster'.

The database is available.

Welcome to the fdbcli. For help, type `help'.
fdb> status

Using cluster file `/etc/foundationdb/fdb.cluster'.

Configuration:
  Redundancy mode        - double
  Storage engine         - ssd-2
  Coordinators           - 3
  Usable Regions         - 1

Cluster:
  FoundationDB processes - 15
  Zones                  - 3
  Machines               - 3
  Memory availability    - 6.1 GB per process on machine with least available
  Fault Tolerance        - 1 machines
  Server time            - 11/11/22 04:47:30

Data:
  Replication health     - Healthy
  Moving data            - 0.000 GB
  Sum of key-value sizes - 0 MB
  Disk space used        - 944 MB

Operating space:
  Storage server         - 473.9 GB free on most full server
  Log server             - 473.9 GB free on most full server

Workload:
  Read rate              - 19 Hz
  Write rate             - 0 Hz
  Transactions started   - 5 Hz
  Transactions committed - 0 Hz
  Conflict rate          - 0 Hz

Backup and DR:
  Running backups        - 0
  Running DRs            - 0
```

## 安装 OpenJDK 17

OpenJDK 17 需安装到所有的节点上，可通过以下链接获取安装：[OpenJDK 17](https://download.java.net/java/GA/jdk17.0.1/2a2082e5a09d4267845be086888add4f/12/GPL/openjdk-17.0.1_linux-x64_bin.tar.gz)

然后，将下载好的 OpenJDK 安装包直接解压到安装路径即可：

```Bash
tar xf openjdk-17.0.1_linux-x64_bin.tar.gz  -C /opt/

# 启动 meta-service 或者 recycler 之前
export JAVA_HOME=/opt/jdk-17.0.1
```

## 注意事项

部署 FoundationDB 的机器同时也可部署 Meta Service 和 Recycler，此为推荐部署方式，可节省机器资源。
