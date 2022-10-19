---
{
    'title': '[Doris 发版通告] Apache Doris(Incubating) 0.15.0 Release',
    'summary': '[Doris 发版通告] Apache Doris(Incubating) 0.15.0 Release',
    'date': '2021-11-29',
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

# Apache Doris(Incubating) 0.15.0 Release

亲爱的社区小伙伴们，历时数个月精心打磨，我们很高兴地宣布， Apache Doris(incubating) 于 2021 年 11 月 29 日迎来了 0.15.0 Release 版本的正式发布！有 99 位 Contributor 为 Apache Doris 提交了近 700 项优化和修复，在此我们也对所有贡献者表示最真诚的感激！

在 0.15.0 Release 版本中，我们增加了诸多新功能，对 Apache Doris 的查询性能、易用性、稳定性方面等进行了全面优化：新增资源划分和隔离功能，用户可以通过资源标签的方式将集群中的 BE 节点划分为资源组，实现对在线、离线业务的统一管理和资源隔离；增加了 Runtime Filter 及 Join Reorder 功能，对多表 Join 场景的查询效率进行了大幅提升，在 Star Schema Benchmark 测试数据集下有 2-10 倍的性能提升；新增导入方式 Binlog Load ，使 Doris 可以增量同步 MySQL 中对数据更新操作的 CDC ；支持 String 列类型，长度最大支持 2GB ；支持 List 分区功能，可以通过枚举值创建分区；支持 Unique Key 模型上的 Update 语句；Spark-Doris-Connector 支持数据写入 Doris ……还有更多重要特性，欢迎大家下载使用。

我们欢迎大家在使用过程中，有任何问题通过 GitHub Discussion 或者 Dev 邮件组与我们取得联系，也期待大家参与社区讨论和建设中 。


## 重要更新 

### 资源划分与隔离

用户可以通过资源标签的方式将一个 Doris 集群中的 BE 节点划分成多个资源组，从而可以进行在线、离线业务的统一管理和节点级别的资源隔离。
同时，还可以通过限制单个查询任务的 CPU、内存开销以及复杂度，来控制单个查询的资源开销，从而降低不同查询之间的资源抢占问题。

### 性能优化

* Runtime Filter 功能通过使用 Join 算子中右表的 Join Key 列条件来过滤左表的数据，在大部分 Join 场景下可以显著提升查询效率。如在 Star Schema Benchmark ( TPCH 的精简测试集) 下可以获得 2-10 倍的性能提升。

* Join Reorder 功能可以通过通过代价模型自动帮助调整 SQL 中 Join 的顺序，以帮助获得最优的 Join 效率。
可通过会话变量  `set enable_cost_based_join_reorder=true`  开启。

### 新增功能

* 支持直接对接 Canal Server 同步 MySQL binlog 数据。
* 支持 String 列类型，最大支持 2GB 。
* 支持 List 分区功能，可以针对枚举值创建分区。
* 支持事务性 Insert 语句功能。可以通过 begin ; insert ; insert; ,... ; commit ; 的方式批量导入数据。
* 支持在 Unique Key 模型上的 Update 语句功能。可以在 Unique Key 模型表上执行 Update Set where 语句。
* 支持 SQL 阻塞名单功能。可以通过正则、Hash 值匹配等方式阻止部分 SQL 的执行。
* 支持 LDAP 登陆验证。

### 拓展功能

* 支持 Flink-Doris-Connector 。
* 支持 DataX doriswriter 插件。
* Spark-Doris-Connector 支持数据写入 Doris 。


## 功能优化 

### 查询

* 支持在 SQL 查询规划阶段，利用 BE 的函数计算能力计算所有常量表达式。

### 导入

* 支持导入文本格式文件时，指定多字节行列分隔符或不可见分隔符。
* 支持通过 Stream Load 导入压缩格式文件。
* Stream Load支持导入多行格式的 Json 数据。

### 导出

* 支持 Export 导出功能指定 where 过滤条件。支持导出文件使用多字节行列分隔符。支持导出到本地文件。
* Export 导出功能支持仅导出指定的列。
* 支持通过 outfile 语句导出结果集到本地磁盘，并支持导出后写入导出成功的标记文件。

### 易用性

* 动态分区功能支持创建、保留指定的历史分区、支持自动冷热数据迁移设置。
* 支持在命令行使用可视化的树形结构展示查询、导入的计划和 Profile。
* 支持记录并查看 Stream Load 操作日志。
* 通过 Routine Load 消费 Kafka 数据时，可以指定时间点进行消费。
* 支持通过 show create routine load 功能导出 Routine Load 的创建语句。
* 支持通过 pause/resume all routine load 命令一键启停所有 Routine Load Job。
* 支持通过 alter routine load 语句修改 Routine Load 的 Broker List 和 Topic。
* 支持 create table as select 功能。
* 支持通过 alter table 命令修改列注释和表注释。
* show tablet status 增加表创建时间、数据更新时间。
* 支持通过 show data skew 命令查看表的数据量分布，以排查数据倾斜问题。
* 支持通过 show/clean trash 命令查看 BE 文件回收站的磁盘占用情况并主动清除。
* 支持通过 show view 语句展示一个表被哪些视图所引用。

### 新增函数

* `bitmap_min`, `bit_length`
* `yearweek`, `week`, `makedate`
* `percentile` 精确百分位函数
* `json_array`，`json_object`，`json_quote`
* 支持为 `AES_ENCRYPT` 和 `AES_DECRYPT` 函数创建自定义公钥。
* 支持通过 `create alias function` 创建函数别名来组合多个函数。

### 其他

* 支持访问 SSL 连接协议的ES外表。
* 支持在动态分区属性中指定热点分区的数量，热点分区将存储在 SSD 磁盘中。
* 支持通过 Broker Load 导入 Json 格式数据。
* 支持直接通过 libhdfs3 库访问 HDFS 进行数据的导入导出，而不需要 Broker 进程。
* select into outfile 功能支持导出 Parquet 文件格式，并支持并行导出。
* ODBC 外表支持 SQLServer。 

## 致谢  

Apache Doris(incubating) 0.15.0 Release 版本的发布离不开所有社区用户的支持，在此向所有参与版本设计、开发、测试、讨论的社区贡献者们表示感谢，他们分别是：

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

