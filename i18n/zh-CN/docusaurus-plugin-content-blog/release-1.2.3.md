---
{
    'title': 'Apache Doris 1.2.3 Release 版本正式发布',
    'summary': 'Apache Doris 于 2023 年 3 月 20 日迎来 1.2.3 Release 版本的正式发布！欢迎大家下载使用',
    'date': '2023-03-20',
    'author': 'Apache Doris',
    'tags': ['版本发布'],
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

亲爱的社区小伙伴们，我们很高兴地宣布，**Apache Doris 于 2023 年 3 月 20 日迎来 1.2.3 Release 版本的正式发布**！在新版本中包含超过 200 项功能优化和问题修复。同时，1.2.3 版本作为 1.2 LTS 的迭代版本，**更加稳定易用，建议用户升级到这个版本**。

**GitHub下载：**https://github.com/apache/doris/releases/tag/1.2.3-rc02

**官网下载页：**https://doris.apache.org/zh-CN/download


# Improvement

### JDBC Catalog 

- 支持通过 JDBC Catalog 连接到另一个 Doris 数据库。

参考文档：[https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc/#doris](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc/#doris)

- 支持通过参数 `only_specified_database` 来同步指定的数据库。

- 支持通过 `lower_case_table_names` 参数控制是否以小写形式同步表名，解决表名区分大小写的问题。

参考文档：[https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc)

- 优化 JDBC Catalog 的读取性能。

### Elasticsearch Catalog

- 支持 Array 类型映射。

- 支持通过 `like_push_down` 属性下推 like 表达式来控制 ES 集群的 CPU 开销。

参考文档：[https://doris.apache.org/docs/dev/lakehouse/multi-catalog/es](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/es)

### Hive Catalog

- 支持 Hive 表默认分区 `__HIVE_DEFAULT_PARTITION__`。

- Hive Metastore 元数据自动同步支持压缩格式的通知事件。

### 动态分区优化

- 支持通过 storage_medium 参数来控制创建动态分区的默认存储介质。

参考文档：[https://doris.apache.org/docs/dev/advanced/partition/dynamic-partition](https://doris.apache.org/docs/dev/advanced/partition/dynamic-partition)


### 优化 BE 的线程模型

- 优化 BE 的线程模型，以避免频繁创建和销毁线程所带来的稳定性问题。

# Bug 修复

- 修复了部分 Unique Key 模型 Merge-on-Write 表的问题；

- 修复了部分 Compaction 相关问题；

- 修复了部分 Delete 语句导致的数据问题；

- 修复了部分 Query 执行问题；

- 修复了在某些操作系统上使用 JDBC Catalog 导致 BE 宕机的问题；

- 修复了部分 Multi-Catalog 的问题；

- 修复了部分内存统计和优化问题；

- 修复了部分 DecimalV3 和 date/datetimev2 的相关问题。

- 修复了部分导入过程中的稳定性问题；

- 修复了部分 Light Schema Change 的问题；

- 修复了使用 `datetime` 类型无法批量创建分区的问题;

- 修复了大量失败的 Broker Load 作业导致 FE 内存使用率过高的问题;

- 修复了删除表后无法取消 Stream Load 的问题；

- 修复了某些情况下查询 `information_schema` 库表超时的问题；

- 修复了使用 `select outfile` 并发数据导出导致 BE 宕机的问题；

- 修复了事务性 Insert 操作导致内存泄漏的问题；

- 修复了 BE Tablet GC 线程导致 IO 负载过高的问题；

- 修复了 Kafka Routine Load 中提交 Offset 不准确的问题。

# 致谢

Apache Doris 1.2.3 版本的发布离不开所有社区用户的支持，在此向所有参与版本设计、开发、测试、讨论的社区 52 位贡献者们表示感谢，他们分别是：

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

