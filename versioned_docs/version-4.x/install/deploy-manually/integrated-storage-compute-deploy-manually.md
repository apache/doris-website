---
{
    "title": "Manually Deploying an Integrated Storage-Compute Cluster",
    "sidebar_label": "Manually Deploying an Integrated Storage-Compute Cluster",
    "language": "en",
    "description": "How to manually deploy an Apache Doris integrated storage-compute cluster on Linux, including FE/BE node deployment, configuration, and verification. Suitable for production cluster setup.",
    "keywords": [
      "Deploy Doris",
      "Integrated storage-compute deployment",
      "FE node deployment",
      "BE node deployment",
      "Doris cluster setup",
      "Doris manual installation"
    ]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Cluster deployment / Environment acceptance -->

Deploying an integrated storage-compute cluster involves four steps:

1. **Deploy the FE Master node**: Deploy the first FE node as the Master node.
  
2. **Deploy the FE cluster (optional)**: Deploy the FE cluster by adding Follower or Observer FE nodes.
  
3. **Deploy BE nodes**: Register BE nodes with the FE cluster.

4. **Verify cluster correctness**: After deployment, connect to the cluster and verify its correctness.

Before starting deployment, you can [download](https://doris.apache.org/download) the corresponding Doris version.

## Prerequisites

Before starting deployment, confirm that the following conditions are met:

| Check item | Requirement | Related document |
|--------|------|---------|
| Operating system | CentOS 7+ / Ubuntu 22.04+ | [Operating system check](../preparation/os-checking.md) |
| JDK version | JDK 17+ | - |
| Network | Nodes can reach each other, ports are accessible | [Environment check](../preparation/env-checking.md) |
| Disk space | FE 100GB+ recommended, BE 500GB+ recommended | [Cluster planning](../preparation/cluster-planning.md) |

After completing the prerequisite checks and planning, such as [Environment check](../preparation/env-checking.md), [Operating system check](../preparation/os-checking.md), and [Cluster planning](../preparation/cluster-planning.md), you can begin deploying the integrated storage-compute cluster.


## Step 1: Deploy the FE Master node

1. **Create the metadata path**

   When deploying FE, it is recommended to store data on a different disk from the BE nodes.

   When the installation package is extracted, a default `doris-meta` directory is included. It is recommended to create a dedicated directory for metadata and symlink it to the default `doris-meta` directory. In production, use a dedicated SSD disk and avoid placing it under the Doris installation directory. In development and test environments, the default configuration is acceptable.

   ```SQL
   ## Use a separate disk for FE metadata
   mkdir -p <doris_meta_created>
      
   ## Create FE metadata directory symlink
   ln -s <doris_meta_created> <doris_meta_original>
   ```

2. **Modify the FE configuration file**

   The FE configuration file is located in the `conf` directory under the FE deployment path. Before starting an FE node, you need to modify `conf/fe.conf`.

    Before deploying an FE node, it is recommended to adjust the following configuration:

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

   Parameter descriptions are as follows. For more detailed configuration items, refer to [FE configuration items](../../admin-manual/config/fe-config):

   | Parameter                                                         | Recommendation                                                  |
   | ------------------------------------------------------------ | --------------------------------------------------------- |
   | JAVA_OPTS                                                    | Use `-Xmx` to adjust the Java Heap. 16G or more is recommended in production.   |
   | [lower_case_table_names ](../../admin-manual/config/fe-config#lower_case_table_names) | Sets case sensitivity. Setting it to 1 (case-insensitive) is recommended. (This parameter cannot be modified after the cluster is created.)            |
   | [priority_networks ](../../admin-manual/config/fe-config#priority_networks) | Network CIDR, specified based on the node's IP address. Can be ignored in an FQDN environment. |
   | JAVA_HOME                                                    | It is recommended that Doris use a JDK environment independent of the operating system.                |
   
3. **Start the FE process**

   Use the following command to start the FE process:

   ```Shell
   bin/start_fe.sh --daemon
   ```

   The FE process starts in the background, and logs are saved by default in the `log/` directory. If startup fails, check `log/fe.log` or `log/fe.out` for error messages.

4. **Check the FE startup status**

   Connect to the Doris cluster with the MySQL client. The initial user is `root`, and the default password is empty.

   ```SQL

   mysql -uroot -P<fe_query_port> -h<fe_ip_address>

   ```

   After connecting to the Doris cluster, you can check the FE status with the `show frontends` command. Typically, confirm the following:

   - Alive being `true` indicates the node is alive.

   - Join being `true` indicates the node has joined the cluster, but does not mean it is currently in the cluster (it may be disconnected).

   - IsMaster being true indicates that the current node is the Master node.

## Step 2: Deploy the FE cluster (optional)

A single FE node can be used for testing and verification. In production, it is recommended to deploy at least 3 nodes. After deploying the FE Master node, you need to deploy two more FE Follower nodes.

1. **Create the metadata directory**

   Refer to deploying the FE Master node to create the `doris-meta` directory.

2. **Modify the FE Follower configuration file**

   Refer to deploying the FE Master node to modify the FE Follower configuration file. Typically, you can copy the FE Master configuration file directly.

3. **Register the new FE Follower node in the Doris cluster**

   Before starting a new FE node, you need to register it in the FE cluster first.

   ```Bash
   ## connect a alive FE node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
   
   ## register a new FE follower node
   ALTER SYSTEM ADD FOLLOWER "<fe_ip_address>:<fe_edit_log_port>"
   ```

   To add an Observer node, use the `ADD OBSERVER` command:

   ```Bash
   ## register a new FE observer node
   ALTER SYSTEM ADD OBSERVER "<fe_ip_address>:<fe_edit_log_port>"
   ```

   :::caution Note
   - The number of FE Follower nodes (including the Master) should be odd. Deploying 3 nodes for high availability is recommended.

   - When FE is deployed in high-availability mode (1 Master, 2 Followers), it is recommended to add Observer FEs to scale out FE read capacity.
   :::

4. **Start the FE Follower node**

   Use the following command to start the FE Follower node and automatically synchronize metadata:

   ```Shell
   bin/start_fe.sh --helper <helper_fe_ip>:<fe_edit_log_port> --daemon
   ```

   Here, `helper_fe_ip` is the IP address of any alive node in the FE cluster. The `--helper` parameter is only required when starting the FE for the first time and is not needed for subsequent restarts.

5. **Check the Follower node status**

   The same as for the FE Master node: after adding a Follower node, check the node status with the `show frontends` command. IsMaster should be false.

## Step 3: Deploy BE nodes

1. **Create the data directory**

   The BE process is used for data computation and storage. The data directory is by default placed under `be/storage`. In production, BE data and BE deployment files are typically stored on different disks. BE supports distributing data across multiple disks to better utilize the I/O capacity of multiple disks.

   ```Bash
   ## Create a BE data storage directory on each data disk
   mkdir -p <be_storage_root_path>
   ```

2. **Modify the BE configuration file**

   The BE configuration file is located in the `conf` directory under the BE deployment path. Before starting a BE node, you need to modify `conf/be.conf`.

   ```Bash
   ## modify storage path for BE node
   storage_root_path=/home/disk1/doris,medium:HDD;/home/disk2/doris,medium:SSD
   
   ## modify network CIDR 
   priority_networks = 10.1.3.0/24
   
   ## modify Java Home in be/conf/be.conf
   JAVA_HOME = <your-java-home-path>
   ```
   
   Parameter descriptions are as follows:

   | Parameter                                                         | Recommendation                                                  |
   | ------------------------------------------------------------ | --------------------------------------------------------- |
   | [priority_networks](../../admin-manual/config/be-config#priority_networks) | Network CIDR, specified based on the node's IP address. Can be ignored in an FQDN environment. |
   | JAVA_OPTS                                                    | Use `-Xmx` to adjust the Java Heap. 2G or more is recommended in production.   |
   | JAVA_HOME                                                    | It is recommended that Doris use a JDK environment independent of the operating system.                |

3. **Register the BE node in Doris**

   Before starting a BE node, you need to register it in the FE cluster:

   ```Bash
   ## connect a alive FE node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
      
   ## register BE node
   ALTER SYSTEM ADD BACKEND "<be_ip_address>:<be_heartbeat_service_port>"
   ```

4. **Start the BE process**

   Use the following command to start the BE process:

   ```Bash
   bin/start_be.sh --daemon
   ```

   The BE process starts in the background, and logs are saved by default in the `log/` directory. If startup fails, check `log/be.log` or `log/be.out` for error messages.

5. **Check the BE startup status**

   After connecting to the Doris cluster, you can check the BE node status with the `show backends` command.

   ```Bash
   ## connect a alive FE node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
      
   ## check BE node status
   show backends;
   ```

   Typically, pay attention to the following:

   - Alive being true indicates the node is alive.

   - TabletNum indicates the number of tablets on the node. Newly added nodes go through data balancing, and TabletNum gradually approaches the average.

## Step 4: Verify cluster correctness

1. **Log in to the database**

   Log in to the Doris cluster with the MySQL client.

   ```Bash
   ## connect a alive fe node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
   ```

2. **Check Doris installation information**

   Use `show frontends` and `show backends` to view information about each instance in the database.
   
   ```SQL
   -- check fe status
   show frontends;

   -- check be status
   show backends;
   ```

3. **Modify the Doris cluster password**

   When a Doris cluster is created, the system automatically creates a user named `root` with an empty password by default. For better security, it is recommended to set a new password for the `root` user immediately after the cluster is created.

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

4. **Create a test table and insert data**

   To verify cluster correctness, you can create a test table in the newly created cluster and insert test data.

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

   Doris is compatible with the MySQL protocol, so you can use `INSERT` statements to insert data.

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

---

## Notes

- It is recommended to use a dedicated SSD disk for the FE metadata directory. Avoid placing it under the Doris installation directory.
- The BE data directory can be configured across multiple disks using the `storage_root_path` parameter, in the format `path1,medium:HDD;path2,medium:SSD`.
- In production, it is recommended to deploy 3 FE Follower nodes for high availability.
- The `lower_case_table_names` parameter cannot be modified after the cluster is created. Confirm the setting at initialization.
- The `priority_networks` parameter must be configured according to the actual network so that it matches the subnet of the node's IP.

## Frequently Asked Questions

### Q: How do I troubleshoot FE startup failures?

1. Check the Java environment: run `echo $JAVA_HOME` to confirm that the JDK is installed.
2. Check the logs: run `tail -100 log/fe.log` and look for `Exception` or `ERROR`.
3. Common errors:
   - **Port already in use**: check whether `query_port` (default 9030) in `fe.conf` is already in use.
   - **Metadata directory permissions**: make sure the `doris-meta` directory is readable and writable.

### Q: What should I do if a BE cannot register with the FE cluster?

1. Confirm the FE cluster is running normally: run `show frontends` to check the Alive status.
2. Check network connectivity: run `telnet <fe_ip> 9030` to test the port.
3. Check the BE configuration: verify whether `priority_networks` in `be.conf` matches the actual IP.
4. Check the BE log: run `tail -100 log/be.log` to find the cause of the registration failure.

### Q: How do I check cluster health?

```SQL
-- Check FE status
SHOW FRONTENDS;

-- Check BE status
SHOW BACKENDS;
-- Confirm that Alive is true for all BEs
```

### Q: How do I reset the password if I forget the root password?

On the FE node, connect via 127.0.0.1 to log in as root without a password, then change the password:

```Bash
mysql -h127.0.0.1 -P9030 -uroot

-- Reset password
SET PASSWORD = PASSWORD('your_new_password');
```

---

## Troubleshooting

| Symptom | Possible cause | Solution |
|---------|---------|---------|
| FE cannot start | Port already in use | Modify the port in `fe.conf` or kill the process using it |
| FE metadata sync fails | Network issue or node disconnected | Check the network between nodes and ensure `priority_networks` is configured correctly |
| BE registration fails | FE cluster not available | Confirm that at least one FE node is Alive |
| BE shows Alive but has no Tablet | Data balancing not finished | Wait for a while; the new node will perform data balancing automatically |
| Password change fails | Syntax error or permission issue | Use the syntax `SET PASSWORD = PASSWORD('new_password')` |
