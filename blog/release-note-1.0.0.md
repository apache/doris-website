---
{
    'title': '[Release Note] Apache Doris(Incubating) 1.0.0 Release',
    'summary': '[Release Note] Apache Doris(Incubating) 1.0.0 Release',
    'date': '2022-04-18',
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

# Apache Doris(Incubating) 1.0.0 Release

Dear community friends, after several months, we are happy to announce that Apache Doris (incubating) has officially released the 1.0 Release version on April 18, 2022! **This is the first 1-bit version of Apache Doris since it was incubated by the Apache Foundation, and it is also the version with the largest refactoring of the core code of Apache Doris so far****! **With **114 Contributors** committing **over 660 optimizations and fixes** for Apache Doris, thank you to everyone who makes Apache Doris even better!

In version 1.0, we introduced important functions such as vectorized execution engine, Hive external table, Lateral View syntax and Table Function table function, Z-Order data index, Apache SeaTunnel plug-in, etc., and added support for synchronous update and deletion of data in Flink CDC. Support, optimize many problems in the process of data import and query, and comprehensively enhance the query performance, ease of use, stability and other special effects of Apache Doris. Welcome to download and use! Click "**Read the original text**" at the end of the article to go directly to the download address.

Every day that has not been published, there are countless contributors behind it, who dare not stop for half a minute. Here we would like to especially thank the small partners from SIG (Special Interest Group) such as **vectorized execution engine, query optimizer, and visual operation and maintenance platform**. Since the establishment of the Apache Doris Community SIG group in August 2021, data from more than ten companies including Baidu, Meituan, Xiaomi, JD, Shuhai, ByteDance, Tencent, NetEase, Alibaba, PingCAP, Nebula Graph, etc. Ten contributors** joined the SIG as the first members, and for the first time completed the development of such major functions as the vectorized execution engine, query optimizer, and Doris Manager visual monitoring operation and maintenance platform in the form of open source collaboration of special groups. **During more than half a year, conducting technical research and sharing dozens of times, holding nearly 100 remote meetings, accumulatively submitting hundreds of Commits, involving more than 100,000 lines of code**, it is precisely because of their contributions , only the 1.0 version came out, let us once again express our most sincere thanks for their hard work!

At the same time, the number of Apache Doris contributors has exceeded 300, the number of monthly active contributors has exceeded 60, and the average weekly number of Commits submitted in recent weeks has also exceeded 80. The scale and activity of developers gathered by the community There has been a huge improvement. We are very much looking forward to having more small partners participate in the community contribution, and work with us to build Apache Doris into the world's top analytical database. We also hope that all small partners can reap valuable growth with us. If you would like to participate in the community, please contact us via the developer email dev@doris.apache.org.

We welcome you to contact us with any questions during the use process through GitHub Discussion or Dev mail group, and we look forward to your participation in community discussions and construction.


## Important update 

### Vectorized Execution Engine [Experimental]

In the past, the SQL execution engine of Apache Doris was designed based on the row-based memory format and the traditional volcano model. There was unnecessary overhead in performing SQL operator and function operations, which led to the limited efficiency of the Apache Doris execution engine, which did not Adapt to the architecture of modern CPUs. The goal of the vectorized execution engine is to replace the current row-based SQL execution engine of Apache Doris, fully release the computing power of modern CPUs, break through the performance limitations on the SQL execution engine, and exert extreme performance.

Based on the characteristics of modern CPUs and the execution characteristics of the volcano model, the vectorized execution engine redesigned the SQL execution engine in the columnar storage system:

- Reorganized the data structure of memory, replaced Tuple with Column, improved Cache affinity, branch prediction and prefetch memory friendliness during calculation
- Type judgment is performed in batches. In this batch, the type determined during type judgment is used, and the virtual function cost of type judgment of each line is allocated to the batch level.
- Through batch-level type judgment, virtual function calls are eliminated, allowing the compiler to have the opportunity for function inlining and SIMD optimization

This greatly improves the efficiency of the CPU when executing SQL and improves the performance of SQL queries.

In Apache Doris version 1.0, enabling the vectorized execution engine with set batch_size = 4096 and set enable_vectorized_engine = true can significantly improve query performance in most cases. Under the SSB and OnTime standard test datasets, the overall performance of the two scenarios of multi-table association and wide-column query is improved by 3 times and 2.6 times respectively.

![](/images/blogs/1.0/1.0.0-1.png)

![](/images/blogs/1.0/1.0.0-2.png)

### Lateral View Grammar [Experimental]

Through Lateral View syntax, we can use Table Function table functions such as explode_bitmap, explode_split, explode_jaon_array, etc., to expand bitmap, String or Json Array from one column into multiple rows, so that the expanded data can be further processed (such as Filter, Join, etc.) .

### Hive External Table [Experimental]

Hive External Table provides users with the ability to directly access Hive tables through Doris. External tables save the tedious data import work, and can use Doris's own OLAP capabilities to solve data analysis problems of Hive tables. The current version supports connecting Hive data sources to Doris, and supports federated queries through data in Doris and Hive data sources for more complex analysis operations.

### Support Z-Order data sorting format

Apache Doris data is sorted and stored according to the prefix column, so when the prefix query condition is included, fast data search can be performed on the sorted data, but if the query condition is not a prefix column, the data sorting feature cannot be used for fast data search. The above problems can be solved by Z-Order Indexing. In version 1.0, we have added the Z-Order data sorting format, which can play a good filtering effect in the scenario of kanban multi-column query and accelerate the filtering performance of non-prefix column conditions. .

### Support for Apache SeaTunnel (Incubating) plugin

Apache SeaTunnel is a high-performance distributed data integration framework built on Apache Spark and Apache Flink. In the 1.0 version of Apache Doris, we have added the SaeTunnel plugin, users can use Apache SeaTunnel for synchronization and ETL between multiple data sources.

### New Function

More bitmap functions are supported, see the function manual for details:

- bitmap_max
- bitmap_and_not
- bitmap_and_not_count
- bitmap_has_all
- bitmap_and_count
- bitmap_or_count
- bitmap_xor_count
- bitmap_subset_limit
- sub_bitmap

Support national secret algorithm SM3/SM4;



> **Note**: The functions marked [Experimental] above are experimental functions. We will continue to optimize and iterate on the above functions in subsequent versions, and further improve them in subsequent versions. If you have any questions or comments during use, please feel free to contact us

### Important Optimization

### Features Optimization

* Reduced the number of segment files generated when importing in large batches to reduce Compaction pressure.
* Transfer data through BRPC's attachment function to reduce serialization and deserialization overhead during query.
* Support to directly return binary data of HLL/BITMAP type for external analysis of business.
* Optimize and reduce the probability of OVERCROWDED and NOT_CONNECTED errors in BRPC, and enhance system stability.
* Enhance the fault tolerance of import.
* Support to update and delete data synchronously through Flink CDC.
* Support adaptive Runtime Filter.
* Significantly reduce the memory footprint of insert into operations


### Usability Improvements

* Routine Load supports displaying the current offset delay number and other status.
* Added statistics on peak memory usage of queries in FE audit log.
* Added missing version information to Compaction URL results to facilitate troubleshooting.
* Support marking BE as non-queryable or non-importable to quickly screen problem nodes.

### Important Bug Fixes

* Fixed several query errors.
* Fixed some scheduling logic issues in Broker Load.
* Fix the problem that the metadata cannot be loaded due to the STREAM keyword.
* Fixed Decommission not executing correctly.
* Fix the problem that -102 error may occur when operating Schema Change operation in some cases.
* Fix the problem that using String type may cause BE to crash in some cases.

### Other

* Added Minidump function; easy to locate when problems occur

## Changelog

For detailed Release Note, please check the link:

https://github.com/apache/incubator-doris/issues/8549

## Thanks  

The release of Apache Doris(incubating) 1.0 Release version is inseparable from the support of all community users. I would like to express my gratitude to all community contributors who participated in version design, development, testing and discussion. They are:

```
@924060929
@adonis0147
@Aiden-Dong
@aihai
@airborne12
@Alibaba-HZY
@amosbird
@arthuryangcs
@awakeljw
@bingzxy
@BiteTheDDDDt
@blackstar-baba
@caiconghui
@CalvinKirs
@cambyzju
@caoliang-web
@ccoffline
@chaplinthink
@chovy-3012
@ChPi
@DarvenDuan
@dataalive
@dataroaring
@dh-cloud
@dohongdayi
@dongweizhao
@drgnchan
@e0c9
@EmmyMiao87
@englefly
@eyesmoons
@freemandealer
@Gabriel39
@gaodayue
@GoGoWen
@Gongruixiao
@gwdgithubnom
@HappenLee
@Henry2SS
@hf200012
@htyoung
@jacktengg
@jackwener
@JNSimba
@Keysluomo
@kezhenxu94
@killxdcj
@lihuigang
@littleeleventhwolf
@liutang123
@liuzhuang2017
@lonre
@lovingfeel
@luozenglin
@luzhijing
@MeiontheTop
@mh-boy
@morningman
@mrhhsg
@Myasuka
@nimuyuhan
@obobj
@pengxiangyu
@qidaye
@qzsee
@renzhimin7
@Royce33
@SleepyBear96
@smallhibiscus
@sodamnsure
@spaces-X
@sparklezzz
@stalary
@steadyBoy
@tarepanda1024
@THUMarkLau
@tianhui5
@tinkerrrr
@ucasfl
@Userwhite
@vinson0526
@wangbo
@wangshuo128
@wangyf0555
@weajun
@weizuo93
@whutpencil
@WindyGao
@wunan1210
@xiaokang
@xiaokangguo
@xiedeyantu
@xinghuayu007
@xingtanzjr
@xinyiZzz
@xtr1993
@xu20160924
@xuliuzhe
@xuzifu666
@xy720
@yangzhg
@yiguolei
@yinzhijian
@yjant
@zbtzbtzbt
@zenoyang
@zh0122
@zhangstar333
@zhannngchen
@zhengshengjun
@zhengshiJ
@ZhikaiZuo
@ztgoto
@zuochunwei
```

