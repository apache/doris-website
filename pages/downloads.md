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

### 0.8.2.1

NOTICE:

These is not an official Apache release version of Doris. We still have some works to do to release a real Apache version.  
But this does not affect the use of this release version in a production environment.

#### Download:

* [palo-0.8.2.1-release-20181026.tar.gz](http://palo-opensource-bj.bj.bcebos.com/palo-0.8.2.1-release-20181026.tar.gz?authorization=bce-auth-v1/069fc2786e464e63a5f1183824ddb522/2018-10-26T08:50:53Z/-1/host/3538578971c0a1e7cbc8e355f86a8bd55b278c211ff8be366679167227e9c129) [183MB]
* source code is associate with commit `4f6f857`

#### Change Log

1. Added: 

	* Add 2 new proc '/current\_queries' and '/current\_backend\_instances' to monitor the current running queries.
	* Add a manual compaction api on Backend to trigger cumulative and base compaction manually.
	* Add Frontend config 'max\_bytes\_per\_broker\_scanner' to limit the loading bytes per one broker scanner. This is to limit the memory cost of a single broker load job.
	* Add Frontend config 'max\_unfinished\_load\_job' to limit load job number. If number of running load jobs exceed the limit, no more load job is allowed to be submmitted.
	* Exposure backend info to user when encounter errors on Backend, for debugging it more convenient.
	* Add 3 new metrics of Backends: host\_fd\_metrics, process\_fd\_metrics and process\_thread\_metrics, to monitor open files number and threads number.
	* Support getting column size and precision info of table or view using JDBC.

2. Updated:

	* Hide password and other sensitive information in fe.log and fe.audit.log.
	* Change the promethues type name 'GAUGE' to lowercase, to fit the latest promethues version.
	* Backend ip saved in FE will be compared with BE's local ip when heartbeating, to avoid false positive heartbeat response.
	* Using version\_num of tablet instead of calculating nice value to select cumulative compaction candicates.

3. Fixed

	* Fix privilege logic error:
    	1. No one can set root password expect for root user itself.
    	2. NODE\_PRIV cannot be granted.
    	3. ADMIN\_PRIV and GRANT\_PRIV can only be granted or revoked on \*.\*.
    	4. No one can modifly privs of default role 'operator' and 'admin'.
    	5. No user can be granted to role 'operator'.
	* Missing password and auth check when handling mini load request in Frontend.
	* DomainResolver should start after Frontend transfering to a certain ROLE, not in Catalog construction methods.
	* Fix a bug that read null data twice:
	     When reading data with a null value, in some cases, the same data will be read twice by the storage engine,
	     resulting in a wrong result. The reason for this problem is that when splitting,
	     and the start key is the minimum value, the data with null is read.
	* Fixed a mem leak of using ByteBuf when parsing auth info of http request.
	* Backend process should crash if failed to saving tablet's header.
	* Should remove fd from map when input stream or output stream is closed in Broker process.
	* Predicates should not be pushed down to subquery which contains limit clause.
	* Fix the formula of calculating BE load score.
	* Fix a bug that in some edge cases, non-master Fontend may wait for a unnecessary long timeout after forwarding cmd to Master FE.
	* Fix a bug that granting privs on more than one table does not work.
	* Support 'Insert into' table which contains HLL columns.
	* ExportStmt's toSql() method may throw NullPointer Exception if table does not exist.
	* Remove unnecessary 'get capacity' operation to avoid IO impact.

#### Compatibility

This release version support rolling upgrade ONLY from 0.8.2.  
The compatibility is same as 0.8.2.

## History Release

### 0.8.2

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

