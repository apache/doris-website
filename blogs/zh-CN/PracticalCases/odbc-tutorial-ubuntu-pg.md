---
{
    "title": "ODBC 外表使用教程（二）：PostgreSQL + Ubuntu",
    "description": "详细介绍如果在 Ubuntu 系统下，使用 ODBC 外表功能连接 PostgreSQL 数据库",
    "date": "2022-01-01",
    "metaTitle": "ODBC 外表使用教程（二）",
    "isArticle": true,
    "language": "zh-CN",
    "author": "张家锋",
    "layout": "Article",
    "sidebar": true,
    "zhCategories": "PracticalCases"
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

本文档详细介绍如何在 Ubuntu 环境下，使用 Doris 的 ODBC 外表功能连接 PostgreSQL 数据库。

[[toc]]

## 1.软件环境

1. 操作系统：ubuntu 18.04
2. Apache Doris ：0.15
3. Postgresql数据库：PostgreSQL 12.9
4. UnixODBC：2.3.4
5. PostgreSQL ODBC ：psqlodbc-12.02.0000

## 2.安装ODBC驱动

首先我们安装unixODBC驱动、这里直接给出驱动的下载地址及安装命令

```shell
$> sudo wget ftp://ftp.unixodbc.org/pub/unixODBC/unixODBC-2.3.4.tar.gz 
$> tar -xvzf unixODBC-2.3.4.tar.gz 
$> cd unixODBC-2.3.4/
$> sudo ./configure --prefix=/usr/local/unixODBC-2.3.7 --includedir=/usr/include --libdir=/usr/lib -bindir=/usr/bin --sysconfdir=/etc
$> make
$> sudo make install
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

## 3.安装Postgresql数据库

**这一章节，仅记录笔者安装 Postgresql 的过程。如果你已经安装了 Postgresql，这可以直接跳到第4节继续阅读。**

Ubuntu的默认存储库包含Postgres软件包，因此您可以使用`apt`安装这些软件包。

安装之前先用`apt`更新一下本地软件包，然后，安装`Postgres`包和一个附加实用程序和功能的`- managed`包:

```shell
$> sudo apt update
$> sudo apt install postgresql postgresql-contrib
```

现在已经安装了该软件，我们可以了解它的工作原理以及它与您可能使用的类似数据库管理系统的不同之处。

### 3.1 使用PostgreSQL roles和数据库

默认情况下，Postgres使用称为“roles”的概念来处理身份验证和授权。在某些方面，这些类似于常规的Unix风格帐户，但Postgres不区分用户和组，而是更喜欢更灵活的术语“roles”。

安装后，Postgres设置为使用*ident身份*验证，这意味着它将Postgres roles与匹配的Unix / Linux系统帐户相关联。如果Postgres中存在roles，则具有相同名称的Unix / Linux用户名可以作为该roles登录。

安装过程创建了一个名为**postgres**的用户帐户，该帐户与默认的Postgres roles相关联。要使用Postgres，您可以登录该帐户。

有几种方法可以使用此帐户访问Postgres。

### 3.2 切换到postgres帐户

输入以下内容切换到服务器上的**postgres**帐户：

```shell
$> sudo -i -u postgres
```

您现在可以通过输入以下内容立即访问Postgres：

```shell
$> psql
```

这将使您进入PostgreSQL提示符，从此处您可以立即与数据库管理系统进行交互。

输入以下命令退出PostgreSQL提示符：

```shell
postgres=# \q
```

### 3.3 在不切换帐户的情况下访问Postgres

您也可以让**postgres**帐户用`sudo`运行您想要的命令。

例如，在最后一个示例中，您被指示通过首先切换到**postgres**用户然后运行`psql`以打开Postgres提示来进入Postgres提示。您可以通过`psql`以**postgres**用户身份运行单个命令来一步完成此操作`sudo`，如下所示：

```shell
$> sudo -u postgres psql
```

这将直接登录到Postgres。

同样，您可以通过输入以下内容退出交互式Postgres会话：

```shell
postgres=# \q
```

许多用例需要多个Postgres roles。继续阅读以了解如何配置这些

### 3.4 创建用户，数据库及表

使用默认用户登录postgresql创建用户、创建数据库及完成授权

```shell
$> sudo -u postgres psql
```

创建数据库新用户，如 dbuser：

```sql
postgres=# CREATE USER dbuser WITH PASSWORD 'zhangfeng';
```

注意：

* 语句要以分号结尾。
* 密码要用单引号括起来。
* 创建用户数据库，你也可以通过你创建的用户登录进去以后创建数据库，如demo：

```sql
postgres=# CREATE DATABASE demo OWNER dbuser;
```

将demo数据库的所有权限都赋予dbuser：

```sql
postgres=# GRANT ALL PRIVILEGES ON DATABASE demo TO dbuser;
```

使用命令 \q 退出psql：

```
postgres=# \q
```

创建Linux普通用户，与刚才新建的数据库用户同名，如 dbuser：
```
$ sudo adduser dbuser
$ sudo passwd dbuser
```

以dbuser的身份连接数据库exampledb：

```
$ su - dbuser

Password: 
Last login: Wed Mar 1 11:52:07 CST 2017 on pts/

```

用我们创建的用户（dbuser）登录psql

```sql
# sudo -u dbuser psql -U dbuser -d demo
could not change directory to "/root": Permission denied
psql (12.9 (Ubuntu 12.9-0ubuntu0.20.04.1))
Type "help" for help.

demo=> \d
                    List of relations
 Schema |           Name            |   Type   |  Owner
--------+---------------------------+----------+----------
 public | playground                | table    | postgres
 public | playground_1              | table    | dbuser
 public | playground_1_equip_id_seq | sequence | dbuser
 public | playground_equip_id_seq   | sequence | postgres
(4 rows)
```

创建表及插入数据

```sql
CREATE TABLE playground_test_odbc (
    equip_id serial PRIMARY KEY,
    type varchar (50) NOT NULL,
    color varchar (25) NOT NULL,
    location varchar(25) ,
    install_date date
);
```

示例数据

```
INSERT INTO playground_test_odbc (type, color, location, install_date) VALUES ('slide', 'blue', 'south', '2017-04-28');
INSERT INTO playground_test_odbc (type, color, location, install_date) VALUES ('swing', 'yellow', 'northwest', '2018-08-16');
```

执行结果

```sql
demo=> CREATE TABLE playground_test_odbc (
demo(>     equip_id serial PRIMARY KEY,
demo(>     type varchar (50) NOT NULL,
demo(>     color varchar (25) NOT NULL,
demo(>     location varchar(25) ,
demo(>     install_date date
demo(> );
CREATE TABLE
demo=> INSERT INTO playground_test_odbc (type, color, location, install_date) VALUES ('slide', 'blue', 'south', '2017-04-28');
INSERT 0 1
demo=> INSERT INTO playground_test_odbc (type, color, location, install_date) VALUES ('swing', 'yellow', 'northwest', '2018-08-16');
INSERT 0 1
```

## 4.安装Postgresql ODBC驱动

这里我们下载是和数据版本相对于的驱动程序

Postgresql ODBC驱动下载地址：https://www.postgresql.org/ftp/odbc/versions/src/

```shell
$> wget https://ftp.postgresql.org/pub/odbc/versions/src/psqlodbc-12.02.0000.tar.gz
$> tar zxvf psqlodbc-12.02.0000.tar.gz
$> cd psqlodbc-12.02.0000
$> ./configure --without-libpq   (注：由于本机未安装postgresql，故使用without-libpq选项) 
$> ./configure
$> make
$> make install
```

如果在编译过程中出现下面的错误

```
configure: error: libpq library version >= 9.2 is required
```

这是因为缺少libpq的包，需要进行安装，执行下面的命令

```shell
$> apt-get install libpq-dev
```

安装成功，默认驱动放在/usr/local/lib/psqlodbcw.so下

## 5.验证ODBC驱动是否成功

### 5.1 配置注册Postgresql ODBC驱动

编辑/etc/odbcinst.ini，加入下面的内容

```shell
[PostgreSQL]
Description = ODBC for PostgreSQL
Driver = /usr/local/lib/psqlodbcw.so
Driver64 = /usr/local/lib/psqlodbcw.so
Setup = /usr/lib/libodbc.so    ##注意这里是在第二节安装的unixODBC的so文件路径
Setup64 = /usr/lib/libodbc.so
FileUsage = 1
```

### 5.2 配置PG 数据源

编辑/etc/odbc.ini

加入下面内容

```shell
[PostgresDB]
Driver = PostgreSQL    ###这里的名称和odbcinst.ini里配置的名称一致
Description = Postgres DSN
Servername = localhost
Database = demo
Username = dbuser
Password = zhangfeng
Port = 5432
ReadOnly = No
```

其他的是你的Postgresql地址及刚才创建的用户、密码、数据库、端口等

### 5.3 验证是否成功

```sql
isql -v PostgresDB dbuser zhangfeng
+---------------------------------------+
| Connected!                            |
|                                       |
| sql-statement                         |
| help [tablename]                      |
| quit                                  |
|                                       |
+---------------------------------------+
SQL>
```

注意这里的PostgresDB是我们在odbc.ini里定义的名称，这里显示ODBC正常

## 6.Apache Doris PG外表验证

### 6.1 修改配置

修改BE节点conf/odbcinst.ini文件,加入刚才/etc/odbcinst.ini添加的一样内容，并删除原先的PostgreSQL配置

```
[PostgreSQL]
Description = ODBC for PostgreSQL
Driver = /usr/local/lib/psqlodbcw.so
Driver64 = /usr/local/lib/psqlodbcw.so
Setup = /usr/lib/libodbc.so
Setup64 = /usr/lib/libodbc.so
FileUsage = 1
```

### 6.2 验证

创建PG ODBC Resource

```sql
CREATE EXTERNAL RESOURCE `pg_12`
 PROPERTIES (
"host" = "localhost",
 "port" = "5432",
 "user" = "dbuser",
 "password" = "zhangfeng",
 "database" = "demo",
 "table" = "playground_test_odbc",
 "driver" = "PostgreSQL",  
 "odbc_type" = "postgresql",
 "type" = "odbc_catalog"
 );
```

创建ODBC外表

```
 CREATE EXTERNAL TABLE `playground_odbc_12` (
    equip_id int NOT NULL,
    type varchar (50) NOT NULL,
    color varchar (25) NOT NULL,
    location varchar(25) ,
    install_date date
) ENGINE=ODBC
COMMENT "ODBC"
PROPERTIES (
"odbc_catalog_resource" = "pg_12", 
"database" = "demo",
"table" = "playground_test_odbc"
);
```

在Doris下执行查询：

```sql
ysql> show tables;
+--------------------+
| Tables_in_demo     |
+--------------------+
| playground_odbc_12 |
| test_odbc_5        |
| test_odbc_8        |
| test_odbc_8_0_26   |
| test_odbc_mysql    |
| test_odbc_mysql_8  |
+--------------------+
6 rows in set (0.00 sec)

mysql> select * from playground_odbc_12;
+----------+-------+--------+-----------+--------------+
| equip_id | type  | color  | location  | install_date |
+----------+-------+--------+-----------+--------------+
|        1 | slide | blue   | south     | 2017-04-28   |
|        2 | swing | yellow | northwest | 2018-08-16   |
+----------+-------+--------+-----------+--------------+
2 rows in set (0.01 sec)
```

OK，一切正常，相对Mysql，PG的ODBC驱动更简单一些，只要你的PG版本和ODBC驱动版本对应上问题都不大。