---
{
    "title": "ODBC 外表使用教程（三）：Oracle + Ubuntu",
    "description": "详细介绍如果在 Ubuntu 系统下，使用 ODBC 外表功能连接 Oracle 数据库",
    "date": "2022-01-01",
    "metaTitle": "ODBC 外表使用教程（三）",
    "isArticle": true,
    "language": "zh-CN",
    "author": "张家锋",
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

本文档详细介绍如何在 Ubuntu 环境下，使用 Doris 的 ODBC 外表功能连接 Oracle 数据库。

[[toc]]

## 1.软件环境

1. 操作系统：ubuntu 18.04
2. Apache Doris ：0.15
3. Postgresql数据库：oracle 19c
4. UnixODBC：2.3.4
5. Oracle ODBC ：instantclient-odbc-linux.x64-19.13.0.0.0dbru

## 2.Oracle安装部署

因为是测试没有Oracle的环境，由于安装比较繁琐耗时，所以通过Docker进行快速安装部署。

**本章节仅记录笔者安装 Oracle 的过程。如果你已安装，可以跳到第3节继续阅读。**

### 2.1 制作镜像

安装方法是通过官方dockerfile自己编译镜像安装，

```shell
$> git clone https://github.com/oracle/docker-images.git
Cloning into 'docker-images'...
remote: Enumerating objects: 77, done.
remote: Counting objects: 100% (77/77), done.
remote: Compressing objects: 100% (52/52), done.
remote: Total 9878 (delta 25), reused 55 (delta 23), pack-reused 9801
Receiving objects: 100% (9878/9878), 10.20 MiB | 2.47 MiB/s, done.
Resolving deltas: 100% (5686/5686), done.
$> cd docker-images/OracleDatabase/SingleInstance/dockerfiles/
$> ls -al
total 44
drwxr-xr-x 9 root root 4096 Jan  1 11:51 ./
drwxr-xr-x 7 root root 4096 Jan  1 11:51 ../
drwxr-xr-x 2 root root 4096 Jan  1 11:51 11.2.0.2/
drwxr-xr-x 2 root root 4096 Jan  1 11:51 12.1.0.2/
drwxr-xr-x 2 root root 4096 Jan  1 11:51 12.2.0.1/
drwxr-xr-x 2 root root 4096 Jan  1 11:51 18.3.0/
drwxr-xr-x 2 root root 4096 Jan  1 11:51 18.4.0/
drwxr-xr-x 2 root root 4096 Jan  1 12:04 19.3.0/
drwxr-xr-x 2 root root 4096 Jan  1 11:51 21.3.0/
-rwxr-xr-x 1 root root 7091 Jan  1 11:51 buildContainerImage.sh*  ---制作镜像的命令
```

目前支持以上几个版本的docker安装。

我们这里要制作安装的是19.3.0这个版本

```shell
$> cd 19.3.0/ && ls -al
total 2988092
drwxr-xr-x 2 root root       4096 Jan  1 12:04 ./
drwxr-xr-x 9 root root       4096 Jan  1 11:51 ../
-rwxr-xr-x 1 root root       1044 Jan  1 11:51 checkDBStatus.sh*
-rwxr-xr-x 1 root root        904 Jan  1 11:51 checkSpace.sh*
-rw-r--r-- 1 root root         63 Jan  1 11:51 Checksum.ee
-rw-r--r-- 1 root root         63 Jan  1 11:51 Checksum.se2
-rwxr-xr-x 1 root root       7634 Jan  1 11:51 createDB.sh*
-rw-r--r-- 1 root root       9204 Jan  1 11:51 dbca.rsp.tmpl
-rw-r--r-- 1 root root       6878 Jan  1 11:51 db_inst.rsp
-rw-r--r-- 1 root root       4398 Jan  1 11:51 Dockerfile
-rwxr-xr-x 1 root root       2712 Jan  1 11:51 installDBBinaries.sh*
-rw-r--r-- 1 root root 3059705302 Apr 24  2019 LINUX.X64_193000_db_home.zip   ---oracle安装介质文件
-rw-r--r-- 1 root root       2008 Jan  1 11:51 relinkOracleBinary.sh
-rwxr-xr-x 1 root root       7743 Jan  1 11:51 runOracle.sh*
-rwxr-xr-x 1 root root       1021 Jan  1 11:51 runUserScripts.sh*
-rwxr-xr-x 1 root root        795 Jan  1 11:51 setPassword.sh*
-rwxr-xr-x 1 root root       1057 Jan  1 11:51 setupLinuxEnv.sh*
-rwxr-xr-x 1 root root        679 Jan  1 11:51 startDB.sh*
$> cat Dockerfile|grep INSTALL_FILE_1
    INSTALL_FILE_1="LINUX.X64_193000_db_home.zip" \   ---这里我们可以看到Oracle的安装介质文件名
COPY --chown=oracle:dba $INSTALL_FILE_1 $INSTALL_RSP $INSTALL_DB_BINARIES_FILE $INSTALL_DIR/
```

我们需要下载Oracle的安装介质文件

下载地址：https://www.oracle.com/database/technologies/oracle19c-linux-downloads.html#license-lightbox

这里需要登录，下载完成之后将zip包放到这个目录下，然后执行下面命令：

```
$> ./buildDockerImage.sh -v 19.3.0 -e
```

`e表示企业版`

```
Successfully built 701b50f5832a
Successfully tagged oracle/database:19.3.0-ee


  Oracle Database Docker Image for 'ee' version 19.3.0 is ready to be extended: 
    
    --> oracle/database:19.3.0-ee

  Build completed in 2624 seconds.
```

当出现上面的提示，就表示镜像制作完成了，剩下就是利用该镜像启动容器即可。

### 2.2 启动容器，安装数据库

注意:oracle 企业版的docker run的命令格式如下（XE版的都有所区别）：

```sql
$> docker run --name oracle-19c \
-p 1521:1521 -p 5500:5500 \
-e ORACLE_SID=lei \  ---这里是你安装数据的时候创建的数据库SID
-e ORACLE_PDB=leipdb \
-e ORACLE_PWD=Oracle \
-v /oracle/oradata:/opt/oracle/oradata \
oracle/database:19.3.0-ee
```

> 注：`/oracle/oradata`目录权限一定要正确，在容器中oracle用户的uid是54321，所以要保证容器内的oracle用户有权限读写该目录。

> 注: 如果"DATABASE IS READY TO USE!"提示信息，表示数据库已成功安装了。

### 2.3 验证Oracle安装

登陆主机或数据库进行操作

```
$> docker exec -it oracle-19c /bin/bash
$> export ORACLE_SID=LEI
$> sqlplus / as sysdba

SQL*Plus: Release 19.0.0.0.0 - Production on Sun Jan 2 02:28:55 2022
Version 19.3.0.0.0

Copyright (c) 1982, 2019, Oracle.  All rights reserved.


Connected to:
Oracle Database 19c Enterprise Edition Release 19.0.0.0.0 - Production
Version 19.3.0.0.0

SQL> show pdbs;

    CON_ID CON_NAME			  OPEN MODE  RESTRICTED
---------- ------------------------------ ---------- ----------
	 2 PDB$SEED			  READ ONLY  NO
	 3 LEIPDB			  READ WRITE NO
SQL>
```

至此就完成了docker安装Oracle 19c！

然后我们就可以创建数据库、创建表、导入数据进行测试

我们首先创建一个表空间，然后创建用户挂在到这个表空间下

```sql
---创建表空间
create tablespace demo1 datafile '/opt/oracle/oradata/demo1.dbf' size 200M;
---创建用户并给用户设置默认的表空间
create user C##dbuser identified by "zhangfeng" default tablespace demo1;
---给用户授权
grant connect,resource,dba to C##dbuser;
grant create session to C##dbuser;
```

然后我们可以使用Navicat或者SQLPlus等其他客户端使用刚才创建的用户连接Oracle，去创建表，导入数据

下面是我测试的建表语句及插入的示例数据

```sql
CREATE TABLE persons(
    person_id NUMBER GENERATED BY DEFAULT AS IDENTITY,
    first_name VARCHAR2(50) NOT NULL,
    last_name VARCHAR2(50) NOT NULL,
    PRIMARY KEY(person_id)
);

INSERT INTO "C##DBUSER"."PERSONS" VALUES ('1', 'zhang', 'feng');
INSERT INTO "C##DBUSER"."PERSONS" VALUES ('2', '张峰', '峰');
INSERT INTO "C##DBUSER"."PERSONS" VALUES ('3', 'zhangfeng', '峰值');
```

## 3.安装unixODBC驱动

首先我们安装unixODBC驱动、这里直接给出驱动的下载地址及安装命令

```shell
$>sudo wget ftp://ftp.unixodbc.org/pub/unixODBC/unixODBC-2.3.4.tar.gz 
$>tar -xvzf unixODBC-2.3.4.tar.gz 
$>cd unixODBC-2.3.4/
$>sudo ./configure --prefix=/usr/local/unixODBC-2.3.7 --includedir=/usr/include --libdir=/usr/lib -bindir=/usr/bin --sysconfdir=/etc
$>make
$>sudo make install
```

安装成功后，unixODBC所需的头文件都被安装到了/usr/inlucde下，编译好的库文件安装到了/usr/lib下，与unixODBC相关的可执行文件安装到了/usr/bin下，配置文件放到了/etc下。

验证安装是否成功

```
$> odbcinst -j
unixODBC 2.3.4
DRIVERS............: /etc/odbcinst.ini
SYSTEM DATA SOURCES: /etc/odbc.ini
FILE DATA SOURCES..: /etc/ODBCDataSources
USER DATA SOURCES..: /root/.odbc.ini
SQLULEN Size.......: 8
SQLLEN Size........: 8
SQLSETPOSIROW Size.: 8
```

## 4.安装Oracle ODBC驱动及测试

### 4.1 安装驱动

我们需要下载下面这几个安装包：

```
oracle-instantclient19.13-basic-19.13.0.0.0-2.x86_64.rpm
oracle-instantclient19.13-devel-19.13.0.0.0-2.x86_64.rpm
oracle-instantclient19.13-odbc-19.13.0.0.0-2.x86_64.rpm
oracle-instantclient19.13-sqlplus-19.13.0.0.0-2.x86_64.rpm
```

下面是下载地址：

```
https://download.oracle.com/otn_software/linux/instantclient/1913000/oracle-instantclient19.13-sqlplus-19.13.0.0.0-2.x86_64.rpm

https://download.oracle.com/otn_software/linux/instantclient/1913000/oracle-instantclient19.13-devel-19.13.0.0.0-2.x86_64.rpm

https://download.oracle.com/otn_software/linux/instantclient/1913000/oracle-instantclient19.13-odbc-19.13.0.0.0-2.x86_64.rpm

https://download.oracle.com/otn_software/linux/instantclient/1913000/oracle-instantclient19.13-basic-19.13.0.0.0-2.x86_64.rpm
```

为了在ubuntu下可以进行安装rpm包，我们还需要安装一个alien，这是一个可以将rpm包转换成deb安装包的工具

```
$> sudo apt-get install alien
```

然后执行安装上面四个包

```
$> sudo alien -i oracle-instantclient19.13-basic-19.13.0.0.0-2.x86_64.rpm
$> sudo alien -i oracle-instantclient19.13-devel-19.13.0.0.0-2.x86_64.rpm
$> sudo alien -i oracle-instantclient19.13-odbc-19.13.0.0.0-2.x86_64.rpm
$> sudo alien -i oracle-instantclient19.13-sqlplus-19.13.0.0.0-2.x86_64.rpm
```

验证我们安装的ODBC驱动动态链接库是否正确

```shell
$> ldd /usr/lib/oracle/19.13/client64/lib/libsqora.so.19.1
	linux-vdso.so.1 (0x00007ffefef27000)
	libdl.so.2 => /lib/x86_64-linux-gnu/libdl.so.2 (0x00007f43e80b0000)
	libm.so.6 => /lib/x86_64-linux-gnu/libm.so.6 (0x00007f43e7f61000)
	libpthread.so.0 => /lib/x86_64-linux-gnu/libpthread.so.0 (0x00007f43e7f3e000)
	libnsl.so.1 => /lib/x86_64-linux-gnu/libnsl.so.1 (0x00007f43e7f21000)
	librt.so.1 => /lib/x86_64-linux-gnu/librt.so.1 (0x00007f43e7f16000)
	libaio.so.1 => /lib/x86_64-linux-gnu/libaio.so.1 (0x00007f43e7f11000)
	libresolv.so.2 => /lib/x86_64-linux-gnu/libresolv.so.2 (0x00007f43e7ef3000)
	libclntsh.so.19.1 => /usr/lib/oracle/19.13/client64/lib/libclntsh.so.19.1 (0x00007f43e3d6f000)
	libclntshcore.so.19.1 => /usr/lib/oracle/19.13/client64/lib/libclntshcore.so.19.1 (0x00007f43e37cb000)
	libodbcinst.so.2 => /usr/local/lib/libodbcinst.so.2 (0x00007f43e37b3000)
	libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f43e35c1000)
	/lib64/ld-linux-x86-64.so.2 (0x00007f43e8379000)
	libnnz19.so => /usr/lib/oracle/19.13/client64/lib/libnnz19.so (0x00007f43e2f4a000)
	libltdl.so.7 => /lib/x86_64-linux-gnu/libltdl.so.7 (0x00007f43e2f3d000)
```

### 4.2 配置环境变量

```
$> sudo vi ~/.bashrc
```

加入下面的内容

```
export ORACLE_HOME=/usr/lib/oracle/19.13/client64
export TNS_ADMIN=$ORACLE_HOME/network/admin
export LD_LIBRARY_PATH=$ORACLE_HOME/lib
export ORACLE_SID=LEI
export PATH=$ORACLE_HOME/bin:$PATH
```

### 4.3 配置 tnsnames.ora 文件

```
$> cd /usr/lib/oracle/19.13/client64
$> mkdir -p network/admin
$> vi tnsnames.ora 
```

加入下面的内容（注意修改成自己的，这里是示例）

```
demo =
  (DESCRIPTION =
    (ADDRESS_LIST =
      (ADDRESS = (PROTOCOL = TCP)(HOST = 172.16.192.81)(PORT = 1521))
    )
    (CONNECT_DATA =
      (	SERVICE_NAME = LEI)
    )
  )
```

> 注1. 将HOST、PORT换成你自己的
> 
> 注2. SERVICE_NAME :这个是我们启动Oracle docker的时候设置的ORACLE_SID

### 4.4 配置odbcinst.ini

这里使用RPM包安装的额ODBC驱动动态链接库在 `/usr/lib/oracle/19.13/client64/lib/`目录下

```
$> ls -al /usr/lib/oracle/19.13/client64/lib/
total 236232
drwxr-xr-x 3 root root      4096 Jan  2 11:04 ./
drwxr-xr-x 5 root root      4096 Jan  1 19:47 ../
-rw-r--r-- 1 root root       342 Nov 27 02:41 glogin.sql
lrwxrwxrwx 1 root root        21 Jan  1 19:43 libclntshcore.so -> libclntshcore.so.19.1*
-rwxr-xr-x 1 root root   8057664 Nov 27 02:39 libclntshcore.so.19.1*
lrwxrwxrwx 1 root root        17 Jan  1 19:43 libclntsh.so -> libclntsh.so.19.1*
lrwxrwxrwx 1 root root        17 Jan  1 19:43 libclntsh.so.10.1 -> libclntsh.so.19.1*
lrwxrwxrwx 1 root root        17 Jan  1 19:43 libclntsh.so.11.1 -> libclntsh.so.19.1*
lrwxrwxrwx 1 root root        17 Jan  1 19:43 libclntsh.so.12.1 -> libclntsh.so.19.1*
lrwxrwxrwx 1 root root        17 Jan  1 19:43 libclntsh.so.18.1 -> libclntsh.so.19.1*
-rwxr-xr-x 1 root root  81679160 Nov 27 02:39 libclntsh.so.19.1*
-rwxr-xr-x 1 root root   3642520 Nov 27 02:39 libipc1.so*
-rwxr-xr-x 1 root root    478728 Nov 27 02:39 libmql1.so*
-rwxr-xr-x 1 root root   5831752 Nov 27 02:39 libnnz19.so*
-rwxr-xr-x 1 root root   2342024 Nov 27 02:39 libocci.so.19.1*
-rwxr-xr-x 1 root root 130543568 Nov 27 02:39 libociei.so*
-rwxr-xr-x 1 root root    153464 Nov 27 02:39 libocijdbc19.so*
-rwxr-xr-x 1 root root    116376 Nov 27 02:39 liboramysql19.so*
-rwxr-xr-x 1 root root   1660776 Nov 27 02:41 libsqlplusic.so*
-rwxr-xr-x 1 root root   1572432 Nov 27 02:41 libsqlplus.so*
-rwxr-xr-x 1 root root   1070192 Nov 27 02:41 libsqora.so.19.1* ---这里是要使用的ODBC动态链接库
drwxr-xr-x 3 root root      4096 Jan  1 19:43 network/
-rw-r--r-- 1 root root   4355723 Nov 27 02:39 ojdbc8.jar
-rw-r--r-- 1 root root    313026 Nov 27 02:41 ottclasses.zip
-rw-r--r-- 1 root root     37519 Nov 27 02:39 xstreams.jar
```

编辑 `/etc/odbcinst.ini`，在最后加上下面的内容

```
[Oracle 19 ODBC driver]
Description     = Oracle ODBC driver for Oracle 19
Driver          = /usr/lib/oracle/19.13/client64/lib/libsqora.so.19.1
Setup           =
FileUsage       =
CPTimeout       =
CPReuse         =
```

配置odbc.ini，在最后加上下面的内容

```
[oracle]
Driver = Oracle 19 ODBC driver ---这里的名称是上面odbcinst.ini里oracle部分用[]括起来的内容
ServerName =172.16.192.81:1521/LEI --这里是你的oracle数据ip地址，端口及SID
UserID = C##dbuser  --这里是我们上面创建的用户名
Password = zhangfeng   --密码
```

验证ODBC

```sql
isql oracle
+---------------------------------------+
| Connected!                            |
|                                       |
| sql-statement                         |
| help [tablename]                      |
| quit                                  |
|                                       |
+---------------------------------------+
```

显示一切正常

## 5.Apache Doris Oracle外表验证

### 5.1 修改配置

修改BE节点 `conf/odbcinst.ini` 文件，加入刚才/etc/odbcinst.ini添加的一样内容，并删除原先的Oracle配置，加上你刚才安装的，如下：

```
[Oracle 19 ODBC driver]
Description     = Oracle ODBC driver for Oracle 19
Driver          = /usr/lib/oracle/19.13/client64/lib/libsqora.so.19.1
```

### 5.2 验证

创建oracle的ODBC Resource

```sql
 CREATE EXTERNAL RESOURCE `oracle_19`
 PROPERTIES (
    "host" = "172.16.192.81",
    "port" = "1521",
    "user" = "C##dbuser",
    "password" = "zhangfeng",
    "database" = "LEI", --这里是你的数据库示例名称，也就是我们在docker启动时的ORACLE_SID
    "driver" = "Oracle 19 ODBC driver",   ---这里的名称一定和你在be odbcinst.ini里的oracle部分的[]里的内容一样，重要
    "odbc_type" = "oracle",
    "type" = "odbc_catalog"
 );
```

创建ODBC外表

```sql
CREATE EXTERNAL TABLE `oracle_odbc` (
    person_id int,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL
) ENGINE=ODBC
COMMENT "ODBC"
PROPERTIES (
  "odbc_catalog_resource" = "oracle_19", 
  "database" = "LEI",
  "table" = "persons"
);
```

下面我们看执行结果

````sql
mysql>  CREATE EXTERNAL RESOURCE `oracle_19`
    ->  PROPERTIES (
    ->  "host" = "172.16.192.81",
    ->  "port" = "1521",
    ->  "user" = "C##dbuser",
    ->  "password" = "zhangfeng",
    ->  "database" = "LEI",
    ->  "driver" = "Oracle 19 ODBC driver",
    ->  "odbc_type" = "oracle",
    ->  "type" = "odbc_catalog"
    ->  );
Query OK, 0 rows affected (0.01 sec)

mysql>
mysql>  CREATE EXTERNAL TABLE `oracle_odbc` (
    ->     person_id int,
    ->     first_name VARCHAR(50) NOT NULL,
    ->     last_name VARCHAR(50) NOT NULL
    -> ) ENGINE=ODBC
    -> COMMENT "ODBC"
    -> PROPERTIES (
    -> "odbc_catalog_resource" = "oracle_19",
    -> "database" = "LEI",
    -> "table" = "persons"
    -> );
Query OK, 0 rows affected (0.01 sec)

mysql> select * from oracle_odbc;
+-----------+------------+-----------+
| person_id | first_name | last_name |
+-----------+------------+-----------+
|         1 | zhang      | feng      |
|         2 | 张峰      | 峰        |
|         3 | zhangfeng  | 峰值      |
+-----------+------------+-----------+
3 rows in set (0.06 sec)
````

OK一切正常，正常情况下，Oracle ODBC驱动只要你的数据库版本和你的ODBC驱动版本（大版本号对上就行）一致，就基本不会出问题。