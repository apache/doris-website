---
{
    "title": "Before Deployment",
    "language": "en"
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

The diagram below visualizes the deployment architecture of Doris in the compute-storage mode. It involves three modules: 

- **FE**: Responsible for receiving user requests and storing the meta data of databases and tables. It is currently stateful, but will evolve to be stateless like BE.
- **BE**: Stateless BE nodes, responsible for computation. The BE will cache a portion of the Tablet metadata and data to improve query performance.
- **Meta Service**: A new module added in the compute-storage decoupled mode, with the program name `doris_cloud`, which can be specified as one of the following two roles by starting with different parameters:
  - **Meta Service**: Responsible for metadata management. It provides services for metadata operations, such as creating Tablets, adding Rowsets, and querying metadata of Tablets and Rowsets.
  - **Recycler**: Responsible for data recycling. It implements periodic asynchronous forward recycling of data by regularly scanning the metadata of the data marked for deletion (the data files are stored on S3 or HDFS), without the need to list the data objects for metadata comparison.

![apache-doris-in-compute-storage-decoupled-mode](/images/apache-doris-in-compute-storage-decoupled-mode.png)

The Meta Service is a stateless service that relies on [FoundationDB](https://github.com/apple/foundationdb), a high-performance distributed transactional KV store, to store metadata. This greatly simplifies the metadata management process and provides high horizontal scalability.

![deployment-of-compute-storage-decoupled-mode](/images/deployment-of-compute-storage-decoupled-mode.png)

Deploying Doris in the compute-storage decoupled mode relies on two open-source projects. Please install the following dependencies before proceeding:

- **FoundationDB (FDB)**
- **OpenJDK17**: Needs to be installed on all nodes where the Meta Service is deployed.

## Deployment steps

Given the modules and their functionalities, it is recommended to deploy Doris in the compute-storage decoupled mode from bottom up:

1. Machine planning: Follow the instructions on [this page](./before-deployment.md).
2. Deployment of FoundationDB and the required runtime dependencies: This step can be completed without the need for any Doris compilation outputs. Follow the instructions on [this page](./before-deployment.md).
3. [Deploy Meta Service and Recycler](./compilation-and-deployment.md)
4. [Deploy FE and BE](./creating-cluster.md)

:::info
Note: A single FoundationDB + Meta Service + Recycler infrastructure can support multiple Doris instances (i.e., multiple FE + BE setups) running in the compute-storage decoupled mode.
:::

## Deployment planning

To avoid inter-module interference as much as possible, the recommended deployment is to deploy module by module.

- The Meta Service, Recycler, and FoundationDB modules use the same set of machines, with a minimum requirement of 3 machines.
  - To enable the compute-storage decoupled mode, at least one Meta Service process and one Recycler process must be deployed. These stateless processes can be scaled as needed, typically with 3 instances for each.
  - To ensure the performance, reliability, and scalability of FoundationDB, a multi-replica deployment is required.
- FE is deployed independently, with a minimum of 1 machine, and can be scaled out based on the actual query demands.
- BE is deployed independently, with a minimum of 1 machine, and can be scaled out based on the actual query demands.


```
               Host1                  Host2
       .------------------.   .------------------.
       |                  |   |                  |
       |        FE        |   |        BE        |
       |                  |   |                  |
       '------------------'   '------------------'

        Host3                 Host4                 Host5
.------------------.  .------------------.  .------------------.
|     Recycler     |  |     Recycler     |  |     Recycler     |
|   Meta Service   |  |   Meta Service   |  |   Meta Service   |
|   FoundationDB   |  |   FoundationDB   |  |   FoundationDB   |
'------------------'  '------------------'  '------------------'

```

If machine resources are limited, a hybrid deployment approach can be used, where all the modules are deployed on the same set of machines. This approach requires a minimum of 3 machines.

One feasible planning is as follows:

```
        Host1                  Host2                  Host3
.------------------.   .------------------.   .------------------.
|                  |   |                  |   |                  |
|        FE        |   |                  |   |                  |
|                  |   |        BE        |   |        BE        |
|     Recycler     |   |                  |   |                  |
|   Meta Servcie   |   |                  |   |                  |
|   FoundationDB   |   |   FoundationDB   |   |   FoundationDB   |
|                  |   |                  |   |                  |
'------------------'   '------------------'   '------------------'
```

## Install FoundationDB

### Machine requirements

Typically, at least 3 machines are required to form a FoundationDB cluster having double data replicas and allowing for failure of a single machine.

:::tip

If this is only for development/testing purposes, a single machine will be enough.

:::

Each machine needs to have the FoundationDB service installed first. You can download the [FoundationDB installation package from here](https://github.com/apple/foundationdb/releases). Currently, the [7.1.38](https://github.com/apple/foundationdb/releases/tag/7.1.38) version is generally recommended.

For CentOS (Red Hat) and Ubuntu users, the download links are as follows:

- [clients-x86_64.rpm](https://github.com/apple/foundationdb/releases/download/7.1.38/foundationdb-clients-7.1.38-1.el7.x86_64.rpm)
- [server-x86_64.rpm](https://github.com/apple/foundationdb/releases/download/7.1.38/foundationdb-server-7.1.38-1.el7.x86_64.rpm)
- [clients-amd64.deb](https://github.com/apple/foundationdb/releases/download/7.1.38/foundationdb-clients_7.1.38-1_amd64.deb)
- [server-amd64.deb](https://github.com/apple/foundationdb/releases/download/7.1.38/foundationdb-server_7.1.38-1_amd64.deb)

If you need faster downloads, you can also use the following image links:

- [clients-x86_64.rpm](https://selectdb-doris-1308700295.cos.ap-beijing.myqcloud.com/toolkit/fdb/foundationdb-clients-7.1.38-1.el7.x86_64.rpm)
- [server-x86_64.rpm](https://selectdb-doris-1308700295.cos.ap-beijing.myqcloud.com/toolkit/fdb/foundationdb-server-7.1.38-1.el7.x86_64.rpm)
- [clients-amd64.deb](https://selectdb-doris-1308700295.cos.ap-beijing.myqcloud.com/toolkit/fdb/foundationdb-clients_7.1.38-1_amd64.deb)
- [server-amd64.deb](https://selectdb-doris-1308700295.cos.ap-beijing.myqcloud.com/toolkit/fdb/foundationdb-server_7.1.38-1_amd64.deb)

Use the following command to install FoundationDB:

```Shell
// Ubuntu user@host
$ sudo dpkg -i foundationdb-clients_7.1.23-1_amd64.deb \ foundationdb-server_7.1.23-1_amd64.deb

// CentOS 
user@host$ sudo rpm -Uvh foundationdb-clients-7.1.23-1.el7.x86_64.rpm \ foundationdb-server-7.1.23-1.el7.x86_64.rpm
```

Enter `fdbcli` in the command line to check if the installation was successful. If the output shows the word `available`, it indicates a successful installation:

```Plain
user@host$ fdbcli
Using cluster file `/etc/foundationdb/fdb.cluster'.

The database is available.

Welcome to the fdbcli. For help, type `help'.
```

:::info

After a successful installation:

- By default, a FoundationDB service will be started.
- By default, the cluster information file `fdb.cluster` will be stored at `/etc/foundationdb/fdb.cluster`, and the default cluster configuration file `foundationdb.conf` will be stored at `/etc/foundationdb/foundationdb.conf`.
- By default, the data and logs will be saved in `/var/lib/foundationdb/data/` and `/var/log/foundationdb`.
- By default, a FoundationDB `user` and `group` will be created. The paths for the data and logs are already granted with access permissions to FoundationDB.

:::

### Primary machine configuration

Select one of the three machines to be the primary machine. Configure the primary machine first, and then the other machines.

### Modify FoundationDB configuration

Adjust the FoundationDB configurations based on different hardware specifications. You may follow the [FoundationDB System Requirements](https://apple.github.io/foundationdb/configuration.html#system-requirements) guidelines.

This is an example `foundationdb.conf` configuration file for a machine with 8 CPU cores, 32 GB of memory, and a 500 GB SSD data disk. Ensure that the `datadir` and `logdir` paths are set correctly. The data disk is typically mounted at `/mnt`:

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

Firstly, on the primary host machine, create the directories corresponding to the configured `datadir` and `logdir` paths, and grant the `foundationdb` user and group access to them.

```Shell
chown -R foundationdb:foundationdb /mnt/foundationdb/data/ /mnt/foundationdb/log
```

Then, replace the relevant contents of the `/etc/foundationdb/foundationdb.conf` file with the corresponding configurations.

### Configure access privilege

Set the access privileges for the `/etc/foundationdb` directory:

```Shell
chmod -R 777 /etc/foundationdb
```

On the primary machine, update the `ip` in the `/etc/foundationdb/fdb.cluster` file. It is set to the address of the local machine by default, and it should be updated to the appropriate internal network address. For example:

```Shell
3OrXp9ei:diDqAjYV@127.0.0.1:4500 -> 3OrXp9ei:diDqAjYV@172.21.16.37:4500
```

Then, restart the FoundationDB service to apply the changes:

```Bash
# for service
user@host$ sudo service foundationdb restart

# for systemd
user@host$ sudo systemctl restart foundationdb.service
```

### Configure a new database

Due to changes in the storage paths for `data` and `log`, a new `database` needs to be created on the primary machine. This can be done in `fdbcli` by creating a new `database` with `ssd` as the storage engine.

```Shell
user@host$ fdbcli
fdb> configure new single ssd
Database created
```

Finally, check through `fdbcli` to see if it starts up normally.

```Shell
user@host$ fdbcli
Using cluster file `/etc/foundationdb/fdb.cluster'.

The database is available.

Welcome to the fdbcli. For help, type `help'.
```

At this point, the configuration of the primary machine is completed.

### Build FoundationDB cluster

:::tip

If you are only deploying a single machine for development or testing, you can skip this step.

:::

For machines other than the primary machine, follow the same steps of configuring the primary machine to create the `data` and `log` directories. Then, set access privileges to the `/etc/foundationdb`directory:

```Shell
chmod -R 777 /etc/foundationdb
```

Replace `/etc/foundationdb/foundationdb.conf` and `/etc/foundationdb/fdb.cluster` of the primary machine with those of the local machine. 

Then, restart FoundationDB service on the local machine.

```Bash
# for service
user@host$ sudo service foundationdb restart

# for systemd
user@host$ sudo systemctl restart foundationdb.service
```

After these steps on all machines, the machines will be connected to the same cluster (i.e., the same `fdb.cluster`). Log in to the primary machine and configure double replicas.

```Shell
user@host$ fdbcli
Using cluster file `/etc/foundationdb/fdb.cluster'.

The database is available.

Welcome to the fdbcli. For help, type `help'.
fdb> configure double
Configuration changed.
```

Then, on the primary machine, configure the `fdb.cluster`file with the accessible machines and ports for disaster recovery purposes.

```Shell
user@host$ fdbcli
Using cluster file `/etc/foundationdb/fdb.cluster'.

The database is available.

Welcome to the fdbcli. For help, type `help'.
fdb> coordinators ${primary machine ip}:4500 ${secondary machine 1 ip}:4500 ${secondary machine 2 ip}:4500 (Fill in all machines)
Coordinators changed
```

Finally, check if the configuration is successful using the `status` command in `fdbcli`:

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

## Install OpenJDK17

All nodes must have OpenJDK 17 installed. You can download the installation package from the following link: [OpenJDK 17](https://download.java.net/java/GA/jdk17.0.1/2a2082e5a09d4267845be086888add4f/12/GPL/openjdk-17.0.1_linux-x64_bin.tar.gz)

Then, simply extract the downloaded OpenJDK package directly to the installation path:

```Bash
tar xf openjdk-17.0.1_linux-x64_bin.tar.gz  -C /opt/

# Before starting Meta Service or Recycler
export JAVA_HOME=/opt/jdk-17.0.1
```

## Note

The machines deployed with FoundationDB can also be deployed with Meta Service and Recycler, which is also the recommended deployment method to save on machine resources.
