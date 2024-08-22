---
{
"title": "Use Workload Remote IO Limit",
"language": "zh-CN"
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

# Use Workload Group limit remote IO

BrokerLoad and S3Load are commonly used methods for importing large volumes of data. Users can first upload data to HDFS or S3 and then use BrokerLoad and S3Load for parallel data imports. To speed up the import process, Doris uses multithreading to pull data from HDFS/S3 in parallel. This can put significant pressure on HDFS/S3, potentially causing instability for other jobs running on HDFS/S3.

You can use the remote I/O limitation feature of Workload Groups to limit the bandwidth used during the import process, thereby reducing the impact on other operations.

## Test limit remote IO
### Test env
1FE,1BE(16 cores, 64G), test data is clickbench,Before testing, the dataset needs to be uploaded to S3. To save time, we will upload only 10 million rows of data, and then use the TVF (Table-Valued Function) feature to query the data from S3.

Show schema info after upload.
```
DESC FUNCTION s3 (
    "URI" = "https://bucketname/1kw.tsv",
    "s3.access_key"= "ak",
    "s3.secret_key" = "sk",
    "format" = "csv",
    "use_path_style"="true"
);
```

### Test not limit remote IO
1. Run query one by one.
```
// just scan, not return value.
set dry_run_query = true;

SELECT * FROM s3(
    "URI" = "https://bucketname/1kw.tsv",
    "s3.access_key"= "ak",
    "s3.secret_key" = "sk",
    "format" = "csv",
    "use_path_style"="true"
);
```

2. Show remote IO by system table,it's about 837M/s, It should be noted that the actual I/O throughput here is significantly affected by the environment. If the machine hosting the BE has a low bandwidth connection to external storage, the actual throughput may be lower.
```
MySQL [(none)]> select cast(REMOTE_SCAN_BYTES_PER_SECOND/1024/1024 as int) as read_mb from information_schema.workload_group_resource_usage;
+---------+
| read_mb |
+---------+
|     837 |
+---------+
1 row in set (0.104 sec)

MySQL [(none)]> select cast(REMOTE_SCAN_BYTES_PER_SECOND/1024/1024 as int) as read_mb from information_schema.workload_group_resource_usage;
+---------+
| read_mb |
+---------+
|     867 |
+---------+
1 row in set (0.070 sec)

MySQL [(none)]> select cast(REMOTE_SCAN_BYTES_PER_SECOND/1024/1024 as int) as read_mb from information_schema.workload_group_resource_usage;
+---------+
| read_mb |
+---------+
|     867 |
+---------+
1 row in set (0.186 sec)
```

3. Using sar(sar -n DEV 1 3600) to show network bandwidth of the machine, the max value is about 1033M/s.The first column of the output is the number of bytes received per second by a certain network card of the current machine, in KB per second.
   

![use workload group rio](/images/workload-management/use_wg_rio_1.png)

### Test limit remote IO
1. Alter workload group.
```
alter workload group normal properties('remote_read_bytes_per_second'='104857600');
```

2. Run query one by one.
```
// just scan not return.
set dry_run_query = true;


SELECT * FROM s3(
    "URI" = "https://bucketname/1kw.tsv",
    "s3.access_key"= "ak",
    "s3.secret_key" = "sk",
    "format" = "csv",
    "use_path_style"="true"
);
```

3. Use the system table to check the current remote read I/O throughput. At this moment, the I/O throughput is around 100M, with some fluctuation. This fluctuation is influenced by the current algorithm design and typically includes a peak, but it does not last long and is considered normal.
```
MySQL [(none)]> select cast(REMOTE_SCAN_BYTES_PER_SECOND/1024/1024 as int) as read_mb from information_schema.workload_group_resource_usage;
+---------+
| read_mb |
+---------+
|      56 |
+---------+
1 row in set (0.010 sec)

MySQL [(none)]> select cast(REMOTE_SCAN_BYTES_PER_SECOND/1024/1024 as int) as read_mb from information_schema.workload_group_resource_usage;
+---------+
| read_mb |
+---------+
|     131 |
+---------+
1 row in set (0.009 sec)

MySQL [(none)]> select cast(REMOTE_SCAN_BYTES_PER_SECOND/1024/1024 as int) as read_mb from information_schema.workload_group_resource_usage;
+---------+
| read_mb |
+---------+
|     111 |
+---------+
1 row in set (0.009 sec)
```

4. Using sar(sar -n DEV 1 3600) to show network bandwidth, the max IO is about 207M, This indicates that remote limit IO works. However, since the sar command shows machine-level traffic, the values may be higher than those reported by Doris.

![use workload group rio](/images/workload-management/use_wg_rio_2.png)
