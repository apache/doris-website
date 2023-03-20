---
{
    'title': 'Apache Doris announced the official release of version 1.2.3',
    'summary': 'Dear community, we are excited to announce the release of Apache Doris 1.2.3 on March 30, 2023. We have made over 200 enhancements and bug fixes in this new version. Upgrade now and enjoy higher stability and ease of use!',
    'date': '2023-03-20',
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

## Improvement

- JDBC Catalog
  - Support connecting to Doris clusters through JDBC Catalog.
    - https://doris.apache.org/zh-CN/docs/dev/lakehouse/multi-catalog/jdbc#doris
  - Support to synchronize only the specified database through the `only_specified_database` attribute.
  - Support synchronizing table names in the form of lowercase through `lower_case_table_names`  to solve the problem of case sensitivity of table names.
    - https://doris.apache.org/zh-CN/docs/dev/lakehouse/multi-catalog/jdbc
  - Optimize the read performance of JDBC Catalog.
- Elasticsearch Catalog
  - Support Array type mapping.
  - Support whether to push down the `like` expression through the `like_push_down` attribute to control the CPU overhead of the ES cluster.
    - https://doris.apache.org/zh-CN/docs/dev/lakehouse/multi-catalog/es
- Hive Catalog
  - Support Hive table default partition `__HIVE_DEFAULT_PARTITION__`.
  - Hive Metastore metadata automatic synchronization supports notification event in compressed format.
- Dynamic partition supports specifying the `storage_medium` parameter to control the storage medium of the newly added partition.
  - https://doris.apache.org/zh-CN/docs/dev/advanced/partition/dynamic-partition
- Optimize BE's threading model to avoid stability problems caused by frequent thread creation and destroy.

## Bug Fixes

- Fixed issues with Merge-On-Write Unique Key tables.
- Fixed compaction related issues.
- Fixed some delete statement issues causing data errors.
- Fixed several query execution errors.
- Fixed the problem of using JDBC catalog to cause BE crash on some operating system.
- Fixed Multi-Catalog issues.
- Fixed memory statistics and optimization issues.
- Fixed decimalV3 and date/datetimev2 related issues.
- Fixed load transaction stability issues.
- Fixed light-weight schema change issues.
- Fixed the issue of using `datetime` type for batch partition creation.
- Fixed the problem that a large number of failed broker loads would cause the FE memory usage to be too high.
- Fixed the problem that stream load cannot be canceled after dropping the table.
- Fixed querying `information_schema` timeout in some cases.
- Fixed the problem of BE crash caused by concurrent data export using `select outfile`.
- Fixed transactional insert operation memory leak.
- Fixed several query/load profile issues, and supports direct download of profiles through FE web ui.
- Fixed the problem that the BE tablet GC thread caused the IO util to be too high.
- Fixed the problem that the commit offset is inaccurate in Kafka routine load.

## Big Thanks

Thanks all who contribute to this release:

[@zy-kkk](https://github.com/zy-kkk)
[@zhannngchen](https://github.com/zhannngchen)
[@ZhangYu0123](https://github.com/ZhangYu0123)
[@zhangstar333](https://github.com/zhangstar333)
[@zclllyybb](https://github.com/zclllyybb)
[@yuxuan-luo](https://github.com/yuxuan-luo)
[@yixiutt](https://github.com/yixiutt)
[@yiguolei](https://github.com/yiguolei)
[@yangzhg](https://github.com/yangzhg)
[@xinyiZzz](https://github.com/xinyiZzz)
[@XieJiann](https://github.com/XieJiann)
[@xiaokang](https://github.com/xiaokang)
[@WuWQ98](https://github.com/WuWQ98)
[@WinkerDu](https://github.com/WinkerDu)
[@wangbo](https://github.com/wangbo)
[@TangSiyang2001](https://github.com/TangSiyang2001)
[@SWJTU-ZhangLei](https://github.com/SWJTU-ZhangLei)
[@starocean999](https://github.com/starocean999)
[@stalary](https://github.com/stalary)
[@sohardforaname](https://github.com/sohardforaname)
[@SaintBacchus](https://github.com/SaintBacchus)
[@qzsee](https://github.com/qzsee)
[@qidaye](https://github.com/qidaye)
[@platoneko](https://github.com/platoneko)
[@nextdreamblue](https://github.com/nextdreamblue)
[@mrhhsg](https://github.com/mrhhsg)
[@morrySnow](https://github.com/morrySnow)
[@morningman](https://github.com/morningman)
[@maochongxin](https://github.com/maochongxin)
[@luwei16](https://github.com/luwei16)
[@luozenglin](https://github.com/luozenglin)
[@liaoxin01](https://github.com/liaoxin01)
[@Kikyou1997](https://github.com/Kikyou1997)
[@Jibing-Li](https://github.com/Jibing-Li)
[@jacktengg](https://github.com/jacktengg)
[@htyoung](https://github.com/htyoung)
[@HappenLee](https://github.com/HappenLee)
[@Gabriel39](https://github.com/Gabriel39)
[@freemandealer](https://github.com/freemandealer)
[@englefly](https://github.com/englefly)
[@eldenmoon](https://github.com/eldenmoon)
[@dutyu](https://github.com/dutyu)
[@Doris-Extras](https://github.com/Doris-Extras)
[@chenlinzhong](https://github.com/chenlinzhong)
[@catpineapple](https://github.com/catpineapple)
[@Cai-Yao](https://github.com/Cai-Yao)
[@caiconghui](https://github.com/caiconghui)
[@ByteYue](https://github.com/ByteYue)
[@BiteTheDDDDt](https://github.com/BiteTheDDDDt)
[@Bingandbing](https://github.com/Bingandbing)
@BePPPower
@adonis0147

