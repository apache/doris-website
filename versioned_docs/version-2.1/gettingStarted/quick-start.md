---
{
    "title": "Quick Start",
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
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

:::caution Warning:

Quick deployment **is only suitable for local development**. Do not use this deployment method in production environments:

1. When deploying quickly using Docker, data will be released when the Docker instance is destroyed.

2. Deploying a single-instance Doris manually does not have data replication capability, and a single machine failure may result in data loss.

3. The tables created in this example are single-instance. In production, please use multi-replica storage for data.
:::

## Use Docker for Quick Deployment

### Step 1: Create the docker-compose.yaml File

Copy the following content into the docker-compose.yaml file, and replace the `DORIS_QUICK_START_VERSION` parameter with the specified version, such as `2.1.7`.

```text
version: "3"
services:
  fe:
    image: apache/doris.fe-ubuntu:${DORIS_QUICK_START_VERSION}
    hostname: fe
    environment:
     - FE_SERVERS=fe1:127.0.0.1:9010
     - FE_ID=1
    network_mode: host
  be:
    image: apache/doris.be-ubuntu:${DORIS_QUICK_START_VERSION}
    hostname: be
    environment:
     - FE_SERVERS=fe1:127.0.0.1:9010
     - BE_ADDR=127.0.0.1:9050
    depends_on:
      - fe
    network_mode: host
```

### Step 2: Start Cluster

Start the cluster using the docker-compose command.

```shell
docker-compose -f ./docker-compose.yaml up -d
```

### Step 3: Connect to the cluster using MySQL client and check the cluster status

```sql
## Check the FE status to ensure that both the Join and Alive columns are true.
mysql -uroot -P9030 -h127.0.0.1 -e 'SELECT `host`, `join`, `alive` FROM frontends()'
+-----------+------+-------+
| host      | join | alive |
+-----------+------+-------+
| 127.0.0.1 | true | true  |
+-----------+------+-------+

## Check the BE status to ensure that the Alive column is true.
mysql -uroot -P9030 -h127.0.0.1 -e 'SELECT `host`, `alive` FROM backends()'
+-----------+-------+
| host      | alive |
+-----------+-------+
| 127.0.0.1 |     1 |
+-----------+-------+

```



## Local Quick Deployment

:::info Environment Recommendations:

* Choose a mainstream Linux environment on AMD/ARM, preferably CentOS 7.1 or Ubuntu 16.04 and above. For more supported environments, refer to the installation and deployment section.

* Java 8 runtime environment (for non-Oracle JDK commercial license users, it is recommended to use the free Oracle JDK 8u300 or later versions, [Download Now](https://www.oracle.com/java/technologies/javase/javase8-archive-downloads.html#license-lightbox)).

* It is recommended to create a new Doris user on Linux. Avoid using the root user to prevent accidental system operation errors.

:::

### Step 1: Download the Binary Package

Download the corresponding binary installation package from the Apache Doris website [here](https://doris.apache.org/en-us/download), and extract it.

### Step 2: Modify the Environment Variables

1. Modify the system's maximum open file descriptor limit

   Use the following command to adjust the maximum file descriptor limit. After making this change, you need to restart the session to apply the configuration:



   ```sql
   vi /etc/security/limits.conf 
   * soft nofile 1000000
   * hard nofile 1000000
   ```

2. Modify Virtual Memory Area

   Use the following command to permanently modify the virtual memory area to at least 2000000, and apply the change immediately:

   ```bash
   cat >> /etc/sysctl.conf << EOF
   vm.max_map_count = 2000000
   EOF

   Take effect immediately
   sysctl -p
   ```

### Step 3: Install FE

1. Configure FE

   Modify the following contents in the FE configuration file `apache-doris/fe/conf/fe.conf`:

   ```sql
   ## Specify Java environment
   JAVA_HOME=/home/doris/jdk

   ## Specify the CIDR block for FE listening IP
   priority_networks=127.0.0.1/32
   ```

2. Start FE

   Run the FE process by executing the start_fe.sh script:

   ```sql
   apache-doris/fe/bin/start_fe.sh --daemon
   ```

3. Check FE Status

   Connect to the cluster using MySQL client and check the cluster status:

   ```sql
   ## Check FE Status to ensure that both the Join and Alive columns are true
   mysql -uroot -P9030 -h127.0.0.1 -e "show frontends;"
   +-----------------------------------------+-----------+-------------+----------+-----------+---------+----------+----------+-----------+------+-------+-------------------+---------------------+----------+--------+-------------------------+------------------+
   | Name                                    | Host      | EditLogPort | HttpPort | QueryPort | RpcPort | Role     | IsMaster | ClusterId | Join | Alive | ReplayedJournalId | LastHeartbeat       | IsHelper | ErrMsg | Version                 | CurrentConnected |
   +-----------------------------------------+-----------+-------------+----------+-----------+---------+----------+----------+-----------+------+-------+-------------------+---------------------+----------+--------+-------------------------+------------------+
   | fe_9d0169c5_b01f_478c_96ab_7c4e8602ec57 | 127.0.0.1 | 9010        | 8030     | 9030      | 9020    | FOLLOWER | true     | 656872880 | true | true  | 276               | 2024-07-28 18:07:39 | true     |        | doris-2.0.12-2971efd194 | Yes              |
   +-----------------------------------------+-----------+-------------+----------+-----------+---------+----------+----------+-----------+------+-------+-------------------+---------------------+----------+--------+-------------------------+------------------+
   ```

### Step 4: Install BE

1. Configure BE

   Modify the following contents in the BE configuration file `apache-doris/be/conf/be.conf`:

   ```sql
   ## Specify Java environment
   JAVA_HOME=/home/doris/jdk

   ## Specify the CIDR block for BE's listening IP
   priority_networks=127.0.0.1/32
   ```

2. Start BE

   Start the BE process with the following command:

   ```sql
   apache-doris/fe/bin/start_be.sh --daemon
   ```

3. Register BE Node in the Cluster

   Connect to the cluster using MySQL client:

   ```sql
   mysql -uroot -P9030 -h127.0.0.1
   ```

   Use the ADD BACKEND command to register the BE node:

   ```sql
   ALTER SYSTEM ADD BACKEND "127.0.0.1:9050";
   ```

4. Check BE Status

   Connect to the cluster using MySQL client and check the cluster status:

   ```sql
   ## Check BE Status to ensure that the Alive column is true
   mysql -uroot -P9030 -h127.0.0.1 -e "show backends;"
   +-----------+-----------+---------------+--------+----------+----------+---------------------+---------------------+-------+----------------------+-----------+------------------+--------------------+---------------+---------------+---------+----------------+--------------------+--------------------------+--------+-------------------------+-------------------------------------------------------------------------------------------------------------------------------+-------------------------+----------+
   | BackendId | Host      | HeartbeatPort | BePort | HttpPort | BrpcPort | LastStartTime       | LastHeartbeat       | Alive | SystemDecommissioned | TabletNum | DataUsedCapacity | TrashUsedCapcacity | AvailCapacity | TotalCapacity | UsedPct | MaxDiskUsedPct | RemoteUsedCapacity | Tag                      | ErrMsg | Version                 | Status                                                                                                                        | HeartbeatFailureCounter | NodeRole |
   +-----------+-----------+---------------+--------+----------+----------+---------------------+---------------------+-------+----------------------+-----------+------------------+--------------------+---------------+---------------+---------+----------------+--------------------+--------------------------+--------+-------------------------+-------------------------------------------------------------------------------------------------------------------------------+-------------------------+----------+
   | 10156     | 127.0.0.1 | 9050          | 9060   | 8040     | 8060     | 2024-07-28 17:59:14 | 2024-07-28 18:08:24 | true  | false                | 14        | 0.000            | 0.000              | 8.342 GB      | 19.560 GB     | 57.35 % | 57.35 %        | 0.000              | {"location" : "default"} |        | doris-2.0.12-2971efd194 | {"lastSuccessReportTabletsTime":"2024-07-28 18:08:14","lastStreamLoadTime":-1,"isQueryDisabled":false,"isLoadDisabled":false} | 0                       | mix      |
   +-----------+-----------+---------------+--------+----------+----------+---------------------+---------------------+-------+----------------------+-----------+------------------+--------------------+---------------+---------------+---------+----------------+--------------------+--------------------------+--------+-------------------------+-------------------------------------------------------------------------------------------------------------------------------+-------------------------+----------+
   ```

## Run Queries

1. Connect to the cluster using MySQL client:

   ```sql
   mysql -uroot -P9030 -h127.0.0.1
   ```

2. Create database and test table:

   ```sql
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
   DISTRIBUTED BY HASH(k1) BUCKETS 1;
   ```

3. Import test data:

   Insert test data using the Insert Into statement

   ```sql
   insert into mytable values
   (1,0.14,'a1',20),
   (2,1.04,'b2',21),
   (3,3.14,'c3',22),
   (4,4.35,'d4',23);
   ```

4. Execute the following SQL query in the MySQL client to view the imported data:

   ```sql
   MySQL [demo]> select * from demo.mytable;
   +------+------+------+------+
   | k1   | k2   | k3   | k4   |
   +------+------+------+------+
   |    1 | 0.14 | a1   |   20 |
   |    2 | 1.04 | b2   |   21 |
   |    3 | 3.14 | c3   |   22 |
   |    4 | 4.35 | d4   |   23 |
   +------+------+------+------+
   4 rows in set (0.10 sec)
   ```





