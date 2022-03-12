---
{
    "title": "Apache Doris 单节点（可多节点）Docker集群制作教程",
    "description": "Apache Doris是当下非常火热和流行的MPP架构OLAP数据库，很多同学想自学/测试Doris的使用和能力，但是又苦于没有环境或者畏惧冗长的编译+搭建过程，整个过程极大的劝退了很多有些尝试意愿、但又由于各种客观因素无法承担过高学习成本导致尝试失败的同学，故此Apache Doris社区三位社区同学苏奕嘉、种益、杨春东制作了三个不同设计的版本安装方式并提供下载，以此降低大家的学习门槛和提升学习/测试效率.",
    "date": "2022-03-07",
    "metaTitle": "Apache Doris 单节点（可多节点）Docker集群制作教程",
    "isArticle": true,
    "language": "zh-CN",
    "author": "苏奕嘉,种益,杨春东",
    "layout": "Article",
    "sidebar": false
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

## 前言

Apache Doris是当下非常火热和流行的MPP架构OLAP数据库，很多同学想自学/测试Doris的使用和能力，但是又苦于没有环境或者畏惧冗长的编译+搭建过程，整个过程极大的劝退了很多有些尝试意愿、但又由于各种客观因素无法承担过高学习成本导致尝试失败的同学，故此Apache Doris社区三位社区同学苏奕嘉、种益、杨春东制作了三个不同设计的版本安装方式并提供下载，以此降低大家的学习门槛和提升学习/测试效率。

**重要说明：该教程提供的编译方式及运行环境都以单节点部署伪集群为目标，故性能会【大打折扣】，如想体验完整Apache Doris数据库的能力，请以完整集群部署，单节点伪集群【仅适用于学习、功能测试】所用！**

## 版本说明

### 1. 极速体验版

#### 1.1. 优点

1. 超快速的部署体验（网速OK的话十五分钟内部署完毕）
2. 单节点部署
3. 支持多环境运行：虚拟机/云服务器/支持Docker的物理机（Mac/Win/Linux）

#### 1.2. 缺点

1. 数据存储是在Docker容器中，如容器如损坏，会导致数据丢失
2. 若非干净纯净的系统环境，可能需要手动执行部分BE注册FE的命令

#### 1.3. 适用人群

学生、培训机构、体验/测试人员

#### 1.4. 安装建议

系统为纯净新系统最佳，无需任何修改即可开箱即用

****

### 2. 完全部署版

#### 2.1. 优点

1. 完整的环境部署（MySQL-Client等组件）
2. 自由的部署安排（有众多可选安装参数）
3. 无惧Docker容器损坏（最小降低损失，可极速恢复）
4. 单节点部署
5. 支持多环境运行：虚拟机/云服务器，暂未适配物理机（后续升级版本会支持）

#### 2.2. 缺点

1. 安装过程时间较长（视网速和机器性能而定）
2. 安装步骤多，代表可能故障率较高

#### 2.3. 适用人群

学生、培训机构、体验/测试人员中的持续性教学受众（数据不易丢失）

#### 2.4. 安装建议

该版本建议完完全全的纯净新系统，以此降低安装故障率

****

### 3. 存算分离版

该版本还在制作过程中，教程及相关文档后续推出，可视为完全部署版的Plus版本。

****

## 目的

该教程最后成果模块提供了`各个版本`下载地址，只需在服务器拉取`不同版本shell脚本`运行即可，在`/opt/docker/doris/sbin`目录下会有`start_doris_docker.sh`和`stop_doris_docker.sh`脚本支持一键启停，同时会在一键部署的过程中将两个脚本添加至环境变量，最大程度简化单节点测试部署和启停操作。

**步骤过程可以忽略**，除非有定制化的一键部署Docker集群的镜像集群制作需求，大可不必照着教程再来一遍，官方已提供了下载地址，无需重复劳动。

## 环境

- 服务器：腾讯云 2C 4G 6M 一台
- OS：CentOS 7.6
- Docker-V：20.10.12
- Doris-V：0.15
- MySQL-Client-V：5.7
- FE-Num：1
- BE-Num：3

## 步骤

### 1. 安装Docker环境

1. Docker 要求 CentOS 系统的内核版本高于`3.10` ，首先查看系统内核版本是否满足

   ```shell
   uname -r
   ```

2. 使用 `root` 权限登录系统，确保 yum 包更新到最新

   ```shell
   sudo yum update -y
   ```

3. 假如安装过旧版本，先卸载旧版本

   ```shell
   sudo yum remove docker  docker-common docker-selinux docker-engine
   ```

4. 安装需要的软件包， yum-util 提供yum-config-manager功能，另外两个是devicemapper驱动依赖的

   ```shell
   sudo yum install -y yum-utils device-mapper-persistent-data lvm2
   ```

5. 设置yum源（加速yum下载速度）

   ```shell
   sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
   ```

6. 查看所有仓库中所有docker版本，并选择特定版本安装，一般可直接安装最新版

   ```shell
   yum list docker-ce --showduplicates | sort -r
   ```

7. 安装docker

   - 安装最新稳定版本

     ```shell
     sudo yum install docker-ce -y  #安装的是最新稳定版本，因为repo中默认只开启stable仓库
     ```

   - 安装指定版本

     ```shell
     sudo yum install <FQPN> -y
     # 例如：
     sudo yum install docker-ce-20.10.11.ce -y
     ```

8. 启动并加入开机启动

   ```shell
   sudo systemctl start docker #启动docker
   sudo systemctl enable docker #加入开机自启动
   ```

9. 查看Version，验证是否安装成功

   ```shell
   docker version
   ```

   若出现Client和Server两部分内容，则证明安装成功

### 2. 容器创建及测试

**在创建之前，请准备好已完成编译的FE/BE文件，此教程不再赘述编译过程。**

1. 拉取Doris编译镜像做测试

   ```shell
   # 拉取
   docker pull apache/incubator-doris:build-env-ldb-toolchain-latest
   ```

2. 创建Doris-Docker的文件（包括元数据文件夹）

   ```shell
   mkdir -p /opt/docker/doris
   ```

3. 将编译好的FE和BE拷贝至Docker文件群内

   ```shell
   cp -r 编译好的Doris根目录/fe/ /opt/docker/doris/
   cp -r 编译好的Doris根目录/be/ /opt/docker/doris/be-01
   cp -r 编译好的Doris根目录/be/ /opt/docker/doris/be-02
   cp -r 编译好的Doris根目录/be/ /opt/docker/doris/be-03
   ```

4. 启动FE-Docker

   ```shell
   docker run -it -p 8030:8030 -p 9030:9030 -d --name=doris-fe -v /opt/docker/doris/fe:/opt/doris/fe -v /opt/docker/doris/doris-meta:/opt/doris/doris-meta apache/incubator-doris:build-env-ldb-toolchain-latest
   ```

5. 进入FE-Docker以及安装组件

   ```shell
   # 进入fe-docker
   docker exec -ti doris-fe /bin/bash
   # 安装net-tools用于查看IP
   yum install net-tools -y
   ```

6. 修改FE配置

   ```shell
   # 查看fe-docker的IPv4地址
   ifconfig
   # 修改配置文件
   vim /opt/doris/fe/conf/fe.conf
   # 取消priority_networks的注解，并根据Docker的网段进行配置
   priority_networks = 172.17.0.0/16 #这里要根据你Docker的IP确定
   ```

7. 切换Docker-JDK版本

   ```shell
   # 切换Java版本为JDK1.8，该镜像默认为JDK11
   alternatives --set java java-1.8.0-openjdk.x86_64
   alternatives --set javac java-1.8.0-openjdk.x86_64
   export JAVA_HOME=/usr/lib/jvm/java-1.8.0
   # 校验是否切换版本成功
   java -version
   ```

8. 配置FE-Docker的环境变量

   ```shell
   # 配置环境变量
   vim /etc/profile.d/doris.sh
   export DORIS_HOME=/opt/doris/fe/
   export PATH=$PATH:$DORIS_HOME/bin
   # 保存并source
   source /etc/profile.d/doris.sh
   ```

9. 启动Doris-FE

   ```shell
   start_fe.sh --daemon
   ```

10. 检查FE是否启动成功

    > 1. 检查是否启动成功,JPS命令下有没有PaloFe进程
    >
    > 2. FE 进程启动后，会首先加载元数据，根据 FE 角色的不同，在日志中会看到 `transfer from UNKNOWN to MASTER/FOLLOWER/OBSERVER`。最终会看到 `thrift server started` 日志，并且可以通过 mysql 客户端连接到 FE，则表示 FE 启动成功。
    >
    > 3. 也可以通过如下连接查看是否启动成功：
    >    `http://fe_host:fe_http_port/api/bootstrap`
    >
    >    如果返回：
    >    `{"status":"OK","msg":"Success"}`
    >
    >    则表示启动成功，其余情况，则可能存在问题。
    >
    > 4. 外网环境访问`http://fe_host:fe_http_port` 查看是否可以访问WebUI界面，登录账号默认为root，密码为空
    >
    > 注：如果在 fe.log 中查看不到启动失败的信息，也许在 fe.out 中可以看到。

11. 宿主机安装MySQL客户端

    ```shell
    wget https://dev.mysql.com/get/Downloads/MySQL-5.7/mysql-5.7.37-1.el7.x86_64.rpm-bundle.tar
    tar -xvf mysql-5.7.37-1.el7.x86_64.rpm-bundle.tar
    rpm -ivh mysql-community-common-5.7.37-1.el7.x86_64.rpm
    rpm -ivh mysql-community-libs-5.7.37-1.el7.x86_64.rpm
    rpm -ivh mysql-community-client-5.7.37-1.el7.x86_64.rpm
    ```

12. 连接FE并修改密码

    ```shell
    mysql -h FE-Docer的IP -P 9030 -uroot
    SET PASSWORD FOR 'root' = PASSWORD('your_password');
    # 也可以创建新用户
    CREATE USER 'test' IDENTIFIED BY 'test_passwd';
    ```

    后续链接时需要使用如下格式

    ```shell
    mysql -h FE_HOST -P9030 -uusername -ppassword
    ```

    添加BE节点注册信息

    ```shell
    ALTER SYSTEM ADD BACKEND "host:port";
    # 其中 host 为 BE 所在节点 ip；port 为 be/conf/be.conf 中的 heartbeat_service_port，默认9050。
    ```

13. 启动BE-Docker

    ```shell
    docker run -it -p 9061:9060 -d --name=doris-be-01 -v /opt/docker/doris/be-01:/opt/doris/be apache/incubator-doris:build-env-ldb-toolchain-latest
    docker run -it -p 9062:9060 -d --name=doris-be-02 -v /opt/docker/doris/be-02:/opt/doris/be apache/incubator-doris:build-env-ldb-toolchain-latest
    docker run -it -p 9063:9060 -d --name=doris-be-03 -v /opt/docker/doris/be-03:/opt/doris/be apache/incubator-doris:build-env-ldb-toolchain-latest
    ```

14. 进入BE-Docker以及安装组件

    ```shell
    # 进入fe-docker,以01为例
    docker exec -ti doris-be-01 /bin/bash
    # 安装net-tools用于查看IP
    yum install net-tools -y
    ```

15. 修改BE配置

    ```shell
    # 查看fe-docker的IPv4地址
    ifconfig
    # 修改配置文件
    vim /opt/doris/be/conf/be.conf
    # 取消priority_networks的注解，并根据Docker的网段进行配置
    priority_networks = 172.17.0.0/16 #这里要根据你Docker的IP确定
    ```

16. 配置BE-Docker的环境变量

    ```shell
    # 配置环境变量
    vim /etc/profile.d/doris.sh
    export DORIS_HOME=/opt/doris/be/
    export PATH=$PATH:$DORIS_HOME/bin
    # 保存并source
    source /etc/profile.d/doris.sh
    ```

17. 启动Doris-BE

    ```shell
    start_be.sh --daemon
    ```

18. 检查BE是否启动成功

    > 1. BE 进程启动后，如果之前有数据，则可能有数分钟不等的数据索引加载时间。
    >
    > 2. 如果是 BE 的第一次启动，或者该 BE 尚未加入任何集群，则 BE 日志会定期滚动 `waiting to receive first heartbeat from frontend` 字样。表示 BE 还未通过 FE 的心跳收到 Master 的地址，正在被动等待。这种错误日志，在 FE 中 ADD BACKEND 并发送心跳后，就会消失。如果在接到心跳后，又重复出现 `master client, get client from cache failed.host: , port: 0, code: 7` 字样，说明 FE 成功连接了 BE，但 BE 无法主动连接 FE。可能需要检查 BE 到 FE 的 rpc_port 的连通性。
    >
    > 3. 如果 BE 已经被加入集群，日志中应该每隔 5 秒滚动来自 FE 的心跳日志：`get heartbeat, host: xx.xx.xx.xx, port: 9020, cluster id: xxxxxx`，表示心跳正常。
    >
    > 4. 其次，日志中应该每隔 10 秒滚动 `finish report task success. return code: 0` 的字样，表示 BE 向 FE 的通信正常。
    >
    > 5. 同时，如果有数据查询，应该能看到不停滚动的日志，并且有 `execute time is xxx` 日志，表示 BE 启动成功，并且查询正常。
    >
    > 6. 也可以通过如下连接查看是否启动成功：
    >    `http://be_host:be_http_port/api/health`
    >
    >    如果返回：
    >    `{"status": "OK","msg": "To Be Added"}`
    >
    >    则表示启动成功，其余情况，则可能存在问题。
    >
    >    注：如果在 be.INFO 中查看不到启动失败的信息，也许在 be.out 中可以看到。

19. 测试连通性

    ```shell
    # 登录FE-MySQL
    mysql -h FE_HOST -P9030 -uusername -ppassword
    # 执行命令查看BE运行情况。如一切正常，isAlive 列应为 true。
    SHOW PROC '/backends';
    ```

20. 若连通性测试成功，则循环完成其他BE节点的部署即可

### 3. 安装ETCD环境（若多节点Dokcer需配置|单节点可忽略）

1. 配置Hosts文件映射

   ```shell
   vim /etc/hosts
   你本机内网IP地址 master
   ```

2. 安装ETCD

   ```SHELL
   # 安装ETCD
   yum install -y etcd
   # 重启ETCD
   systemctl restart etcd
   ```

3. 设置开机启动

   ```shell
   systemctl enable etcd
   ```

4. 修改ETCD配置

   ```shell
    # 先查找本机的IP地址
    ifconfig
    # 备份原始配置文件
    cp /etc/etcd/etcd.conf /etc/etcd/etcd.conf.bak
    # 编辑ETCD的conf文件
    vim /etc/etcd/etcd.conf
    # 修改监听客户端地址为
   ETCD_LISTEN_CLIENT_URLS="http://master:2379,http://127.0.0.1:2379,http://master:4001,http://127.0.0.1:4001"
    # 修改通知客户端地址为
   ETCD_ADVERTISE_CLIENT_URLS="http://master:2379,http://master:4001"
    # 保存退出
   ```

5. 设置ETCD网段

   ```shell
   # Flannel使用Etcd进行配置，来保证多个Flannel实例之间的配置一致性，所以需要在etcd上进行如下配置（'/atomic.io/network/config'这个key与上文/etc/sysconfig/flannel中的配置项FLANNEL_ETCD_PREFIX是相对应的，错误的话启动就会出错）
   etcdctl mk /atomic.io/network/config '{"Network":"172.20.0.0/16","SubnetMin":"172.20.1.0","SubnetMax":"172.20.254.0"}'
   ```

6. 重启ETCD

   ```shell
   systemctl restart etcd 
   ```

7. 测试

   ```shell
   # 查看ETCD进程是否存在
   ps -ef|grep etcd
   # 查看端口使用情况，因为ETCD默认TCP:2379端口通讯
   lsof -i:2379
   # 使用get命令查看是否设置成功
   etcdctl get /atomic.io/network/config 
   # 若出现以下信息，则代表设置成功
   {"Network":"172.20.0.0/16","SubnetMin":"172.20.1.0","SubnetMax":"172.20.254.0"}
   # 查看cluster-health
   etcdctl -C http://master:4001 cluster-health
   etcdctl -C http://master:2379 cluster-health
   # 若出现如下信息，则代表成功
   member 8e9e05c52164694d is healthy: got healthy result from http://你IP地址:2379（和4001）
   ```

### 4. 安装Flannel环境（若多节点Dokcer需配置|单节点可忽略）

1. Yum安装Flannel

   ```shell
   yum install -y flannel
   ```

2. 配置Flannel

   ```shell
   # 备份原始配置文件
   cp /etc/sysconfig/flanneld /etc/sysconfig/flanneld.bak
   # 编辑配置文件
   vim /etc/sysconfig/flanneld
   # 修改以下配置项
   FLANNEL_ETCD_ENDPOINTS="http://master:2379"
   ```

3. 设置开机自启

   ```shell
   systemctl enable flanneld.service
   ```

4. 启动Flannel

   ```shell
   systemctl start flanneld.service
   ```

5. 重启Docker

   ```shell
   systemctl restart docker
   ```

6. 测试

   ```shell
   # 查看Flannel进程
   ps -ef | grep flannel
   ```

### 5. 测试及远程连接

可使用Navicat等远端工具连接FE，地址为部署了FE服务的单机外网IP，端口为9030，如图所示

![](/images/blogs/doris-docker-cluster-install/2022-03-03-123903.png)

### 6. SHELL脚本设计及开发

#### 6.1. 完整部署版整体设计示意图

![](/images/blogs/doris-docker-cluster-install/2022-03-04-041009/png)

#### 6.2. 思路梳理

##### 6.2.1 极速体验版（极速体验免除安装）

1. 默认1FE 3BE安装

2. Docker安装（可参照**步骤1**）

3. 拉取Docker镜像群

   ```shell
   docker pull freeoneplus/doris-fe:1.0
   docker pull freeoneplus/doris-be:1.0
   ```

4. 创建FE-Docker容器

   ```shell
   docker run -it -p 8030:8030 -p 9030:9030 -d --name=doris-fe freeoneplus/doris-fe:1.0
   ```

5. 进入FE-Docker并获取IPv4地址

   ```shell
   docker exec -it doris-fe /bin/bash
   ifconfig
   exit
   docker exec -d doris-fe /bin/bash /opt/doris/fe/start_fe.sh --daemon
   ```

6. 循环创建BE-Docker容器并启动BE

   ```shell
   docker run -it -p 9061:9060 -d --name=doris-be-01 freeoneplus/doris-be:1.0
   docker exec -d doris-be-01 /bin/bash /opt/doris/be/start_be.sh --daemon
   docker run -it -p 9062:9060 -d --name=doris-be-02 freeoneplus/doris-be:1.0
   docker exec -d doris-be-02 /bin/bash /opt/doris/be/start_be.sh --daemon
   docker run -it -p 9063:9060 -d --name=doris-be-03 freeoneplus/doris-be:1.0
   docker exec -d doris-be-03 /bin/bash /opt/doris/be/start_be.sh --daemon
   ```

7. 提示用户进行BE注册

   ```shell
   亲爱的用户，欢迎使用 Apache Doris-极简版-Docker集群！
   接下来的文字请认真阅读：
   1. 此版本集群为极简版单节点docker集群，所有数据均挂载在Docker集群内，请谨慎修改或删除容器！
   2. 此版本预制注册三个BE节点至FE，但可能由于不同环境影响，预先注册的IP地址可能会出现错误，所以请仔细观察FE的预制IP地址：${FE-IP地址}，若以上地址为172.17.0.2，则无需做任何修改即可直接使用，如果是其他数值，则需要进行链接FE进行BE注册
   3. 您可以使用任意MySQL-Client或者MySQL工具连接FE-MySQL-Server
   若宿主机（您的虚拟机/云服务器）有MySQL-Client，则需要执行以下命令链接FE-MySQL-Server
   mysql -h ${FE-IP地址} -P 9030 -uroot -p123456
   若您使用外网机器链接FE-MySQL-Server，则需要填入以下参数，您需要提前打开9030外网端口
   url：您的服务器外网IP（虚拟机则视网络桥接方式）
   port：9030
   username：root
   password：123456
   然后执行以下命令清除已注册至FE的BE节点信息
   
   `以下需要逻辑处理`
   预设的三个BE地址为[172.17.0.3,172.17.0.4,172.17.0.5]
   该地址应为FE-IP地址最后一位自增3，所以如果预设错误，需要给出删除语句和增添语句
   比如FE-IP为 172.17.0.4，则需要给出删除[172.17.0.3,172.17.0.4]两个BE节点的语句
   ALTER SYSTEM DECOMMISSION BACKEND "${FE-IP地址}:9050";
   然后再给出新增的两个节点的IP[172.17.0.6,172.17.0.7]注册语句
   ALTER SYSTEM ADD BACKEND "${FE-IP地址}:9050";
   `以上需要逻辑处理`
   
   感谢您的安装和使用Apache Doris！
   感谢您为开源世界作出的一份贡献！
   如有问题请打开地址：doris.freeoneplus.com
   扫描二维码添加Apache Doris社区微信群获取答疑~
   ```

##### 6.2.2 完整部署版（数据落盘无惧丢失）

1. 校验脚本执行口令，防止误操作

   - 输出一段文字说明
   - 等待接收`Doris`这五个字母，成功则继续，未成功则终止

2. 依次询问参数配置设置，接收参数，可参考的有：

   > 1. 是否默认配置安装（Y/N）
   > 2. BE数量（默认为3）
   > 3. root密码（默认为空）
   > 4. 操作员账户名称（默认无）
   > 5. 操作员账户密码（默认无）
   > 6. FE-Http-Port端口（默认8030）
   > 7. FE-MySQL-Cli-Port端口（默认9030）

3. 创建宿主机资源目录并进入

   ```shell
   mkdir -p /opt/docker/doris/
   cd /opt/docker/doris/
   ```

4. 拉取编译好的文件包至上述目录（当前版本为Apache Doris-1.0.0 bate测试版）

   ```shell
   wget https://jiafeng2022.oss-cn-beijing.aliyuncs.com/doris-1.0.0-jdk8-20220301.tar.gz
   ```

5. 解压文件包

   ```
   tar -zxvf /opt/docker/doris/apache-doris-install.tar.gz
   ```

6. 根据传参的BE数量循环复制BE目录，以默认数量为样例，命令执行为

   ```shell
   cp -r /opt/docker/doris/be /opt/docker/doris/be-01
   cp -r /opt/docker/doris/be /opt/docker/doris/be-02
   cp -r /opt/docker/doris/be /opt/docker/doris/be-03
   ```

7. 监测Docker是否安装

   ```shell
   docker version
   ```

8. 如果已安装则跳过，未安装则安装Docker

   ```shell
   # 监测内核版本，若小于3.10则终止安装并通知失败，告知失败原因
   uname -r
   # 如果大于3.10则开始安装，依次执行以下命令
   sudo yum update -y
   sudo yum install -y yum-utils device-mapper-persistent-data lvm2
   sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
   sudo yum install docker-ce -y
   sudo systemctl start docker 
   sudo systemctl enable docker 
   # 执行结束，监测执行是否都已成功
   docker version
   ```

9. 监测MySQL-Client是否已安装

   ```shell
   mysql --version
   ```

10. 如果已安装则跳过，未安装则安装MySQL-Client

    ```shell
    mkdir -p /opt/software
    cd /opt/software
    wget https://dev.mysql.com/get/Downloads/MySQL-5.7/mysql-5.7.37-1.el7.x86_64.rpm-bundle.tar
    tar -xvf mysql-5.7.37-1.el7.x86_64.rpm-bundle.tar
    rpm -ivh mysql-community-common-5.7.37-1.el7.x86_64.rpm
    rpm -ivh mysql-community-libs-5.7.37-1.el7.x86_64.rpm
    rpm -ivh mysql-community-client-5.7.37-1.el7.x86_64.rpm
    ```

11. 拉取Doris编译镜像为基础环境镜像

    ```shell
    docker pull apache/incubator-doris:build-env-ldb-toolchain-latest
    ```

12. 制作FE容器

    - 构建FE容器

      ```shell
      docker run -it -p 8030:8030 -p 9030:9030 -d --name=doris-fe -v /opt/docker/doris/fe:/opt/doris/fe -v /opt/docker/doris/doris-meta:/opt/doris/doris-meta apache/incubator-doris:build-env-ldb-toolchain-latest
      ```

    - 进入容器

      ```shell
      docker exec -ti doris-fe /bin/bash
      ```

    - 修改FE配置文件

      ```shell
      vim /opt/doris/fe/conf/fe.conf
      # 如FE两个对外端口都是默认值，则无需修改，若有改变，则改变该值
      http_port = 8030
      query_port = 9030
      # 修改网段
      priority_networks = 172.17.0.0/16
      ```

    - 切换JDK版本

      ```shell
      # 切换Java版本为JDK1.8，该镜像默认为JDK11
      alternatives --set java java-1.8.0-openjdk.x86_64
      alternatives --set javac java-1.8.0-openjdk.x86_64
      export JAVA_HOME=/usr/lib/jvm/java-1.8.0
      ```

    - 配置Doris环境变量

      ```shell
      # 配置环境变量
      vim /etc/profile.d/doris.sh
      export DORIS_HOME=/opt/doris/fe/
      export PATH=$PATH:$DORIS_HOME/bin
      # 保存并source
      source /etc/profile.d/doris.sh
      ```

    - 安装Net-Tools工具以便于查看IP地址

      ```shell
      yum install net-tools -y
      ```

    - 使用命令查看该Docker的IPv4地址，并记录下来

      ```shell
      ifconfig
      ```

    - 启动FE

      ```shell
      start_fe.sh
      # 最好执行命令以后再等待10秒左右
      ```

    - 退出该容器，返回宿主机

      ```shell
      exit
      ```

13. 用MySQL-Client连接Doris

    ```shell
    mysql -h ${记录下的FE-Docker的IPv4地址} -P ${默认9030，如有改变则使用改变后的query-port} -uroot
    ```

14. 注册BE至FE

    ```shell
    ALTER SYSTEM ADD BACKEND "${FE-Docker的IPv4地址的第四位自增1}:9050";
    # 这里需要说明的是，这命令执行时应该是根据BE的数量来循环的，比如BE为默认值3，记录下FE-Docker的地址为172.17.0.3，那么就应该循环添加 172.17.0.4:9050、172.17.0.5:9050、172.17.0.6:9050三条注册信息，以此类推
    ```

15. 若有用户修改密码和注册了操作员账户，则执行以下命令

    ```shell
    # 修改密码
    SET PASSWORD FOR 'root' = PASSWORD('${填写的root密码}');
    # 也可以创建新用户
    CREATE USER '${填写的操作员账户}' IDENTIFIED BY '${填写的操作员密码}';
    ```

16. 退出MySQL-Client

    ```shell
    exit
    ```

17. 制作BE容器，该处应该进入以BE数量为最大数值从1开始的循环中（以BE-01为例）

    **假设BE的节点数量从1自增的变量为n，在以下示例中取值方式为`${n}`**

    - 构建BE容器

      ```shell
      # 标准格式为如下所示，其中三处被替换为${n}
      docker run -it -p 906${n}:9060 -d --name=doris-be-0${n} -v /opt/docker/doris/be-0${n}:/opt/doris/be apache/incubator-doris:build-env-ldb-toolchain-latest
      # 示例
      docker run -it -p 9061:9060 -d --name=doris-be-01 -v /opt/docker/doris/be-01:/opt/doris/be apache/incubator-doris:build-env-ldb-toolchain-latest
      ```

    - 进入容器

      ```shell
      # 这里需要注意，也是要根据循环进行取值
      docker exec -ti doris-be-0${n} /bin/bash
      ```

    - 修改BE配置文件

      ```shell
      vim /opt/doris/be/conf/be.conf
      # 取消priority_networks的注解，并根据Docker的网段进行配置
      priority_networks = 172.17.0.0/16 #这里要根据你Docker的IP确定
      ```

    - 配置BE环境变量

      ```shell
      # 配置环境变量
      vim /etc/profile.d/doris.sh
      export DORIS_HOME=/opt/doris/be/
      export PATH=$PATH:$DORIS_HOME/bin
      # 保存并source
      source /etc/profile.d/doris.sh
      ```

    - 启动BE

      ```
      start_be.sh
      ```

    - 退出容器，开始下一次循环

      ```shell
      exit
      ```

18. 循环结束，清除临时解压缩及部分下载文件

    ```shell
    rm -rf /opt/software/*.rpm
    rm -rf /opt/docker/doris/apache-doris-install.tar.gz
    ```

19. 制作启动、停止脚本（前提Docker容器是启动的，若未启动则报错）

    启动脚本需以`start_doris_docker.sh`命名，停止脚本以`stop_doris_docker.sh`命名

    两个脚本均写在`/opt/docker/doris/sbin/`目录下

    - 创建目录

      ```shell
      mkdir -p /opt/docker/doris/sbin/
      ```

    - 启动脚本内容

      - 启动FE

        ```shell
        docker exec -d doris-fe /bin/bash /opt/doris/fe/start_fe.sh --daemon
        ```

      - 循环启动BE

        ```shell
        docker exec -d doris-be-0${n} /bin/bash /opt/doris/be/start_be.sh --daemon
        ```

    - 停止脚本内容

      - 循环停止BE

        ```shell
        docker exec -d doris-be-0${n} /bin/bash /opt/doris/be/stop_be.sh --daemon
        ```

      - 停止FE

        ```shell
        docker exec -d doris-fe /bin/bash /opt/doris/fe/stop_fe.sh --daemon
        ```

    - 配置环境变量

      ```shell
      vim /etc/profile.d/doris-docker.sh
      export DORIS_DOCKER_HOME=/opt/docker/doris/sbin
      export PATH=$PATH:$DORIS_DOCKER_HOME
      ```

    - 刷新环境变量

      ```shell
      source /etc/profile.d/doris-docker.sh
      ```

## 成果

**极速体验版部署流程**（此脚本部署将部署最新版本Apache Doris）

```shell
wget http://download.freeoneplus.com/doris/doris_docker_fast_install.sh
./doris_docker_fast_install.sh
```

**完全部署版部署流程**（此脚本部署将部署最新版本Apache Doris）

```shell
wget http://download.freeoneplus.com/doris/doris_docker_whole_install.sh
./doris_docker_whole_install.sh
```

**假设需要指定版本的部署，请使用以下部署流程**

```shell
# 极速体验版部署流程
wget http://download.freeoneplus.com/doris/doris_docker_fast_install_${指定版本号}.sh
./doris_docker_fast_install_${指定版本号}.sh
# 案例：极速体验版 Apache Doris 0.15版本
wget http://download.freeoneplus.com/doris/doris_docker_fast_install_0.15.sh
./doris_docker_fast_install_0.15.sh

# 完全部署版部署流程
wget http://download.freeoneplus.com/doris/doris_docker_whole_install_${指定版本号}.sh
./doris_docker_whole_install_${指定版本号}.sh
# 案例：完全部署版 Apache Doris 0.15版本
wget http://download.freeoneplus.com/doris/doris_docker_whole_install_0.15.sh
./doris_docker_whole_install_0.15.sh
```

**当前支持版本对照表**

| Apache Doris version | 是否支持     |
| -------------------- | ------------ |
| 1.0.0-beta           | 支持         |
| 0.15                 | 3月8日起支持 |
| 0.14及以下           | 不支持       |

