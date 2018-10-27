title=Apache Doris Downloads
date=2018-10-26
type=simplepage
status=published
~~~~~~

<!--Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.-->

## Current Release

Comming soon...

## History Release

### 0.8.2 (20180824)

#### Download

* [palo-0.8.2-release-20180824.tar.gz](https://github.com/apache/incubator-doris/releases/download/v0.8.2/palo-0.8.2-release-20180824.tar.gz) [184 MB]

* [Source code (zip)](https://github.com/apache/incubator-doris/archive/v0.8.2.zip)

* [Source code (tar.gz)](https://github.com/apache/incubator-doris/archive/v0.8.2.tar.gz)

#### Change Log

1. Performance improvement

    * Support vectorized execution engine.
    * Support aggregation operator parallelization.
    * Optimized storage engine for more efficient data fetching.

2. Table-level privileges support

    * User can grant fine-grained privileges on specified tables to specified user from specified host.

3. Backup and restore

    * User can backup snapshot of data to HDFS and restore snapshot to other Palo cluster.

4. Broker supports HDFS HA and Hadoop kerberos authentication.

5. Using [BRPC](https://github.com/brpc/brpc) instead of the old RPC framework.

6. A lot of bugs fixed.

7. Other changes:

    * Rewrite http server in Backend using Libevent to replace Mongoose.
    * Remove mysql code to avoid copyright problem.
    * More metrics to expose internal situation of Palo system.
    * Same Frontend can be removed and added again without the changing port.
    * Change the format of Frontend's audit log for parsing it more conveniently.

#### Compatibility

**This release version DOES NOT support rolling upgrade, and CAN NOT rollback after upgrade. So it is HIGHLY RECOMMENDED to backup your data and meta data before upgrading to this release version. Or upgrade it in your test/pre-online Palo cluster to make sufficient test.**

|Item|Content|
|---|---|
|Forward Compatibility | 0.8.1, 0.8.0 |
|Rolling Upgrade | No |
|Rollback | No |

