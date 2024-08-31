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

```Bash
sh build.sh --fe --be --cloud 
```

相比 3.0.0 之前的版本，编译完成的二进制包中（产出）多了 `ms` 目录。

```Bash
output
├── be
├── fe
└── ms
    ├── bin
    ├── conf
    └── lib
```

## Meta Service 部署

### 配置

通常情况下，只需在`./conf` 目录下的默认配置文件 `doris_cloud.conf`中修改 `brpc_listen_port` 和 `fdb_cluster` 两个参数。（Meta Service 配置只需一个配置文件。）

```Shell
brpc_listen_port = 5000
fdb_cluster = xxx:yyy@127.0.0.1:4500
```

上述 `brpc_listen_port = 5000` 是 Meta Service 的默认端口。其中，`fdb_cluster` 是 FoundationDB 集群的连接信息，其值是 FoundationDB 所部署机器上的 `/etc/foundationdb/fdb.cluster` 文件内容。

**示例, 文件的最后一行就是要填到doris_cloud.conf 里 fdb_cluster 字段的值**

```Bash
cat /etc/foundationdb/fdb.cluster

# DO NOT EDIT!
# This file is auto-generated, it is not to be edited by hand.
cloud_ssb:A83c8Y1S3ZbqHLL4P4HHNTTw0A83CuHj@127.0.0.1:4500
```

### 启停

Meta Service 依赖 JAVA 运行环境，并使用 OpenJDK 17。在启动前这两个服务前，请确保已正确设置 `export JAVA_HOME` 环境变量。

`doris_cloud` 部署的 `bin` 目录下提供了启停脚本，调用对应的启停脚本即可完成启停。

在 `ms` 目录中：

```Shell
export JAVA_HOME=${path_to_jdk_17}
bin/start.sh --meta-service --recycler --daemon

bin/stop.sh
```

其中`--meta-service` 和 `--recycler` 两个参数指定的是当前 Meta Service 进程拥有什么样的能力
前者为元数据操作(主要提供一些在线实时元数据操作)， 后者为数据回收功能(离线异步数据回收等流程)。

在成功部署并启动 Meta Service 之后，Doris 存算分离模式的底座便已完成搭建。

若 Meta Service 进程正常启动，将能在 `doris_cloud.out` 文件中观察到 `meta-service started` 的输出信息。同样地，Recycler 进程如果正常启动，则会在该文件中显示 `recycler started` 的输出信息。

```
Tue Jun 18 00:46:37 CST 2024
process working directory: "/mnt/disk1/gavinchou/debug/doris-cloud/ms"
pid=2682786 written to file=./bin/doris_cloud.pid
version:{doris_cloud-0.0.0-debug} code_version:{commit=4517faffbf79b48d34a94abb22ee090f2d6e2007 time=2024-06-18 00:40:29 +0800} build_info:{initiator=gavinchou@VM-10-7-centos build_at=2024-06-18 00:40:29 +0800 build_on=NAME="TencentOS Server" VERSION="3.1 (Final)" }

meta-service started
```

## 将数据回收功能作为单独进程部署

在一些场景中为了更好的隔离性以及稳定性，我们需要将元数据操作功能和数据回收功能分开不同的进程部署。

`ms`目录也可以用于启动为数据回收功能进程，只需使用不同启动参数启动即可。
需要注意的是，需要单独准备一个独立的工作目录，二进制以及配置文件都是单独的一份。

使用以下命令从`ms`目录中拷贝二进制文件至一个新的 Recycler 工作目录`re`。
```Shell
cp -r ms re
```

在 re 目录下对配置文件中的 BRPC 的监听端口号按需进行必要修改，然后使用 `--recycler` 参数启动即可。

```Shell
export JAVA_HOME=${path_to_jdk_17}
bin/start.sh --recycler --daemon

bin/stop.sh
```

这样我们得到了一个只有数据回收功能的 Meta Service 进程，它不负责元数据的操作，**在 FE BE 的配置中不要将只有回收功能的 Meta Service 进程其作为 `meta_service_endpoint` 配置的目标**。

同理，我们通过控制启动参数，也可以得到一个只有元数据操作功能的 Meta Service 进程
在 ms 目录下使用以下参数启动
```Shell
export JAVA_HOME=${path_to_jdk_17}
bin/start.sh --meta-service --daemon

bin/stop.sh
```
这样我们得到了一个只有元数据操作功能的 Meta Service 进程，这些进程可以作为 FE BE 的配置 `meta_service_endpoint` 配置的目标。

通过上述操作我们可以将 Meta Service 的离线的任务和在线的任务处理剥离到不同进程处理，大大提高了系统的稳定性。

