---
{
    "title": "安装 FDB",
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


## 0. 机器要求

- 一般要求至少 3 台机器组成一个双副本、允许单机故障的 FDB 集群。

> 如果只是需要开发、测试，只要一台机器就行。

## 1. 安装

每台机器都需先安装 FDB 服务。安装包下载地址 <https://github.com/apple/foundationdb/releases>，选择一个版本，目前一般用的版本 [7.1.38](https://github.com/apple/foundationdb/releases/tag/7.1.38)。

一般关注 centos(redhat) 和 ubuntu 的即可
这里是原链接
<https://github.com/apple/foundationdb/releases/download/7.1.38/foundationdb-clients-7.1.38-1.el7.x86_64.rpm>
<https://github.com/apple/foundationdb/releases/download/7.1.38/foundationdb-server-7.1.38-1.el7.x86_64.rpm>
<https://github.com/apple/foundationdb/releases/download/7.1.38/foundationdb-clients_7.1.38-1_amd64.deb>
<https://github.com/apple/foundationdb/releases/download/7.1.38/foundationdb-server_7.1.38-1_amd64.deb>

这里镜像
<https://selectdb-doris-1308700295.cos.ap-beijing.myqcloud.com/toolkit/fdb/foundationdb-clients-7.1.38-1.el7.x86_64.rpm>
<https://selectdb-doris-1308700295.cos.ap-beijing.myqcloud.com/toolkit/fdb/foundationdb-server-7.1.38-1.el7.x86_64.rpm>
<https://selectdb-doris-1308700295.cos.ap-beijing.myqcloud.com/toolkit/fdb/foundationdb-server_7.1.38-1_amd64.deb>
<https://selectdb-doris-1308700295.cos.ap-beijing.myqcloud.com/toolkit/fdb/foundationdb-clients_7.1.38-1_amd64.deb>

安装 FDB```Shell
// ubuntu 系统
user@host$ sudo dpkg -i foundationdb-clients_7.1.23-1_amd64.deb \
foundationdb-server_7.1.23-1_amd64.deb

// Centos 系统
user@host$ sudo rpm -Uvh foundationdb-clients-7.1.23-1.el7.x86_64.rpm \
foundationdb-server-7.1.23-1.el7.x86_64.rpm
```

安装完毕后，在命令行输入 fdbcli 查看是否安装成功，成功会显示 available 字样：

```SQL
user@host$ fdbcli
Using cluster file `/etc/foundationdb/fdb.cluster'.

The database is available.

Welcome to the fdbcli. For help, type `help'.
```

安装完毕后有几点需要注意：

- 默认会启动一个 FDB 服务。

- 默认集群信息文件 fdb.cluster 存放在/etc/foundationdb/fdb.cluster、默认集群配置文件 foundationdb.conf 存放在/etc/foundationdb/foundationdb.conf。

- 默认 data 和 log 保存在/var/lib/foundationdb/data/和/var/log/foundationdb。

- 默认会新建一个 foundationdb 的 user 和 group，data 和 log 的路径默认已有 foundationdb 的访问权限。

## 1. 主机配置

从三台机器中选择一台作为主机，先将主机配置好，再配置其他机器。

### 1. 更改 FDB 配置

按照不同机型使用不同的 FDB 配置

目前使用的 8 核 32G 内存 一块数据盘 500G 机型的 foundationdb.conf 如下，注意 log 和 data 的存放路径，目前的数据盘一般挂载在 mnt 上：

> 目前只出了 8C32G 和 4C16G 机型的配置模板，部署时请更改对应机型的配置。

```Shell
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
## by default, restart-backoff = restart-delay-reset-interval = restart-delay
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

先按照上述配置的 datadir 和 logdir 路径在主机上创建相应的目录，并使其有 foundationdb 的访问权限：

```Shell
chown -R foundationdb:foundationdb /mnt/foundationdb/data/ /mnt/foundationdb/log
```

然后将/etc/foundationdb/foundationdb.conf 的内容替换为上述配置内容。

### 1. 配置访问权限

先设置/etc/foundationdb 目录的访问权限：

```Shell
chmod -R 777 /etc/foundationdb
```

在主机中修改/etc/foundationdb/fdb.cluster 中的 ip 地址，默认是本机地址，修改为内网地址，如

```Shell
3OrXp9ei:diDqAjYV@127.0.0.1:4500 -> 3OrXp9ei:diDqAjYV@172.21.16.37:4500
```

然后重启 FDB 服务

```Shell
# for service
user@host$ sudo service foundationdb restart

# for systemd
user@host$ sudo systemctl restart foundationdb.service
```

### 1. 配置新数据库

主机由于更改了 data 和 dir 的存放路径，需新建 database，在 fdbcli 中新建一个 ssd 存储引擎的 database。

```Shell
user@host$ fdbcli
fdb> configure new single ssd
Database created
```

最后通过 fdbcli 检测是否启动正常

```Shell
user@host$ fdbcli
Using cluster file `/etc/foundationdb/fdb.cluster'.

The database is available.

Welcome to the fdbcli. For help, type `help'.
```

此时主机的配置完成。

## 1. 构建集群

> 如果只部署一台机器做测试，可以直接跳过这个步骤。

对于其余机器，每台先按照 2.1 步骤，创建 data 和 log 目录。

然后设置/etc/foundationdb 目录的访问权限：

```Shell
chmod -R 777 /etc/foundationdb
```

接着将主机的/etc/foundationdb/foundationdb.conf 和/etc/foundationdb/fdb.cluster 替换成本机的/etc/foundationdb/foundationdb.conf 和/etc/foundationdb/fdb.cluster。

然后在本机重启 FDB 服务

```Shell
# for service
user@host$ sudo service foundationdb restart

# for systemd
user@host$ sudo systemctl restart foundationdb.service
```

待所有机器操作完毕后，所有机器都已连接在同一集群上（同一 fdb.cluster）。此时登录主机，配置双副本模式：

```Shell
user@host$ fdbcli
Using cluster file `/etc/foundationdb/fdb.cluster'.

The database is available.

Welcome to the fdbcli. For help, type `help'.
fdb> configure double
Configuration changed.
```

然后在主机配置 fdb.cluster 可被访问的机器和端口，用于容灾：

```Shell
user@host$ fdbcli
Using cluster file `/etc/foundationdb/fdb.cluster'.

The database is available.

Welcome to the fdbcli. For help, type `help'.
fdb> coordinators 主机 ip:4500 从机 1ip:4500 从机 2ip:4500（需要填写所有机器）
Coordinators changed
```

最后通过 fdbcli 中的 status 检测模式是否配置成功：

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
