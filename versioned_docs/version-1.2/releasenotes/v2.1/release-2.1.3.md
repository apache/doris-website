---
{
    "title": "Release 2.1.3",
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

Apache Doris 2.1.3 was officially released on May 21, 2024. This version has updated several improvements, including writing data back to Hive, materialized view, permission management and bug fixes. It further enhances the performance and stability of the system.

**Quick Download:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases



## Feature Enhancements

**1. Support writing back data to hive tables via Hive Catalog**

Starting from version 2.1.3, Apache Doris supports DDL and DML operations on Hive. Users can directly create libraries and tables in Hive through Apache Doris and write data to Hive tables by executing `INSERT INTO` statements. This feature allows users to perform complete data query and write operations on Hive through Apache Doris, further simplifying the integrated lakehouse architecture.

Please refer: [https://doris.apache.org/docs/lakehouse/datalake-building/hive-build/](https://doris.apache.org/docs/lakehouse/datalake-building/hive-build/)

**2. Support building new asynchronous materialized views on top of existing ones**

Users can create new asynchronous materialized views on top of existing ones, directly reusing pre-computed intermediate results for data processing. This simplifies complex aggregation and computation operations, reducing resource consumption and maintenance costs while further accelerating query performance and improving data availability. [#32984](https://github.com/apache/doris/pull/32984)

**3. Support rewriting through nested materialized views**

Materialized View (MV) is a database object used to store query results. Now, Apache Doris supports rewriting through nested materialized views, which helps optimize query performance. [#33362](https://github.com/apache/doris/pull/33362)

**4. New `SHOW VIEWS` statement**

The `SHOW VIEWS` statement can be used to query views in the database, facilitating better management and understanding of view objects in the database. [#32358](https://github.com/apache/doris/pull/32358)

**5. Workload Group supports binding to specific BE nodes**

Workload Group can be bound to specific BE nodes, enabling more refined control over query execution to optimize resource usage and improve performance. [#32874](https://github.com/apache/doris/pull/32874)

**6. Broker Load supports compressed JSON format**

Broker Load now supports importing compressed JSON format data, significantly reducing bandwidth requirements for data transmission and accelerating data import performance. [#30809](https://github.com/apache/doris/pull/30809)

**7. TRUNCATE Function can use columns as scale parameters**

The TRUNCATE function can now accept columns as scale parameters, providing more flexibility when processing numerical data. [#32746](https://github.com/apache/doris/pull/32746)

**8. Add new functions `uuid_to_int` and `int_to_uuid`**

These two functions allow users to convert between UUID and integer, significantly helping in scenarios that require handling UUID data. [#33005](https://github.com/apache/doris/pull/33005)

**9. Add `bypass_workload_group` session variable to bypass query queue**

The `bypass_workload_group` session variable allows certain queries to bypass the Workload Group queue and execute directly, which is useful for handling critical queries that require quick responses. [#33101](https://github.com/apache/doris/pull/33101)

**10. Add strcmp function**

The strcmp function compares two strings and returns their comparison result, simplifying text data processing. [#33272](https://github.com/apache/doris/pull/33272)

**11. Support HLL functions `hll_from_base64` and `hll_to_base64`**

HyperLogLog (HLL) is an algorithm for cardinality estimation. These two functions allow users to decode HLL data from a Base64-encoded string or encode HLL data as a Base64 string, which is very useful for storing and transmitting HLL data. [#32089](https://github.com/apache/doris/pull/32089)

## Optimization and Improvements

**1. Replace SipHash with XXHash to improve shuffle performance**

Both SipHash and XXHash are hashing functions, but XXHash may provide faster hashing speeds and better performance in certain scenarios. This optimization aims to improve performance during data shuffling by adopting XXHash. [#32919](https://github.com/apache/doris/pull/32919)

**2. Asynchronous materialized views support NULL partition columns in OLAP tables**

This enhancement allows asynchronous materialized views to support NULL partition columns in OLAP tables, enhancing data processing flexibility.[#32698](https://github.com/apache/doris/pull/32698)

**3. Limit maximum string length to 1024 when collecting column statistics to control BE memory usage**

Limiting the string length when collecting column statistics prevents excessive data from consuming too much BE memory, helping maintain system stability and performance. [#32470](https://github.com/apache/doris/pull/32470)

**4. Support dynamic deletion of Bitmap cache to improve performance**

Dynamically deleting no longer needed Bitmap Cache can free up memory and improve system performance. [#32991](https://github.com/apache/doris/pull/32991)

**5. Reduce memory usage during ALTER operations**

Reducing memory usage during ALTER operations improves the efficiency of system resource utilization. [#33474](https://github.com/apache/doris/pull/33474)

**6. Support constant folding for complex types**

Supports constant folding for Array/Map/Struct complex types.[#32867](https://github.com/apache/doris/pull/32867)

**7. Add support for Variant type in Aggregate Key Model**

The Variant data type can store multiple data types. This optimization allows aggregation operations on Variant type data, enhancing the flexibility of semi-structured data analysis. [#33493](https://github.com/apache/doris/pull/33493)

**8. Support new inverted index format in CCR** [#33415](https://github.com/apache/doris/pull/33415)

**9. Optimize rewriting performance for nested materialized views** [#34127](https://github.com/apache/doris/pull/34127)

**10. Support decimal256 type in row-based storage format**

Supporting the decimal256 type in row-based storage extends the system's ability to handle high-precision numerical data. [#34887](https://github.com/apache/doris/pull/34887)

## Behavioral Changes

**1. Authorization**

- **Grant_priv permission changes**: `Grant_priv` can no longer be arbitrarily granted. When performing a `GRANT` operation, the user not only needs to have `Grant_priv` but also the permissions to be granted. For example, to grant `SELECT` permission on `table1`, the user needs both `GRANT` permission and `SELECT` permission on `table1`, enhancing security and consistency in permission management. [#32825](https://github.com/apache/doris/pull/32825)

- **Workload group and resource usage_priv**: `Usage_priv` for Workload Group and Resource is no longer global but limited to Resource and Workload Group, making permission granting and usage more specific. [#32907](https://github.com/apache/doris/pull/32907)

- **Authorization for operations**: Operations that were previously unauthorized now have corresponding authorizations for more detailed and comprehensive operational permission control. [#33347](https://github.com/apache/doris/pull/33347)

**2. LOG directory configuration**

The log directory configuration for FE and BE now uniformly uses the `LOG_DIR` environment variable. All other different types of logs will be stored with `LOG_DIR` as the root directory. To maintain compatibility between versions, the previous configuration item `sys_log_dir` can still be used. [#32933](https://github.com/apache/doris/pull/32933)

**3. S3 Table Function (TVF)**

Due to issues with correctly recognizing or processing S3 URLs in certain cases, the parsing logic for object storage paths has been refactored. For file paths in S3 table functions, the `force_parsing_by_standard_uri` parameter needs to be passed to ensure correct parsing. [#33858](https://github.com/apache/doris/pull/33858)

## Upgrade Issues

Since many users use certain keywords as column names or attribute values, the following keywords have been set as non-reserved, allowing users to use them as identifiers. [#34613](https://github.com/apache/doris/pull/34613)

## Bug Fixes

**1. Fix no data error when reading Hive tables on Tencent Cloud COSN**

Resolved the no data error that could occur when reading Hive tables on Tencent Cloud COSN, enhancing compatibility with Tencent Cloud storage services.

**2. Fix incorrect results returned by `milliseconds_diff` function**

Fixed an issue where the `milliseconds_diff` function returned incorrect results in some cases, ensuring the accuracy of time difference calculations. [#32897](https://github.com/apache/doris/pull/32897)

**3. User-defined variables should be rorwarded to the Master node**

Ensured that user-defined variables are correctly passed to the Master node for consistency and correct execution logic across the entire system. [#33013]https://github.com/apache/doris/pull/33013

**4. Fix Schema Change issues when adding complex type columns**

Resolved Schema Change issues that could arise when adding complex type columns, ensuring the correctness of Schema Changes. [#31824](https://github.com/apache/doris/pull/31824)

**5. Fix data loss issue in Routine Load when FE Master node changes**

`Routine Load` is often used to subscribe to Kafka message queues. This fix addresses potential data loss issues that may occur during FE Master node changes. [#33678](https://github.com/apache/doris/pull/33678)

**6. Fix Routine Load failure when Workload Group cannot be found**

Resolved an issue where `Routine Load` would fail if the specified Workload Group could not be found. [#33596](https://github.com/apache/doris/pull/33596)

**7. Support column string64 to avoid join failures when string size overflows unit32**

In some cases, string sizes may exceed the unit32 limit. Supporting the `string64` type ensures correct execution of string JOIN operations. [#33850](https://github.com/apache/doris/pull/33850)

**8. Allow Hadoop users to create Paimon Catalog**

Permitted authorized Hadoop users to create Paimon Catalogs.[#33833](https://github.com/apache/doris/pull/33833)

**9. Fix `function_ipxx_cidr` function issues with constant parameters**

Resolved problems with the `function_ipxx_cidr` function when handling constant parameters, ensuring the correctness of function execution.[#33968](https://github.com/apache/doris/pull/33968)

**10. Fix file download errors when restoring using HDFS**

Resolved "failed to download" errors encountered during data restoration using HDFS, ensuring the accuracy and reliability of data recovery. [#33303](https://github.com/apache/doris/issues/33303)

**11. Fix column permission issues related to hidden columns**

In some cases, permission settings for hidden columns may be incorrect. This fix ensures the correctness and security of column permission settings. [#34849](https://github.com/apache/doris/pull/34849)

**12. Fix issue where Arrow Flight cannot obtain the correct IP in K8s deployments**

This fix resolves an issue where Arrow Flight cannot correctly obtain the IP address in Kubernetes deployment environments.[#34850](https://github.com/apache/doris/pull/34850)