---
{
    "title": "编译部署",
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

在存算分离模式下进行 Doris 编译与存算一体模式的编译相似，主要区别在于新增 MS 模块的编译和部署。
本文档主要介绍相比于3.0.0版本前的新增 MS 模块的编译，配置以及启停。

## 获取二进制

存算分离和存算一体模式下的编译方式相似，均使用代码库自带的 `build.sh` 脚本编译，新增的 MS 模块使用参数`--cloud` 即可编出（二进制名为 `doris_cloud`）。
**已经编译好的二进制（包含所有 Doris 模块）可以直接从 [Doris 下载页面](https://doris.apache.org/download/)下载（选择大于等于3.0.0的版本）**。

```shell
sh build.sh --fe --be --cloud 
```

相比 3.0.0 之前的版本，编译完成的二进制包中（产出）多了 `ms` 目录。

```shell
output
├── be
├── fe
└── ms
    ├── bin
    ├── conf
    └── lib
```

`ms`目录将同时用于 Meta Service 和 Recycler 两种进程。
需要注意的是，尽管 Meta Service 和 Recycler 在本质上属于同一程序，但目前需要分别为它们准备独立的二进制文件，以及工作目录。
Meta Service 和 Recycler 两个工作目录除了配置完全一致，使用不同启动参数启动。

要准备两份二进制文件/工作目录，只需使用以下命令从`ms`目录中拷贝二进制文件至一个新的 Recycler 工作目录`re`，然后在`ms`和`re`的`conf`子目录下，对端口号等参数按需进行必要修改即可。详细的配置启动会在本文后续章节介绍。

```Shell
cp -r ms re
```

可通过两种方式检查`doris_cloud` 的版本信息，若其中一种方式无法正确执行，可尝试另一方式，在`ms`或者`re`目录下：

- `bin/start.sh --version`
- `lib/doris_cloud --version`

```shell
$ lib/doris_cloud --version
version:{doris_cloud-0.0.0-debug} code_version:{commit=b9c1d057f07dd874ad32501ff43701247179adcb time=2024-03-24 20:44:50 +0800} build_info:{initiator=gavinchou@VM-10-7-centos build_at=2024-03-24 20:44:50 +0800 build_on=NAME="TencentOS Server" VERSION="3.1 (Final)" }
```

## Meta Service 和 Recycler 部署

Meta Service 和 Recycler 是同一程序的不同进程，通过启动不同参数来分别运行。

这两个进程依赖 FoundationDB，关于 FoundationDB 的部署可参考“部署前准备”页的 FoundationDB 安装指引）。

### Meta Service 配置

通常情况下，只需在`./conf` 目录下的默认配置文件 `doris_cloud.conf`中修改 `brpc_listen_port` 和 `fdb_cluster` 两个参数。（Meta Service 配置只需一个配置文件。）

```Shell
brpc_listen_port = 5000
fdb_cluster = xxx:yyy@127.0.0.1:4500
```

上述 `brpc_listen_port = 5000` 是 Meta Service 的默认端口。其中，`fdb_cluster` 是 FoundationDB 集群的连接信息，通常可从 FoundationDB 所部署机器上的 `/etc/foundationdb/fdb.cluster` 文件中获得。

**示例**

```shell
cat /etc/foundationdb/fdb.cluster

DO NOT EDIT!
This file is auto-generated, it is not to be edited by hand.
cloud_ssb:A83c8Y1S3ZbqHLL4P4HHNTTw0A83CuHj@127.0.0.1:4500
```

### Recycler 配置

除了端口外，Recycler 的其他默认配置均与 Meta Service 相同。Recycler 的 bRPC 端口一般采用 5100。

通常情况下，只需在`./conf` 目录下的默认配置文件 `doris_cloud.conf`中修改 `brpc_listen_port` 和 `fdb_cluster` 两个参数。（Recycler 配置只需一个配置文件。）

```Shell
brpc_listen_port = 5100
fdb_cluster = xxx:yyy@127.0.0.1:4500
```

上述 `brpc_listen_port = 5100` 是 Recycler 的默认端口。其中，`fdb_cluster` 是 FoundationDB 集群的连接信息，通常可从 FoundationDB 所部署机器上的 `/etc/foundationdb/fdb.cluster` 文件中获得。

**示例**

```shell
cat /etc/foundationdb/fdb.cluster

DO NOT EDIT!
This file is auto-generated, it is not to be edited by hand.
cloud_ssb:A83c8Y1S3ZbqHLL4P4HHNTTw0A83CuHj@127.0.0.1:4500
```

### 模块启停

Meta Service 和 Recycler 依赖 JAVA 运行环境，并使用 OpenJDK 17。在启动前这两个服务前，请确保已正确设置 `export JAVA_HOME` 环境变量。

`doris_cloud` 部署的 `bin` 目录下提供了启停脚本，调用对应的启停脚本即可完成启停。

### 启停 Meta Service

在 `ms` 目录中：

```Shell
export JAVA_HOME=${path_to_jdk_17}
bin/start.sh --meta-service --daemon

bin/stop.sh
```

### 启停 Recycler

在 `re` 目录中：

```Shell
export JAVA_HOME=${path_to_jdk_17}
bin/start.sh --recycler --daemon

bin/stop.sh
```

在成功部署并启动 Meta Service 和 Recycler 之后，Doris 存算分离模式的底座便已完成搭建。

若 Meta Service 进程正常启动，将能在 `doris_cloud.out` 文件中观察到 `meta-service started` 的输出信息。同样地，Recycler 进程如果正常启动，则会在该文件中显示 `recycler started` 的输出信息。

```
Tue Jun 18 00:46:37 CST 2024
process working directory: "/mnt/disk1/gavinchou/debug/doris-cloud/ms"
pid=2682786 written to file=./bin/doris_cloud.pid
version:{doris_cloud-0.0.0-debug} code_version:{commit=4517faffbf79b48d34a94abb22ee090f2d6e2007 time=2024-06-18 00:40:29 +0800} build_info:{initiator=gavinchou@VM-10-7-centos build_at=2024-06-18 00:40:29 +0800 build_on=NAME="TencentOS Server" VERSION="3.1 (Final)" }

meta-service started
```
