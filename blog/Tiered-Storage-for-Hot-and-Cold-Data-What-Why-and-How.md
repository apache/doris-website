---
{
    'title': 'Tiered storage for hot and cold data: what, why, and how?',
    'description': "Hot data is the frequently accessed data, while cold data is the one you seldom visit but still need. Separating them is for higher efficiency in computation and storage.",
    'date': '2023-06-23',
    'author': 'Apache Doris',
    'tags': ['Tech Sharing'],
    "image": '/images/tiered-storage-for-hot-and-cold-cata.jpg'
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

Apparently tiered storage is hot now. But first of all:

## What is Hot/Cold Data?

In simple terms, hot data is the frequently accessed data, while cold data is the one you seldom visit but still need. Normally in data analytics, data is "hot" when it is new, and gets "colder" and "colder" as time goes by. 

For example, orders of the past six months are "hot" and logs from years ago are "cold". But no matter how cold the logs are, you still need them to be somewhere you can find.  

## Why Separate Hot and Cold Data? 

Tiered storage is an idea often seen in real life: You put your favorite book on your bedside table, your Christmas ornament in the attic, and your childhood art project in the garage or a cheap self-storage space on the other side of town. The purpose is a tidy and efficient life.

Similarly, companies separate hot and cold data for more efficient computation and more cost-effective storage, because storage that allows quick read/write is always expensive, like SSD. On the other hand, HDD is cheaper but slower. So it is more sensible to put hot data on SSD and cold data on HDD. If you are looking for an even lower-cost option, you can go for object storage.

In data analytics, tiered storage is implemented by a tiered storage mechanism in the database. For example, Apache Doris supports three-tiered storage: SSD, HDD, and object storage. For newly ingested data, after a specified cooldown period, it will turn from hot data into cold data and be moved to object storage. In addition, object storage only preserves one copy of data, which further cuts down storage costs and the relevant computation/network overheads.

![tiered-storage](/images/HCDS_1.png)

How much can you save by tiered storage? Here is some math.

In public cloud services, cloud disks generally cost 5~10 times as much as object storage. If 80% of your data asset is cold data and you put it in object storage instead of cloud disks, you can expect a cost reduction of around 70%.

Let the percentage of cold data be "rate", the price of object storage be "OS", and the price of cloud disk be "CloudDisk", this is how much you can save by tiered storage instead of putting all your data on cloud disks: 

![cost-calculation-of-tiered-storage](/images/HCDS_2.png)

Now let's put real-world numbers in this formula: 

AWS pricing, US East (Ohio):

- **S3 Standard Storage**: 23 USD per TB per month
- **Throughput Optimized HDD (st 1)**: 102 USD per TB per month
- **General Purpose SSD (gp2)**: 158 USD per TB per month

![cost-reduction-by-tiered-storage](/images/HCDS_3.png)

## How Is Tiered Storage Implemented?

Till now, hot-cold separation sounds nice, but the biggest concern is: how can we implement it without compromising query performance? This can be broken down to three questions:

- How to enable quick reading of cold data?
- How to ensure high availability of data?
- How to reduce I/O and CPU overheads?

In what follows, I will show you how Apache Doris addresses them one by one.

### Quick Reading of Cold Data

Accessing cold data from object storage will indeed be slow. One solution is to cache cold data in local disks for use in queries. In Apache Doris 2.0, when a query requests cold data, only the first-time access will entail a full network I/O operation from object storage. Subsequent queries will be able to read data directly from local cache.

The granularity of caching matters, too. A coarse granularity might lead to a waste of cache space, but a fine granularity could be the reason for low I/O efficiency. Apache Doris bases its caching on data blocks. It downloads cold data blocks from object storage onto local Block Cache. This is the "pre-heating" process. With cold data fully pre-heated, queries on tables with tiered storage will be basically as fast as those on tablets without. We drew this conclusion from test results on Apache Doris:

![query-performance-with-tiered-storage](/images/HCDS_4.png)

- ***Test Data****: SSB SF100 dataset*
- ***Configuration****: 3 × 16C 64G, a cluster of 1 frontend and 3 backends* 

P.S. Block Cache adopts the LRU algorithm, so the more frequently accessed data will stay in Block Cache for longer.

### High Availability of Data

In object storage, only one copy of cold data is preserved. Within Apache Doris, hot data and metadata are put in the backend nodes, and there are multiple replicas of them across different backend nodes in order to ensure high data availability. These replicas are called "local replicas". The metadata of cold data is synchronized to all local replicas, so that Doris can ensure high availability of cold data without using too much storage space.

Implementation-wise, the Doris frontend picks a local replica as the Leader. Updates to the Leader will be synchronized to all other local replicas via a regular report mechanism. Also, as the Leader uploads data to object storage, the relevant metadata will be updated to other local replicas, too.

![data-availability-with-tiered-storage](/images/HCDS_5.png)

### Reduced I/O and CPU Overhead

This is realized by cold data [compaction](https://medium.com/gitconnected/understanding-data-compaction-in-3-minutes-d2b5a1f7446f). Some scenarios require large-scale update of historical data. In this case, part of the cold data in object storage should be deleted. Apache Doris 2.0 supports cold data compaction, which ensures that the updated cold data will be reorganized and compacted, so that it will take up storage space.

A thread in Doris backend will regularly pick N tablets from the cold data and start compaction. Every tablet has a CooldownReplica and only the CooldownReplica will execute cold data compaction for the tablet. Every time 5MB of data is compacted, it will be uploaded to object storage to clear up space locally. Once the compaction is done, the CooldownReplica will update the new metadata to object storage. Other replicas only need to synchronize the metadata from object storage. This is how I/O and CPU overheads are reduced.

## Tutorial

Separating tiered storage in storage is a huge cost saver and there have been ways to ensure the same fast query performance. Executing hot-cold data separation is a simple 6-step process, so you can find out how it works yourself:



To begin with, you need **an object storage bucket** and the relevant **Access Key (AK)** and **Secret Access Key (SK)**.

Then you can start cold/hot data separation by following these six steps.

### 1. Create Resource

You can create a resource using the object storage bucket with the AK and  SK. Apache Doris supports object storage on various cloud service  providers including AWS, Azure, and Alibaba Cloud.

```
CREATE RESOURCE IF NOT EXISTS "${resource_name}"
        PROPERTIES(
            "type"="s3",
            "s3.endpoint" = "${S3Endpoint}",
            "s3.region" = "${S3Region}",
            "s3.root.path" = "path/to/root",
            "s3.access_key" = "${S3AK}",
            "s3.secret_key" = "${S3SK}",
            "s3.connection.maximum" = "50",
            "s3.connection.request.timeout" = "3000",
            "s3.connection.timeout" = "1000",
            "s3.bucket" = "${S3BucketName}"
        );
```

###  2. Create Storage Policy

With the Storage Policy, you can specify the cooling-down period of data  (including absolute cooling-down period and relative cooling-down  period).

```
CREATE STORAGE POLICY testPolicy
PROPERTIES(
  "storage_resource" = "remote_s3",
  "cooldown_ttl" = "1d"
);
```

In the above snippet, the Storage Policy is named `testPolicy`, and data will start to cool down one day after it is ingested. The cold data will be moved under the `root path` of the object storage `remote_s3`. Apart from setting the TTL, you can also specify the timepoint when the cooling down starts.

```
CREATE STORAGE POLICY testPolicyForTTlDatatime
PROPERTIES(
  "storage_resource" = "remote_s3",
  "cooldown_datetime" = "2023-06-07 21:00:00"
);
```

### 3. Specify Storage Policy for a Table/Partition

With an established Resource and a Storage Policy, you can set a Storage Policy for a data table or a specific data partition.

The following snippet uses the lineitem table in the TPC-H dataset as an  example. To set a Storage Policy for the whole table, specify the  PROPERTIES as follows:

```
CREATE TABLE IF NOT EXISTS lineitem1 (
            L_ORDERKEY    INTEGER NOT NULL,
            L_PARTKEY     INTEGER NOT NULL,
            L_SUPPKEY     INTEGER NOT NULL,
            L_LINENUMBER  INTEGER NOT NULL,
            L_QUANTITY    DECIMAL(15,2) NOT NULL,
            L_EXTENDEDPRICE  DECIMAL(15,2) NOT NULL,
            L_DISCOUNT    DECIMAL(15,2) NOT NULL,
            L_TAX         DECIMAL(15,2) NOT NULL,
            L_RETURNFLAG  CHAR(1) NOT NULL,
            L_LINESTATUS  CHAR(1) NOT NULL,
            L_SHIPDATE    DATEV2 NOT NULL,
            L_COMMITDATE  DATEV2 NOT NULL,
            L_RECEIPTDATE DATEV2 NOT NULL,
            L_SHIPINSTRUCT CHAR(25) NOT NULL,
            L_SHIPMODE     CHAR(10) NOT NULL,
            L_COMMENT      VARCHAR(44) NOT NULL
            )
            DUPLICATE KEY(L_ORDERKEY, L_PARTKEY, L_SUPPKEY, L_LINENUMBER)
            PARTITION BY RANGE(`L_SHIPDATE`)
            (
                PARTITION `p202301` VALUES LESS THAN ("2017-02-01"),
                PARTITION `p202302` VALUES LESS THAN ("2017-03-01")
            )
            DISTRIBUTED BY HASH(L_ORDERKEY) BUCKETS 3
            PROPERTIES (
            "replication_num" = "3",
            "storage_policy" = "${policy_name}"
            )
```

You can check the Storage Policy of a tablet via the `show tablets` command. If the `CooldownReplicaId` is anything rather than `-1` and the `CooldownMetaId` is not null, that means the current tablet has been specified with a Storage Policy.

```
               TabletId: 3674797
              ReplicaId: 3674799
              BackendId: 10162
             SchemaHash: 513232100
                Version: 1
      LstSuccessVersion: 1
       LstFailedVersion: -1
          LstFailedTime: NULL
          LocalDataSize: 0
         RemoteDataSize: 0
               RowCount: 0
                  State: NORMAL
LstConsistencyCheckTime: NULL
           CheckVersion: -1
           VersionCount: 1
              QueryHits: 0
               PathHash: 8030511811695924097
                MetaUrl: http://172.16.0.16:6781/api/meta/header/3674797
       CompactionStatus: http://172.16.0.16:6781/api/compaction/show?tablet_id=3674797
      CooldownReplicaId: 3674799
         CooldownMetaId: TUniqueId(hi:-8987737979209762207, lo:-2847426088899160152)
```

To set a Storage Policy for a specific partition, add the policy name to the partition PROPERTIES as follows:

```
CREATE TABLE IF NOT EXISTS lineitem1 (
            L_ORDERKEY    INTEGER NOT NULL,
            L_PARTKEY     INTEGER NOT NULL,
            L_SUPPKEY     INTEGER NOT NULL,
            L_LINENUMBER  INTEGER NOT NULL,
            L_QUANTITY    DECIMAL(15,2) NOT NULL,
            L_EXTENDEDPRICE  DECIMAL(15,2) NOT NULL,
            L_DISCOUNT    DECIMAL(15,2) NOT NULL,
            L_TAX         DECIMAL(15,2) NOT NULL,
            L_RETURNFLAG  CHAR(1) NOT NULL,
            L_LINESTATUS  CHAR(1) NOT NULL,
            L_SHIPDATE    DATEV2 NOT NULL,
            L_COMMITDATE  DATEV2 NOT NULL,
            L_RECEIPTDATE DATEV2 NOT NULL,
            L_SHIPINSTRUCT CHAR(25) NOT NULL,
            L_SHIPMODE     CHAR(10) NOT NULL,
            L_COMMENT      VARCHAR(44) NOT NULL
            )
            DUPLICATE KEY(L_ORDERKEY, L_PARTKEY, L_SUPPKEY, L_LINENUMBER)
            PARTITION BY RANGE(`L_SHIPDATE`)
            (
                PARTITION `p202301` VALUES LESS THAN ("2017-02-01") ("storage_policy" = "${policy_name}"),
                PARTITION `p202302` VALUES LESS THAN ("2017-03-01")
            )
            DISTRIBUTED BY HASH(L_ORDERKEY) BUCKETS 3
            PROPERTIES (
            "replication_num" = "3"
            )
```

**This is how you can confirm that only the target partition is set with a Storage Policy:**

In the above example, Table Lineitem1 has 2 partitions, each partition has 3 buckets, and `replication_num` is set to "3". That means there are 2*3 = 6 tablets and 6*3 = 18 replicas in total.

Now, if you check the replica information of all tablets via the `show tablets` command, you will see that only the replicas of tablets of the target  partion have a CooldownReplicaId and a CooldownMetaId. (For a clear  comparison, you can check replica information of a specific partition  via the `ADMIN SHOW REPLICA STATUS FROM TABLE PARTITION(PARTITION)` command.)

For instance, Tablet 3691990 belongs to Partition p202301, which is the  target partition, so the 3 replicas of this tablet have a  CooldownReplicaId and a CooldownMetaId:

```
*****************************************************************
               TabletId: 3691990
              ReplicaId: 3691991
      CooldownReplicaId: 3691993
         CooldownMetaId: TUniqueId(hi:-7401335798601697108, lo:3253711199097733258)
*****************************************************************
               TabletId: 3691990
              ReplicaId: 3691992
      CooldownReplicaId: 3691993
         CooldownMetaId: TUniqueId(hi:-7401335798601697108, lo:3253711199097733258)
*****************************************************************
               TabletId: 3691990
              ReplicaId: 3691993
      CooldownReplicaId: 3691993
         CooldownMetaId: TUniqueId(hi:-7401335798601697108, lo:3253711199097733258)
```

Also, the above snippet means that all these 3 replicas have been specified  with the same CooldownReplica: 3691993, so only the data in Replica  3691993 will be stored in the Resource.

### 4. View Tablet Details

You can view the detailed information of Table Lineitem1 via a `show tablets from lineitem1` command. Among all the properties, `LocalDataSize` represents the size of locally stored data and `RemoteDataSize` represents the size of cold data in object storage.

For example, when the data is newly ingested into the Doris backends, you can see that all data is stored locally.

```
*************************** 1. row ***************************
               TabletId: 2749703
              ReplicaId: 2749704
              BackendId: 10090
             SchemaHash: 1159194262
                Version: 3
      LstSuccessVersion: 3
       LstFailedVersion: -1
          LstFailedTime: NULL
          LocalDataSize: 73001235
         RemoteDataSize: 0
               RowCount: 1996567
                  State: NORMAL
LstConsistencyCheckTime: NULL
           CheckVersion: -1
           VersionCount: 3
              QueryHits: 0
               PathHash: -8567514893400420464
                MetaUrl: http://172.16.0.8:6781/api/meta/header/2749703
       CompactionStatus: http://172.16.0.8:6781/api/compaction/show?tablet_id=2749703
      CooldownReplicaId: 2749704
         CooldownMetaId:
```

When the data has cooled down, you will see that the data has been moved to remote object storage.

```
*************************** 1. row ***************************
               TabletId: 2749703
              ReplicaId: 2749704
              BackendId: 10090
             SchemaHash: 1159194262
                Version: 3
      LstSuccessVersion: 3
       LstFailedVersion: -1
          LstFailedTime: NULL
          LocalDataSize: 0
         RemoteDataSize: 73001235
               RowCount: 1996567
                  State: NORMAL
LstConsistencyCheckTime: NULL
           CheckVersion: -1
           VersionCount: 3
              QueryHits: 0
               PathHash: -8567514893400420464
                MetaUrl: http://172.16.0.8:6781/api/meta/header/2749703
       CompactionStatus: http://172.16.0.8:6781/api/compaction/show?tablet_id=2749703
      CooldownReplicaId: 2749704
         CooldownMetaId: TUniqueId(hi:-8697097432131255833, lo:9213158865768502666)
```

You can also check your cold data from the object storage side by finding  the data files under the path specified in the Storage Policy.

Data in object storage only has a single copy.

![img](https://miro.medium.com/v2/resize:fit:1400/1*jao2TrbhDI2h6S04W0x95Q.png)

### 5. Execute Queries

When all data in Table Lineitem1 has been moved to object storage and a  query requests data from Table Lineitem1, Apache Doris will follow the  root path specified in the Storage Policy of the relevant data  partition, and download the requested data for local computation.

Apache Doris 2.0 has been optimized for cold data queries. Only the first-time access to the cold data will entail a full network I/O operation from  object storage. After that, the downloaded data will be put in cache to  be available for subsequent queries, so as to improve query speed.

### 6. Update Cold Data

In Apache Doris, each data ingestion leads to the generation of a new  Rowset, so the update of historical data will be put in a Rowset that is separated from those of newly loaded data. That’s how it makes sure the updating of cold data does not interfere with the ingestion of hot  data. Once the rowsets cool down, they will be moved to S3 and deleted  locally, and the updated historical data will go to the partition where  it belongs.

If you any questions, come find Apache Doris developers on [Slack](https://join.slack.com/t/apachedoriscommunity/shared_invite/zt-2unfw3a3q-MtjGX4pAd8bCGC1UV0sKcw). We will be happy to provide targeted support.







