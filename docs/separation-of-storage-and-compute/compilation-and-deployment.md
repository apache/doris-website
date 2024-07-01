---
{
    "title": "Compilation and Deployment",
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

Compilation in the compute-storage decoupled mode is similar to that in the compute-storage coupled mode. The main difference lies in the addition of compiling and deploying the Meta Service module.

## Compilation

Similar to the compute-storage coupled mode, you can use the built-in `build.sh` script to compile Doris in the compute-storage decoupled mode. Add the `--cloud` parameter for compilation of the new Meta Service module (The binary name for it is `doris_cloud`). 

```Bash
sh build.sh --fe --be --cloud 
```

Unlike the compute-storage coupled mode, you will find an `ms` directory in the `output` directory after compiling in the compute-storage decoupled mode.

```Bash
output
├── be
├── fe
└── ms
    ├── bin
    ├── conf
    └── lib
```

The `ms` directory, as a product of the compilation, will serve both Meta Service and Recycler. Note that although Meta Service and Recycler are essentially the same program, currently they require separate binary files. The binary files for Meta Service and Recycler are identical. They are only started with different parameters.

To prepare the two binary files, you can simply copy the binaries from the `ms` directory to a new `re` (Recycler) directory, and then modify the necessary parameters as needed, such as the port number, in the `conf` subdirectories of both `ms` and `re`.

```Shell
cp -r ms re
```

## Version

The version information of `doris_cloud` can be checked in two ways. If one method does not work correctly, you can try the other:

- `bin/start.sh --version`
- `lib/doris_cloud --version`

```Bash
$ lib/doris_cloud --version
version:{doris_cloud-0.0.0-debug} code_version:{commit=b9c1d057f07dd874ad32501ff43701247179adcb time=2024-03-24 20:44:50 +0800} build_info:{initiator=gavinchou@VM-10-7-centos build_at=2024-03-24 20:44:50 +0800 build_on=NAME="TencentOS Server" VERSION="3.1 (Final)" }
```

## Deploy Meta Service and Recycler

Meta Service and Recycler are different processes of the same program, and they are started with different parameters.

These two processes depend on FoundationDB. For the deployment of FoundationDB, you can refer to the FoundationDB installation guide in the "Before Deployment".

### Deploy Meta Service

Typically, you only need to modify the `brpc_listen_port` and `fdb_cluster` parameters in the default configuration file `doris_cloud.conf` located in the `./conf` directory. (It only requires one configuration file to configure Meta Service.)

```Shell
brpc_listen_port = 5000
fdb_cluster = xxx:yyy@127.0.0.1:4500
```

The `brpc_listen_port = 5000` above is the default port for Meta Service. `fdb_cluster` represents the connection information for the FoundationDB cluster, which can typically be found in the `/etc/foundationdb/fdb.cluster` file on the machine(s) where FoundationDB is deployed.

**Example**

```Bash
cat /etc/foundationdb/fdb.cluster

DO NOT EDIT!
This file is auto-generated, it is not to be edited by hand.
cloud_ssb:A83c8Y1S3ZbqHLL4P4HHNTTw0A83CuHj@127.0.0.1:4500
```

### Deploy Recycler

Aside from the port, other configurations for Recycler are the same as those for Meta Service. The default bRPC port for Recycler is typically set to 5100.

Typically, you only need to modify the `brpc_listen_port` and `fdb_cluster` parameters in the default configuration file `doris_cloud.conf` located in the `./conf` directory. (It only requires one configuration file to configure Recycler.)

```Shell
brpc_listen_port = 5100
fdb_cluster = xxx:yyy@127.0.0.1:4500
```

The `brpc_listen_port = 5100` above is the default port for Recycler. `fdb_cluster` represents the connection information for the FoundationDB cluster, which can typically be found in the `/etc/foundationdb/fdb.cluster` file on the machine(s) where FoundationDB is deployed.

**Example**

```Bash
cat /etc/foundationdb/fdb.cluster

DO NOT EDIT!
This file is auto-generated, it is not to be edited by hand.
cloud_ssb:A83c8Y1S3ZbqHLL4P4HHNTTw0A83CuHj@127.0.0.1:4500
```

### Start/stop Meta Service and Recycler

Meta Service and Recycler depend on a JAVA runtime environment and use OpenJDK 17. Before starting these two services, please ensure that the `JAVA_HOME` environment variable is correctly set.

You can use the start and stop scripts provided in the `bin` directory for `doris_cloud` deployment to start and stop Meta Service and Recycler services.

### Start/stop Meta Service

In the `ms` directory: 

```Shell
export JAVA_HOME=${path_to_jdk_17}
bin/start.sh --meta-service --daemonized

bin/stop.sh
```

### Start/stop Recycler

In the `re` directory: 

```Shell
export JAVA_HOME=${path_to_jdk_17}
bin/start.sh --recycler --daemonized

bin/stop.sh
```

After deploying and starting Meta Service and Recycler, the foundation for the Doris compute-storage decoupled mode has been established.

If the Meta Service process starts up normally, you will observe a `meta-service started` output message in the `doris_cloud.out` file. Similarly, if the Recycler process starts up normally, you will see a `recycler started` output message in the same file.

```
Tue Jun 18 00:46:37 CST 2024
process working directory: "/mnt/disk1/gavinchou/debug/doris-cloud/ms"
pid=2682786 written to file=./bin/doris_cloud.pid
version:{doris_cloud-0.0.0-debug} code_version:{commit=4517faffbf79b48d34a94abb22ee090f2d6e2007 time=2024-06-18 00:40:29 +0800} build_info:{initiator=gavinchou@VM-10-7-centos build_at=2024-06-18 00:40:29 +0800 build_on=NAME="TencentOS Server" VERSION="3.1 (Final)" }

meta-service started
```

