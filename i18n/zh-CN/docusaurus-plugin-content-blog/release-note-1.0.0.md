---
{
    'title': '[Doris 发版通告] Apache Doris(Incubating) 1.0.0 Release',
    'summary': '[Doris 发版通告] Apache Doris(Incubating) 1.0.0 Release',
    'date': '2022-04-18',
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

# Apache Doris(Incubating) 1.0.0 Release

亲爱的社区小伙伴们，历时数月，我们很高兴地宣布，Apache Doris (incubating) 于 2022 年 4 月 18 日迎来了 1.0 Release 版本的正式发布！**这是 Apache Doris 在进入 Apache 基金会孵化以来的第一个 1 位版本，也是迄今为止对 Apache Doris 核心代码重构幅度最大的一个版本\*\***！**有 **114 位 Contributor** 为 Apache Doris 提交了**超过 660 项优化和修复\*\*，感谢每一个让 Apache Doris 变得更好的你！

在 1.0 版本中，我们引入了向量化执行引擎、Hive 外部表、Lateral View 语法及 Table Function 表函数、Z-Order 数据索引、Apache SeaTunnel 插件等重要功能，增加了对 Flink CDC 同步更新和删除数据的支持，优化了诸多数据导入和查询过程中的问题，对 Apache Doris 的查询性能、易用性、稳定性等多方特效进行了全面加强，欢迎大家下载使用！点击文末“**阅读原文**”即可直接前往下载地址。

每一个不曾发版的日子，背后都有无数贡献者枕戈待旦，不敢停歇半分。在此我们尤其要感谢来自**向量化执行引擎、查询优化器、可视化运维平台 等 SIG （专项兴趣小组）的小伙伴**。自 2021 年 8 月 Apache Doris 社区 SIG 小组成立以来，**来自百度、美团、小米、京东、蜀海、字节跳动、腾讯、网易、阿里巴巴、PingCAP、Nebula Graph 等十余家公司的数十名贡献者**作为首批成员加入到 SIG 中，第一次以专项小组的开源协作形式完成了向量化执行引擎、查询优化器、 Doris Manager 可视化监控运维平台等如此重大功能的开发，**历时半年以上、开展技术调研和分享数十次、召开远程会议近百次、累计提交 Commits 多达数百个、涉及代码行数高达十余万行**，正是因为有他们的贡献，才有 1.0 版本的问世，让我们再次对他们的辛勤付出表示最真诚的感谢！

与此同时，Apache Doris 的贡献者数量已超过 300 人，每月活跃的贡献者数量超过了 60 人，近几周平均每周提交的 Commits 数量也超过 80，社区聚集的开发者规模及活跃度已经有了极大的提升。我们十分期待有更多的小伙伴参与社区贡献中来，与我们一道把 Apache Doris 打造成全球顶级的分析型数据库，也期待所有小伙伴可以与我们一起收获宝贵的成长。如果你想参与社区，欢迎通过开发者邮箱 dev@doris.apache.org 与我们取得联系。

我们欢迎大家在使用过程中，有任何问题通过 GitHub Discussion 或者 Dev 邮件组与我们取得联系，也期待大家参与社区讨论和建设中 。

## 重要更新

### 向量化执行引擎 [Experimental]

过去 Apache Doris 的 SQL 执行引擎是基于行式内存格式以及基于传统的火山模型进行设计的，在进行 SQL 算子与函数运算时存在非必要的开销，导致 Apache Doris 执行引擎的效率受限，并不适应现代 CPU 的体系结构。向量化执行引擎的目标是替换 Apache Doris 当前的行式 SQL 执行引擎，充分释放现代 CPU 的计算能力，突破在 SQL 执行引擎上的性能限制，发挥出极致的性能表现。

基于现代 CPU 的特点与火山模型的执行特点，向量化执行引擎重新设计了在列式存储系统的 SQL 执行引擎：

-   重新组织内存的数据结构，用 Column 替换 Tuple，提高了计算时 Cache 亲和度，分支预测与预取内存的友好度
-   分批进行类型判断，在本次批次中都使用类型判断时确定的类型，将每一行类型判断的虚函数开销分摊到批量级别。
-   通过批级别的类型判断，消除了虚函数的调用，让编译器有函数内联以及 SIMD 优化的机会

从而大大提高了 CPU 在 SQL 执行时的效率，提升了 SQL 查询的性能。

在 Apache Doris 1.0 版本中，通过 set batch_size = 4096 和 set enable_vectorized_engine = true 开启向量化执行引擎，多数情况下可显著提升查询性能。在 SSB 和 OnTime 标准测试数据集下，多表关联和宽列查询两大场景的整体性能分别有 3 倍和 2.6 倍的提升。

![](/images/blogs/1.0/1.0.0-1.png)

![](/images/blogs/1.0/1.0.0-2.png)

### Lateral View 语法 [Experimental]

通过 Lateral View 语法，我们可以使用 explod_bitmap 、explode_split、explode_jaon_array 等 Table Function 表函数，将 bitmap、String 或 Json Array 由一列展开成多行，以便后续可以对展开的数据进行进一步处理（如 Filter、Join 等）。

### Hive 外表 [Experimental]

Hive External Table 为用户提供了通过 Doris 直接访问 Hive 表的能力，外部表省去了 繁琐的数据导入工作，可以借助 Doris 本身 OLAP 的能力来解决 Hive 表的数据分析问题。当前版本支持将 Hive 数据源接入 Doris，并支持通过 Doris 与 Hive 数据源中的数据进行联邦查询，进行更加复杂的分析操作。

### 支持 Z-Order 数据排序格式

Apache Doris 数据是按照前缀列排序存储的，因此在包含前缀查询条件时，可以在排序数据上进行快速的数据查找，但如果查询条件不是前缀列，则无法利用数据排序的特征进行快速数据查找。通过 Z-Order Indexing 可以解决上述问题，在 1.0 版本中我们增加了 Z-Order 数据排序格式，在看板类多列查询的场景中可以起到很好过滤效果，加速对非前缀列条件的过滤性能。

### 支持 Apache SeaTunnel（Incubating）插件

Apache SeaTunnel 是一个高性能的分布式数据集成框架，架构于 Apache Spark 和 Apache Flink 之上。在 Apache Doris 1.0 版本中，我们增加了 SaeTunnel 插件，用户可以借助 Apache SeaTunnel 进行多数据源之间的同步和 ETL。

### 新增函数

支持更多 bitmap 函数，具体可查看函数手册：

-   bitmap_max
-   bitmap_and_not
-   bitmap_and_not_count
-   bitmap_has_all
-   bitmap_and_count
-   bitmap_or_count
-   bitmap_xor_count
-   bitmap_subset_limit
-   sub_bitmap

支持国密算法 SM3/SM4；

> **注意**：以上标记 [Experimental] 的功能为实验性功能，我们将会在后续版本中对以上功能进行持续优化和迭代，并后续版本中进一步完善。在使用过程中有任何问题或意见，欢迎随时与我们联系

### 重要优化

### 功能优化

-   降低大批量导入时，生成的 Segment 文件数量，以降低 Compaction 压力。
-   通过 BRPC 的 attachment 功能传输数据，以查询过程中的降低序列化和反序列化开销。
-   支持直接返回 HLL/BITMAP 类型的二进制数据，用于业务在外侧解析。
-   优化并降低 BRPC 出现 OVERCROWDED 和 NOT_CONNECTED 错误的概率，增强系统稳定性。
-   增强导入的容错性。
-   支持通过 Flink CDC 同步更新和删除数据。
-   支持自适应的 Runtime Filter。
-   显著降低 insert into 操作的内存占用

### 易用性改进

-   Routine Load 支持显示当前 offset 延迟数量等状态。
-   FE audit log 中增加查询峰值内存使用量的统计。
-   Compaction URL 结果中增加缺失版本的信息，方便排查问题。
-   支持将 BE 标记为不可查询或不可导入，以快速屏蔽问题节点。

### 重要 Bug 修复

-   修复若干查询错误问题。
-   修复 Broker Load 若干调度逻辑问题。
-   修复 STREAM 关键词导致元数据无法加载的问题。
-   修复 Decommission 无法正确执行的问题。
-   修复部分情况下操作 Schema Change 操作可能出现 -102 错误的问题。
-   修复部分情况下使用 String 类型可能导致 BE 宕机的问题。

### 其他

-   增加 Minidump 功能；

## 更新日志

详细 Release Note 请查看链接：

https://github.com/apache/incubator-doris/issues/8549

## 致谢

Apache Doris(incubating) 1.0 Release 版本的发布离不开所有社区用户的支持，在此向所有参与版本设计、开发、测试、讨论的社区贡献者们表示感谢，他们分别是：

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
