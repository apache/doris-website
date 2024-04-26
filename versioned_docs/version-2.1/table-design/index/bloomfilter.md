---
{
    "title": "BloomFilter Index",
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



BloomFilter is a fast search algorithm for multi-hash function mapping proposed by Bloom in 1970. Usually used in some occasions where it is necessary to quickly determine whether an element belongs to a set, but is not strictly required to be 100% correct, BloomFilter has the following characteristics:

- A highly space-efficient probabilistic data structure used to check whether an element is in a set.
- For a call to detect whether an element exists, BloomFilter will tell the caller one of two results: it may exist or it must not exist.
- The disadvantage is that there is a misjudgment, telling you that it may exist, not necessarily true.

Bloom filter is actually composed of an extremely long binary bit array and a series of hash functions. The binary bit array is all 0 initially. When an element to be queried is given, this element will be calculated by a series of hash functions to map out a series of values, and all values are treated as 1 in the offset of the bit array.

Figure below shows an example of Bloom Filter with m=18, k=3 (m is the size of the Bit array, and k is the number of Hash functions). The three elements of x, y, and z in the set are hashed into the bit array through three different hash functions. When querying the element w, after calculating by the Hash function, because one bit is 0, w is not in the set.

Similarly, if an element undergoes a hash function calculation to obtain all its offset positions, and if all these positions are set to 1, then it is determined that this element is in the set.

![Bloom_filter.svg](/images/Bloom_filter.svg.png)

Bloom Filter is a data structure that allows for a reverse test on the data stored in each data block. When a specific row is requested, the Bloom Filter first checks if that row is not in the data block. The Bloom Filter either confidently states that the row is not present or it gives an uncertain answer. This uncertainty is why it's called a reverse test. However, Bloom Filters are not without cost. Storing this additional index level consumes extra space, and Bloom Filters grow as the data they index grows.

In Doris, BloomFilter indexes can be specified during table creation or through ALTER table operations. Essentially, a Bloom Filter is a bitmap structure used to quickly determine if a given value is in a set. This determination can result in a small probability of false positives. That is, if it returns false, the value is definitely not in the set. But if it returns true, the value might be in the set.

BloomFilter indexes in Doris are created at the Block level. Within each Block, the values of specified columns are treated as a set to generate a BloomFilter index entry. This entry is used during queries to quickly filter out data that doesn't meet the conditions.

Now let's see how Doris creates a BloomFilter index through an example.

### Create BloomFilter index

The Doris BloomFilter index is created by adding `"bloom_filter_columns"="k1,k2,k3"` to the PROPERTIES of the table building statement, this attribute, k1,k2,k3 is the Key column name of the BloomFilter index you want to create, for example, we Create a BloomFilter index for the saler_id and category_id in the table.

```sql
CREATE TABLE IF NOT EXISTS sale_detail_bloom (
    sale_date date NOT NULL COMMENT "Sales time",
    customer_id int NOT NULL COMMENT "Customer ID",
    saler_id int NOT NULL COMMENT "Salesperson",
    sku_id int NOT NULL COMMENT "Product ID",
    category_id int NOT NULL COMMENT "Product Category",
    sale_count int NOT NULL COMMENT "Sales Quantity",
    sale_price DECIMAL(12,2) NOT NULL COMMENT "unit price",
    sale_amt DECIMAL(20,2) COMMENT "Total sales amount"
)
Duplicate KEY(sale_date, customer_id,saler_id,sku_id,category_id)
PARTITION BY RANGE(sale_date)
(
PARTITION P_202111 VALUES [('2021-11-01'), ('2021-12-01'))
)
DISTRIBUTED BY HASH(saler_id) BUCKETS 10
PROPERTIES (
"replication_num" = "3",
"bloom_filter_columns"="saler_id,category_id",
"dynamic_partition.enable" = "true",
"dynamic_partition.time_unit" = "MONTH",
"dynamic_partition.time_zone" = "Asia/Shanghai",
"dynamic_partition.start" = "-2147483648",
"dynamic_partition.end" = "2",
"dynamic_partition.prefix" = "P_",
"dynamic_partition.replication_num" = "3",
"dynamic_partition.buckets" = "3"
);
```

### View BloomFilter index

Check that the BloomFilter index we built on the table is to use:

```sql
SHOW CREATE TABLE <table_name>;
```

### Delete BloomFilter index

Deleting the index is to remove the index column from the `bloom_filter_columns attribute`:

```sql
ALTER TABLE <db.table_name> SET ("bloom_filter_columns" = "");
```

### Modify BloomFilter index

Modifying the index is to modify the `bloom_filter_columns` attribute of the table:

```sql
ALTER TABLE <db.table_name> SET ("bloom_filter_columns" = "k1,k3");
```

### **BloomFilter usage scenarios**

User can create a BloomFilter index for a column when the following conditions are met:

- BloomFilter is suitable for non-prefix filtering.

- The query will be filtered according to the high frequency of the column, and most of the query conditions are `in` and `= `filtering.

- BloomFilter is suitable for high cardinality columns. Such as UserID. Because if it is created on a low-cardinality column, such as a `gender` column, each Block will almost contain all values, causing the BloomFilter index to lose its meaning.

### **BloomFilter use precautions**

- It does not support the creation of BloomFilter indexes for `Tinyint`,`Float`, and `Double` columns.

- The BloomFilter index only has an acceleration effect on `in` and `=` filtering queries.

- If you want to check whether a query hits the BloomFilter index, you can check the profile information of the query.
