---
{
    "title": "Apache Doris Docker Compilation Installation and Deployment Tutorial - Compilation",
    "description": "The purpose of this tutorial is for students who know little or nothing about Docker containerization technology, but want to try to deploy the hottest MPP-OLAP database Apache Doris to play, or the company has new technical architecture needs, want to deploy a test environment for testing performance, simple build partners, the full text try to use concise vernacular text to enhance readability.",
    "date": "2021-12-20",
    "metaTitle": "Apache Doris Docker Compilation Installation and Deployment Tutorial - Compilation",
    "language": "en",
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

This tutorial is intended for students who know little or nothing about Docker containerization technology, but want to try to deploy the hottest MPP-OLAP database Apache Doris for fun, or companies with new technical architecture needs, want to deploy a test environment for testing performance, simple build partners, the full text to try to use concise vernacular to enhance readability.

The tutorial starts with questions such as "What system can you compile with?", "How to configure the deployed cluster", "What is Docker", "Installing Docker and basic operations", and finally "How to compile Doris", "Doris quick deployment", etc. The full text is several thousand words, with a practical time of about 3-5 hours.

This tutorial has two deployment modes, one is a multi-server multi-node cluster deployment mode, this mode is generally used for test environment deployment, a high-performance single node production multi-Docker do cluster, this mode is generally used for personal research, two deployment modes tutorial have detailed step-by-step instructions.

The final standard you want to achieve is that even if you do not want to read any text descriptions throughout, just copy the code in the code box in turn, paste and execute in the specified place, you can complete the compilation and deployment of Apache Doris work!

This tutorial will be divided into two parts, which have been tested on three platforms and successfully compiled and deployed~

Translated with www.DeepL.com/Translator (free version)

[[toc]]

## 1 Deployment process

*** This is the "Compilation" section, only for compilation. Deployment will be done by the "Deploy" section***

1. Configure the compilation environment
2. Get to know Docker
3. Install Docker
4. Docker basic commands
5. How to compile Doris
6. Two deployment methods of Doris
   1. Standalone deployment
   2. Docker Deployment
7. Doris Deployment FAQ

## 2 Tutorial environment (just view on demand)

The compilation process is all based on the Docker image for compilation, divided into different platforms just to facilitate the reduction of the cost of use for students willing to try to use or test the environment to build, whether you have a Mac book at hand, a Win computer, or a cloud Linux server, you can complete the compilation work.

Depending on your current system environment, you can select the following sections to read.

* 2.1 Linux
* 2.2 MaC
* 2.3 Windows

### 2.1 Linux environment

Cluster size: 3 Tencent Cloud servers

Cluster configuration: 1 node FE | 2 nodes BE (the number of nodes can be on demand, please refer to the recommendations in the Apache Doris official website deployment document)

Standalone specifications: 2C 4G

System version: CentOS 7.6

Java version: JDK1.8

Doris version: Apache Doris 0.15.0

Docker version: 20.10.11

#### 2.1.1 Cloud server environment preparation

The newly acquired cloud server needs to do the following.

1. install CentOS 7.6 system image
2. modify the password to enter the system
3. remote connection to the server can be

### 2.2 Mac environment

Cluster size: 1 MacOS computer Virtual 4 Docker objects

Cluster configuration: 1 node FE | 3 nodes BE (the number of nodes can be on demand, see the recommendations in the official Apache Doris deployment documentation)

Standalone specifications: 2C 4G

System version: CentOS 7.6

Java version: JDK1.8

Doris version: Apache Doris 0.15.0

Docker version: 20.10.11

#### 2.2.1 MacOS environment preparation

1. Go to the official website of Docker to download the Docker-MacOS installation package

    Download address: https://hub.docker.com/

2. Initial login, you need to register, after registration through the email link authentication

3. Download and install Docker Tools, after the initialization of Docker Tools, the color block of Docker Logo in the lower left corner turns green, which means the initialization is successful.

   ![image-20211221194520114](/images/blogs/doris-tutorial-compilation/image-20211221194520114.png)

4. There will be a code block in the Contalners/Apps Tab that says

   ```shell
   docker run -d -p 80:80 docker/getting-started
   ```

   Copy it and open Mac Terminal to run the first Docker image on your Mac (this image is not a Doris-related image)

### 2.3 Windows environment

Cluster size: 1 Win computer Make 4 virtual machine objects

Cluster configuration: 1 node FE | 3 nodes BE (the number of nodes can be on demand, refer to the recommendations in the Apache Doris official website deployment documentation)

Standalone specifications: 4C 8G

System version: CentOS 7.6

Java version: JDK1.8

Doris version: Apache Doris 0.15.0

Docker version: 20.10.11

#### 2.3.1 Windows environment preparation

- The computer needs to have VM virtual machine software (VMwareWorkstation) on it

- Need to be prepared to download a good ISO image file of CentOS7

- The computer configuration is best slightly better, easy to compile quickly

Why not apply Windows-Docker for virtual environment installation?

Because it is very tedious, will increase a lot of work, and there are many no common problems arise, not easy to write and read tutorials

#### 2.3.2 Virtual Machine Cluster Installation and Deployment

##### 2.3.2.1 Creating virtual machines with VMs

1. Create a new virtual machine

    ![](/images/blogs/doris-tutorial-compilation/image-20211221195227111.png)

2. Select Advanced

    ![](/images/blogs/doris-tutorial-compilation/image-20211221195250005.png)

3. Select -Install Later when installing system sources

    ![](/images/blogs/doris-tutorial-compilation/image-20211221195340120.png)

4. Select Linux-CentOS 7 64-bit when choosing a system

    ![](/images/blogs/doris-tutorial-compilation/image-20211221195424420.png)

5. choose a larger processor, preferably more than 4 total cores (the number of cores determines the compilation speed)

    ![](/images/blogs/doris-tutorial-compilation/image-20211221195548551.png)

6. slightly more memory too, more than 4G-8G

    ! [](/images/blogs/doris-tutorial-compilation/image-20211221195624113.png)

7. Select NAT network mode

    ![](/images/blogs/doris-tutorial-compilation/image-20211221195653102.png)

8. Capacity is optional, 50GB or more is fine

    ![](/images/blogs/doris-tutorial-compilation/image-20211221200029323.png)

9. Once created, select Edit Virtual Machine Settings

    ![](/images/blogs/doris-tutorial-compilation/image-20211221200137725.png)

10. Set the system ISO mapping file

    ![](/images/blogs/doris-tutorial-compilation/image-20211221200346916.png)

11. Start the virtual machine and install the system

##### 2.3.2.2 Configuring the VM and network environment

First you need to configure the virtual network on the VM

1. Click `Edit Menu`, click `Virtual Network Editor`

    ![](/images/blogs/doris-tutorial-compilation/image-20211221203204574.png)

2. Click Change Settings

    ![](/images/blogs/doris-tutorial-compilation/image-20211221203243631.png)

3. Check the box as shown, then set the subnet IP address segment, the fourth segment is 0

    ![](/images/blogs/doris-tutorial-compilation/image-20211221203405005.png)

4. Then click on NAT settings and modify the gateway IP. Note that both the gateway IP and the virtual machine IP should match the criteria of the subnet IP address segment, that is, the other IP address settings, the first three segments should be consistent with the subnet IP

    ![](/images/blogs/doris-tutorial-compilation/image-20211221203712731.png)

5. All OK and apply

6. open the `Network and Internet` of your host computer (this computer)

    ![](/images/blogs/doris-tutorial-compilation/image-20211221203847192.png)

7. Right-click to edit the `VMnet8` network card and open the properties

    ![](/images/blogs/doris-tutorial-compilation/image-20211221203955970.png)

8. Select the IPv4 protocol and click Properties

    ![](/images/blogs/doris-tutorial-compilation/image-20211221204030083.png)

9. Modify the items inside

    ![](/images/blogs/doris-tutorial-compilation/image-20211221204116846.png)

   Note that

   - IP address filling rules are the same as above, need to meet the subnet IP address segment rules
   - The subnet mask should be the same as the subnet mask set in NAT mode in the VM virtual network settings.
   - Select the default gateway address set in "item 4".

   Just make sure

After installing the virtual machine, log into the system and do the following things:

1. Modify the NIC configuration to allow the system to connect to the host and external network

   ```shell
   vi /etc/sysconfig/network-scripts/ifcfg-ens33 #The last one is your network card name, change it according to your personal situation
   ```

   ![](/images/blogs/doris-tutorial-compilation/image-20211221202312977.png)

   Keep and add the following entries.

   ```shell
   BOOTPROTO=static # Network address assignment method is static
   NAME=ens33 # NIC alias
   DEVICE=ens33 # NIC driver name
   ONBOOT=yes # Whether to activate the NIC at system boot
   IPADDR=192.168.201.101 # local IP address, do not duplicate with the host VMnet8 IP address, to meet the rules of the subnet IP segment
   GATEWAY=192.168.201.2 # Gateway address, the value in NAT mode in the virtual network settings
   NETMASK=255.255.255.0 # Subnet mask
   DNS1=8.8.8.8 # DNS server
   ```

   `Shift + ZZ` Save and exit

   Reboot the network device and load the parameters we just finished modifying

   ```shell
   service network restart
   ```

   ![](/images/blogs/doris-tutorial-compilation/image-20211221204709603.png)

   Then ping the gateway, the host IP and the external network respectively

   ```shell
   ping 192.168.201.2
   ping 192.168.3.5
   ping www.baidu.com
   ```

   If they all ping successfully, then we can prove that our configuration is correct

2. modify the firewall settings, close the firewall

   Because it is a virtual machine, and the entire independent use, so directly shut down the virtual machine firewall is fine

   ```shell
   # Check the firewall status
   systemctl status firewalld.service
   # Shut down the firewall
   systemctl stop firewalld.service
   # Disable the firewall server on boot
   systemctl disable firewalld.service
   ````

3. install wget tool

   ```shell
   yum -y install wget
   ```

At this point, the virtual machine of Win platform and CentOS7 system are configured and can be compiled normally

## 3 Docker Awareness and Deployment

### 3.1 Docker Awareness

Docker is an open source application container engine that allows developers to package their applications and dependency packages into a portable image that can then be distributed to any popular Linux or Windows OS machine, and also virtualized. Containers are completely using the sandbox mechanism and will not have any interfaces with each other.

In short, it can be analogous to the **virtual machine technology** that we often use in the learning process, but compared to virtual machines, Docker **extremely** lightweight and simple, through containerized deployment, you can quickly isolate a small and complete system container with resources, independent systems, and independent environment, we can manipulate our Linux system to create a Docker container for compiling Doris environment by simply installing and using simple commands.

***------ recommends the following must read ------***

So why not compile it directly (under CentOS or Redhat systems), instead of building an environment container with Docker for compilation?

Very simple, afraid of various pre-dependent environment, compile under the user's own system may encounter no dependencies, does not exist to install the source, can not install a variety of problems (this environment caused by a variety of parameters is time-consuming and no value and meaning), in order to allow users to reduce unnecessary trouble in the compilation process, to improve the success rate of compilation, so, Apache Doris officially provides a Docker image they have configured the basic environment, just pull down from the cloud by a line of command, and then use a line of command into the container to compile ~

**Summary is that compiling with Docker greatly simplifies the compilation process, greatly enhances compilation reliability, and greatly saves operation and maintenance time. ** Next, start deploying Docker components.

Next, start deploying Docker components to the server system.

### 3.2 Docker deployment

1. Docker requires a kernel version higher than ``3.10`` on CentOS systems, first check if the kernel version of the system meets

   ```shell
   uname -r
   ```

2. Log in with ``root`` privileges and make sure the yum package is updated to the latest

   ```shell
   sudo yum update
   ```

3. If you have an older version installed, uninstall it first

   ```shell
   sudo yum remove docker docker-common docker-selinux docker-engine
   ```

4. install the required packages, yum-util provides yum-config-manager function, the other two are devicemapper driver dependencies

   ```shell
   sudo yum install -y yum-utils device-mapper-persistent-data lvm2
   ```

5. set yum source (to speed up yum downloads)

   ```shell
   sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
   ```

6. View all docker versions in all repositories and select a specific version to install, usually you can install the latest version directly

   ```shell
   yum list docker-ce --showduplicates | sort -r
   ```

7. Install docker

   - Install the latest stable version

     ```shell
     sudo yum install docker-ce -y #Install the latest stable version, because the repo only opens the stable repository by default
     ```

   - Install the specified version

     ```shell
     sudo yum install <FQPN> -y
     # Example.
     sudo yum install docker-ce-20.10.11.ce -y
     ```

8. start and add bootstrap

   ```shell
   sudo systemctl start docker #start docker
   sudo systemctl enable docker #Add boot to boot
   ```

9. Check the Version to verify if the installation is successful

   ```shell
   docker version
   ```

   If the Client and Server parts appear, the installation is successful.

### 3.3 Docker common commands (can be omitted)

This piece can be seen or not, see your basic use of Docker will be OK, do not see also does not prevent the next compilation

- View the currently running Docker image

  ```
  docker ps
  ```

- Go to a Docker image

  ```shell
  docker exec -it <mirrorName> /bin/bash
  ```

- View the pulled mirrors for the current machine

  ```
  docker images
  ```

- Run the specified image to create a container

  ```
  docker run -p local mapping port:mirror mapping port -d --name start image name -e image start parameters image name:image version number
  ```

## 4 Apache Doris Compilation and Deployment

> We won't go into details about Apache Doris, but we will go straight to the point - compiling Doris source code and generating a system-executable application.

### 4.1 Compiling Apache Doris

#### 4.1.1 Pulling images

In the previous step, we have successfully deployed the Docker component on `CentOS 7.6` system. Now, we need to pull the official Apache Doris environment image from the image source for compiling Doris source code.

- Pull the image

```shell
docker pull apache/incubator-doris:build-env-for-0.15.0 #This is version 0.15.0
```

![](/images/blogs/doris-tutorial-compilation/image-20211221190909871.png)

- After a successful pull, check the list of mirrors to see if they were successfully pulled

```
docker images
```

- If there is a red image circled below, the image is downloaded successfully

![](/images/blogs/doris-tutorial-compilation/image-20211221190954677.png)

- If the pull is successful, run the run command and enter the Docker image

```shell
#Don't copy and paste this sentence yet, read the following description
docker run -it apache/incubator-doris:build-env-for-0.15.0
```

After entering the mirror this way, all operations done are resource-isolated, and resources disappear as you exit the mirror.

It is recommended to run the mirror with the local Doris source directory mounted, so that the compiled output binaries are stored in the host and do not disappear when the mirror is exited.

It is also recommended to mount the `.m2` directory of maven in the mirror to the host directory to prevent repeated downloads of maven dependencies each time the mirror is started.

The following commands need to be customized according to your needs

Here, after creating the location for the host to download the source code, you can go to section ``4.1.3.1`` and download the source code to that folder first, and then execute the following statement

```shell
docker run --name apache-doris-0.15.0 -it -v /root/.m2:/root/.m2 -v Location where the host downloaded the source code: the location of the source code you want to see in the container apache/incubator-doris:build-env-for-0.15.0
# Example
# First go to section 4.1.3.1 wget and download the source code to the host /opt/doris folder and run the following command
docker run --name apache-doris-0.15.0 -it -v /root/.m2:/root/.m2 -v /opt/doris:/opt/doris apache/incubator-doris:build-env-for-0.15.0
```

If the following command header appears after execution, the mirror has been successfully entered

![](/images/blogs/doris-tutorial-compilation/image-20211220181157554.png)

#### 4.1.2 Specifying the JDK version (on-demand)

After completing pulling and entering the image, this next step is quite important, **this step is about the JDK version you will subsequently use**.

In the official compiled environment image we pull down, we are actually given two sets of JDKs to choose from, one for JDK8 and one for JDK11, the default is JDK11, so we modify it as needed.

![](/images/blogs/doris-tutorial-compilation/image-20211221120403558.png)

If you want to use JDK8 for your subsequent work, please execute the following code in order to change the JDK version

```shell
# execute as needed
alternatives --set java java-1.8.0-openjdk.x86_64
alternatives --set javac java-1.8.0-openjdk.x86_64
export JAVA_HOME=/usr/lib/jvm/java-1.8.0
```

![](/images/blogs/doris-tutorial-compilation/image-20211221120445833.png)

If you want to use JDK11 in the future, then either you should not perform any operation in the first place, because the default is JDK11. If you perform the above command to switch to JDK8 and want to cut back, then use the following command to switch to JDK11

```shell
# Execute on demand
alternatives --set java java-11-openjdk.x86_64
alternatives --set javac java-11-openjdk.x86_64
export JAVA_HOME=/usr/lib/jvm/java-11
```

![](/images/blogs/doris-tutorial-compilation/image-20211221120543215.png)

#### 4.1.3 Compiling Doris

##### 4.1.3.1 Downloading the source code and unpacking

- Use the wget command to download

```shell
# Download example (with version 0.15.0 as an example)
wget https://downloads.apache.org/incubator/doris/0.15.0-incubating/apache-doris-0.15.0-incubating-src.tar.gz
```

- Or use the following command (github pull, preferably with a ladder)

```shell
git clone https://github.com/apache/incubator-doris.git
```

After downloading, get the source tarball and execute the following command to extract it

```shell
tar -zxvf apache-doris-0.15.0-incubating-src.tar.gz 
```

After unzipping, get the folder ``apache-doris-0.15.0-incubating-src``

Execute the following command to enter the directory

```shell
cd apache-doris-0.15.0-incubating-src
```

##### 4.1.3.2 Compiling source code

```shell
# Before copying and pasting this command, you need to read the following text
sh build.sh
```

If the Docker version of the pulled Doris build environment is `build-env-1.4.2` or `build-env-for-0.15.0` (the version can be checked with the `docker images` command under CentOS as described in section `4.1.1`)

![](/images/blogs/doris-tutorial-compilation/image-20211220182911446.png)

This is because the 1.4.2 image has been upgraded to ``thrift(0.9 -> 0.13)`, and you need to force the new version of ``thrift` to generate the code file with the --clean command, otherwise incompatible code will appear.

```shell
sh build.sh --clean --be --fe --ui -j2
```

Next, you can go do other things, the tutorial test machine is using `2C 4G 8M` to compile, taking **two hours**, during the period if you find the following chart, and run super slow, is normal, the node do not continue to carry out other actions, just wait for the completion, so as not to occur inexplicable errors.

![](/images/blogs/doris-tutorial-compilation/image-20211220162256154.png)

The following message will prove that the compilation was successful

![](/images/blogs/doris-tutorial-compilation/image-20211220184120563.png)

##### 4.1.3.3 Occasional error

The compilation ended up with Failed, which means that the compilation failed with the error message

![](/images/blogs/doris-tutorial-compilation/image-20211220183806318.png)

where the main description is: `ninja: build stopped: subcommand failed.`

The reason for this error is probably due to some problem in the system itself, but it may also be due to insufficient memory used during compilation, which can be solved by using the following solution

The solution is to add a parameter at compile time and execute the following statement

```shell
sh build.sh --clean --be --fe --ui -j2
# If it's not the first build, use
sh build.sh -j2
```

If you still get the error, you need to reset the server system and start the compilation from scratch again~

##### 4.1.3.4 Copying resources

After successful compilation, the `output` folder will be created in the `apache-doris-0.15.0-incubating-src` directory (or the current directory if nothing else is done)

![](/images/blogs/doris-tutorial-compilation/image-20211220184756120.png)

Execute the view directory command to see the contents of this folder

```shell
ll output
```

The following folders need to be in the directory for the compilation to be successful: ``fe``, ``be``

- Linux cloud server.

    ![](/images/blogs/doris-tutorial-compilation/image-20211221201459225.png)

- Win platform

    ![](/images/blogs/doris-tutorial-compilation/image-20211221201650493.png)

- MacOS platform

    ![](/images/blogs/doris-tutorial-compilation/image-20211221201751774.png)

At this point, all compilation steps are complete and successful~

We need to copy the FE folder and BE folder to the host, this is the crystallization of our compilation, which is equivalent to the incubator successfully hatching the chick, we need to take the chick out of the incubator to feed and do subsequent operations~

**Linux systems and Mac systems execute commands under the host computer**

```shell
docker cp container name: the path of the file to be copied inside the container to be copied to the corresponding path in the host 
```

Note that the container name here is the name of the currently running Docker container after executing the ``docker ps`` command **on the host**

![](/images/blogs/doris-tutorial-compilation/image-20211220192355582.png)

```shell
# For example
docker cp ed22cbfd325a:/~/apache-doris-0.15.0-incubating-src/output/ /opt/
```

At this point, Doris compilation is complete.
