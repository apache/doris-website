---
{
    'title': '[Release Note] Apache Doris(Incubating) 0.15.0 Release',
    'summary': '[Release Note] Apache Doris(Incubating) 0.15.0 Release',
    'date': '2021-11-29',
    'author': 'Apache Doris',
    'tags': ['Release Notes'],
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

# Apache Doris(Incubating) 0.15.0 Release

Dear Community, After months of polishing, we are pleased to announce the release of Apache Doris(Incubating) on November 29, 2021! Nearly 700 optimizations and fixes have been submitted by 99 contributors to Apache Doris, and we'd like to express our sincere gratitude to all of them!

In the 0.15.0 Release, we have added many new features to optimize Apache Doris's query performance, ease of use, and stability: a new resource division and isolation feature that allows users to divide BE nodes in a cluster into resource groups by means of resource tags, enabling unified management of online and offline services and resource isolation; the addition of Runtime Filter and Join Reorder functions have been added to significantly improve the query efficiency of multi-table Join scenarios, with a 2-10 times performance improvement under the Star Schema Benchmark test data set; new import method Binlog Load enables Doris to incrementally synchronize the CDC of data update operations in MySQL; support for String column type The new import method, Binlog Load, allows Doris to incrementally synchronize the CDC of MySQL for data update operations; supports String column type with a maximum length of 2GB; supports List partitioning to create partitions by enumerating values; supports Update statements on the Unique Key model; Spark-Doris-Connector supports data writing to Doris ... ...and many more important features, welcome to download and use.

We welcome you to contact us via GitHub Discussion or the Dev email group if you have any questions during use, and we look forward to your participation in community discussions and building.

## High Lights

### Resource Segregation and Isolation

You can divide BE nodes in a Doris cluster into resource groups by using resource tags, allowing you to manage online and offline operations and isolate resources at the node level.
You can also control the resource overhead of individual queries by limiting the CPU and memory overhead and complexity of individual query tasks, thus reducing the resource hogging problem between different queries.

### Performance Optimization

* The Runtime Filter feature can significantly improve query efficiency in most Join scenarios by using the Join Key column condition of the right table in the Join algorithm to filter the data in the left table. For example, you can get 2-10 times performance improvement under Star Schema Benchmark (TPCH's streamlined test set).

* The Join Reorder feature can automatically help adjust the order of joins in SQL by using a cost model to help achieve optimal join efficiency.
It can be enabled via the session variable `set enable_cost_based_join_reorder=true`.

### New features

* Support synchronizing MySQL binlog data directly to Canal Server.
* Support String column type, support up to 2GB.
* Support List partitioning, you can create partitions for enumerated values.
* Support transactional Insert statement function. You can import data in bulk by begin ; insert ; insert;, ... You can import data in bulk by begin ; insert ; insert ;, ... ;.
* Support Update statement function on Unique Key model. You can execute Update Set where statement on Unique Key model table.
* Support SQL blocking list function. You can block some SQL execution by regular, hash value matching, etc.
* Support LDAP login authentication.

### Extended Features

* Support Flink-Doris-Connector.
* Support for DataX doriswriter plugin.
* Spark-Doris-Connector support for data writing to Doris.

## Feature Optimization 

### Query

* Support for computing all constant expressions in the SQL query planning phase using BE's functional computing power.

### Import

* Support for specifying multi-byte row separators or invisible separators when importing text format files.
* Supports importing compressed format files via Stream Load.
* Stream Load supports importing Json data in multi-line format.

### Export

* Support Export export function to specify where filter. Supports exporting files with multi-byte row separators. Support export to local files.
* Export export function supports exporting only specified columns.
* Supports exporting the result set to local disk via outfile statement and writing the exported marker file after exporting.

### Ease of use

* Dynamic partitioning function supports creating and keeping specified historical partitions, and supports automatic hot and cold data migration settings.
* Supports displaying queries, imported schedules and Profiles using a visual tree structure at the command line.
* Support to record and view Stream Load operation logs.
* When consuming Kafka data via Routine Load, you can specify the time point for consumption.
* Supports exporting Routine Load creation statements by show create routine load function.
* Support to start and stop all Routine Load jobs with one click by pause/resume all routine load command.
* Supports modifying the Broker List and Topic of Routine Load by alter routine load statement.
* Support create table as select function.
* Support modify column comments and table comments by alter table command.
* show tablet status to add table creation time and data update time.
* Support show data skew command to check the data volume distribution of a table to troubleshoot data skewing problems.
* Support show/clean trash command to check the disk occupation of BE file recycle bin and clear it actively.
* Support show view statement to show which views a table is referenced by.

### New functions

* `bitmap_min`, `bit_length`
* `yearweek`, `week`, `makedate`
* `percentile` exact percentile function
* `json_array`, `json_object`, `json_quote`
* Support for creating custom public keys for the `AES_ENCRYPT` and `AES_DECRYPT` functions.
* Support for creating function aliases to combine multiple functions by `create alias function`.

### Other

* Support for accessing the ES exterior of the SSL connection protocol.
* Support specifying the number of hotspot partitions in the dynamic partition property, which will be stored in SSD disks.
* Support importing Json format data via Broker Load.
* Supports accessing HDFS directly through libhdfs3 library for data import and export without the Broker process.
* select into outfile function supports exporting Parquet file format and parallel export.
* ODBC external table support for SQLServer. 

## 致谢  

The release of Apache Doris (incubating) 0.15.0 Release is made possible by the support of all community users. We would like to thank all the community contributors who participated in the design, development, testing, and discussion of the release, namely.

* [@924060929](https://github.com/924060929)
* [@acelyc111](https://github.com/acelyc111)
* [@Aimiyoo](https://github.com/Aimiyoo)
* [@amosbird](https://github.com/amosbird)
* [@arthur-zhang](https://github.com/arthur-zhang)
* [@azurenake](https://github.com/azurenake)
* [@BiteTheDDDDt](https://github.com/BiteTheDDDDt)
* [@caiconghui](https://github.com/caiconghui)
* [@caneGuy](https://github.com/caneGuy)
* [@caoliang-web](https://github.com/caoliang-web)
* [@ccoffline](https://github.com/ccoffline)
* [@chaplinthink](https://github.com/chaplinthink)
* [@chovy-3012](https://github.com/chovy-3012)
* [@ChPi](https://github.com/ChPi)
* [@copperybean](https://github.com/copperybean)
* [@crazyleeyang](https://github.com/crazyleeyang)
* [@dh-cloud](https://github.com/dh-cloud)
* [@DinoZhang](https://github.com/DinoZhang)
* [@dixingxing0](https://github.com/dixingxing0)
* [@dohongdayi](https://github.com/dohongdayi)
* [@e0c9](https://github.com/e0c9)
* [@EmmyMiao87](https://github.com/EmmyMiao87)
* [@eyesmoons](https://github.com/eyesmoons)
* [@francisoliverlee](https://github.com/francisoliverlee)
* [@Gabriel39](https://github.com/Gabriel39)
* [@gaodayue](https://github.com/gaodayue)
* [@GoGoWen](https://github.com/GoGoWen)
* [@HappenLee](https://github.com/HappenLee)
* [@harveyyue](https://github.com/harveyyue)
* [@Henry2SS](https://github.com/Henry2SS)
* [@hf200012](https://github.com/hf200012)
* [@huangmengbin](https://github.com/huangmengbin)
* [@huozhanfeng](https://github.com/huozhanfeng)
* [@huzk8](https://github.com/huzk8)
* [@hxianshun](https://github.com/hxianshun)
* [@ikaruga4600](https://github.com/ikaruga4600)
* [@JameyWoo](https://github.com/JameyWoo)
* [@Jennifer88huang](https://github.com/Jennifer88huang)
* [@JinLiOnline](https://github.com/JinLiOnline)
* [@jinyuanlu](https://github.com/jinyuanlu)
* [@JNSimba](https://github.com/JNSimba)
* [@killxdcj](https://github.com/killxdcj)
* [@kuncle](https://github.com/kuncle)
* [@liutang123](https://github.com/liutang123)
* [@luozenglin](https://github.com/luozenglin)
* [@luzhijing](https://github.com/luzhijing)
* [@MarsXDM](https://github.com/MarsXDM)
* [@mh-boy](https://github.com/mh-boy)
* [@mk8310](https://github.com/mk8310)
* [@morningman](https://github.com/morningman)
* [@Myasuka](https://github.com/Myasuka)
* [@nimuyuhan](https://github.com/nimuyuhan)
* [@pan3793](https://github.com/pan3793)
* [@PatrickNicholas](https://github.com/PatrickNicholas)
* [@pengxiangyu](https://github.com/pengxiangyu)
* [@pierre94](https://github.com/pierre94)
* [@qidaye](https://github.com/qidaye)
* [@qzsee](https://github.com/qzsee)
* [@shiyi23](https://github.com/shiyi23)
* [@smallhibiscus](https://github.com/smallhibiscus)
* [@songenjie](https://github.com/songenjie)
* [@spaces-X](https://github.com/spaces-X)
* [@stalary](https://github.com/stalary)
* [@stdpain](https://github.com/stdpain)
* [@Stephen-Robin](https://github.com/Stephen-Robin)
* [@Sunt-ing](https://github.com/Sunt-ing)
* [@Taaang](https://github.com/Taaang)
* [@tarepanda1024](https://github.com/tarepanda1024)
* [@tianhui5](https://github.com/tianhui5)
* [@tinkerrrr](https://github.com/tinkerrrr)
* [@TobKed](https://github.com/TobKed)
* [@ucasfl](https://github.com/ucasfl)
* [@Userwhite](https://github.com/Userwhite)
* [@vinson0526](https://github.com/vinson0526)
* [@wangbo](https://github.com/wangbo)
* [@wangliansong](https://github.com/wangliansong)
* [@wangshuo128](https://github.com/wangshuo128)
* [@weajun](https://github.com/weajun)
* [@weihongkai2008](https://github.com/weihongkai2008)
* [@weizuo93](https://github.com/weizuo93)
* [@WindyGao](https://github.com/WindyGao)
* [@wunan1210](https://github.com/wunan1210)
* [@wuyunfeng](https://github.com/wuyunfeng)
* [@xhmz](https://github.com/xhmz)
* [@xiaokangguo](https://github.com/xiaokangguo)
* [@xiaoxiaopan118](https://github.com/xiaoxiaopan118)
* [@xinghuayu007](https://github.com/xinghuayu007)
* [@xinyiZzz](https://github.com/xinyiZzz)
* [@xuliuzhe](https://github.com/xuliuzhe)
* [@xxiao2018](https://github.com/xxiao2018)
* [@xy720](https://github.com/xy720)
* [@yangzhg](https://github.com/yangzhg)
* [@yx91490](https://github.com/yx91490)
* [@zbtzbtzbt](https://github.com/zbtzbtzbt)
* [@zenoyang](https://github.com/zenoyang)
* [@zh0122](https://github.com/zh0122)
* [@zhangboya1](https://github.com/zhangboya1)
* [@zhangstar333](https://github.com/zhangstar333)
* [@zuochunwei](https://github.com/zuochunwei) 

