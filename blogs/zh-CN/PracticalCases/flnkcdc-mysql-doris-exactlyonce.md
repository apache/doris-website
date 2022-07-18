---
{
    "title": "Doris Connector 结合 Flink CDC 实现 MySQL 分库分表 Exactly Once精准接入",
    "description": "本篇文档我们就演示怎么基于Flink CDC 并结合 Apache Doris Flink Connector 及 Doris Stream Load的两阶段提交，实现MySQL数据库分库分表实时高效的接入到 Apache Doris 数据仓库中进行分析.",
    "date": "2022-07-18",
    "metaTitle": "Doris Connector 结合 Flink CDC 实现 MySQL 分库分表 Exactly Once精准接入",
    "isArticle": true,
    "language": "zh-CN",
    "author": "张家锋",
    "layout": "Article",
    "sidebar": true,
    "zhCategories": "PracticalCases"
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

# Doris Connector 结合 Flink CDC 实现 MySQL 分库分表 Exactly Once精准接入

## 1. 概述

在实际业务系统中为了解决单表数据量大带来的各种问题，我们通常采用分库分表的方式对库表进行拆分，以达到提高系统的吞吐量。 

但是这样给后面数据分析带来了麻烦，这个时候我们通常试将业务数据库的分库分表同步到数据仓库时，将这些分库分表的数据，合并成一个库，一个表。便于我们后面的数据分析

本篇文档我们就演示怎么基于Flink CDC 并结合 Apache Doris Flink Connector 及 Doris Stream Load的两阶段提交，实现MySQL数据库分库分表实时高效的接入到 Apache Doris 数据仓库中进行分析。

### 1.1 什么是CDC

CDC是（`Change Data Capture 变更数据获取`）的简称。

核心思想是，监测并捕获数据库的变动（包括数据 或 数据表的插入INSERT、更新UPDATE、删除DELETE等），将这些变更按发生的顺序完整记录下来，写入到消息中间件中以供其他服务进行订阅及消费。

CDC 技术应用场景也非常广泛，包括：

●   **数据分发**，将一个数据源分发给多个下游，常用于业务解耦、微服务。

●   **数据集成**，将分散异构的数据源集成到数据仓库中，消除数据孤岛，便于后续的分析。

●   **数据迁移**，常用于数据库备份、容灾等。

### 1.2 为什么选择Flink CDC

Flink CDC 基于数据库日志的Change Data Caputre 技术，实现了全量和增量的一体化读取能力，并借助 Flink 优秀的管道能力和丰富的上下游生态，支持捕获多种数据库的变更，并将这些变更实时同步到下游存储。

目前，Flink CDC 的上游已经支持了 MySQL、MariaDB、PG、Oracle、MongoDB 、Oceanbase、TiDB、SQLServer等数据库。

Flink CDC 的下游则更加丰富，支持写入 Kafka、Pulsar 消息队列，也支持写入 Hudi、Iceberg 、Doris等，支持写入各种数据仓库及数据湖中。

同时，通过 Flink SQL 原生支持的 Changelog 机制，可以让 CDC 数据的加工变得非常简单。用户可以通过 SQL 便能实现数据库全量和增量数据的清洗、打宽、聚合等操作，极大地降低了用户门槛。 此外， Flink DataStream API 支持用户编写代码实现自定义逻辑，给用户提供了深度定制业务的自由度

Flink CDC 技术的核心是支持将表中的全量数据和增量数据做实时一致性的同步与加工，让用户可以方便地获每张表的实时一致性快照。比如一张表中有历史的全量业务数据，也有增量的业务数据在源源不断写入，更新。Flink CDC 会实时抓取增量的更新记录，实时提供与数据库中一致性的快照，如果是更新记录，会更新已有数据。如果是插入记录，则会追加到已有数据，整个过程中，Flink CDC 提供了一致性保障，即不重不丢。

FLink CDC 如下优势：

- Flink 的算子和 SQL 模块更为成熟和易用
- Flink 作业可以通过调整算子并行度的方式，轻松扩展处理能力
- Flink 支持高级的状态后端（State Backends），允许存取海量的状态数据
- Flink 提供更多的 Source 和 Sink 等生态支持
- Flink 有更大的用户基数和活跃的支持社群，问题更容易解决
- Flink 的开源协议允许云厂商进行全托管的深度定制，而 Kafka Streams 只能自行部署和运维

而且 Flink Table / SQL 模块将数据库表和变动记录流（例如 CDC 的数据流）看做是同一事物的两面，因此内部提供的 Upsert 消息结构（`+I` 表示新增、`-U` 表示记录更新前的值、`+U` 表示记录更新后的值，`-D` 表示删除）可以与 Debezium 等生成的变动记录一一对应。

### 1.3 什么是Apache Doris 

Apache Doris是一个现代化的MPP分析型数据库产品。仅需亚秒级响应时间即可获得查询结果，有效地支持实时数据分析。Apache Doris的分布式架构非常简洁，易于运维，并且可以支持10PB以上的超大数据集。

Apache Doris可以满足多种数据分析需求，例如固定历史报表，实时数据分析，交互式数据分析和探索式数据分析等。令您的数据分析工作更加简单高效！

### 1.4  Two-phase commit

#### 1.4.1 什么是 two-phase commit （2PC）

在分布式系统中，为了让每个节点都能够感知到其他节点的事务执行状况，需要引入一个中心节点来统一处理所有节点的执行逻辑，这个中心节点叫做协调者（coordinator），被中心节点调度的其他业务节点叫做参与者（participant）。

2PC将分布式事务分成了两个阶段，两个阶段分别为提交请求（投票）和提交（执行）。协调者根据参与者的响应来决定是否需要真正地执行事务，具体流程如下。

##### 提交请求（投票）阶段

1. 协调者向所有参与者发送prepare请求与事务内容，询问是否可以准备事务提交，并等待参与者的响应。
2. 参与者执行事务中包含的操作，并记录undo日志（用于回滚）和redo日志（用于重放），但不真正提交。
3. 参与者向协调者返回事务操作的执行结果，执行成功返回yes，否则返回no。

##### 提交（执行）阶段

分为成功与失败两种情况。

- 若所有参与者都返回yes，说明事务可以提交：

1. 协调者向所有参与者发送commit请求。
2. 参与者收到commit请求后，将事务真正地提交上去，并释放占用的事务资源，并向协调者返回ack。
3. 协调者收到所有参与者的ack消息，事务成功完成。

- 若有参与者返回no或者超时未返回，说明事务中断，需要回滚：

1. 协调者向所有参与者发送rollback请求。
2. 参与者收到rollback请求后，根据undo日志回滚到事务执行前的状态，释放占用的事务资源，并向协调者返回ack。
3. 协调者收到所有参与者的ack消息，事务回滚完成。

### 1.4 Flink 2PC

Flink作为流式处理引擎，自然也提供了对exactly once语义的保证。端到端的exactly once语义，是输入、处理逻辑、输出三部分协同作用的结果。Flink内部依托检查点机制和轻量级分布式快照算法ABS保证exactly once。而要实现精确一次的输出逻辑，则需要施加以下两种限制之一：幂等性写入（idempotent write）、事务性写入（transactional write）。

##### 预提交阶段的流程

![img](/images/blogs/2pc/1620.png)

每当需要做checkpoint时，JobManager就在数据流中打入一个屏障（barrier），作为检查点的界限。屏障随着算子链向下游传递，每到达一个算子都会触发将状态快照写入状态后端的动作。当屏障到达Kafka sink后，通过KafkaProducer.flush()方法刷写消息数据，但还未真正提交。接下来还是需要通过检查点来触发提交阶段

##### 提交阶段流程

![img](/images/blogs/2pc/1621.png)

只有在所有检查点都成功完成这个前提下，写入才会成功。这符合前文所述2PC的流程，其中JobManager为协调者，各个算子为参与者（不过只有sink一个参与者会执行提交）。一旦有检查点失败，notifyCheckpointComplete()方法就不会执行。如果重试也不成功的话，最终会调用abort()方法回滚事务

### 1.5 Doris Flink Connector 2PC

#### 1.5.1 Stream load

Stream load 是Apache Doris 提供的一个同步的导入方式，用户通过发送 HTTP 协议发送请求将本地文件或数据流导入到 Doris 中。Stream load 同步执行导入并返回导入结果。用户可直接通过请求的返回体判断本次导入是否成功。

Stream load 主要适用于导入本地文件，或通过程序导入数据流中的数据。

使用方法，用户通过Http Client 进行操作，也可以使用Curl命令进行

```shell
curl --location-trusted -u user:passwd [-H ""...] -T data.file -H "label:label" -XPUT http://fe_host:http_port/api/{db}/{table}/_stream_load
```

这里为了是防止用户重复导入相同的数据，使用了导入任务标识label。**强烈推荐用户同一批次数据使用相同的 label。这样同一批次数据的重复请求只会被接受一次，保证了 At-Most-Once**

####  1.5.2 Stream load 2PC

Aapche  Doris 最早的Stream Load 是没有两阶段提交的，导入数据的时候直接通过 Stream Load 的 http 接口完成数据导入，只有成功和失败。

1. 这种在正常情况下是没有问题的，在分布式环境下可能为因为某一个导入任务是失败导致两端数据不一致的情况，特别是在Doris Flink Connector里，之前的Doris Flink Connector 数据导入失败需要用户自己控制，做异常处理，比如如果导入失败之后，将数据保存到指定的地方（例如Kafka），然后人工手动处理。
2. 如果Flink Job因为其他为题突然挂掉，这样会造成部分数据成功，部分数据失败，而且失败的数据因为没有checkpoint，重新启动Job也没办法重新消费失败的数据，造成两端数据不一致

为了解决上面的这些问题，保证两端数据一致性，我们实现了Doris Stream Load 2PC，原理如下：

1. 提交分成两个阶段
2. 第一阶段，提交数据写入任务，这个时候数据写入成功后，数据状态是不可见的，事务状态是PRECOMMITTED
3. 数据写入成功之后，用户触发Commit操作，将事务状态变成VISIBLE，这个时候数据可以查询到
4. 如果用户要方式这一批数据只需要通过事务ID，对事务触发abort操作，这批数据将会被自动删除掉

#### 1.5.3 Stream load 2PC使用方式

1. 在be.conf中配置`disable_stream_load_2pc=false`（重启生效） 
2. 并且 在 HEADER 中声明 `two_phase_commit=true` 。



发起预提交：

```
curl  --location-trusted -u user:passwd -H "two_phase_commit:true" -T test.txt http://fe_host:http_port/api/{db}/{table}/_stream_load
```

触发事务Commit操作

```
curl -X PUT --location-trusted -u user:passwd  -H "txn_id:18036" -H "txn_operation:commit"  http://fe_host:http_port/api/{db}/_stream_load_2pc
```

对事物触发abort操作

```
curl -X PUT --location-trusted -u user:passwd  -H "txn_id:18037" -H "txn_operation:abort"  http://fe_host:http_port/api/{db}/_stream_load_2pc
```



### 1.6 Doris Flink Connector 2PC

我们之前提供了Doris Flink Connector ，支持对Doris表数据的读，Upsert、delete（Unique key模型），但是存在可能因为Job失败或者其他异常情况导致两端数据不一致的问题。

为了解决这些问题，我们基于FLink 2PC 和Doris Stream Load 2PC对Doris Connector进行了改造升级，保证两端exactly once。

1. 我们会在内存中维护读写的buffer，在启动的时候，开启写入，并异步的提交，期间通过http chunked的方式持续的将数据写入到BE，直到Checkpoint的时候，停止写入，这样做的好处是避免用户频繁提交http带来的开销，Checkpoint完成后会开启下一阶段的写入
2. 在这个Checkpoint期间，可能是多个task任务同时在写一张表的数据，这些我们都会在这个Checkpoint期间对应一个全局的label，在checkpoint的时候将这个label对应的写入数据的事务进行统一的一次提交，将数据状态变成可见，
3. 如果失败 Flink 在重启的时候会对这些数据通过checkpoint进行回放。
4. 这样就可以保证Doris两端数据的一致

## 2. 系统架构

下面我们通过一个完整示例来看怎么去通过Doris Flink Connector最新版本（支持两阶段提交），来完成整合Flink CDC实现MySQL分库分表实时采集入库

![image-20220622175254804](/images/blogs/2pc/image-20220622175254804.png)



1. 这里我们通过Flink CDC 来完成MySQL分库分表数据通过
2. 然后通过Doris Flink Connector来完成数据的入库
3. 最后利用Doris的高并发、高性能的OLAP分析计算能力对外提供数据服务

## 3. MySQL 安装配置

### 3.1 安装MySQL

快速使用Docker安装配置Mysql，具体参照下面的连接

https://segmentfault.com/a/1190000021523570

### 3.2 开启Mysql binlog

进入 Docker 容器修改/etc/my.cnf 文件，在 [mysqld] 下面添加以下内容，

```text
log_bin=mysql_bin
binlog-format=Row
server-id=1
```

然后重启Mysql

```text
systemctl restart mysqld
```

### 3.3 准备数据

这里演示我们准备了两个库emp_1,emp_2,每个库下面各种主备了两张表employees_1，employees_2。并给出了一下初始化数据

```sql
CREATE DATABASE emp_1;
 USE emp_1;
CREATE TABLE employees_1 (
    emp_no      INT             NOT NULL,
    birth_date  DATE            NOT NULL,
    first_name  VARCHAR(14)     NOT NULL,
    last_name   VARCHAR(16)     NOT NULL,
    gender      ENUM ('M','F')  NOT NULL,    
    hire_date   DATE            NOT NULL,
    PRIMARY KEY (emp_no)
);

INSERT INTO `employees_1` VALUES (10001,'1953-09-02','Georgi','Facello','M','1986-06-26'),
(10002,'1964-06-02','Bezalel','Simmel','F','1985-11-21'),
(10003,'1959-12-03','Parto','Bamford','M','1986-08-28'),
(10004,'1954-05-01','Chirstian','Koblick','M','1986-12-01'),
(10005,'1955-01-21','Kyoichi','Maliniak','M','1989-09-12'),
(10006,'1953-04-20','Anneke','Preusig','F','1989-06-02'),
(10007,'1957-05-23','Tzvetan','Zielinski','F','1989-02-10'),
(10008,'1958-02-19','Saniya','Kalloufi','M','1994-09-15'),
(10009,'1952-04-19','Sumant','Peac','F','1985-02-18'),
(10010,'1963-06-01','Duangkaew','Piveteau','F','1989-08-24'),
(10011,'1953-11-07','Mary','Sluis','F','1990-01-22'),
(10012,'1960-10-04','Patricio','Bridgland','M','1992-12-18'),
(10013,'1963-06-07','Eberhardt','Terkki','M','1985-10-20'),
(10014,'1956-02-12','Berni','Genin','M','1987-03-11'),
(10015,'1959-08-19','Guoxiang','Nooteboom','M','1987-07-02'),
(10016,'1961-05-02','Kazuhito','Cappelletti','M','1995-01-27'),
(10017,'1958-07-06','Cristinel','Bouloucos','F','1993-08-03'),
(10018,'1954-06-19','Kazuhide','Peha','F','1987-04-03'),
(10019,'1953-01-23','Lillian','Haddadi','M','1999-04-30'),
(10020,'1952-12-24','Mayuko','Warwick','M','1991-01-26'),
(10021,'1960-02-20','Ramzi','Erde','M','1988-02-10'),
(10022,'1952-07-08','Shahaf','Famili','M','1995-08-22'),
(10023,'1953-09-29','Bojan','Montemayor','F','1989-12-17'),
(10024,'1958-09-05','Suzette','Pettey','F','1997-05-19'),
(10025,'1958-10-31','Prasadram','Heyers','M','1987-08-17'),
(10026,'1953-04-03','Yongqiao','Berztiss','M','1995-03-20'),
(10027,'1962-07-10','Divier','Reistad','F','1989-07-07'),
(10028,'1963-11-26','Domenick','Tempesti','M','1991-10-22'),
(10029,'1956-12-13','Otmar','Herbst','M','1985-11-20'),
(10030,'1958-07-14','Elvis','Demeyer','M','1994-02-17'),
(10031,'1959-01-27','Karsten','Joslin','M','1991-09-01'),
(10032,'1960-08-09','Jeong','Reistad','F','1990-06-20'),
(10033,'1956-11-14','Arif','Merlo','M','1987-03-18'),
(10034,'1962-12-29','Bader','Swan','M','1988-09-21'),
(10035,'1953-02-08','Alain','Chappelet','M','1988-09-05'),
(10036,'1959-08-10','Adamantios','Portugali','M','1992-01-03');

CREATE TABLE employees_2 (
    emp_no      INT             NOT NULL,
    birth_date  DATE            NOT NULL,
    first_name  VARCHAR(14)     NOT NULL,
    last_name   VARCHAR(16)     NOT NULL,
    gender      ENUM ('M','F')  NOT NULL,    
    hire_date   DATE            NOT NULL,
    PRIMARY KEY (emp_no)
);

INSERT INTO `employees_2` VALUES (10037,'1963-07-22','Pradeep','Makrucki','M','1990-12-05'),
(10038,'1960-07-20','Huan','Lortz','M','1989-09-20'),
(10039,'1959-10-01','Alejandro','Brender','M','1988-01-19'),
(10040,'1959-09-13','Weiyi','Meriste','F','1993-02-14'),
(10041,'1959-08-27','Uri','Lenart','F','1989-11-12'),
(10042,'1956-02-26','Magy','Stamatiou','F','1993-03-21'),
(10043,'1960-09-19','Yishay','Tzvieli','M','1990-10-20'),
(10044,'1961-09-21','Mingsen','Casley','F','1994-05-21'),
(10045,'1957-08-14','Moss','Shanbhogue','M','1989-09-02'),
(10046,'1960-07-23','Lucien','Rosenbaum','M','1992-06-20'),
(10047,'1952-06-29','Zvonko','Nyanchama','M','1989-03-31'),
(10048,'1963-07-11','Florian','Syrotiuk','M','1985-02-24'),
(10049,'1961-04-24','Basil','Tramer','F','1992-05-04'),
(10050,'1958-05-21','Yinghua','Dredge','M','1990-12-25'),
(10051,'1953-07-28','Hidefumi','Caine','M','1992-10-15'),
(10052,'1961-02-26','Heping','Nitsch','M','1988-05-21'),
(10053,'1954-09-13','Sanjiv','Zschoche','F','1986-02-04'),
(10054,'1957-04-04','Mayumi','Schueller','M','1995-03-13');


CREATE DATABASE emp_2;

USE emp_2;

CREATE TABLE employees_1 (
    emp_no      INT             NOT NULL,
    birth_date  DATE            NOT NULL,
    first_name  VARCHAR(14)     NOT NULL,
    last_name   VARCHAR(16)     NOT NULL,
    gender      ENUM ('M','F')  NOT NULL,    
    hire_date   DATE            NOT NULL,
    PRIMARY KEY (emp_no)
);


INSERT INTO `employees_1` VALUES  (10055,'1956-06-06','Georgy','Dredge','M','1992-04-27'),
(10056,'1961-09-01','Brendon','Bernini','F','1990-02-01'),
(10057,'1954-05-30','Ebbe','Callaway','F','1992-01-15'),
(10058,'1954-10-01','Berhard','McFarlin','M','1987-04-13'),
(10059,'1953-09-19','Alejandro','McAlpine','F','1991-06-26'),
(10060,'1961-10-15','Breannda','Billingsley','M','1987-11-02'),
(10061,'1962-10-19','Tse','Herber','M','1985-09-17'),
(10062,'1961-11-02','Anoosh','Peyn','M','1991-08-30'),
(10063,'1952-08-06','Gino','Leonhardt','F','1989-04-08'),
(10064,'1959-04-07','Udi','Jansch','M','1985-11-20'),
(10065,'1963-04-14','Satosi','Awdeh','M','1988-05-18'),
(10066,'1952-11-13','Kwee','Schusler','M','1986-02-26'),
(10067,'1953-01-07','Claudi','Stavenow','M','1987-03-04'),
(10068,'1962-11-26','Charlene','Brattka','M','1987-08-07'),
(10069,'1960-09-06','Margareta','Bierman','F','1989-11-05'),
(10070,'1955-08-20','Reuven','Garigliano','M','1985-10-14'),
(10071,'1958-01-21','Hisao','Lipner','M','1987-10-01'),
(10072,'1952-05-15','Hironoby','Sidou','F','1988-07-21'),
(10073,'1954-02-23','Shir','McClurg','M','1991-12-01'),
(10074,'1955-08-28','Mokhtar','Bernatsky','F','1990-08-13'),
(10075,'1960-03-09','Gao','Dolinsky','F','1987-03-19'),
(10076,'1952-06-13','Erez','Ritzmann','F','1985-07-09'),
(10077,'1964-04-18','Mona','Azuma','M','1990-03-02'),
(10078,'1959-12-25','Danel','Mondadori','F','1987-05-26'),
(10079,'1961-10-05','Kshitij','Gils','F','1986-03-27'),
(10080,'1957-12-03','Premal','Baek','M','1985-11-19'),
(10081,'1960-12-17','Zhongwei','Rosen','M','1986-10-30'),
(10082,'1963-09-09','Parviz','Lortz','M','1990-01-03'),
(10083,'1959-07-23','Vishv','Zockler','M','1987-03-31'),
(10084,'1960-05-25','Tuval','Kalloufi','M','1995-12-15');


CREATE TABLE employees_2(
    emp_no      INT             NOT NULL,
    birth_date  DATE            NOT NULL,
    first_name  VARCHAR(14)     NOT NULL,
    last_name   VARCHAR(16)     NOT NULL,
    gender      ENUM ('M','F')  NOT NULL,    
    hire_date   DATE            NOT NULL,
    PRIMARY KEY (emp_no)
);

INSERT INTO `employees_2` VALUES (10085,'1962-11-07','Kenroku','Malabarba','M','1994-04-09'),
(10086,'1962-11-19','Somnath','Foote','M','1990-02-16'),
(10087,'1959-07-23','Xinglin','Eugenio','F','1986-09-08'),
(10088,'1954-02-25','Jungsoon','Syrzycki','F','1988-09-02'),
(10089,'1963-03-21','Sudharsan','Flasterstein','F','1986-08-12'),
(10090,'1961-05-30','Kendra','Hofting','M','1986-03-14'),
(10091,'1955-10-04','Amabile','Gomatam','M','1992-11-18'),
(10092,'1964-10-18','Valdiodio','Niizuma','F','1989-09-22'),
(10093,'1964-06-11','Sailaja','Desikan','M','1996-11-05'),
(10094,'1957-05-25','Arumugam','Ossenbruggen','F','1987-04-18'),
(10095,'1965-01-03','Hilari','Morton','M','1986-07-15'),
(10096,'1954-09-16','Jayson','Mandell','M','1990-01-14'),
(10097,'1952-02-27','Remzi','Waschkowski','M','1990-09-15'),
(10098,'1961-09-23','Sreekrishna','Servieres','F','1985-05-13'),
(10099,'1956-05-25','Valter','Sullins','F','1988-10-18'),
(10100,'1953-04-21','Hironobu','Haraldson','F','1987-09-21'),
(10101,'1952-04-15','Perla','Heyers','F','1992-12-28'),
(10102,'1959-11-04','Paraskevi','Luby','F','1994-01-26'),
(10103,'1953-11-26','Akemi','Birch','M','1986-12-02'),
(10104,'1961-11-19','Xinyu','Warwick','M','1987-04-16'),
(10105,'1962-02-05','Hironoby','Piveteau','M','1999-03-23'),
(10106,'1952-08-29','Eben','Aingworth','M','1990-12-19'),
(10107,'1956-06-13','Dung','Baca','F','1994-03-22'),
(10108,'1952-04-07','Lunjin','Giveon','M','1986-10-02'),
(10109,'1958-11-25','Mariusz','Prampolini','F','1993-06-16'),
(10110,'1957-03-07','Xuejia','Ullian','F','1986-08-22'),
(10111,'1963-08-29','Hugo','Rosis','F','1988-06-19'),
(10112,'1963-08-13','Yuichiro','Swick','F','1985-10-08'),
(10113,'1963-11-13','Jaewon','Syrzycki','M','1989-12-24'),
(10114,'1957-02-16','Munir','Demeyer','F','1992-07-17'),
(10115,'1964-12-25','Chikara','Rissland','M','1986-01-23'),
(10116,'1955-08-26','Dayanand','Czap','F','1985-05-28');
```

## 4. Doris 安装配置

这里我们以单机版为例

首先下载doris 1.0 release版本：[**https://dlcdn.apache.org/doris/1.0/1.0.0-incubating/apache-doris-1.0.0-incubating-bin.tar.gz**](https://dlcdn.apache.org/doris/1.0/1.0.0-incubating/apache-doris-1.0.0-incubating-bin.tar.gz)

解压到指定目录

```
tar zxvf apache-doris-1.0.0-incubating-bin.tar.gz -C doris-1.0
```

解压后的目录结构是这样：

```
.
├── apache_hdfs_broker
│   ├── bin
│   ├── conf
│   └── lib
├── be
│   ├── bin
│   ├── conf
│   ├── lib
│   ├── log
│   ├── minidump
│   ├── storage
│   └── www
├── derby.log
├── fe
│   ├── bin
│   ├── conf
│   ├── doris-meta
│   ├── lib
│   ├── log
│   ├── plugins
│   ├── spark-dpp
│   ├── temp_dir
│   └── webroot
└── udf
    ├── include
    └── lib
```



配置fe和be

```
cd doris-1.0
# 配置 fe.conf 和 be.conf,这两个文件分别在fe和be的conf目录下
打开这个 priority_networks
修改成自己的IP地址，注意这里是CIDR方式配置IP地址
例如我本地的IP是172.19.0.12，我的配置如下：
priority_networks = 172.19.0.0/24

######
在be.conf配置文件最后加上下面这个配置
disable_stream_load_2pc=false
```

1. 注意这里默认只需要修改 `fe.conf` 和 `be.conf` 同样的上面这个配置就行了
2. 默认fe元数据的目录在 `fe/doris-meta` 目录下
3. be的数据存储在 `be/storage` 目录下

启动 FE

```
sh fe/bin/start_fe.sh --daemon
```

启动BE

```
sh be/bin/start_be.sh --daemon
```

MySQL命令行连接FE，这里新安装的Doris集群默认用户是root和admin，密码是空

```sql
mysql -uroot -P9030 -h127.0.0.1
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 41
Server version: 5.7.37 Doris version trunk-440ad03

Copyright (c) 2000, 2022, Oracle and/or its affiliates.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

mysql> show frontends;
+--------------------------------+-------------+-------------+----------+-----------+---------+----------+----------+------------+------+-------+-------------------+---------------------+----------+--------+---------------+------------------+
| Name                           | IP          | EditLogPort | HttpPort | QueryPort | RpcPort | Role     | IsMaster | ClusterId  | Join | Alive | ReplayedJournalId | LastHeartbeat       | IsHelper | ErrMsg | Version       | CurrentConnected |
+--------------------------------+-------------+-------------+----------+-----------+---------+----------+----------+------------+------+-------+-------------------+---------------------+----------+--------+---------------+------------------+
| 172.19.0.12_9010_1654681464955 | 172.19.0.12 | 9010        | 8030     | 9030      | 9020    | FOLLOWER | true     | 1690644599 | true | true  | 381106            | 2022-06-22 18:13:34 | true     |        | trunk-440ad03 | Yes              |
+--------------------------------+-------------+-------------+----------+-----------+---------+----------+----------+------------+------+-------+-------------------+---------------------+----------+--------+---------------+------------------+
1 row in set (0.01 sec)

```

将BE节点加入到集群中

```
mysql>alter system add backend "172.19.0.12:9050";
```

这里是你自己的IP地址

查看BE

```sql
mysql> show backends;
+-----------+-----------------+-------------+---------------+--------+----------+----------+---------------------+---------------------+-------+----------------------+-----------------------+-----------+------------------+---------------+---------------+---------+----------------+--------------------------+--------+---------------+-------------------------------------------------------------------------------------------------------------------------------+
| BackendId | Cluster         | IP          | HeartbeatPort | BePort | HttpPort | BrpcPort | LastStartTime       | LastHeartbeat       | Alive | SystemDecommissioned | ClusterDecommissioned | TabletNum | DataUsedCapacity | AvailCapacity | TotalCapacity | UsedPct | MaxDiskUsedPct | Tag                      | ErrMsg | Version       | Status                                                                                                                        |
+-----------+-----------------+-------------+---------------+--------+----------+----------+---------------------+---------------------+-------+----------------------+-----------------------+-----------+------------------+---------------+---------------+---------+----------------+--------------------------+--------+---------------+-------------------------------------------------------------------------------------------------------------------------------+
| 10002     | default_cluster | 172.19.0.12 | 9050          | 9060   | 8040     | 8060     | 2022-06-22 12:51:58 | 2022-06-22 18:15:34 | true  | false                | false                 | 4369      | 328.686 MB       | 144.083 GB    | 196.735 GB    | 26.76 % | 26.76 %        | {"location" : "default"} |        | trunk-440ad03 | {"lastSuccessReportTabletsTime":"2022-06-22 18:15:05","lastStreamLoadTime":-1,"isQueryDisabled":false,"isLoadDisabled":false} |
+-----------+-----------------+-------------+---------------+--------+----------+----------+---------------------+---------------------+-------+----------------------+-----------------------+-----------+------------------+---------------+---------------+---------+----------------+--------------------------+--------+---------------+-------------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)
```

Doris单机版安装完成

## 5. Flink安装配置

### 5.1 下载安装Flink1.14.4

```
wget https://dlcdn.apache.org/flink/flink-1.14.4/flink-1.14.5-bin-scala_2.12.tgz
tar zxvf flink-1.14.4-bin-scala_2.12.tgz
```

然后需要将下面的依赖拷贝到Flink安装目录下的lib目录下，具体的依赖的lib文件如下：

```
wget https://jiafeng-1308700295.cos.ap-hongkong.myqcloud.com/flink-doris-connector-1.14_2.12-1.0.0-SNAPSHOT.jar
wget https://repo1.maven.org/maven2/com/ververica/flink-sql-connector-mysql-cdc/2.2.1/flink-sql-connector-mysql-cdc-2.2.1.jar
```

启动Flink

```
bin/start-cluster.sh
```

启动后的界面如下：

![image-20220620195605251](/images/blogs/2pc/image-20220622115510011.png)



## 6. 开始同步数据到Doris

### 6.1 创建Doris数据库及表

```sql
create database demo;
use demo;
CREATE TABLE all_employees_info (
    emp_no       int NOT NULL,
    birth_date   date,
    first_name   varchar(20),
    last_name    varchar(20),
    gender       char(2),
    hire_date    date,
    database_name varchar(50),
    table_name    varchar(200)
)
UNIQUE KEY(`emp_no`, `birth_date`)
DISTRIBUTED BY HASH(`birth_date`) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```

### 6.2 进入Flink SQL Client

```
 bin/sql-client.sh embedded 
```

![image-20220620202805321](/images/blogs/2pc/image-20220620202805321.png)

开启 checkpoint，每隔10秒做一次 checkpoint

Checkpoint 默认是不开启的，我们需要开启 Checkpoint 来让 Iceberg 可以提交事务。 

Source在启动时会扫描全表，将表按照主键分成多个chunk。并使用增量快照算法逐个读取每个chunk的数据。作业会周期性执行Checkpoint，记录下已经完成的chunk。当发生Failover时，只需要继续读取未完成的chunk。当chunk全部读取完后，会从之前获取的Binlog位点读取增量的变更记录。Flink作业会继续周期性执行Checkpoint，记录下Binlog位点，当作业发生Failover，便会从之前记录的Binlog位点继续处理，从而实现Exactly Once语义

```
SET execution.checkpointing.interval = 10s;
```

>注意： 这里是演示，生产环境建议checkpoint间隔60秒

### 6.3 创建MySQL CDC表

在Flink SQL Client 下执行下面的 SQL

```sql
CREATE TABLE employees_source (
    database_name STRING METADATA VIRTUAL,
    table_name STRING METADATA VIRTUAL,
    emp_no int NOT NULL,
    birth_date date,
    first_name STRING,
    last_name STRING,
    gender STRING,
    hire_date date,
    PRIMARY KEY (`emp_no`) NOT ENFORCED
  ) WITH (
    'connector' = 'mysql-cdc',
    'hostname' = 'localhost',
    'port' = '3306',
    'username' = 'root',
    'password' = 'MyNewPass4!',
    'database-name' = 'emp_[0-9]+',
    'table-name' = 'employees_[0-9]+'
  );
```

1. 'database-name' = 'emp_[0-9]+'：  这里是使用了正则表达式，同时连接多个库
2.  'table-name' = 'employees_[0-9]+'：这里是使用了正则表达式，同时连接多个表

查询CDC表，我们可以看到下面的数据，标识一切正常

```sql
select * from employees_source limit 10;
```

![image-20220622185815942](/images/blogs/2pc/image-20220622185815942.png)

### 6.4 创建 Doris Sink 表

```sql
CREATE TABLE cdc_doris_sink (
    emp_no       int ,
    birth_date   STRING,
    first_name   STRING,
    last_name    STRING,
    gender       STRING,
    hire_date    STRING,
    database_name STRING,
    table_name    STRING
) 
WITH (
  'connector' = 'doris',
  'fenodes' = '172.19.0.12:8030',
  'table.identifier' = 'demo.all_employees_info',
  'username' = 'root',
  'password' = '',
  'sink.properties.two_phase_commit'='true',
  'sink.label-prefix'='doris_demo_emp_001'
);
```

参数说明：

1. connector ： 指定连接器是doris
2. fenodes：doris FE节点IP地址及http port
3. table.identifier ： Doris对应的数据库及表名
4. username：doris用户名
5. password：doris用户密码
6. sink.properties.two_phase_commit：指定使用两阶段提交，这样在stream load的时候，会在http header里加上 `two_phase_commit:true` ，不然会失败
7. sink.label-prefix ： 这个是在两阶段提交的时候必须要加的一个参数，才能保证两端数据一致性，否则会失败
8. 其他参数参考官方文档 https://doris.apache.org/zh-CN/docs/ecosystem/flink-doris-connector.html

这个时候查询Doris sink表是没有数据的

 ```sql
 select * from cdc_doris_sink;
 ```

![image-20220622122018196](/images/blogs/2pc/image-20220622122018196.png)

### 6.5 将数据插入到Doris表里

执行下面的SQL：

```sql
insert into cdc_doris_sink (emp_no,birth_date,first_name,last_name,gender,hire_date,database_name,table_name) 
select emp_no,cast(birth_date as string) as birth_date ,first_name,last_name,gender,cast(hire_date as string) as hire_date ,database_name,table_name from employees_source;
```

然后我们可以看到Flink WEB UI上的任务运行信息

![image-20220622184643354](/images/blogs/2pc/image-20220622184643354.png)



这里我们可以看看TaskManager的日志信息，会发现这里是使用两阶段提交的，而且数据是通过http chunked方式不断朝BE端进行传输的，知道Checkpoint，才会停止。Checkpoint完成后会继续下一个任务的提交。

```log
2022-06-22 19:04:01,350 INFO  io.debezium.relational.history.DatabaseHistoryMetrics        [] - Started database history recovery
2022-06-22 19:04:01,350 INFO  io.debezium.relational.history.DatabaseHistoryMetrics        [] - Finished database history recovery of 0 change(s) in 0 ms
2022-06-22 19:04:01,351 INFO  io.debezium.util.Threads                                     [] - Requested thread factory for connector MySqlConnector, id = mysql_binlog_source named = binlog-client
2022-06-22 19:04:01,352 INFO  io.debezium.connector.mysql.MySqlStreamingChangeEventSource  [] - Skip 0 events on streaming start
2022-06-22 19:04:01,352 INFO  io.debezium.connector.mysql.MySqlStreamingChangeEventSource  [] - Skip 0 rows on streaming start
2022-06-22 19:04:01,352 INFO  io.debezium.util.Threads                                     [] - Creating thread debezium-mysqlconnector-mysql_binlog_source-binlog-client
2022-06-22 19:04:01,374 INFO  io.debezium.util.Threads                                     [] - Creating thread debezium-mysqlconnector-mysql_binlog_source-binlog-client
2022-06-22 19:04:01,381 INFO  io.debezium.connector.mysql.MySqlStreamingChangeEventSource  [] - Connected to MySQL binlog at localhost:3306, starting at MySqlOffsetContext [sourceInfoSchema=Schema{io.debezium.connector.mysql.Source:STRUCT}, sourceInfo=SourceInfo [currentGtid=null, currentBinlogFilename=mysql_bin.000005, currentBinlogPosition=211725, currentRowNumber=0, serverId=0, sourceTime=null, threadId=-1, currentQuery=null, tableIds=[], databaseName=null], partition={server=mysql_binlog_source}, snapshotCompleted=false, transactionContext=TransactionContext [currentTransactionId=null, perTableEventCount={}, totalEventCount=0], restartGtidSet=null, currentGtidSet=null, restartBinlogFilename=mysql_bin.000005, restartBinlogPosition=211725, restartRowsToSkip=0, restartEventsToSkip=0, currentEventLengthInBytes=0, inTransaction=false, transactionId=null]
2022-06-22 19:04:01,381 INFO  io.debezium.util.Threads                                     [] - Creating thread debezium-mysqlconnector-mysql_binlog_source-binlog-client
2022-06-22 19:04:01,381 INFO  io.debezium.connector.mysql.MySqlStreamingChangeEventSource  [] - Waiting for keepalive thread to start
2022-06-22 19:04:01,497 INFO  io.debezium.connector.mysql.MySqlStreamingChangeEventSource  [] - Keepalive thread is running
2022-06-22 19:04:08,303 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - stream load stopped.
2022-06-22 19:04:08,321 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - load Result {
    "TxnId": 6963,
    "Label": "doris_demo_001_0_1",
    "TwoPhaseCommit": "true",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 634,
    "NumberLoadedRows": 634,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 35721,
    "LoadTimeMs": 9046,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 0,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 9041,
    "CommitAndPublishTimeMs": 0
}

2022-06-22 19:04:08,321 INFO  org.apache.doris.flink.sink.writer.RecordBuffer              [] - start buffer data, read queue size 0, write queue size 3
2022-06-22 19:04:08,321 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - stream load started for doris_demo_001_0_2
2022-06-22 19:04:08,321 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - start execute load
2022-06-22 19:04:08,325 INFO  org.apache.flink.streaming.runtime.operators.sink.AbstractStreamingCommitterHandler [] - Committing the state for checkpoint 1
2022-06-22 19:04:08,329 INFO  org.apache.doris.flink.sink.committer.DorisCommitter         [] - load result {
    "status": "Success",
    "msg": "transaction [6963] commit successfully."
}
2022-06-22 19:04:18,303 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - stream load stopped.
2022-06-22 19:04:18,310 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - load Result {
    "TxnId": 6964,
    "Label": "doris_demo_001_0_2",
    "TwoPhaseCommit": "true",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 0,
    "NumberLoadedRows": 0,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 0,
    "LoadTimeMs": 9988,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 0,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 9983,
    "CommitAndPublishTimeMs": 0
}

2022-06-22 19:04:18,310 INFO  org.apache.doris.flink.sink.writer.RecordBuffer              [] - start buffer data, read queue size 0, write queue size 3
2022-06-22 19:04:18,310 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - stream load started for doris_demo_001_0_3
2022-06-22 19:04:18,310 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - start execute load
2022-06-22 19:04:18,312 INFO  org.apache.flink.streaming.runtime.operators.sink.AbstractStreamingCommitterHandler [] - Committing the state for checkpoint 2
2022-06-22 19:04:18,317 INFO  org.apache.doris.flink.sink.committer.DorisCommitter         [] - load result {
    "status": "Success",
    "msg": "transaction [6964] commit successfully."
}
2022-06-22 19:04:28,303 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - stream load stopped.
2022-06-22 19:04:28,308 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - load Result {
    "TxnId": 6965,
    "Label": "doris_demo_001_0_3",
    "TwoPhaseCommit": "true",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 0,
    "NumberLoadedRows": 0,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 0,
    "LoadTimeMs": 9998,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 0,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 9993,
    "CommitAndPublishTimeMs": 0
}

2022-06-22 19:04:28,308 INFO  org.apache.doris.flink.sink.writer.RecordBuffer              [] - start buffer data, read queue size 0, write queue size 3
2022-06-22 19:04:28,308 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - stream load started for doris_demo_001_0_4
2022-06-22 19:04:28,308 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - start execute load
2022-06-22 19:04:28,311 INFO  org.apache.flink.streaming.runtime.operators.sink.AbstractStreamingCommitterHandler [] - Committing the state for checkpoint 3
2022-06-22 19:04:28,316 INFO  org.apache.doris.flink.sink.committer.DorisCommitter         [] - load result {
    "status": "Success",
    "msg": "transaction [6965] commit successfully."
}
2022-06-22 19:04:38,303 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - stream load stopped.
2022-06-22 19:04:38,308 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - load Result {
    "TxnId": 6966,
    "Label": "doris_demo_001_0_4",
    "TwoPhaseCommit": "true",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 0,
    "NumberLoadedRows": 0,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 0,
    "LoadTimeMs": 9999,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 0,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 9994,
    "CommitAndPublishTimeMs": 0
}

2022-06-22 19:04:38,308 INFO  org.apache.doris.flink.sink.writer.RecordBuffer              [] - start buffer data, read queue size 0, write queue size 3
2022-06-22 19:04:38,308 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - stream load started for doris_demo_001_0_5
2022-06-22 19:04:38,308 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - start execute load
2022-06-22 19:04:38,311 INFO  org.apache.flink.streaming.runtime.operators.sink.AbstractStreamingCommitterHandler [] - Committing the state for checkpoint 4
2022-06-22 19:04:38,317 INFO  org.apache.doris.flink.sink.committer.DorisCommitter         [] - load result {
    "status": "Success",
    "msg": "transaction [6966] commit successfully."
}
2022-06-22 19:04:48,303 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - stream load stopped.
2022-06-22 19:04:48,310 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - load Result {
    "TxnId": 6967,
    "Label": "doris_demo_001_0_5",
    "TwoPhaseCommit": "true",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 0,
    "NumberLoadedRows": 0,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 0,
    "LoadTimeMs": 10000,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 0,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 9996,
    "CommitAndPublishTimeMs": 0
}

2022-06-22 19:04:48,310 INFO  org.apache.doris.flink.sink.writer.RecordBuffer              [] - start buffer data, read queue size 0, write queue size 3
2022-06-22 19:04:48,310 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - stream load started for doris_demo_001_0_6
2022-06-22 19:04:48,310 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - start execute load
2022-06-22 19:04:48,312 INFO  org.apache.flink.streaming.runtime.operators.sink.AbstractStreamingCommitterHandler [] - Committing the state for checkpoint 5
2022-06-22 19:04:48,317 INFO  org.apache.doris.flink.sink.committer.DorisCommitter         [] - load result {
    "status": "Success",
    "msg": "transaction [6967] commit successfully."
}
2022-06-22 19:04:58,303 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - stream load stopped.
2022-06-22 19:04:58,308 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - load Result {
    "TxnId": 6968,
    "Label": "doris_demo_001_0_6",
    "TwoPhaseCommit": "true",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 0,
    "NumberLoadedRows": 0,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 0,
    "LoadTimeMs": 9998,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 0,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 9993,
    "CommitAndPublishTimeMs": 0
}

2022-06-22 19:04:58,308 INFO  org.apache.doris.flink.sink.writer.RecordBuffer              [] - start buffer data, read queue size 0, write queue size 3
2022-06-22 19:04:58,308 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - stream load started for doris_demo_001_0_7
2022-06-22 19:04:58,308 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - start execute load
2022-06-22 19:04:58,311 INFO  org.apache.flink.streaming.runtime.operators.sink.AbstractStreamingCommitterHandler [] - Committing the state for checkpoint 6
2022-06-22 19:04:58,316 INFO  org.apache.doris.flink.sink.committer.DorisCommitter         [] - load result {
    "status": "Success",
    "msg": "transaction [6968] commit successfully."
}
2022-06-22 19:05:08,303 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - stream load stopped.
2022-06-22 19:05:08,309 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - load Result {
    "TxnId": 6969,
    "Label": "doris_demo_001_0_7",
    "TwoPhaseCommit": "true",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 0,
    "NumberLoadedRows": 0,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 0,
    "LoadTimeMs": 9999,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 0,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 9995,
    "CommitAndPublishTimeMs": 0
}

2022-06-22 19:05:08,309 INFO  org.apache.doris.flink.sink.writer.RecordBuffer              [] - start buffer data, read queue size 0, write queue size 3
2022-06-22 19:05:08,309 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - stream load started for doris_demo_001_0_8
2022-06-22 19:05:08,309 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - start execute load
2022-06-22 19:05:08,311 INFO  org.apache.flink.streaming.runtime.operators.sink.AbstractStreamingCommitterHandler [] - Committing the state for checkpoint 7
2022-06-22 19:05:08,316 INFO  org.apache.doris.flink.sink.committer.DorisCommitter         [] - load result {
    "status": "Success",
    "msg": "transaction [6969] commit successfully."
}
2022-06-22 19:05:18,303 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - stream load stopped.
2022-06-22 19:05:18,308 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - load Result {
    "TxnId": 6970,
    "Label": "doris_demo_001_0_8",
    "TwoPhaseCommit": "true",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 0,
    "NumberLoadedRows": 0,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 0,
    "LoadTimeMs": 9999,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 0,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 9993,
    "CommitAndPublishTimeMs": 0
}

2022-06-22 19:05:18,308 INFO  org.apache.doris.flink.sink.writer.RecordBuffer              [] - start buffer data, read queue size 0, write queue size 3
2022-06-22 19:05:18,308 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - stream load started for doris_demo_001_0_9
2022-06-22 19:05:18,308 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - start execute load
2022-06-22 19:05:18,311 INFO  org.apache.flink.streaming.runtime.operators.sink.AbstractStreamingCommitterHandler [] - Committing the state for checkpoint 8
2022-06-22 19:05:18,317 INFO  org.apache.doris.flink.sink.committer.DorisCommitter         [] - load result {
    "status": "Success",
    "msg": "transaction [6970] commit successfully."
}
2022-06-22 19:05:28,303 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - stream load stopped.
2022-06-22 19:05:28,310 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - load Result {
    "TxnId": 6971,
    "Label": "doris_demo_001_0_9",
    "TwoPhaseCommit": "true",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 0,
    "NumberLoadedRows": 0,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 0,
    "LoadTimeMs": 10000,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 0,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 9996,
    "CommitAndPublishTimeMs": 0
}

2022-06-22 19:05:28,310 INFO  org.apache.doris.flink.sink.writer.RecordBuffer              [] - start buffer data, read queue size 0, write queue size 3
2022-06-22 19:05:28,310 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - stream load started for doris_demo_001_0_10
2022-06-22 19:05:28,310 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - start execute load
2022-06-22 19:05:28,315 INFO  org.apache.flink.streaming.runtime.operators.sink.AbstractStreamingCommitterHandler [] - Committing the state for checkpoint 9
2022-06-22 19:05:28,320 INFO  org.apache.doris.flink.sink.committer.DorisCommitter         [] - load result {
    "status": "Success",
    "msg": "transaction [6971] commit successfully."
}
2022-06-22 19:05:38,303 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - stream load stopped.
2022-06-22 19:05:38,308 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - load Result {
    "TxnId": 6972,
    "Label": "doris_demo_001_0_10",
    "TwoPhaseCommit": "true",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 0,
    "NumberLoadedRows": 0,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 0,
    "LoadTimeMs": 9998,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 0,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 9992,
    "CommitAndPublishTimeMs": 0
}

2022-06-22 19:05:38,308 INFO  org.apache.doris.flink.sink.writer.RecordBuffer              [] - start buffer data, read queue size 0, write queue size 3
2022-06-22 19:05:38,308 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - stream load started for doris_demo_001_0_11
2022-06-22 19:05:38,308 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - start execute load
2022-06-22 19:05:38,311 INFO  org.apache.flink.streaming.runtime.operators.sink.AbstractStreamingCommitterHandler [] - Committing the state for checkpoint 10
2022-06-22 19:05:38,316 INFO  org.apache.doris.flink.sink.committer.DorisCommitter         [] - load result {
    "status": "Success",
    "msg": "transaction [6972] commit successfully."
}
2022-06-22 19:05:48,303 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - stream load stopped.
2022-06-22 19:05:48,315 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - load Result {
    "TxnId": 6973,
    "Label": "doris_demo_001_0_11",
    "TwoPhaseCommit": "true",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 520,
    "NumberLoadedRows": 520,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 29293,
    "LoadTimeMs": 10005,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 0,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 10001,
    "CommitAndPublishTimeMs": 0
}

2022-06-22 19:05:48,315 INFO  org.apache.doris.flink.sink.writer.RecordBuffer              [] - start buffer data, read queue size 0, write queue size 3
2022-06-22 19:05:48,315 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - stream load started for doris_demo_001_0_12
2022-06-22 19:05:48,315 INFO  org.apache.doris.flink.sink.writer.DorisStreamLoad           [] - start execute load
2022-06-22 19:05:48,322 INFO  org.apache.flink.streaming.runtime.operators.sink.AbstractStreamingCommitterHandler [] - Committing the state for checkpoint 11
2022-06-22 19:05:48,327 INFO  org.apache.doris.flink.sink.committer.DorisCommitter         [] - load result {
    "status": "Success",
    "msg": "transaction [6973] commit successfully."
}
```



### 6.6 查询Doris 数据

这里我是插入了636条数据，

```sql
mysql> select count(1) from  all_employees_info ;
+----------+
| count(1) |
+----------+
|      634 |
+----------+
1 row in set (0.01 sec)

mysql> select * from  all_employees_info limit 20;
+--------+------------+------------+-------------+--------+------------+---------------+-------------+
| emp_no | birth_date | first_name | last_name   | gender | hire_date  | database_name | table_name  |
+--------+------------+------------+-------------+--------+------------+---------------+-------------+
|  10001 | 1953-09-02 | Georgi     | Facello     | M      | 1986-06-26 | emp_1         | employees_1 |
|  10002 | 1964-06-02 | Bezalel    | Simmel      | F      | 1985-11-21 | emp_1         | employees_1 |
|  10003 | 1959-12-03 | Parto      | Bamford     | M      | 1986-08-28 | emp_1         | employees_1 |
|  10004 | 1954-05-01 | Chirstian  | Koblick     | M      | 1986-12-01 | emp_1         | employees_1 |
|  10005 | 1955-01-21 | Kyoichi    | Maliniak    | M      | 1989-09-12 | emp_1         | employees_1 |
|  10006 | 1953-04-20 | Anneke     | Preusig     | F      | 1989-06-02 | emp_1         | employees_1 |
|  10007 | 1957-05-23 | Tzvetan    | Zielinski   | F      | 1989-02-10 | emp_1         | employees_1 |
|  10008 | 1958-02-19 | Saniya     | Kalloufi    | M      | 1994-09-15 | emp_1         | employees_1 |
|  10009 | 1952-04-19 | Sumant     | Peac        | F      | 1985-02-18 | emp_1         | employees_1 |
|  10010 | 1963-06-01 | Duangkaew  | Piveteau    | F      | 1989-08-24 | emp_1         | employees_1 |
|  10011 | 1953-11-07 | Mary       | Sluis       | F      | 1990-01-22 | emp_1         | employees_1 |
|  10012 | 1960-10-04 | Patricio   | Bridgland   | M      | 1992-12-18 | emp_1         | employees_1 |
|  10013 | 1963-06-07 | Eberhardt  | Terkki      | M      | 1985-10-20 | emp_1         | employees_1 |
|  10014 | 1956-02-12 | Berni      | Genin       | M      | 1987-03-11 | emp_1         | employees_1 |
|  10015 | 1959-08-19 | Guoxiang   | Nooteboom   | M      | 1987-07-02 | emp_1         | employees_1 |
|  10016 | 1961-05-02 | Kazuhito   | Cappelletti | M      | 1995-01-27 | emp_1         | employees_1 |
|  10017 | 1958-07-06 | Cristinel  | Bouloucos   | F      | 1993-08-03 | emp_1         | employees_1 |
|  10018 | 1954-06-19 | Kazuhide   | Peha        | F      | 1987-04-03 | emp_1         | employees_1 |
|  10019 | 1953-01-23 | Lillian    | Haddadi     | M      | 1999-04-30 | emp_1         | employees_1 |
|  10020 | 1952-12-24 | Mayuko     | Warwick     | M      | 1991-01-26 | emp_1         | employees_1 |
+--------+------------+------------+-------------+--------+------------+---------------+-------------+
20 rows in set (0.00 sec)
```

### 6.7 测试删除

```sql
mysql> use emp_2;
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Database changed
mysql> show tables;
+-----------------+
| Tables_in_emp_2 |
+-----------------+
| employees_1     |
| employees_2     |
+-----------------+
2 rows in set (0.00 sec)

mysql> delete from employees_2 where emp_no in (12013,12014,12015);
Query OK, 3 rows affected (0.01 sec)
```

验证Doris数据删除

```sql
mysql> select count(1) from  all_employees_info ;
+----------+
| count(1) |
+----------+
|      631 |
+----------+
1 row in set (0.01 sec)
```



## 7. 总结

本问主要介绍了FLink CDC分库分表怎么实时同步，并结合Apache Doris Flink Connector最新版本整合的Flink 2PC 和 Doris Stream Load 2PC的机制及整合原理，使用方法等。

希望能给大家带来一点帮助。