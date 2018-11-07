title=安装文档
date=2018-11-06
type=guide
status=published
~~~~~~

# Doris 安装文档

本文档会介绍 Doris 的系统依赖，编译，部署和常见问题解决。

您可以前往 [release](https://github.com/apache/incubator-doris/releases) 页面下载最新的已编译完成的 release 版本直接进行使用。部署方式直接跳至 **3. 部署** 章节查看。release 预编译版本已包含 static libc, 理论上可以运行于任意 Linux 发行版本。如无法使用，请按照本文档自行编译。

* 自 0.8.2 版本起，Apache 官方 Release 版本会在 http://doris.incubator.apache.org/downloads.html 同步。

* 每个 tag 都在 `tags/download_url.md` 提供对应 tag 版本的 预编译二进制包。

同时我们提供了 docker 镜像下载（20171213 update）：[palo-fe-0.8.0-docker-image](http://palo-opensource.gz.bcebos.com/palo-fe-0.8.0-docker-image-20171213?authorization=bce-auth-v1%2F069fc2786e464e63a5f1183824ddb522%2F2017-12-13T05%3A44%3A07Z%2F-1%2Fhost%2Ff25e5dc66bf62fae2fee6cc8579747f8a01ad0f2e722adf5da3327e2212af05e), [palo-be-0.8.0-docker-image](http://palo-opensource.gz.bcebos.com/palo-be-0.8.0-docker-image-20171213?authorization=bce-auth-v1%2F069fc2786e464e63a5f1183824ddb522%2F2017-12-13T05%3A43%3A17Z%2F-1%2Fhost%2F99e78f00289c3c481832b7829c0f0884f463726f50fffbba18ae8c5fbea0ed62)

docker 镜像的使用方式参见本文最后一节。

## 1. 系统依赖

Doris 当前只能运行在 Linux 系统上，无论是编译还是部署，都建议确保系统安装了如下软件或者库：

* GCC 4.8.2+，Oracle JDK 1.8+，Python 2.7+，确认 gcc, java, python 命令指向正确版本, 设置 JAVA_HOME 环境变量

* Ubuntu需要安装：`sudo apt-get install g++ ant cmake zip byacc flex automake libtool binutils-dev libiberty-dev bison python2.7 libncurses5-dev`；安转完成后，需要执行 `sudo updatedb`。

* CentOS需要安装：`sudo yum install gcc-c++ libstdc++-static ant cmake byacc flex automake libtool binutils-devel bison ncurses-devel`；安装完成后，需要执行 `sudo updatedb`。

* 某些 Linux 发行版本不包含 `lsb_release` 命令。如果没有，Ubuntu 用户可以通过以下命令安装：`apt-get install lsb-release`；CentOS 用户可以通过以下命令安装：`yum install redhat-lsb`。

* 某些 Linux 发行版本不包含 `updatedb` 命令。如果没有，Ubuntu 用户可以通过以下命令安装：`apt-get install mlocate`；CentOS 用户可以通过以下命令安装：`yum install mlocate`。

* 自 0.8.2.1 版本起（commit log `e453fc`）, Frontend 和 broker 的代码编译方式由 ant 替换为 maven。建议从 [这里](https://maven.apache.org/download.cgi) 下载最新的 Apache Maven（建议版本 3.5.4+）。

## 2. 编译

请按照下面步骤进行源码编译。

### 2.1 编译第三方依赖库

为防止从官网下载第三方库失败，我们提前打包了 doris 所需的第三方库，下载地址: [doris-thirdparty-20181102.tar.gz](http://doris-opensource.bj.bcebos.com/doris-thirdparty-20181102.tar.gz?authorization=bce-auth-v1/069fc2786e464e63a5f1183824ddb522/2018-11-02T09:27:57Z/-1/host/b30621ca2be77596cec9477f6cfb3608b681206d73084338d1b2f1204a3e3848)。

第三方库下载后，将解压后的 doris-thirdparty-`date`/ 下的所有文件拷贝到 thirdparty/src/ 目录下（src目录如没有，自行创建）

运行`sh thirdparty/build-thirdparty.sh`编译第三方库。

**注意**：`build-thirdparty.sh` 依赖 thirdparty 目录下的其它两个脚本，其中 `vars.sh` 定义了一些编译第三方库时依赖的环境变量；`download-thirdparty.sh` 负责完成从官网下载所需第三方依赖库。

### 2.2 编译 Doris FE 和 BE

`sh build.sh`

最终的部署文件将产出到 output/ 目录下。

### 2.3 (可选) 编译 FS_Broker

FS_Broker 用于从其他数据源（如Hadoop HDFS、百度云 BOS）导入数据时使用，如果不需要从这两个数据源导入数据可以先不编译和部署。需要的时候，可以后面再编译和部署。

需要哪个 broker，就进入 fs_brokers/ 下对应的 broker 的目录，执行相应的build脚本即可，执行完毕后，产生的部署文件生成在对应 broker 的 output 目录下。

## 3. 部署

Doris 主要包括 Frontend（FE）和 Backend（BE）两个进程。其中 FE 主要负责元数据管理、集群管理、接收用户请求和查询计划生成；BE 主要负责数据存储和查询计划执行。

一般 100 台规模的集群，可根据性能需求部署 1 到 5 台 FE，而剩下的全部机器部署 BE。其中建议 FE 的机器采用带有 RAID 卡的 SAS 硬盘，或者 SSD 硬盘，不建议使用普通 SATA 硬盘；而 BE 对硬盘没有太多要求。

### 3.1 单 FE 部署

* 拷贝 FE 部署文件到指定节点

    将源码编译生成的 output 下的 fe 文件夹拷贝到 FE 的节点指定部署路径下。

* 配置 FE

    1. 配置文件为 conf/fe.conf。其中注意：`meta_dir`：元数据存放位置。默认在 fe/palo-meta/ 下。需**手动创建**该目录。
    2. fe.conf 中 JAVA_OPTS 默认 java 最大堆内存为 2GB，建议生产环境调整至 8G 以上。

* 启动FE

    `sh bin/start_fe.sh`

    FE进程启动进入后台执行。日志默认存放在 fe/log/ 目录下。如启动失败，可以通过查看 fe/log/fe.log 或者 fe/log/fe.out 查看错误信息。

* 如需部署多 FE，请参见 "FE 高可用" 章节

### 3.2 多 BE 部署

* 拷贝 BE 部署文件到所有要部署BE的节点

    将源码编译生成的 output 下的 be 文件夹拷贝到 BE 的节点的指定部署路径下。

* 修改所有 BE 的配置

    修改 be/conf/be.conf。主要是配置 `storage_root_path`：数据存放目录，使用 `;` 分隔（最后一个目录后不要加 `;`），其它可以采用默认值。

* 在 FE 中添加所有 BE 节点

    BE 节点需要先在 FE 中添加，才可加入集群。可以使用 mysql-client 连接到FE：

    `./mysql-client -h host -P port -uroot`

    其中 host 为 FE 所在节点 ip；port 为 fe/conf/fe.conf 中的 query_port；默认使用root账户，无密码登录。

    登录后，执行以下命令来添加每一个BE：

    `ALTER SYSTEM ADD BACKEND "host:port";`

	如果使用多租户功能，则执行以下命令添加BE:
    
   	`ALTER SYSTEM ADD FREE BACKEND "host:port";`
   	
   	其中 host 为 BE所在节点 ip；port 为 be/conf/be.conf 中的 heartbeat_service_port。
   	
   	如果不添加free关键字，be默认进入自动生成的cluster，添加了free关键字后新的be不属于任何cluster，这样创建新cluster的时候就可以从这些空闲的be中选取，详细见[多租户设计文档](https://github.com/apache/incubator-doris/wiki/Multi-Tenant)

* 启动 BE

    `sh bin/start_be.sh`

    BE 进程将启动并进入后台执行。日志默认存放在 be/log/ 目录下。如启动失败，可以通过查看 be/log/be.log 或者 be/log/be.out 查看错误信息。

* 查看BE状态

    使用 mysql-client 连接到 FE，并执行 `SHOW PROC '/backends';` 查看 BE 运行情况。如一切正常，`isAlive` 列应为 `true`。

### 3.3 （可选）FS_Broker 部署

broker 以插件的形式，独立于 Doris 部署。如果需要从第三方存储系统导入数据，需要部署相应的 broker，默认提供了读取 HDFS 和百度云 BOS 的 fs_broker。fs_broker 是无状态的，建议每一个 FE 和 BE 节点都部署一个 broker。

* 拷贝源码 fs_broker 的 output 目录下的相应 broker 目录到需要部署的所有节点上。建议和 BE 或者 FE 目录保持同级。

* 修改相应broker配置

    在相应 broker/conf/ 目录下对应的配置文件中，可以修改相应配置。

 * 启动broker

    sh bin/start_broker.sh 启动broker。

* 添加broker

    要让 doris 的 fe 和 be 知道 broker 在哪些节点上，通过 sql 命令添加 broker 节点列表。

    使用 mysql-client 连接启动的 FE，执行以下命令：

    `ALTER SYSTEM ADD BROKER broker_name "host1:port1","host2:port2",...;`

    其中 host 为 broker 所在节点 ip；port 为 broker 配置文件中的 broker_ipc_port。

* 查看broker 状态

    使用 mysql-client 连接任一已启动的 FE，执行以下命令查看 broker 状态：`SHOW PROC "/brokers";`

## 4. 常见问题解决

* 执行 `sh build-thirdparty.sh` 报错: source: not found

    请使用 /bin/bash 代替 sh 执行脚本。

* 编译 gperftools：找不到 libunwind

    创建到 libunwind.so.x 的软链：`cd thirdparty/installed/lib && ln -s libunwind.so.8 libunwind.so`，之后重新执行：`build-thirdparty.sh`。

* 编译 thrift：找不到 libssl 或 libcrypto

    创建到系统 libssl.so.x 的软链：

    `cd thirdparty/installed/lib`

    `rm libssl.so libcrypto.so`

    `ln -s /usr/lib64/libssl.so.10 libssl.so`

    `ln -s /lib64/libcrypto.so.10 libcrypto.so`

    (系统库路径可能不相同，请对应修改)

    在 thirdparty/build-thirdparty.sh 中，注释掉 build_openssl 之后重新执行 `build-thirdparty.sh`。

* 编译 thrift：No rule to make target \`gen-cpp/Service.cpp', needed by \`Service.lo'.  Stop.

    重新执行：`sh build-thirdparty.sh`

* 编译 Boost：Boost.Context fails to build -> Call of overloaded 'callcc(...) is ambiguous'

    如果你使用 gcc 4.8 或 4.9 版本，则可能出现这个问题。执行以下命令：

    `cd thirdparty/src/boost_1_64_0`

    `patch -p0 < ../../patches/boost-1.64.0-gcc4.8.patch`

    之后重新执行：`sh build-thirdparty.sh`；

    > 参考：https://github.com/boostorg/fiber/issues/121

* 编译 mysql：Inconsistency detected by ld.so: dl-version.c: 224: _dl_check_map_versions: Assertion `needed != ((void *)0)' failed!

    如果你使用 Ubuntu 14.04 LTS apt-get 安装的 cmake 2.8.2 版本，则可能出现这个问题。

    用 apt-get 删除 cmake，并从cmake官网下载安装最新的 cmake。

    之后重新执行：`sh build-thirdparty.sh`；

    > 参考：https://forum.directadmin.com/archive/index.php/t-51343.html

* 编译 thrift：syntax error near unexpected token `GLIB,'

    检查是否安装了 pkg-config，并且版本高于 0.22。如果已经安装，但依然出现此问题，请删除 `thirdparty/src/thrift-0.9.3` 后，重新执行：sh build-thirdparty.sh`

* 编译 curl：libcurl.so: undefined reference to `SSL_get0_alpn_selected'

    在 thirdparty/build-thirdparty.sh 中确认没有注释掉 build_openssl。同时注释掉 build_thrift。之后重新执行：`sh build-thirdparty.sh`

* 编译 ncurse:  error: expected ')' before 'int'

    参考：https://stackoverflow.com/questions/37475222/ncurses-6-0-compilation-error-error-expected-before-int

* 编译 Doris FE 和 BE：[bits/c++config.h] 或 [cstdef] 找不到

    在 be/CMakeLists.txt 中修改对应的 CLANG_BASE_FLAGS 中设置的 include 路径。可以通过命令：`locate c++config.h` 确认头文件的地址。

* 编译 Doris FE 和 BE：cstddef: no member named 'max_align_t' in the global namespace

    在 Ubuntu 14.04 LTS 和 16.04 环境下可能会遇到此问题。首先通过 `locate cstddef` 定位到系统的 cstddef 文件位置。打开 cstddef 文件，修改如下片段：
    ```
    namespace std {
      // We handle size_t, ptrdiff_t, and nullptr_t in c++config.h.
      +#ifndef __clang__
      using ::max_align_t;
      +#endif
    }
    ```
    > 参考：http://clang-developers.42468.n3.nabble.com/another-try-lastest-ubuntu-14-10-gcc4-9-1-can-t-build-clang-td4043875.html

* 编译 Doris FE 和 BE：/bin/bash^M: bad interpreter: No such file or directory

    对应的脚本程序可能采用了 window 的换行格式。使用 vim 打开对应的脚本文件，执行： `:set ff=unix` 保存并退出。

## 5. FE 高可用

FE 分为 leader，follower 和 observer 三种角色。 默认一个集群，只能有一个 leader，可以有多个 follower 和 observer。其中 leader 和 follower 组成一个 Paxos 选择组，如果 leader 宕机，则剩下的 follower 会自动选出新的 leader，保证写入高可用。observer 同步 leader 的数据，但是不参加选举。如果只部署一个 FE，则 FE默认就是 leader。

第一个启动的 FE 自动成为 leader。在此基础上，可以添加若干 follower 和 observer。

添加 follower 或 observer。使用 mysql-client 连接到已启动的 FE，并执行：

`ALTER SYSTEM ADD FOLLOWER "host:port";`

或

`ALTER SYSTEM ADD OBSERVER "host:port";`

其中 host 为 follower 或 observer 所在节点 ip；port 为其配置文件fe.conf中的 edit_log_port。

配置及启动 follower 或 observer。follower 和 observer 的配置同 leader 的配置。第一次启动时，需执行以下命令：

`sh bin/start_fe.sh -helper host:port`

其中host为 Leader 所在节点 ip；port 为 Leader 的配置文件 fe.conf 中的 edit_log_port。-helper 参数仅在 follower 和 observer 第一次启动时才需要。

查看 Follower 或 Observer 运行状态。使用 mysql-client 连接到任一已启动的 FE，并执行：SHOW PROC '/frontend'; 可以查看当前已加入集群的 FE 及其对应角色。

## 6. Docker 镜像

我们以 CentOS 7.2 环境为例，介绍如何使用 Doris Docker 镜像快速部署Doris环境。  

1. 安装并启动 Docker 服务

	`yum install docker`  
	`service docker start`

2. 加载 docker 镜像

	`docker load -i palo-fe-0.8.0-docker-image`  
	`docker load -i palo-be-0.8.0-docker-image`

3. 分别在 FE 和 BE 节点的宿主机上创建运行路径

	* FE 需创建配置文件目录、元数据目录、日志目录
		`cd /your/workspace/ && mkdir -p fe/conf fe/palo-meta fe/log`
	
	* BE 需创建配置文件目录、数据目录、日志目录
		`cd /your/workspace/ && mkdir -p be/conf be/data be/log`

4. 准备配置文件

	* 将 FE 和 BE 的配置文件拷贝到上一步中创建的各自的配置文件目录中。
	* FE 和 BE 配置文件中需添加 **priority_networks** 配置
		
		> 因为 docker 服务启动后，会自动创建一个名为 docker0 的虚拟网桥，ip 通常是 172.7.0.1。该网桥地址会影响 Doris 正确识别自身可访问的 ip。  
		> 通过添加 **priority_networks** 配置，可以协助 Doris 获取到正确的 ip 地址。  
		> 举例说明：  
		> 假设 FE 和 BE 所在宿主机的局域网 ip 分别为：192.168.0.1 和 192.168.0.2。那么，在 fe.conf 和 be.conf 中，都加入配置：`priority_networks=192.168.0.0/16`。则可保证 Doris 获取到指定网段的 ip 地址。
		
	* FE 默认配置文件点击[这里](https://github.com/apache/incubator-doris/blob/master/conf/fe.conf)
	* BE 默认配置文件点击[这里](https://github.com/apache/incubator-doris/blob/master/conf/be.conf)  
	* 默认配置文件中，不包含 priority_networks 配置。

5. 启动 container

	* FE  
    ```docker run --net=host -p 9030:9030 -p 8030:8030 -p 9010:9010 -p 9020:9020 -v /your/workspace/fe/log:/home/palo/run/fe/log -v /your/workspace/fe/palo-meta:/home/palo/run/fe/palo-meta -v /your/workspace/fe/conf:/home/palo/run/fe/conf/ -i -t -d -v /etc/localtime:/etc/localtime:ro palo-fe:0.8.0```
    
    * BE  
    ```docker run --net=host --privileged -p 9050:9050 -p 8040:8040 -p 9060:9060 -p 9070:9070 -v /your/workspace/be/log:/home/palo/run/be/log -v /your/workspace/be/data:/home/palo/run/be/data -v /your/workspace/be/conf:/home/palo/run/be/conf/ -i -t -d -v /etc/localtime:/etc/localtime:ro palo-be:0.8.0```
    
    > 注：  
    > 以上命令将 FE 和 BE 所需的所有端口映射到宿主机对应端口，并将 FE 和 BE 所需的持久化目录（配置、元信息、数据、日志）挂载到之前创建的工作目录下。  
    > 必须使用 **host 网络模式**以确保 FE 和 BE，以及 BE 之间的连通性。  

6. 确认系统正常

	通过 mysql 客户端连接 FE。如果能够正确的添加 BE、建库、建表，则基本确认部署正确。  
	具体确认部署正确的方法，请参阅 [Doris 部署和升级文档](https://github.com/apache/incubator-doris/wiki/Doris-Deploy-%26-Upgrade) 中的 **常见问题**  
	
7. Dockerfile

	这里提供 [Dockerfile](https://github.com/apache/incubator-doris/wiki/Dockerfile) 供参考。
