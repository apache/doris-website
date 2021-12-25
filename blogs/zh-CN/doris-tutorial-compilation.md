---
{
    "title": "Apache Doris 全平台保姆级Docker编译安装部署教程（Win|Mac|Linux）- 编译版",
    "description": "本教程的目的，是针对对Docker容器化技术知之甚少甚至一无所知，但又想尝试部署当下最火热的MPP-OLAP数据库Apache Doris玩耍的同学，或者公司有新的技术架构需求，想部署测试环境进行测试性能、简单搭建的伙伴，全文尽量使用简练白话文增强可阅读性。",
    "date": "2021-12-20",
    "metaTitle": "Apache Doris 编译安装部署教程 - 编译版",
    "language": "zh-CN",
    "isArticle": true,
    "author": "苏奕嘉",
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

# Apache Doris 全平台保姆级Docker编译安装部署教程（Win|Mac|Linux）- 编译版

本教程的目的，是针对对Docker容器化技术知之甚少甚至一无所知，但又想尝试部署当下最火热的MPP-OLAP数据库Apache Doris玩耍的同学，或者公司有新的技术架构需求，想部署测试环境进行测试性能、简单搭建的伙伴，全文尽量使用简练白话文增强可阅读性。

本教程始于「用啥系统可以编译啊」、「部署的集群怎么配置」、「Docker是啥」、「安装Docker及基本操作」等疑问，终于「Doris如何编译」、「Doris快速部署」等话题，全文数千字，实战时间3-5小时左右。

本教程的部署模式有两种，一种是多服务器多节点的集群部署模式，这种模式一般用于测试环境部署，一种是高性能的单节点制作多Docker做集群，这种模式一般用于个人研究，两种部署模式教程都有详细步骤说明。

最终想要达到的标准是，哪怕你全程不想看任何的文字描述，只需要依次复制代码框里的代码，在指定的地方粘贴并执行，即可完成Apache Doris的编译及部署工作！

本教程将会分为两部分，已经通过三平台分别测试，均成功编译及部署~

## 1 部署流程

***本篇为「编译篇」只涉及编译，部署将由「部署篇」完成***

1. 配置编译环境
2. 认识Docker
3. 安装Docker
4. Docker基本操作命令
5. Doris如何编译
6. Doris两种部署方法
   1. 独立机器部署
   2. Docker部署
7. Doris部署常见问题及避坑

## 2 教程环境（按需查看即可）

编译过程都是基于Docker镜像进行编译的，分不同平台只是为了便于减少愿意尝试使用或者测试环境搭建的同学的使用成本，无论是你手头有Mac本，有Win电脑，还是有云端Linux服务器，都可以完成编译工作。

可以根据当前系统环境，选择以下章节阅读：

* 2.1 Linux
* 2.2 MaC
* 2.3 Windows

### 2.1 Linux环境

集群规模：3台 腾讯云服务器

集群配置：1节点FE | 2节点BE（节点数可以按需，具体可参阅 Apache Doris 官网部署文档中的建议）

单机规格：2C 4G

系统版本：CentOS 7.6

Java版本：JDK1.8

Doris版本：Apache Doris 0.15.0

Docker版本：20.10.11

#### 2.1.1 云服务器环境准备

新购置的云服务器需要做如下工作：

1. 安装CentOS7.6系统镜像
2. 修改进入系统密码
3. 远程连接服务器即可

### 2.2 Mac环境

集群规模：1台MacOS电脑 虚拟4个Docker对象

集群配置：1节点FE | 3节点BE（节点数可以按需，具体可参阅 Apache Doris 官网部署文档中的建议）

单机规格：2C 4G

系统版本：CentOS 7.6

Java版本：JDK1.8

Doris版本：Apache Doris 0.15.0

Docker版本：20.10.11

#### 2.2.1 MacOS环境准备

1. 到Docker官网下载Docker-MacOS安装包

    下载地址：https://hub.docker.com/

2. 初次登陆，需要注册，注册后通过邮件链接认证

3. 下载安装，Docker Tools初始化好后左下角Docker Logo所在的色块变绿色即代表初始化成功

   ![image-20211221194520114](images/blogs/doris-tutorial-compilation/image-20211221194520114.png)

4. Contalners/Apps Tab里会有一个代码块，写着

   ```shell
   docker run -d -p 80:80 docker/getting-started
   ```

   复制它，打开Mac终端，即可以运行你的Mac上第一个Docker镜像（该镜像非Doris相关镜像）

### 2.3 Windows环境

集群规模：1台Win电脑 制作4个虚拟机对象

集群配置：1节点FE | 3节点BE（节点数可以按需，具体可参阅 Apache Doris 官网部署文档中的建议）

单机规格：4C 8G

系统版本：CentOS 7.6

Java版本：JDK1.8

Doris版本：Apache Doris 0.15.0

Docker版本：20.10.11

#### 2.3.1 Windows环境准备

- 电脑上需要有VM虚拟机软件（VMwareWorkstation）

- 需要准备下载好CentOS7的ISO镜像文件

- 电脑配置最好稍好一些，易于快速编译

为什么不适用Windows-Docker进行虚拟环境安装？

因为很繁琐，会增加很多工作量，且有很多没有共性的问题出现，不便于教程编写和阅读

#### 2.3.2 虚拟机集群安装部署

##### 2.3.2.1 使用VM创建虚拟机

1. 新建虚拟机

    ![](images/blogs/doris-tutorial-compilation/image-20211221195227111.png)

2. 选择高级

    ![](images/blogs/doris-tutorial-compilation/image-20211221195250005.png)

3. 在安装系统来源时选择-稍后安装

    ![](images/blogs/doris-tutorial-compilation/image-20211221195340120.png)

4. 在选择系统时选择Linux-CentOS 7 64位

    ![](images/blogs/doris-tutorial-compilation/image-20211221195424420.png)

5. 处理器选大一些，最好4内核总数以上（内核数量决定了编译速度）

    ![](images/blogs/doris-tutorial-compilation/image-20211221195548551.png)

6. 内存也稍微大一些，4G-8G以上

    ![](images/blogs/doris-tutorial-compilation/image-20211221195624113.png)

7. 选择NAT网络模式

    ![](images/blogs/doris-tutorial-compilation/image-20211221195653102.png)

8. 容量随意，50GB以上即可

    ![](images/blogs/doris-tutorial-compilation/image-20211221200029323.png)

9. 创建好以后选择 编辑虚拟机设置

    ![](images/blogs/doris-tutorial-compilation/image-20211221200137725.png)

10. 设置系统ISO映射文件

    ![](images/blogs/doris-tutorial-compilation/image-20211221200346916.png)

11. 开启虚拟机，安装系统即可

##### 2.3.2.2 配置虚拟机及网络环境

首先需要在VM上配置虚拟网络

1. 点击`编辑菜单`，点击`虚拟网络编辑器`

    ![](images/blogs/doris-tutorial-compilation/image-20211221203204574.png)

2. 点击更改设置

    ![](images/blogs/doris-tutorial-compilation/image-20211221203243631.png)

3. 照图进行勾选，然后设置子网IP地址段，第四段为0

    ![](images/blogs/doris-tutorial-compilation/image-20211221203405005.png)

4. 然后点击NAT设置，修改网关IP，要注意，无论网关IP还是虚拟机IP，都要符合子网IP地址段的标准，也就是说，其他的IP地址设置，前三段要和子网IP一致

    ![](images/blogs/doris-tutorial-compilation/image-20211221203712731.png)

5. 全部确定及应用

6. 打开你宿主机（本电脑）的`网络和Internet`

    ![](images/blogs/doris-tutorial-compilation/image-20211221203847192.png)

7. 右键编辑 `VMnet8`网卡，打开属性

    ![](images/blogs/doris-tutorial-compilation/image-20211221203955970.png)

8. 选择IPv4协议，点击属性

    ![](images/blogs/doris-tutorial-compilation/image-20211221204030083.png)

9. 修改里面的项目

    ![](images/blogs/doris-tutorial-compilation/image-20211221204116846.png)

   其中注意

   - IP地址填写规则跟上述一样，需要满足子网IP地址段规则
   - 子网掩码和VM虚拟网络设置里的NAT模式中设置的子网掩码要一致
   - 默认网关选择`第4项`设置的网关地址

   确定即可

安装好虚拟机以后，登录进入系统，需要做以下几件事

1. 修改网卡配置，让系统可以连通宿主机和外网

   ```shell
   vi /etc/sysconfig/network-scripts/ifcfg-ens33 #最后这个是你的网卡名，根据个人情况更改
   ```

    ![](images/blogs/doris-tutorial-compilation/image-20211221202312977.png)

   保留和新增如下项：

   ```shell
   BOOTPROTO=static          # 网络地址分配方式为静态
   NAME=ens33                # 网卡别名
   DEVICE=ens33              # 网卡驱动名称
   ONBOOT=yes                # 系统启动时是否激活网卡
   IPADDR=192.168.201.101    # 本机IP地址，勿与宿主机VMnet8的IP地址重复，要满足子网IP段规则
   GATEWAY=192.168.201.2     # 网关地址，虚拟网络设置中NAT模式下的值
   NETMASK=255.255.255.0     # 子网掩码
   DNS1=8.8.8.8              # DNS服务器
   ```

   `Shift + ZZ`  保存并退出

   重启网络设备，加载我们刚刚修改完成的参数

   ```shell
   service network restart
   ```

    ![](images/blogs/doris-tutorial-compilation/image-20211221204709603.png)

   然后分别ping一下网关、宿主机IP及外网

   ```shell
   ping 192.168.201.2
   ping 192.168.3.5
   ping www.baidu.com
   ```

   如果都成功ping通，则证明我们配置无误

2. 修改防火墙设置，关闭防火墙

   由于是虚拟机，且全程自主使用，所以直接关了虚拟机防火墙也没事

   ```shell
   # 查看防火墙状态
   systemctl status firewalld.service
   # 关闭防火墙
   systemctl stop firewalld.service
   # 开机禁止防火墙服务器
   systemctl disable firewalld.service
   ```

3. 安装wget工具

   ```shell
   yum -y install wget
   ```

至此，Win平台的虚拟机和CentOS7系统配置完毕，可正常进行编译工作

## 3 Docker认知与部署

### 3.1 Docker认知

Docker是一个开源的应用容器引擎，让开发者可以打包他们的应用以及依赖包到一个可移植的镜像中，然后发布到任何流行的 Linux或Windows操作系统的机器上，也可以实现虚拟化。容器是完全使用沙箱机制，相互之间不会有任何接口。

简而言之，可以类比于我们在学习过程中经常使用到的**虚拟机技术**，但相较虚拟机，Docker**极**为轻量化和简单化，通过容器化部署，可以快速隔离出一个有资源、有独立系统、有独立环境的小型完备的系统容器，我们可以通过简单的安装和使用简单的命令，来操控我们的Linux系统创建一个用于编译Doris环境的Docker容器。

***——————建议必读以下内容——————***

那为什么不直接编译（在CentOS或者Redhat系统下），而要用Docker构建一个环境容器进行编译呢？

很简单，怕各种前置性的依赖环境，在用户本身的系统下编译可能遇到没有依赖、不存在安装源、无法安装等各种问题（这种环境引起的各种参数问题很耗时且无任何价值和意义），为了让用户在编译过程中减少不必要的麻烦，提高编译成功率，所以，Apache Doris官方提供了一个他们已经配置好了基本环境的Docker镜像，只需要通过一行命令从云端拉取下来，然后再用一行命令进入容器进行编译即可~

**总结就是，用Docker编译，极大的简化了编译过程、极大的增强了编译可靠性、极大的节省了运维时间。**

接下来，开始部署Docker组件到服务器系统内。

### 3.2 Docker部署

1. Docker 要求 CentOS 系统的内核版本高于`3.10` ，首先查看系统内核版本是否满足

   ```shell
   uname -r
   ```

2. 使用 `root` 权限登录系统，确保 yum 包更新到最新

   ```shell
   sudo yum update
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

### 3.3 Docker常用命令（可略）

这一块可看可不看，看了你对于Docker基本使用就OK了，不看也不妨碍接下来编译

- 查看当前运行的Docker镜像

  ```
  docker ps
  ```

- 进入某个Docker镜像

  ```shell
  docker exec -it <镜像Name> /bin/bash
  ```

- 查看当前机器已拉取的镜像

  ```
  docker images
  ```

- 运行指定的镜像创建容器

  ```
  docker run -p 本机映射端口:镜像映射端口 -d  --name 启动镜像名称 -e 镜像启动参数  镜像名称:镜像版本号
  ```

## 4 Apache Doris编译与部署

> 关于Apache Doris的相关介绍，就不再多做赘述，接下来直接步入正题——编译Doris源码，编译生成一个系统可以执行的应用程序。

### 4.1 Apache Doris编译

#### 4.1.1 拉取镜像

上一步，我们已经成功在 `CentOS 7.6` 系统下部署了Docker组件，现在，我们需要从镜像源拉取Apache Doris官方制作的用于编译Doris源码的环境镜像。

- 拉取镜像

```shell
docker pull apache/incubator-doris:build-env-for-0.15.0 #这是0.15.0版本
```

![](images/blogs/doris-tutorial-compilation/image-20211221190909871.png)

- 拉取成功后，查看镜像列表，看是否已成功拉取

```
docker images
```

- 如有下图圈红镜像，则证明镜像下载成功

![](images/blogs/doris-tutorial-compilation/image-20211221190954677.png)

- 如已成功拉取，运行run命令，进入Docker镜像

```shell
#这句先别着急复制粘贴，看一下下面描述
docker run -it apache/incubator-doris:build-env-for-0.15.0
```

这样进入镜像以后，做的所有操作都是资源隔离的，资源会随着退出镜像而消失。

建议以挂载本地 Doris 源码目录的方式运行镜像，这样编译的产出二进制文件会存储在宿主机中，不会因为镜像退出而消失。

同时，建议同时将镜像中 maven 的 `.m2` 目录挂载到宿主机目录，以防止每次启动镜像编译时，重复下载 maven 的依赖库。

以下命令需要根据自己需要定制化修改

在这里，宿主机下载源码的位置创建好以后，可以先到章节`4.1.3.1`所述，先下载源码至该文件夹下，然后再执行下述语句

```shell
docker run --name apache-doris-0.15.0 -it -v /root/.m2:/root/.m2 -v 宿主机下载了源码的位置:容器内你想看到的源码位置 apache/incubator-doris:build-env-for-0.15.0
# 例子
# 先到4.1.3.1章节 wget 下载源码至宿主机/opt/doris文件夹下，运行以下命令
docker run --name apache-doris-0.15.0 -it -v /root/.m2:/root/.m2 -v /opt/doris:/opt/doris apache/incubator-doris:build-env-for-0.15.0
```

执行以后出现如下命令头，则代表已成功进入镜像

![](images/blogs/doris-tutorial-compilation/image-20211220181157554.png)

#### 4.1.2 指定JDK版本（按需执行）

完成了镜像的拉取和进入，接下来这步挺重要，**这步关乎到了你后续使用的JDK版本**。

在我们拉取下的官方编译环境镜像中，其实给了两套JDK供我们选择，一套是JDK8、一套JDK11，默认使用的是JDK11，所以我们按需进行修改。

![](images/blogs/doris-tutorial-compilation/image-20211221120403558.png)

假如你希望以及后续工作都使用JDK8的话，请依次执行以下代码修改JDK版本

```shell
# 按需执行
alternatives --set java java-1.8.0-openjdk.x86_64
alternatives --set javac java-1.8.0-openjdk.x86_64
export JAVA_HOME=/usr/lib/jvm/java-1.8.0
```

![](images/blogs/doris-tutorial-compilation/image-20211221120445833.png)

假如你希望以后使用的是JDK11，那要么你一开始就不要执行任何操作，因为默认就是JDK11，如果执行了以上切换JDK8命令，又想切回来，那就用如下命令切换到JDK11

```shell
# 按需执行
alternatives --set java java-11-openjdk.x86_64
alternatives --set javac java-11-openjdk.x86_64
export JAVA_HOME=/usr/lib/jvm/java-11
```

![](images/blogs/doris-tutorial-compilation/image-20211221120543215.png)

#### 4.1.3 编译Doris

##### 4.1.3.1 下载源码及解压

- 使用wget命令下载

```shell
# 下载示例（以0.15.0版本为例）
wget https://downloads.apache.org/incubator/doris/0.15.0-incubating/apache-doris-0.15.0-incubating-src.tar.gz
```

- 或者使用如下命令（github拉取，最好有梯子）

```shell
git clone https://github.com/apache/incubator-doris.git
```

下载后得到源码tar压缩包，执行以下命令解压缩

```shell
tar -zxvf apache-doris-0.15.0-incubating-src.tar.gz 
```

解压缩后得到文件夹 `apache-doris-0.15.0-incubating-src`

执行如下命令进入目录

```shell
cd apache-doris-0.15.0-incubating-src
```

##### 4.1.3.2 编译源码

```shell
# 复制粘贴此命令前，需要看下面文字
sh build.sh
```

假如拉取下的Doris编译环境的Docker版本是`build-env-1.4.2`或者`build-env-for-0.15.0`（版本可通过`4.1.1`章节所述，在CentOS系统下使用`docker images`命令进行查看）

![](images/blogs/doris-tutorial-compilation/image-20211220182911446.png)

则第一次编译的时候要使用如下命令，这是因为1.4.2 版本镜像升级了 `thrift(0.9 -> 0.13)`，需要通过 --clean 命令强制使用新版本的 `thrift` 生成代码文件，否则会出现不兼容的代码。

```shell
sh build.sh --clean --be --fe --ui -j2
```

接下来，可以去做其他事情了，教程测试机器是使用`2C 4G 8M`进行编译，耗时**两小时**，期间如发现出现如下图，且运行速度超慢，属正常现象，该节点勿持续进行其他动作，静待完成即可，以免发生莫名错误。

![](images/blogs/doris-tutorial-compilation/image-20211220162256154.png)

出现以下报文，则证明编译成功

![](images/blogs/doris-tutorial-compilation/image-20211220184120563.png)

##### 4.1.3.3 偶现错误

编译最后出现了Failed，代表编译失败了，错误信息为

![](images/blogs/doris-tutorial-compilation/image-20211220183806318.png)

其中主要描述为：`ninja: build stopped: subcommand failed.`

该错误原因大概率是因为本身系统出现一些问题，也有可能是由于编译时使用内存不够导致，可以尝试使用以下解决方案尝试解决

解决方案为在编译时增加参数，执行如下语句

```shell
sh build.sh --clean --be --fe --ui -j2
# 如果非第一次编译，使用
sh build.sh -j2
```

若依旧出现该错误，则需要重新重置服务器系统，重新从头进行一遍编译工作~

##### 4.1.3.4 拷贝资源

编译成功后，在`apache-doris-0.15.0-incubating-src`目录（如无其他操作，则为当前目录）下会生成`output`文件夹

![](images/blogs/doris-tutorial-compilation/image-20211220184756120.png)

执行查看目录命令，查看该文件夹内容

```shell
ll output
```

目录下需要有如下文件夹才算编译成功：`fe`、`be`

- Linux云服务器：

    ![](images/blogs/doris-tutorial-compilation/image-20211221201459225.png)

- Win平台

    ![](images/blogs/doris-tutorial-compilation/image-20211221201650493.png)

- MacOS平台

    ![](images/blogs/doris-tutorial-compilation/image-20211221201751774.png)

至此，编译步骤全部完成且成功~

我们需要将FE文件夹和BE文件夹拷贝至宿主机，这是我们的编译结晶，相当于是孵化器成功孵化出小鸡，我们要把小鸡从孵化器中拎出来去喂养和做后续操作~

**Linux系统和Mac系统在宿主机下执行命令**

```shell
docker cp 容器名:要拷贝的文件在容器里面的路径 要拷贝到宿主机的相应路径 
```

需要注意，这里的容器名是**在宿主机**执行`docker ps`命令后，得到的当前正在运行的Docker容器的名字

![](images/blogs/doris-tutorial-compilation/image-20211220192355582.png)

```shell
# 例如
docker cp ed22cbfd325a:/~/apache-doris-0.15.0-incubating-src/output/ /opt/
```

至此，Doris编译结束。

