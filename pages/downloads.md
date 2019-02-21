title=Downloads
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

## [Apache Doris 0.9.0 (incubating) Release](http://www.apache.org/dyn/closer.cgi/incubator/doris/0.9.0-incubating/apache-doris-0.9.0-incubating-src.tar.gz)

### Download

Source Package: [**apache-doris-0.9.0-incubating-src.tar.gz**](http://www.apache.org/dyn/closer.cgi/incubator/doris/0.9.0-incubating/apache-doris-0.9.0-incubating-src.tar.gz) ([SHA-512](https://dist.apache.org/repos/dist/release/incubator/doris/0.9.0-incubating/apache-doris-0.9.0-incubating-src.tar.gz.sha512), [PGP ASC](https://dist.apache.org/repos/dist/release/incubator/doris/0.9.0-incubating/apache-doris-0.9.0-incubating-src.tar.gz.asc))

Officially, it is important that you verify the integrity of the downloaded files using the PGP signatures (.asc file) or a hash (.sha512 files). The PGP keys used to sign this release are available [**here**](https://dist.apache.org/repos/dist/release/incubator/doris/KEYS).

### Building from source in Docker Image

Firstly, you must be install and start docker service, and then you could build Doris as following steps:

Step1: Pull the docker image with Doris building environment

```
$ docker pull apachedoris/doris-dev:build-env
```

You can check it by listing images, its size is about 3.28GB.

Step2: Run the Docker image
You can run image directyly:

```
$ docker run -it apachedoris/doris-dev:build-env
```

Step3: Download Doris source
Now you should in docker environment, and you can download Doris source package, for example:
(If you have downloaded source and it is not in image, you can map its path to image in Step2.)

```
$ wget --trust-server-names "https://www.apache.org/dyn/mirrors/mirrors.cgi?action=download&filename=incubator/doris/0.9.0-incubating/apache-doris-0.9.0-incubating-src.tar.gz"
```

Step4: Build Doris
Now you can decompress and enter Doris source path and build Doris.

```
$ tar zxvf apache-doris-0.9.0-incubating-src.tar.gz
$ cd apache-doris-0.9.0-incubating-src
$ sh build.sh
```

### Change Log

#### Features, Changes and Enhanced

1. Add streaming load feature. You can execute 'help stream load;' to see more information.
2. Introduce RocksDB to save the header info of tablets in Backends, to reduce the IO operations and increate speeding of restarting.
3. Change project name from Palo to Doris, include variables and namespace name (#268)
4. Change license to Apache License 2.0 (#262)
5. Improve build scripts and add docker dev environment (#301).
6. Support NULLS LAST and NULLS FIRST syntax (#252)
7. Support AnalyticExpr in View (#248)
8. Improve cardinality, avgRowSize, numNodes stat info in OlapScanNode (#256)
9. Transform row-oriented table to columnar-oriented table (#311)
10. Change ByteBuffer to StorageByteBuffer in olap/byte_buffer.h (#341)
11. Improve the Backend's disk info report performance (#349)
12. Add path info of replica in catalog (#327)
13. Change log verbose level to vlog(3) (#325)
14. Change PaloMetrics' name and Catalog's Id generator (#329)
15. Rename Rowset to SegmentGroup (#364)
16. Subsititue ColumnType to Type (#366)
17. Optimize the publish logic of streaming load (#350)
18. Add connection id to CurrentQueryStatisticsProcDir (#355)
19. Change SQL built-in function's symbol (#274)

#### Bugs Fix
1. Failed to register equal conjuncts which refer more than three tuples (#266)
2. Rewrite aes encryption (#264)
3. Fix a bug that user can not kill it own connection (#276)
4. Fix lose of be's meta data bug (#318)
5. Fix SHOW BACKENDS return ERROR (#320)
6. Fix Ubuntu llvm compile (#361)
7. Support for custom build toolchains (#330)
8. Modify partition's version name to what it means (#334)
9. Fix compile issue of thirdparty library (#338)
10. Fix a compile issue of DORIS_GCC_HOME (#339)
11. Add special add_column_statistics method for linked_schema_change (#337)
12. Fix wrong query result when column value is Null (#344)
13. Fix bug of using symbolic link dir as storage path (#340)
14. Add distributor which schedule task to be fairly, for routine load job (#333)
15. Fix UnionStmt toSql bug (#249)
16. Fix a bug that user can not kill it own connection (#276)
17. Fix failed cases in regression test (#299)
18. Fix code LICENSE for file modified from LevelDB. (#300)
19. Fix snapshot's making header bug (#362)
20. Fix stream load failure when target table contains HLL and insert failure when it contains subquery (#359)
21. Avoid 'No more data to read' error when handling stream load RPC (#354)
22. Fix cast error in StreamLoadScanNodeush (#356)
23. Fix insert error when it contains HLL (#358)

### Compatibility

**This release version DOES NOT support rolling upgrade, and CAN NOT rollback after upgrade. So it is HIGHLY RECOMMENDED to backup your data and meta data before upgrading to this release version. Or upgrade it in your test/pre-online Palo cluster to make sufficient test.**

|Item|Content|
|---|---|
|Forward Compatibility | 0.8.1, 0.8.0 |
|Rolling Upgrade | No |
|Rollback | No |

## DISCLAIMER
Apache Doris is an effort undergoing incubation at The Apache Software Foundation (ASF),
sponsored by the Apache Incubator. Incubation is required of all newly accepted projects
until a further review indicates that the infrastructure, communications, and decision
making process have stabilized in a manner consistent with other successful ASF projects.
While incubation status is not necessarily a reflection of the completeness or stability
of the code, it does indicate that the project has yet to be fully endorsed by the ASF.

