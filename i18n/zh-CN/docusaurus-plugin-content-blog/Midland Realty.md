---
{
    'title': 'Apache Doris 在美联物业的数据仓库应用实践，助力传统行业数字化革新',
    'summary': "本文主要介绍美联物业基于 Apache Doris 在数据体系方面的建设，以及对数据仓库搭建经验进行的分享和介绍，旨在为数据量不大的传统企业提供一些数仓思路，实现数据驱动业务，低成本、高效的进行数仓改造。",
    'date': '2023-05-12',
    'author': '谢帮桂',
    'tags': ['最佳实践'],
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



**导读：** 传统行业面对数字化转型往往会遇到很多困难，比如缺乏数据管理体系、数据需求开发流程冗长、烟囱式开发、过于依赖纸质化办公等，美联物业也有遇到类似的问题。本文主要介绍美联物业基于 [Apache Doris](https://github.com/apache/doris) 在数据体系方面的建设，以及对数据仓库搭建经验进行的分享和介绍，旨在为数据量不大的传统企业提供一些数仓思路，实现数据驱动业务，低成本、高效的进行数仓改造。

作者｜美联物业数仓负责人 谢帮桂

美联物业属于香港美联集团成员，于 1973 年成立，并于 1995 年在香港联合交易所挂牌上市(香港联交所编号:1200)，2008 年美联工商铺于主板上市（香港联交所编号:459）， 成为拥有两家上市公司的地产代理企业。拥有 40 余载房地产销售行业经验，业务涵盖中、小型住宅、豪宅及工商铺，提供移民顾问、金融、测量、按揭转介等服务，业务遍布中国香港地区、中国澳门地区和中国内地等多个重要城市。

本文主要介绍关于美联物业在数据体系方面的建设，以及对数据仓库搭建经验进行的分享和介绍，旨在为数据量不大的传统企业提供一些数仓思路，实现数据驱动业务，低成本、高效的进行数仓改造。

*考虑隐私政策，本文不涉及公司任何具体业务数据。*

# 业务背景

美联物业早在十多年前就已深入各城市开展房地产中介业务，数据体系的建设和发展与大多数传统服务型公司类似，经历过几个阶段时期，如下图所示。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/99156394583e4c289c81872b1ebbace5~tplv-k3u1fbpfcp-zoom-1.image)

我们的数据来源于大大小小的子业务系统和部门手工报表数据等，存在历史存量数据庞大，数据结构多样复杂，数据质量差等普遍性问题。此外，早期业务逻辑处理多数是使用关系型数据库 SQL Server 的存储过程来实现，当业务流程稍作变更，就需要投入大量精力排查存储过程并进行修改，使用及维护成本都比较高。

**基于此背景，我们面临的挑战可以大致归纳为以下几点：**

-   缺乏数据管理体系，统计口径统一，已有数据无法降本复用。多部门、多系统、多字段，命名随意、表违反范式结构混乱；对同一业务来源数据无法做到多份报表复用，反复在不同报表编写同一套计算逻辑。
-   海量数据下性能不足，查询响应慢。历史大多数业务数据存储在关系型数据库中，分表分库已无法做到上亿数据秒级分析查询。
-   数据需求开发流程冗长、烟囱式开发。每当业务部门提出一个数据需求，数据开发就需要在多个系统之间进行数据兼容编写存储过程，从而导致存储过程的可移植性和可读性都非常差。
-   部门之间严重依赖文本文档处理工作，效率低下。由于长期的手工统计，用户已形成习惯，导致对信息系统的信任程度也比较低。

# 早期架构

针对上述的⼏个需求，我们在平台建设的初期选⽤了 Hadoop、Hive、Spark 构建最初的离线数仓架构，也是比较普遍、常见的架构，运作原理不进行过多赘述。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a80f8ff750a04761b6d97eb1fdfc0250~tplv-k3u1fbpfcp-zoom-1.image)

我们数据体系主要服务对象以内部员工为主，如房产经纪人、后勤人员、行政人事、计算机部门，房产经纪在全国范围内分布广泛，也是我们的主要服务对象。当前数据体系还无需面向 C 端用户，因此在数据计算和资源方面的压力并不大，早期基于 Hadoop 的架构可以满足一部分基本的需求。但是随着业务的不断发展、内部人员对于数据分析的复杂性、分析的效率也越来越高，该架构的弊端日益越发的明显，主要体现为以下几点：

-   过于笨重：传统公司的计算量和数据量并不大，使用 Hadoop 过于浪费。
-   效率低下：T+1 的调度时效和脚本，动辄需要花费 1 小时的计算时间导入导出，效率低、影响数据的开发工作。
-   维护成本高：组件过多，排查故障链路过长，运维成本也很高，且部门同事之间熟悉各个组件需要大量学习和沟通成本。

# 新数仓架构

基于上述业务需求及痛点，我们开始了架构升级，并希望在这次升级中实现几个目标：

-   初步建立数据管理体系，搭建数据仓库。
-   搭建报表平台和报表快速开发流程体系。
-   实现数据需求能够快速反应和交付（1小时内），查询延迟不超过 10s。
-   最小成本原则构建架构，支持滚动扩容。

## 技术选型

经过调研了解以及朋友推荐，我们了解到了 Apache Doris ，并很快与社区取得了联系，Apache Doris 的几大优势吸引了我们：

**足够简单**

美联物业及大部分传统公司的数据人员除了需要完成数据开发工作之外，还需要兼顾运维和架构规划的工作。因此我们选择数仓组件的第一原则就是"简单"，简单主要包括两个方面：

-   使用简单：Apache Doris 兼容 MySQL 协议，支持标准 SQL，有利于开发效率和共识统一，此外，Doris 的 ETL 编写脚本主要使用 SQL进行开发，使用 MySQL 协议登陆使用，兼容多数 MySQL 语法，提供丰富的数据分析函数，省去了 UDF 开发工作。
-   架构简单：Doris 的组件架构由 FE+BE 两类进程组成，不依赖其他系统，升级扩容非常方便，故障排查链路非常清晰，有利于运维成本的降低。

**极速性能**

Doris 依托于列式存储引擎、自动分区分桶、向量计算、多方面 Join 优化和物化视图等功能的实现，可以覆盖众多场景的查询优化，海量数据也能可以保证低延迟查询，实现分钟级或秒级响应。

**极低成本**

降本提效已经成为现如今企业发展的常态，免费的开源软件就比较满足我们的条件，另外基于 Doris 极简的架构、语言的兼容、丰富的生态等，为我们节省了不少的资源和人力的投入。并且 Doris 支持 PB 级别的存储和分析，对于存量历史数据较大、增量数据较少的公司来说，仅用 5-8 个节点就足以支撑上线使用。

**社区活跃**

截止目前，Apache Doris 已开源数年，并已支持全国超 1500 企业生产使用，其健壮性、稳定性不可否认。另外社区非常活跃，SelectDB 为社区组建了专职的技术支持团队，任何问题均能快速反馈，提供无偿技术支持，使用起来没有后顾之忧。

## **运行架构**

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/35e83ee5515648779a8baaff2cc11d07~tplv-k3u1fbpfcp-zoom-1.image)

在对 Apache Doris 进一步测试验证之后，我们完全摒弃了之前使用 Hadoop、Hive、Spark 体系建立的数仓，决定基于 Doris 对架构进行重构，以 Apache Doris 作为数仓主体进行开发：

-   数据集成：利用 DataX、Flink CDC 和 Apache Doris 的 Multi Catalog 功能等进行数据集成。
-   数据管理：利用 Apache Dolphinscheduler 进行脚本开发的生命周期管理、多租户人员的权限管理、数据质量监察等。
-   监控告警：采用 Grafana + Prometheus + Loki 进行监控告警，Doris 的各项监控指标可以在上面运行，解决了对组件资源和日志的监控问题。
-   数据服务：使用帆软 Report 为用户提供数据查询和分析服务，帆软支持表单制作和数据填报等功能，支持自助取数和自助分析。

### **数据模型**

**1）纵向分域**

房地产中介行业的大数据主题大致如下，一般会根据这些主题进行数仓建模。建模主题域核心围绕"企业用户"、"客户"、"房源"、"组织"等几个业务实体展开，进行维度表和事实表的创建。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c7ff29e7e87144959328feb348eeb645~tplv-k3u1fbpfcp-zoom-1.image)

我们从前线到后勤，对业务数据总线进行了梳理，旨在整理业务实体和业务活动相关数据，如多个系统之间存在同一个业务实体，应统一为一个字段。梳理业务总线有助于掌握公司整体数据结构，便于维度建模等工作。

下图为我们简单的梳理部分房地产中介行业的业务总线：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2efc7d4692664627a8bdd2efb54a8ef7~tplv-k3u1fbpfcp-zoom-1.image)

**2）横向分层**

数据分层是最常见的 5 层结构主要是利用 Apache Doris + Apache DolphinScheduler 进行层级数据之间 DAG 脚本调度。

**存储策略：** 我们在 8 点到 24 点之间采用增量策略，0 点到 8 点执行全量策略。采用增量 + 全量的方式是为了在ODS 表因为记录的历史状态字段变更或者 CDC 出现数据未完全同步的情况下，可以及时进行全量补数修正。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/17ff0792a5c140b8b8afc798561c1ad1~tplv-k3u1fbpfcp-zoom-1.image)

**3）增量策略**

1.  where >= "业务时间-1天或-1小时"

增量的 SQL 语句不使用 `where="业务时间当天"`的原因是为了避免数据漂移情况发生，换言之，调度脚本之间存在时间差，如 23:58:00 执行了脚本，脚本的执行周期是 10 分钟/次，但是源库最后一条数据 23:59:00 才进来，这时候 ` where="业务时间当天"  `就会将该数据漏掉。

2.  每次跑增量脚本前获取表中最大的主键 ID 存入辅助表，`where >= "辅助表记录ID"`

如果 Doris 表使用的是 Unique Key 模型，且恰好为组合主键，当主键组合在源表发生了变化，这时候 `where >=" 业务时间-1天"`会记录该变化，把主键发生变化的数据 Load 进来，从而造成数据重复。而使用这种自增策略可有效避免该情况发生，且自增策略只适用于源表自带业务自增主键的情况。

3.  表分区

如面对日志表等基于时间的自增数据，且历史数据和状态基本不会变更，数据量非常大，全量或快照计算压力非常大的场景，这种场景需要对 Doris 表进行建表分区，每次增量进行分区替换操作即可，同时需要注意数据漂移情况。

**4）全量策略**

1.  Truncate Table 清空表插入

先清空表格后再把源表数据全量导入，该方式适用于数据量较小的表格和凌晨没有用户使用系统的场景。

2.  ` ALTER TABLE tbl1 REPLACE WITH TABLE tbl2  `表替换

这种方式是一种原子操作，适合数据量大的全量表。每次执行脚本前先 Create 一张数据结构相同的临时表，把全量数据 Load 到临时表，再执行表替换操作，可以进行无缝衔接。

# **应用实践**

## 业务模型

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3e414110d34a460a869c9c0a8cf5a23c~tplv-k3u1fbpfcp-zoom-1.image)

-   业务模型是分钟级调度 ETL
-   初次部署建议配置：8 节点 2FE * 8BE 混合部署
-   节点配置：32C * 60GB * 2TB SSD
-   对于存量数据 TB 级、增量数据 GB 级的场景完全够用，如有需要可以进行滚动扩容。

## **具体应用**

1.  离线数据和日志数据集成利用 DataX 进行增量和全量调度，Datax 支持 CSV 格式和多种关系型数据库的Redear，而 Doris 在很早之前就提供了 DataX Doris writer 连接器。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/71127fce1de54a518aed418af70faafe~tplv-k3u1fbpfcp-zoom-1.image)

2.  实时统计部分借助了 Flink CDC 对源表进行实时同步，利用 Doris 的物化视图或者 Aggregate 模型表进行实时指标的汇总处理，因我们只有部分指标需要实时处理，不希望产生过多的数据库连接和 Flink Job，因此我们使用 Dinky 的多源合并和整库同步功能，也可以自己简单实现一个Flink DataStream 多源合并任务，只通过一个 Job 可对多个 CDC 源表进行维护。值得一提的是， Flink CDC 和 Apache Doris 新版本支持 Schema Change 实时同步，在成本允许的前提下，可完全使用 CDC 的方式对 ODS 层进行改造。

```
EXECUTE CDCSOURCE demo_doris WITH (
  'connector' = 'mysql-cdc',
  'hostname' = '127.0.0.1',
  'port' = '3306',
  'username' = 'root',
  'password' = '123456',
  'checkpoint' = '10000',
  'scan.startup.mode' = 'initial',
  'parallelism' = '1',
  'table-name' = 'ods.ods_*,ods.ods_*',
  'sink.connector' = 'doris',
  'sink.fenodes' = '127.0.0.1:8030',
  'sink.username' = 'root',
  'sink.password' = '123456',
  'sink.doris.batch.size' = '1000',
  'sink.sink.max-retries' = '1',
  'sink.sink.batch.interval' = '60000',
  'sink.sink.db' = 'test',
  'sink.sink.properties.format' ='json',
  'sink.sink.properties.read_json_by_line' ='true',
  'sink.table.identifier' = '${schemaName}.${tableName}',
  'sink.sink.label-prefix' = '${schemaName}_${tableName}_1'
);
```

3.  脚本语言采用 Shell + SQL 或纯 SQL 的形式，我们在 Apache DolphinScheduler 上进行脚本生命周期管理和发布，如 ODS 层，可以编写通用的 DataX Job 文件，通过传参的方式将 DataX Job 文件传参执行源表导入，无需在每一个源表编写不同的DataX Job ，支持统一配置参数和代码内容，维护起来非常方便。另外我们在 DolphinsSheduler 上对 Doris 的 ETL 脚本进行管理，还可以进行版本控制，能有效控制生产环境错误的发生，进行及时回滚。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4ceb0780a1764df881c4ac6e9a3c7530~tplv-k3u1fbpfcp-zoom-1.image)![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/bfcfa5c5caf444ecbdf442685ef7065c~tplv-k3u1fbpfcp-zoom-1.image)

4.  发布 ETL 脚本后导入数据，可直接在帆软 Report 进行页面制作，基于登陆账号来控制页面权限，如需控制行级别、字段级别权限，可以制作全局字典，利用 SQL 方式进行控制。Doris 完全支持对账号的库表权限控制，这一点和 MySQL 的设置完全一样，使用起来非常便捷。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b8e4112e2e714a4cb721f733e22b0c65~tplv-k3u1fbpfcp-zoom-1.image)

除以上之外，在容灾恢复、集群监控、数据安全等方面也有应用，比如利用 Doris 备份实现容灾恢复、Grafana+Loki 对集群进行指标规则告警、Supervisor 对节点组件进行守护进程监控，开启 Doris 审计日志对执行 SQL 效率进行监控等，因篇幅限制，此处不进行详细说明。

## 优化经验

1.  **数据导入**

我们使用 DataX 进行离线数据导入，DataX 采用的是 Stream Load 方式导入，该方式可以通过参数控制导入批次流量，DataX 导入不需要借助计算引擎，开箱即用的特点非常方便。另外，Stream Load 导入是同步返回结果的，其他导入方式一般是异步返回结果，针对我们的架构来说，在 Dolphinscheduler上执行异步导入数据会误以为该脚本已经执行成功，影响其正常运行。如采用其他异步导入方式，建议在 Shell 脚本中 执行`  show load ` 再利用正则过滤状态进行判断。

2.  **数据模型**

我们所有层级的表模型大部分采用 Unique Key 模型，该模型可有效保证数据脚本的结果幂等性，Unique Key 模型可以完美解决上游数据重复的问题，大家可以根据业务模式来选择不同的模型建表。

3.  **外部数据源读取**

Catalog 方式可以使用 JDBC 外表连接，还可以对 Doris 生产集群数据进行读取，便于生产数据直接 Load 进测试服务器进行测试。另外，新版支持多数据源的 Catalog，可以基于 Catalog 对 ODS 层进行改造，无需使用 DataX 对ODS 层进行导入。

4.  **查询优化**

尽量把非字符类型（如 int 类型、where 条件）中最常用的字段放在前排 36 个字节内，在点查表过程中可以快速过滤这些字段（毫秒级别），可以充分利用该特性进行数据表输出。

5.  **数据字典**

利用 Doris 自带的 `information_schema` 元数据制作简单的数据字典，这在还未建立数据治理体系前非常重要，当部门人数较多的时候，沟通成本成为发展过程中最大的“拦路虎”，利用数据字典可快速对表格和字段的全局查找和释义，最低成本形成数仓人员的数据规范，减少人员沟通成本，提高开发效率。

# 架构收益

-   自动取数导数：数据仓库的明细表可以定时进行取数、导数，自助组合维度进行分析。
-   效率提升：T+1 的离线时效从小时计降低至分钟级
-   查询延迟降低：面对上亿行数据的表，利用 Doris 在索引和点查方面的能力，实现即席查询 1 秒内响应，复杂查询 5 秒内响应。
-   运维成本降低：从数据集成到数据服务，只需维护少数组件就可以实现整体链路高效管理。
-   数据管理体系：Doris 数仓的搭建，使得数据管理体系初步形成，数据资产得以规范化的沉淀。
-   资源节省：只用了少数服务器，快速搭建起一套数据仓库，成功实现降本赋能。同时 Doris 超高的压缩比，将数据压缩了 70%，相较于 Hadoop 来说，存储资源的消耗大幅降低。

# 总结与规划

目前我们已经完成数仓建设的初期目标，未来我们有计划基于 Apache Doris 进行中台化的改造，同时 Apache Doris在用户画像和人群圈选场景的能力十分强悍，支持 Bitmap 等格式进行导入和转换，提供了丰富的 Bitmap 分析函数等，后续我们也将利用这部分能力进行客户群体分析，加快数字化转型。

最后，感谢 Apache Doris 社区和 SelectDB 团队对美联物业的快速响应和无偿支持，希望 Doris 发展越来越好，也希望更多的企业可以尝试使用 Apache Doris。