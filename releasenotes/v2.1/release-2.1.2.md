---
{
    "title": "Release 2.1.2",
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

## Behavior Changed

1. Set the default value of the `data_consistence` property of EXPORT to partition to make export more stable during load. 

- https://github.com/apache/doris/pull/32830

2. Some of MySQL Connector (eg, dotnet MySQL.Data) rely on variable's column type to make connection.

  eg, select @[@autocommit]([@autocommit](https://github.com/autocommit)) should with column type BIGINT, not BIT, otherwise it will throw error. So we change column type of @[@autocommit](https://github.com/autocommit) to BIGINT. 

  - https://github.com/apache/doris/pull/33282


## Upgrade Problem

1. Normal workload group is not created when upgrade from 2.0 or other old versions. 

  - https://github.com/apache/doris/pull/33197

##  New Feature


1. Add processlist table in information_schema database, users could use this table to query active connections. 

  - https://github.com/apache/doris/pull/32511

2. Add a new table valued function `LOCAL` to allow access file system like shared storage. 

  - https://github.com/apache/doris-website/pull/494


## Optimization

1. Skip some useless process to make graceful stop more quickly in K8s env. 

  - https://github.com/apache/doris/pull/33212

2. Add rollup table name in profile to help find the mv selection problem. 

  - https://github.com/apache/doris/pull/33137

3. Add test connection function to DB2 database to allow user check the connection when create DB2 Catalog. 

  - https://github.com/apache/doris/pull/33335

4. Add DNS Cache for FQDN to accelerate the connect process among BEs in K8s env. 

  - https://github.com/apache/doris/pull/32869

5. Refresh external table's rowcount async to make the query plan more stable. 

  - https://github.com/apache/doris/pull/32997


## Bugfix


1. Fix Iceberg Catalog of HMS and Hadoop do not support Iceberg properties like "io.manifest.cache-enabled" to enable manifest cache in Iceberg. 

  - https://github.com/apache/doris/pull/33113

2. The offset params in `LEAD`/`LAG` function could use 0 as offset. 

  - https://github.com/apache/doris/pull/33174

3. Fix some timeout issues with load. 

  - https://github.com/apache/doris/pull/33077

  - https://github.com/apache/doris/pull/33260

4. Fix core problem related with `ARRAY`/`MAP`/`STRUCT` compaction process. 

  - https://github.com/apache/doris/pull/33130

  - https://github.com/apache/doris/pull/33295

5. Fix runtime filter wait timeout. 

  - https://github.com/apache/doris/pull/33369

6. Fix `unix_timestamp` core for string input in auto partition. 

  - https://github.com/apache/doris/pull/32871