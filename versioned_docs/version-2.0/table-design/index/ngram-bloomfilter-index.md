---
{
    "title": "N-Gram BloomFilter Index",
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



In order to improve the like query performance, the N-Gram BloomFilter index was implemented.

:::tip

N-Gram BloomFilter indexing is supported starting from the Doris 2.0 version.

:::

### Create N-Gram BloomFilter index

During create table：

```sql
CREATE TABLE `table3` (
  `siteid` int(11) NULL DEFAULT "10" COMMENT "",
  `citycode` smallint(6) NULL COMMENT "",
  `username` varchar(100) NULL DEFAULT "" COMMENT "",
  INDEX idx_ngrambf (`username`) USING NGRAM_BF PROPERTIES("gram_size"="3", "bf_size"="256") COMMENT 'username ngram_bf index'
) ENGINE=OLAP
AGGREGATE KEY(`siteid`, `citycode`, `username`) COMMENT "OLAP"
DISTRIBUTED BY HASH(`siteid`) BUCKETS 10
PROPERTIES (
"replication_num" = "1"
);
```

- PROPERTIES("gram_size"="3", "bf_size"="1024")，indicate the number of gram and bytes of bloom filter respectively.
- The number of grams is related to the actual query scenarios and is usually set to the length of most query strings. The byte size of the Bloom Filter can be determined through testing, and generally, a larger size leads to better filtering effects. You can start with 256 bytes for validation testing to see the results. However, a larger byte size will also increase the storage and memory cost of the index.
- If the data cardinality is relatively high, the byte size does not need to be set too large. If the cardinality is not very high, the filtering effect can be improved by increasing the byte size.

### Show N-Gram BloomFilter index

```sql
show index from example_db.table3;
```

### Drop N-Gram BloomFilter index


```sql
alter table example_db.table3 drop index idx_ngrambf;
```

### Modify N-Gram BloomFilter index

Add N-Gram BloomFilter Index for old column:

```sql
alter table example_db.table3 add index idx_ngrambf(username) using NGRAM_BF PROPERTIES("gram_size"="3", "bf_size"="512")comment 'username ngram_bf index' 
```

### **Some Notes about Doris NGram BloomFilter**

1. NGram BloomFilter only support CHAR/VARCHAR/String column.
2. NGram BloomFilter index and BloomFilter index should be exclusive on same column
3. The gram number and bytes of BloomFilter can be adjust and optimize. Like if gram is too small, you can increase the bytes of BloomFilter.
4. To find some query whether use the NGram BloomFilter index, you can check the query profile.
