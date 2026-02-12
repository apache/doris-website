---
{
    "title": "Quick Start",
    "language": "en"
}
---

# Quick Start

This guide is about how to download the latest stable version of Apache Doris, install it on a single node, and get it running, including steps for creating a database, data tables, importing data, and performing queries.

## Environment requirements

- A mainstream Linux x86-64 environment. CentOS 7.1 or Ubuntu 16.04 or later versions are recommended. See the "Install and Deploy" section of the doc for guides on more environments.
- Install Java 8 runtime environment. (If you are not an Oracle JDK commercial license user, we suggest using the free Oracle JDK 8u202. [Download now](https://www.oracle.com/java/technologies/javase/javase8-archive-downloads.html#license-lightbox).)
- It is recommended to create a new user for Apache Doris on Linux (avoid using the root user to prevent accidental operations on the operating system).

## Download binary package

Download the Apache Doris installation package from doris.apache.org and proceed with the following steps.

```shell
# Download the binary installation package of Apache Doris
server1:~ doris$ wget https://download.velodb.io/apache-doris-2.0.3-bin-x64.tar.gz

# Extract the installation package
server1:~ doris$ tar zxf apache-doris-2.0.3-bin-x64.tar.gz

# Rename the directory to apache-doris for simplicity
server1:~ doris$ mv apache-doris-2.0.3-bin-x64 apache-doris
```

## Install Apache Doris

### Configure FE

Go to the `apache-doris/fe/conf/fe.conf` file for FE configuration. Below are some key configurations to pay attention to. Add JAVA_HOME manually and point it to your JDK8 runtime environment. For other configurations, you can go with the default values for a quick single-machine experience.

```Shell
# Add JAVA_HOME and point it to your JDK8 runtime environment. Suppose your JDK8 is at /home/doris/jdk8, set it as follows:
JAVA_HOME=/home/doris/jdk8

# The CIDR network segment of FE listening IP is empty by default. When started, Apache Doris will automatically select an available network segment. If you need to specify a segment, you can set priority_networks=192.168.0.0/24, for example.
# priority_networks =

# By default, FE metadata is stored in the doris-meta directory under DORIS_HOME. It is created already. You can change it to your specified path.
# meta_dir = ${DORIS_HOME}/doris-meta
```

### Start FE

Run the following command under apache-doris/fe to start FE.

```shell
# Start FE in the background to ensure that the process continues running even after exiting the terminal.
server1:apache-doris/fe doris$ ./bin/start_fe.sh --daemon
```

### Configure BE

Go to the `apache-doris/be/conf/be.conf` file for BE configuration. Below are some key configurations to pay attention to. Add JAVA_HOME manually and point it to your JDK8 runtime environment. For other configurations, you can go with the default values for a quick single-machine experience.

```Shell
# Add JAVA_HOME and point it to your JDK8 runtime environment. Suppose your JDK8 is at /home/doris/jdk8, set it as follows:
JAVA_HOME=/home/doris/jdk8

# The CIDR network segment of BE listening IP is empty by default. When started, Doris will automatically select an available network segment. If you need to specify a segment, you can set priority_networks=192.168.0.0/24, for example.
# priority_networks =

# By default, BE data is stored in the storage directory under DORIS_HOME. It is created already. You can change it to your specified path.
# storage_root_path = ${DORIS_HOME}/storage
```

### Start BE

Run the following command under apache-doris/be to start BE.

```shell
# Start BE in the background to ensure that the process continues running even after exiting the terminal.
server1:apache-doris/be doris$ ./bin/start_be.sh --daemon
```

### Connect to Doris FE

Download the [portable MySQL client](https://dev.mysql.com/downloads/mysql/) to connect to Doris FE.

Unpack the client, find the `mysql` command-line tool in the `bin/` directory. Then execute the following command to connect to Apache Doris.

```shell
mysql -uroot -P9030 -h127.0.0.1
```

Note:

- The root user here is the built-in super admin user of Apache Doris. See [Authentication and Authorization](../admin-manual/auth/authentication-and-authorization.md) for more information.
- -P: This specifies the query port that is connected to. The default port is 9030. It corresponds to the `query_port`setting in fe.conf.
- -h: This specifies the IP address of the FE that is connected to. If your client and FE are installed on the same node, you can use 127.0.0.1.

### Add BE nodes to cluster

An example SQL to execute in the MySQL client to add BE nodes to the cluster:

```SQL
 ALTER SYSTEM ADD BACKEND "be_host_ip:heartbeat_service_port";
```

Note:

1. be_host_ip: the IP address of the BE node to be added
2. heartbeat_service_port: the heartbeat reporting port of the BE node to be added, which can be found in `be.conf`under `heartbeat_service_port`, set as `9050` by default
3. You can use the "show backends" statement to view the newly added BE nodes.

### Modify passwords for root and admin

Example SQLs to execute in the MySQL client to set new passwords for root and admin users:

```SQL
mysql> SET PASSWORD FOR 'root' = PASSWORD('doris-root-password');                                                                                                                                                                                   
Query OK, 0 rows affected (0.01 sec)                                                                                                                                                                                                       
                                                                                                                                                                                                                                           
mysql> SET PASSWORD FOR 'admin' = PASSWORD('doris-admin-password');                                                                                                                                                                                 
Query OK, 0 rows affected (0.00 sec)        
```

:::tip
Difference between root and admin users

The root and admin users are two default accounts that are automatically created after Doris installation. The root user has superuser privileges for the entire cluster and can perform various management operations, such as adding or removing nodes. The admin user does not have administrative privileges but is a superuser within the cluster, possessing all permissions except those related to cluster management. It is recommended to use the root privileges only when necessary for cluster administration and maintenance.
:::

## Create database and table

### Connect to Apache Doris

Use admin account to connect to Apache Doris FE.

```shell
mysql -uadmin -P9030 -h127.0.0.1
```

:::tip
If the MySQL client connecting to 127.0.0.1 is on the same machine as FE, no password will be required.
:::

### Create database and table

```SQL
create database demo;

use demo; 
create table mytable
(
    k1 TINYINT,
    k2 DECIMAL(10, 2) DEFAULT "10.05",    
    k3 CHAR(10) COMMENT "string column",    
    k4 INT NOT NULL DEFAULT "1" COMMENT "int column"
) 
COMMENT "my first table"
DISTRIBUTED BY HASH(k1) BUCKETS 1
PROPERTIES ('replication_num' = '1');
```

### Ingest data

Save the following example data to the local "data.csv" file:

```Plaintext
1,0.14,a1,20
2,1.04,b2,21
3,3.14,c3,22
4,4.35,d4,23
```

Load the data from "data.csv" into the newly created table using the Stream Load method.

```shell
curl  --location-trusted -u admin:admin_password -T data.csv -H "column_separator:," http://127.0.0.1:8030/api/demo/mytable/_stream_load
```

- -T data.csv: data file name
- -u admin:admin_password: admin account and password
- 127.0.0.1:8030: IP and http_port of FE

Once it is executed successfully, a message like the following will be returned: 

```shell
{                                                     
    "TxnId": 30,                                  
    "Label": "a56d2861-303a-4b50-9907-238fea904363",        
    "Comment": "",                                       
    "TwoPhaseCommit": "false",                           
    "Status": "Success",                                 
    "Message": "OK",                                    
    "NumberTotalRows": 4,                                
    "NumberLoadedRows": 4,                               
    "NumberFilteredRows": 0,                             
    "NumberUnselectedRows": 0,                          
    "LoadBytes": 52,                                     
    "LoadTimeMs": 206,                                    
    "BeginTxnTimeMs": 13,                                
    "StreamLoadPutTimeMs": 141,                           
    "ReadDataTimeMs": 0,                                 
    "WriteDataTimeMs": 7,                                
    "CommitAndPublishTimeMs": 42                         
} 
```

- `NumberLoadedRows`: the number of rows that have been loaded
- `NumberTotalRows`: the total number of rows to be loaded
- `Status`: "Success" means data has been loaded successfully.

### Query data

Execute the following SQL in the MySQL client to query the loaded data:

```SQL
mysql> select * from mytable;                                                                                                                                                                                                              
+------+------+------+------+                                                                                                                                                                                                              
| k1   | k2   | k3   | k4   |                                                                                                                                                                                                              
+------+------+------+------+                                                                                                                                                                                                              
|    1 | 0.14 | a1   |   20 |                                                                                                                                                                                                              
|    2 | 1.04 | b2   |   21 |                                                                                                                                                                                                              
|    3 | 3.14 | c3   |   22 |                                                                                                                                                                                                              
|    4 | 4.35 | d4   |   23 |                                                                                                                                                                                                              
+------+------+------+------+                                                                                                                                                                                                              
4 rows in set (0.01 sec)       
```

## Stop Apache Doris

### Stop FE

Execute the following command under apache-doris/fe to stop FE.

```shell
server1:apache-doris/fe doris$ ./bin/stop_fe.sh
```

### Stop BE

Execute the following command under apache-doris/be to stop BE.

```shell
server1:apache-doris/be doris$ ./bin/stop_be.sh
```
