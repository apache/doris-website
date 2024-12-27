---
{
    "title": "Deploy Storage Compute Coupled Manually",
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
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

After completing preliminary checks and planning, such as environment checks, cluster planning, and operating system inspections, you can begin deploying the cluster. Deploying the cluster is divided into four steps:

1. Deploy FE Master Node: Deploy the first FE node as the Master node;
   
2. Deploy FE Cluster: Deploy the FE cluster by adding Follower or Observer FE nodes;
   
3. eploy BE Nodes: Register BE nodes to the FE cluster;
   
4. Verify Cluster Correctness: After deployment, connect to and verify the cluster's correctness.

## Step 1: Deploy FE Master Node

1. Create Metadata Path

   When deploying FE, it is recommended to store metadata on a different hard drive from the BE node data storage.

   When extracting the installation package, a doris-meta directory is included by default. It is recommended to create an independent metadata directory and create a symbolic link to doris-meta. In a production environment, it is strongly advised to specify a separate directory outside the Doris installation directory, preferably on a dedicated SSD. For testing and development environments, you can use the default configuration.

   ```sql
   ## Use a separate disk for FE metadata
   mkdir -p <doris_meta_created>
      
   ## Create FE metadata directory symlink
   ln -s <doris_meta_original> <doris_meta_created>
   ```

2. Modify FE Configuration File

   The FE configuration file is located in the conf directory under the FE deployment path. Before starting the FE node, you need to modify conf/fe.conf.

   Before deploying the FE node, it is recommended to modify the following parameters:

   ```Bash
   ## modify Java Heap
   JAVA_OPTS="-Xmx16384m -XX:+UseMembar -XX:SurvivorRatio=8 -XX:MaxTenuringThreshold=7 -XX:+PrintGCDateStamps -XX:+PrintGCDetails -XX:+UseConcMarkSweepGC -XX:+UseParNewGC -XX:+CMSClassUnloadingEnabled -XX:-CMSParallelRemarkEnabled -XX:CMSInitiatingOccupancyFraction=80 -XX:SoftRefLRUPolicyMSPerMB=0 -Xloggc:$DORIS_HOME/log/fe.gc.log.$DATE"
      
   ## modify case sensitivity
   lower_case_table_names = 1
     
   ## modify network CIDR 
   priority_networks = 10.1.3.0/24
      
   ## modify Java Home
   JAVA_HOME = <your-java-home-path>
   ```
   
   Parameter Descriptions: For more detailed parameters, refer to the documentation. [FE Configuration](../../admin-manual/config/fe-config)：

   | Parameter                                                    | Suggestion                                                 |
   | ------------------------------------------------------------ | --------------------------------------------------------- |
   | JAVA_OPTS                                                    | Specify the `-Xmx` parameter to adjust the Java Heap. It is recommended to set it to above 16G in production environments.   |
   | [lower_case_table_names ](../../admin-manual/config/fe-config#lower_case_table_names) | Set case sensitivity. It is recommended to adjust it to 1, meaning case-insensitive.            |
   | [priority_networks ](../../admin-manual/config/fe-config#priority_networks) | Network CIDR is specified based on the network IP address. It can be ignored in an FQDN environment. |
   | JAVA_HOME                                                    | It is recommended to use a JDK environment independent of the operating system for Doris.                |
   
3. Start FE Process

   You can start the FE process using the following command:
   ```Shell
   bin/start_fe.sh --daemon
   ```

   The FE process will start and run in the background. By default, logs are stored in the log/ directory. If the startup fails, you can check the log/fe.log or log/fe.out files for error information.

4. Check FE Startup Status

   You can connect to the Doris cluster using MySQL Client. The default user is root, and the password is empty.

   ```sql
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
   ```

   After connecting to the Doris cluster, you can use the show frontends command to check the status of FE nodes. Typically, you should verify the following:

   - Alive: If true, it indicates the node is alive.
   - Join: If true, it indicates the node has joined the cluster, but it doesn't necessarily mean the node is still active in the cluster (it may have lost connection).
   - IsMaster: If true, it indicates the current node is the Master node.

## Step 2: Deploy FE Cluster (Optional)

In a production cluster, it is recommended to deploy at least 3 Follower nodes. After deploying the FE Master node, you should deploy two additional FE Follower nodes.

1. Create Metadata Directory

   Follow the same steps as for deploying the FE Master node to create the `doris-meta` directory.

2. Modify FE Follower Node Configuration

   Modify the FE configuration file for the Follower node, following the same steps as for the FE Master node. Typically, you can simply copy the configuration file from the FE Master node.

3. Register New FE Follower Node in the Doris Cluster

   Before starting a new FE node, you need to register the new FE node in the FE cluster.

   ```Bash
   ## connect a alive FE node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
   
   ## registe a new FE follower node
   ALTER SYSTEM ADD FOLLOWER "<fe_ip_address>:<fe_edit_log_port>"
   ```

   If you want to add an observer node, you can use the `ADD OBSERVER` command:

   ```Bash
   ## register a new FE observer node
   ALTER SYSTEM ADD OBSERVER "<fe_ip_address>:<fe_edit_log_port>"
   ```

   :::caution Note
   - The number of FE Follower nodes (including Master) should be odd. It is recommended to deploy 3 nodes for high availability.

   - When FE is deployed in high availability mode (1 Master, 2 Followers), we recommend adding Observer FE nodes to extend the FE read service capacity.

   - Typically, one FE node can handle 10-20 BE nodes. It is recommended that the total number of FE nodes be kept below 10. 
   :::
4. Start FE Follower Node

   The FE Follower node can be started with the following command, which will automatically synchronize metadata.

   ```Shell
   bin/start_fe.sh --helper <helper_fe_ip>:<fe_edit_log_port> --daemon
   ```

   Here, helper_fe_ip refers to any live node in the current FE cluster. The --helper parameter is only used for the initial startup of FE to synchronize metadata. It is not required for subsequent restarts of the FE node.

5. Check Follower Node Status

   The method to check the FE Follower node status is the same as checking the FE Master node status. After adding and registering the FE Follower node, you need to use the `show frontends` command to check the FE node status. Unlike the Master status, the `IsMaster` state should be false.

## Step 3: Deploy BE Node

1. Create Data Directory

   The BE process is responsible for data computation and storage. The data directory is by default located under `be/storage`. In a production environment, it is common to use a separate disk for data storage and place BE data on a different disk from the BE deployment files. BE supports distributing data across multiple disks to better utilize the I/O capabilities of multiple hard drives.

   ```Bash
   ## Create a BE data storage directory on each data disk
   mkdir -p <be_storage_root_path>
   ```

2. Modify BE Configuration File

   The BE configuration file is located in the conf directory under the BE deployment path. Before starting the BE node, you need to modify the `conf/be.conf` file.

   ```Bash
   ## modify storage path for BE node
   
   storage_root_path=/home/disk1/doris,medium:HDD;/home/disk2/doris,medium:SSD
   
   ## modify network CIDR 
   
   priority_networks = 10.1.3.0/24
   
   ## modify Java Home in be/conf/be.conf
   
   JAVA_HOME = <your-java-home-path>
   ```

   Parameter explanations are as follows:

   | 参数                                                         | 修改建议                                                  |
   | ------------------------------------------------------------ | --------------------------------------------------------- |
   | [priority_networks](../../admin-manual/config/be-config#priority_networks) | Network CIDR, specified by network IP address. Can be ignored in FQDN environments. |
   | JAVA_OPTS                                                    | Set the `-Xmx` parameter to adjust the Java heap size. It is recommended to set it to 16GB or more for production environments.   |
   | JAVA_HOME                                                    | It is recommended to use a JDK environment that is independent of the operating system for Doris.               |

3. Register BE Node in Doris

   Before starting a new BE node, you need to register the new BE node in the FE cluster:

   ```Bash
   ## connect a alive FE node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
      
   ## registe BE node
   ALTER SYSTEM ADD BACKEND "<be_ip_address>:<be_heartbeat_service_port>"
   ```

4. Start BE Process

   The BE process can be started with the following command:

   ```Bash
   bin/start_be.sh --daemon
   ```

   The BE process starts and runs in the background. Logs are stored by default in the `log/` directory. If the startup fails, check the `log/be.log` or `log/be.out` files for error messages.

5. Check BE Startup Status

   After connecting to the Doris cluster, use the `show backends` command to check the BE node status.

   ```Bash
   ## connect a alive FE node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
      
   ## check BE node status
   show backends;
   ```

   Typically, pay attention to the following states:

   - `Alive` being true indicates that the node is alive.

   - `TabletNum` represents the number of shards on the node. Newly added nodes will undergo data balancing, and the `TabletNum` will gradually become more evenly distributed.


## Step 4: Verify Cluster Integrity

1. Log in to the Database

   Log in to the Doris cluster using the MySQL Client.

   ```Bash
   ## connect a alive fe node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
   ```

2. Check Doris Installation Information

   Use `show frontends` and `show backends` to view the status of each database instance.

   ```Sql
   -- check fe status
   show frontends \G  
        
   -- check be status  
   show backends \G
   ```

3. Change Doris Cluster Password

   When the Doris cluster is created, a user named `root` is automatically created, and its password is set to empty by default. For security reasons, it is recommended to set a new password for the `root` user immediately after the cluster is created.


   ```SQL
   -- check the current user
   select user();  
   +------------------------+  
   | user()                 |  
   +------------------------+  
   | 'root'@'192.168.88.30' |  
   +------------------------+  
        
   -- modify the password for current user
   SET PASSWORD = PASSWORD('doris_new_passwd');
   ```

4. Create a Test Table and Insert Data

   To verify the integrity of the cluster, you can create a test table in the newly created cluster and insert some data.

   ```SQL
   -- create a test database
   create database testdb;
    
   -- create a test table
   CREATE TABLE testdb.table_hash
   (
       k1 TINYINT,
       k2 DECIMAL(10, 2) DEFAULT "10.5",
       k3 VARCHAR(10) COMMENT "string column",
       k4 INT NOT NULL DEFAULT "1" COMMENT "int column"
   )
   COMMENT "my first table"
   DISTRIBUTED BY HASH(k1) BUCKETS 32;
   ```

   Doris is compatible with the MySQL protocol, and you can use the INSERT statement to insert data.

   ```SQL
   -- insert data
   INSERT INTO testdb.table_hash VALUES
   (1, 10.1, 'AAA', 10),
   (2, 10.2, 'BBB', 20),
   (3, 10.3, 'CCC', 30),
   (4, 10.4, 'DDD', 40),
   (5, 10.5, 'EEE', 50);
   
   -- check the data
   SELECT * from testdb.table_hash;
   +------+-------+------+------+
   | k1   | k2    | k3   | k4   |
   +------+-------+------+------+
   |    3 | 10.30 | CCC  |   30 |
   |    4 | 10.40 | DDD  |   40 |
   |    5 | 10.50 | EEE  |   50 |
   |    1 | 10.10 | AAA  |   10 |
   |    2 | 10.20 | BBB  |   20 |
   +------+-------+------+------+
   ```
