---
{
    "title": "Deploy Integrated Storage Compute Cluster Manually",
    "language": "en",
    "description": "After completing the preliminary checks and planning, such as environment checks, cluster planning, and operating system inspections,"
}
---

After completing the preliminary checks and planning, such as environment checks, cluster planning, and operating system inspections, you can begin deploying the cluster.

The integrated storage-compute architecture is shown below, and the deployment of the integrated storage-compute cluster involves four steps:

[MPP-based integrated storage compute architecture](/images/getting-started/apache-doris-technical-overview.png)

1. **Deploy FE Master Node**: Deploy the first FE node as the Master node;
   
2. **Deploy FE Cluster**: Deploy the FE cluster by adding Follower or Observer FE nodes;
   
3. **Deploy BE Nodes**: Register BE nodes to the FE cluster;
   
4. **Verify Cluster Correctness**: After deployment, connect to and verify the cluster's correctness.

## Step 1: Deploy FE Master Node

1. **Create Metadata Path**

   When deploying FE, it is recommended to store metadata on a different hard drive from the BE node data storage.

   When extracting the installation package, a doris-meta directory is included by default. It is recommended to create a separate metadata directory and link it to the doris-meta directory. In production, it's highly advised to use a separate directory outside the Doris installation folder, preferably on an SSD. For testing and development environments, you can use the default configuration.
   
   ```sql
   ## Use a separate disk for FE metadata
   mkdir -p <doris_meta_created>
      
   ## Create FE metadata directory symlink
   ln -s <doris_meta_created> <doris_meta_original>
   ```

2. **Modify FE Configuration File**

   The FE configuration file is located in the conf directory under the FE deployment path. Before starting the FE node, modify the `conf/fe.conf` file..

   Before deploying the FE node, it is recommended to modify the following configurations:

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
   
   Parameter Descriptions: For more details, refer to the [FE Configuration](../../admin-manual/config/fe-config)：

   | Parameter                                                    | Suggestion                                                 |
   | ------------------------------------------------------------ | --------------------------------------------------------- |
   | JAVA_OPTS                                                    | Specify the `-Xmx` parameter to adjust the Java Heap. It is recommended to set it to above 16G in production environments.   |
   | [lower_case_table_names ](../../admin-manual/config/fe-config#lower_case_table_names) | Set case sensitivity. It is recommended to adjust it to 1, meaning case-insensitive.            |
   | [priority_networks ](../../admin-manual/config/fe-config#priority_networks) | Network CIDR is specified based on the network IP address. It can be ignored in an FQDN environment. |
   | JAVA_HOME                                                    | It is recommended to use a JDK environment independent of the operating system for Doris.                |
   
3. **Start FE Process**

   You can start the FE process using the following command:

   ```Shell
   bin/start_fe.sh --daemon
   ```

   The FE process will start and run in the background. By default, logs are stored in the log/ directory. If the startup fails, you can check the log/fe.log or log/fe.out files for error details.

4. **Check FE Startup Status**

   You can connect to the Doris cluster using MySQL Client. The default user is root, and the password is empty.

   ```sql
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
   ```

   After connecting to the Doris cluster, you can use the `show frontends` command to check the status of FE nodes. Typically, you should verify the following:

   - Alive: If true, it indicates the node is alive.

   - Join: If true, it indicates the node has joined the cluster, but it doesn't necessarily mean the node is still active in the cluster (it may have lost connection).

   - IsMaster: If true, it indicates the current node is the Master node.

## Step 2: Deploy FE Cluster (Optional)

In production, it is recommended to deploy at least 3 nodes. After deploying the FE Master node, you should deploy two additional FE Follower nodes.

1. **Create Metadata Directory**

   Follow the same steps as for deploying the FE Master node to create the `doris-meta` directory.

2. **Modify FE Follower Node Configuration**

   Modify the FE configuration file for the Follower node, following the same steps as for the FE Master node. Typically, you can simply copy the configuration file from the FE Master node.

3. **Register New FE Follower Node in the Doris Cluster**

   Before starting a new FE node, you need to register the new FE node in the FE cluster.

   ```Bash
   ## connect a alive FE node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
   
   ## register a new FE follower node
   ALTER SYSTEM ADD FOLLOWER "<fe_ip_address>:<fe_edit_log_port>"
   ```

   To add an observer node, use the `ADD OBSERVER` command:

   ```Bash
   ## register a new FE observer node
   ALTER SYSTEM ADD OBSERVER "<fe_ip_address>:<fe_edit_log_port>"
   ```

   :::caution Note
   - The number of FE Follower nodes (including Master) should be odd. It is recommended to deploy 3 nodes for high availability.

   - When FE is deployed in high availability mode (1 Master, 2 Followers), we recommend adding Observer FE nodes to extend the FE read service capacity.
   :::

4. **Start FE Follower Node**

   The FE Follower node can be started with the following command, which will automatically synchronize metadata.

   ```Shell
   bin/start_fe.sh --helper <helper_fe_ip>:<fe_edit_log_port> --daemon
   ```

   Here, helper_fe_ip refers to any live node in the FE cluster. The --helper parameter is used only during the initial startup of FE to synchronize metadata; subsequent restarts do not require this parameter.

5. **Check Follower Node Status**

   The method for checking the FE Follower node status is the same as for the FE Master node status. After adding the Follower node, use the show frontendscommand to check the FE node status. Unlike the Master, theIsMaster state should be false.

## Step 3: Deploy BE Node

1. **Create Data Directory**

   The BE process is responsible for data computation and storage. The data directory is by default located under `be/storage`. In a production environment, it is common to store BE data on a separate disk, placing the BE data and deployment files on different disks. BE supports distributing data across multiple disks to better utilize the I/O capabilities of multiple hard drives.

   ```Bash
   ## Create a BE data storage directory on each data disk
   mkdir -p <be_storage_root_path>
   ```

2. **Modify BE Configuration File**

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

   | Parameters                                                         | Suggestions                                                  |
   | ------------------------------------------------------------ | --------------------------------------------------------- |
   | [priority_networks](../../admin-manual/config/be-config#priority_networks) | Network CIDR, specified by network IP address. Can be ignored in FQDN environments. |
   | JAVA_OPTS                                                    | Set the `-Xmx` parameter to adjust the Java heap size. It is recommended to set it to 2GB or more for production environments.   |
   | JAVA_HOME                                                    | It is recommended to use a JDK environment that is independent of the operating system for Doris.               |

3. **Register BE Node in Doris**

   Before starting the BE node, register it in the FE cluster:

   ```Bash
   ## connect a alive FE node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
      
   ## Register BE node
   ALTER SYSTEM ADD BACKEND "<be_ip_address>:<be_heartbeat_service_port>"
   ```

4. **Start BE Process**

   The BE process can be started with the following command:

   ```Bash
   bin/start_be.sh --daemon
   ```

   The BE process starts and runs in the background. Logs are stored by default in the `log/` directory. If the startup fails, check the `log/be.log` or `log/be.out` files for error information.

5. **Check BE Startup Status**

   After connecting to the Doris cluster, use the show backends command to check the BE node status.

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

1. **Log in to the Database**

   Log in to the Doris cluster using the MySQL Client.

   ```Bash
   ## connect a alive fe node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
   ```

2. **Check Doris Installation Information**

   Use `show frontends` and `show backends` to view the status of each database instance.

   ```Sql
   -- check fe status
   show frontends \G  
        
   -- check be status  
   show backends \G
   ```

3. **Change Doris Cluster Password**

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

4. **Create a Test Table and Insert Data**

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
