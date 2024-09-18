---
{
"title": "使用 Docker 开发镜像编译（推荐）",
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

本文介绍如何使用 Doris 官方提供的编译镜像来编译 Doris，由于此镜像由官方维护，且会随编译依赖及时更新，所以推荐用户使用这种方式编译

## 安装 Docker

比如在 CentOS 下，执行命令安装 Docker

```shell
yum install docker
```

或参考 [Docker 官方安装文档](https://docs.docker.com/engine/install/)进行安装

## 下载 Doris 构建镜像

不同的 Doris 版本，需要下载不同的构建镜像。其中 apache/doris:build-env-ldb-toolchain-latest 用于编译最新主干版本代码，会随主干版本不断更新。

| 镜像版本                                            | Doris 版本 |
| --------------------------------------------------- | ---------- |
| apache/doris:build-env-for-2.0                      | 2.0.x      |
| apache/doris:build-env-for-2.0-no-avx2              | 2.0.x      |
| apache/doris:build-env-ldb-toolchain-latest         | master     |
| apache/doris:build-env-ldb-toolchain-no-avx2-latest | master     |

下面就以编译 Doris 2.0 版本作为介绍，下载并检查 Docker 镜像

```shell
# 可以选择 docker.io/apache/doris:build-env-for-2.0
$ docker pull apache/doris:build-env-for-2.0

# 检查镜像下载完成
$ docker images
REPOSITORY      TAG                  IMAGE ID        CREATED       SIZE
apache/doris    build-env-for-2.0    f29cf1979dba    3 days ago    3.3GB
```

**注意事项：**

-   针对不同的 Doris 版本，需要下载对应的镜像版本。镜像版本号与 Doris 版本号统一，比如可以使用 apache/doris:build-env-for-2.0 来编译 2.0 版本。

-   `apache/doris:build-env-ldb-toolchain-latest` 用于编译最新主干版本代码，会随主干版本不断更新。可以查看 `docker/README.md` 中的更新时间。

-   名称中带有 no-AVX2 字样的镜像中的第三方库，可以运行在不支持 AVX2 指令的 CPU 上。可以配合 USE_AVX2=0 选项，编译 Doris。 

-   编译镜像变更信息可参考 [ChangeLog](https://github.com/apache/doris/blob/master/thirdparty/CHANGELOG.md)。

-   最新版本的 `apache/doris:build-env-ldb-toolchain-latest` 镜像中同时包含 JDK 8 和 JDK 17。2.1（含）之前的版本，请使用 JDK 8。3.0（含）之后的版本或 master 分支，请使用 JDK 17。

```shell
# 切换到 JDK 8
export JAVA_HOME=/usr/lib/jvm/java-1.8.0
export PATH=$JAVA_HOME/bin/:$PATH

# 切换到 JDK 17
export JAVA_HOME=/usr/lib/jvm/jdk-17.0.2/
export PATH=$JAVA_HOME/bin/:$PATH
```

## 编译 Doris

### 01 下载 Doris 源码

登录到宿主机，通过 git clone 获取 Doris 2.0 分支上的最新代码。

```Plain
$ git clone -b branch-2.0 https://github.com/apache/doris.git
```

下载后，源代码路径，假设放到了 doris-branch-2.0 这个目录下。

### 02 运行构建镜像

```Plain
# 提前在 host 主机构建 maven 的 .m2 目录，以便将下载的 Java 库可以多次在 Docker 复用
mkdir ~/.m2 

# 运行构建镜像
docker run -it --network=host --name mydocker -v ~/.m2:/root/.m2 -v ~/doris-branch-2.0:/root/doris-branch-2.0/ apache/doris:build-env-for-2.0  

# 执行成功后，应该自动进入到 Docker 里了
```

**注意：**

-   建议以挂载本地 Doris 源码目录的方式运行镜像，这样编译的产出二进制文件会存储在宿主机中，不会因为镜像退出而消失。

-   建议同时将镜像中 maven 的 `.m2` 目录挂载到宿主机目录，以防止每次启动镜像编译时，重复下载 maven 的依赖库。

-   运行镜像编译时需要下载其它文件，可以采用 host 模式启动镜像。host 模式不需要加 -p 进行端口映射，和宿主机共享网络 IP 和端口。

-   Docker run 部分参数说明如下：

|              参数                 | 注释                                                         |
| -------------------- | ------------------------------------------------------------ |
| -v        | 给容器挂载存储卷，挂载到容器的某个目录                       |
| --name    | 指定容器名字，后续可以通过名字进行容器管理                   |
| --network &nbsp;&nbsp;&nbsp;&nbsp   | 容器网络设置：bridge 使用 docker daemon 指定的网桥，host 容器使用主机的网络，container:NAME_or_ID 使用其他容器的网路，共享 IP 和 PORT 等网络资源，none 容器使用自己的网络（类似--net=bridge），但是不进行配置 |

### 03 执行构建

```Plain
# 默认编译出支持 AVX2 的
$ sh build.sh

# 如不支持 AVX2 需要加USE_AVX2=0
$ USE_AVX2=0 sh build.sh

# 如需编译 Debug 版本的 BE，增加 BUILD_TYPE=Debug
$ BUILD_TYPE=Debug sh build.sh
```

:::tip
**如何查看机器是否支持 AVX2？**

$ cat /proc/cpuinfo | grep avx2
:::


编译完成后，产出文件在 `output/` 目录中。

## 自行编译开发环境镜像

可以自己创建一个 Doris 开发环境镜像，具体可参阅 `docker/README.md` 文件。
