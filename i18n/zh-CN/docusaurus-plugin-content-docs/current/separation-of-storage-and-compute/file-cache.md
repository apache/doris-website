---
{
    "title": "存算分离数据缓存",
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

## 概述

存算分离架构下的数据是放在远端存储上的，为了加速对数据的访问，实现了一个基于本地硬盘的缓存。缓存提供了两种管理策略：LRU 策略 和 TTL 策略，对索引相关的数据做了优化，让缓存尽可能 Cache 住用户常用的数据。

在多 Cluster（计算集群）的应用场景，还提供了缓存预热功能。当新建一个计算集群的时候，用户可以让新 计算集群 对指定的数据（表或 Partition）进行预热，以便提高查询效率。

## 缓存空间管理

### 缓存数据

数据进入缓存主要有三种方式。

1. 导入。新导入的数据会异步写到缓存中以加速第一次访问。

2. 查询。如果判断查询的数据不在缓存，会从远端存储读取到内存，并会写到缓存中，以便下一次查询。

3. 主动预热。尽管远端存储的数据可以多集群共享，但缓存并不会共享。当新建一个集群的时候，此时的缓存是空的，这时候可以通过主动去预热，让集群快速地从远端存储拉取想要的数据在本地缓存中。

### 缓存淘汰

缓存同时支持 LRU 和 TTL 两种策略。

1. LRU 是缓存的默认策略，缓存会对该策略的数据维护一个队列，当访问队列中的某一块数据的时候，会把对应的数据移动到 LRU 队列的队首。如果有新写入缓存的数据，也会放在队首，避免过早被淘汰。当数据满的时候，会优先淘汰队列尾部的数据。

2. TTL 策略主要用来确保新导入的数据在缓存中的一段时间内不被淘汰（过期时间是由导入时间 + 超时时间来计算的得出）。TTL 的数据的地位是最高且平等的。最高指当缓存满的时候，会通过淘汰 LRU 队列的数据，来让 TTL 的数据写进缓存中。平等是指所有 TTL 策略的数据并不会因为过期时间有差别而进行淘汰。当 TTL 的数据占满了缓存，之后的新导入的数据（无论有没有设置 TTL）或者从远端存储拉取下来的冷数据，都不会被写进缓存。

3. TTL 策略可以用在希望常驻本地的小表。对于常驻表，可以设置一个比较大的 TTL 值来让它在缓存里的数据不会被其他大表的查询淘汰掉。或者对于动态 Partition 的表，可以根据 Partition 的 Hot Partition 的时间，设置对应的 TTL 值，来让 Hot Partition 不会被 Cold Partition 的查询淘汰掉。目前暂不支持查看 TTL 数据在缓存的占比。



## 使用方法

### 设置 TTL 策略

在建表的时候设置对应的 PROPERTY，即可该表的数据使用 TTL 策略缓存下来。

- file_cache_ttl_seconds : 新导入的数据期望在缓存中保持的时间，单位是秒。

  ```sql
  # 设置 TTL 的例子，通过建表时指定对应 property
  CREATE TABLE IF NOT EXISTS customer (
    C_CUSTKEY     INTEGER NOT NULL,
    C_NAME        VARCHAR(25) NOT NULL,
    C_ADDRESS     VARCHAR(40) NOT NULL,
    C_NATIONKEY   INTEGER NOT NULL,
    C_PHONE       CHAR(15) NOT NULL,
    C_ACCTBAL     DECIMAL(15,2)   NOT NULL,
    C_MKTSEGMENT  CHAR(10) NOT NULL,
    C_COMMENT     VARCHAR(117) NOT NULL
  )
  DUPLICATE KEY(C_CUSTKEY, C_NAME)
  DISTRIBUTED BY HASH(C_CUSTKEY) BUCKETS 32
  PROPERTIES(
      "file_cache_ttl_seconds"="300"
  )
  ```



对于上面那张表，该表所有新导入的数据都会在缓存中被保留 300s。目前也支持修改表的 TTL 时间，可以将 TTL 的时间延长或减短。注：修改的值目前暂时不会立刻生效，会有一定时间的延迟。

```sql
ALTER TABLE customer set ("file_cache_ttl_seconds"="3000");
```

如果建表的时候没有设置 TTL，也可以通过 ALTER 语句进行修改。

## 实践案例

某用户有若干张表，总数据量为 3TB+，缓存只有 1.2TB。其中经常访问的有两张表，其中有一张小表 200 MB，还有一张 100 GB 的表。其他的大表也会每天有流量，但不多，在 LRU 策略下，查询大表有可能淘汰掉需要经常访问的小表的数据，造成性能波动。为了让常驻的表的缓存不被淘汰，通过设置两张表的 TTL 时间，让这两张表的数据常驻在缓存中。对于小表，因为数据量较大，每天变动不大，设置了 TTL 超时 1 年来让他长期在缓存。对于另一张表，用户每天会做一次表的备份，然后再进行全量导入，所以推荐设置了 1 天的 TTL 超时时间。
