---
{
    "title": "安装fdb",
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

- 一般要求至少3台机器组成一个双副本、允许单机故障的fdb集群。

> 如果只是需要开发、测试，只要一台机器就行。

## 1. 安装

每台机器都需先安装fdb服务。安装包下载地址 <https://github.com/apple/foundationdb/releases>，选择一个版本，目前一般用的版本 [7.1.38](https://github.com/apple/foundationdb/releases/tag/7.1.38)。

一般关注centos(redhat) 和 ubuntu 的即可
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

安装fdb

```Shell
// ubuntu系统
user@host$ sudo dpkg -i foundationdb-clients_7.1.23-1_amd64.deb \
foundationdb-server_7.1.23-1_amd64.deb

// Centos系统
user@host$ sudo rpm -Uvh foundationdb-clients-7.1.23-1.el7.x86_64.rpm \
foundationdb-server-7.1.23-1.el7.x86_64.rpm
```

安装完毕后，在命令行输入fdbcli查看是否安装成功，成功会显示available字样：

```SQL
user@host$ fdbcli
Using cluster file `/etc/foundationdb/fdb.cluster'.

The database is available.

Welcome to the fdbcli. For help, type `help'.
```

安装完毕后有几点需要注意：

- 默认会启动一个fdb服务。
- 默认集群信息文件fdb.cluster存放在/etc/foundationdb/fdb.cluster、默认集群配置文件foundationdb.conf存放在/etc/foundationdb/foundationdb.conf。
- 默认data和log保存在/var/lib/foundationdb/data/和/var/log/foundationdb。
- 默认会新建一个foundationdb的user和group，data和log的路径默认已有foundationdb的访问权限。

## 1. 主机配置

从三台机器中选择一台作为主机，先将主机配置好，再配置其他机器。

### 1. 更改fdb配置

按照不同机型使用不同的fdb配置

目前使用的8核 32G内存 一块数据盘500G机型的foundationdb.conf如下，注意log和data的存放路径，目前的数据盘一般挂载在mnt上：

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

先按照上述配置的datadir和logdir路径在主机上创建相应的目录，并使其有foundationdb的访问权限：

```Shell
chown -R foundationdb:foundationdb /mnt/foundationdb/data/ /mnt/foundationdb/log
```

然后将/etc/foundationdb/foundationdb.conf的内容替换为上述配置内容。

### 1. 配置访问权限

先设置/etc/foundationdb目录的访问权限：

```Shell
chmod -R 777 /etc/foundationdb
```

在主机中修改/etc/foundationdb/fdb.cluster中的ip地址，默认是本机地址，修改为内网地址，如

```Shell
3OrXp9ei:diDqAjYV@127.0.0.1:4500 -> 3OrXp9ei:diDqAjYV@172.21.16.37:4500
```

然后重启fdb服务

```Shell
# for service
user@host$ sudo service foundationdb restart

# for systemd
user@host$ sudo systemctl restart foundationdb.service
```

### 1. 配置新数据库

主机由于更改了data和dir的存放路径，需新建database，在fdbcli中新建一个ssd存储引擎的database。

```Shell
user@host$ fdbcli
fdb> configure new single ssd
Database created
```

最后通过fdbcli检测是否启动正常

```Shell
user@host$ fdbcli
Using cluster file `/etc/foundationdb/fdb.cluster'.

The database is available.

Welcome to the fdbcli. For help, type `help'.
```

此时主机的配置完成。

## 1. 构建集群

> 如果只部署一台机器做测试，可以直接跳过这个步骤。

对于其余机器，每台先按照2.1步骤，创建data和log目录。

然后设置/etc/foundationdb目录的访问权限：

```Shell
chmod -R 777 /etc/foundationdb
```

接着将主机的/etc/foundationdb/foundationdb.conf和/etc/foundationdb/fdb.cluster替换成本机的/etc/foundationdb/foundationdb.conf和/etc/foundationdb/fdb.cluster。

然后在本机重启fdb服务

```Shell
# for service
user@host$ sudo service foundationdb restart

# for systemd
user@host$ sudo systemctl restart foundationdb.service
```

待所有机器操作完毕后，所有机器都已连接在同一集群上（同一fdb.cluster）。此时登录主机，配置双副本模式：

```Shell
user@host$ fdbcli
Using cluster file `/etc/foundationdb/fdb.cluster'.

The database is available.

Welcome to the fdbcli. For help, type `help'.
fdb> configure double
Configuration changed.
```

然后在主机配置fdb.cluster可被访问的机器和端口，用于容灾：

```Shell
user@host$ fdbcli
Using cluster file `/etc/foundationdb/fdb.cluster'.

The database is available.

Welcome to the fdbcli. For help, type `help'.
fdb> coordinators 主机ip:4500 从机1ip:4500 从机2ip:4500（需要填写所有机器）
Coordinators changed
```

最后通过fdbcli中的status检测模式是否配置成功：

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
