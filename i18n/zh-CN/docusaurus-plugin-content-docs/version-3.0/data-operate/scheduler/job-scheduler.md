---
{
    "title": "作业调度",
    "language": "zh-CN"
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
## 背景
在数据管理愈加精细化的需求背景下，定时调度在其中扮演着重要的角色。它通常被应用于以下场景：
- 定期数据更新，如周期性数据导入和 ETL 操作，减少人工干预，提高数据处理的效率和准确性。
- 结合 Catalog 实现外部数据源数据定期同步，确保多源数据高效、准确的整合到目标系统中，满足复杂的业务分析需求。
- 定期清理过期/无效数据，释放存储空间，避免过多过期/无效数据对系统性能产生影响。

在 Apache Doris 之前版本中，通常需要依赖于外部调度系统，如通过业务代码定时调度或者引入第三方调度工具、分布式调度平台来满足上述需求。然而，因受限于外部系统自身能力，可能无法满足 Doris 对调度策略及资源管理灵活性的要求。此外，如果外部调度系统出现故障，这不仅会增加业务风险，还需投入额外的运维时间和人力来应对。
## Job Scheduler
为解决上述问题，Apache Doris 在 2.1 版本中引入了 Job Scheduler 功能，实现了自主任务调度能力，调度的精准度可达到秒级。该功能的推出不仅保障了数据导入的完整性和一致性，更让用户能够灵活、便捷调整调度策略。同时，因减少了对外部系统的依赖，也降低了系统故障的风险和运维成本，为社区用户带来更加统一、可靠的使用体验。

Doris Job Scheduler 是一种基于预设计划运行的任务管理系统，能够在特定时间点或按照指定时间间隔触发预定义操作，实现任务的自动化执行。Job Scheduler 具备以下特点：
- 高效调度：Job Scheduler 可以在指定的时间间隔内安排任务和事件，确保数据处理的高效性。采用时间轮算法保证事件能够精准做到秒级触发。
- 灵活调度：Job Scheduler 提供了多种调度选项，如按 分、小时、天或周的间隔进行调度，同时支持一次性调度以及循环（周期）事件调度，并且周期调度也可以指定开始时间、结束时间。
- 事件池和高性能处理队列：Job Scheduler 采用 Disruptor 实现高性能的生产消费者模型，最大可能的避免任务执行过载。
- 调度记录可追溯：Job Scheduler 会存储最新的 Task 执行记录（可配置），通过简单的命令即可查看任务执行记录，确保过程可追溯。
- 高可用：依托于 Doris 自身的高可用机制，Job Schedule 可以很轻松的做到自恢复、高可用。

**相关文档:** [CREATE-JOB](../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-JOB.md)

## 语法说明
一条有效的 Job 语句需包含以下内容：
- 关键字 CREATE JOB 需加作业名称，它在数据库中标识唯一事件。
- ON SCHEDULE 子句用于指定 Job 作业的类型、触发时间和频率。
    - AT timestamp用于一次性事件。它指定 JOB 仅在给定的日期和时间执行一次，AT current_timestamp  指定当前日期和时间。因 JOB 一旦创建则会立即运行，也可用于异步任务创建。
    - EVERY：用于周期性作业，可指定作业的执行频率，关键字后需指定时间间隔（周、天、小时、分钟）。
        - Interval：用于指定作业执行频率。1 DAY 表示每天执行一次， 1 HOUR表示每小时执行一次， 1 MINUTE 表示每分钟执行一次， 1 WEEK 表示每周执行一次。
        - 子句EVERY包含可选 STARTS子句。STARTS后面为timestamp值，该值用于定义开始重复的时间，CURRENT_TIMESTAMP  用于指定当前日期和时间。JOB 一旦创建则会立即运行。
        - 子句EVERY包含可选 ENDS子句。ENDS 关键字后面为timestamp 值，该值定义 JOB 事件停止运行的时间。
- DO 子句用于指定 Job 作业触发时所需执行的操作，目前仅支持 Insert 语句。
```sql 
CREATE
JOB
  job_name
  ON SCHEDULE schedule
  [COMMENT 'string']
  DO execute_sql;

schedule: {
    AT timestamp
    | EVERY interval
    [STARTS timestamp ]
    [ENDS timestamp ]
}
interval:
    quantity { WEEK |DAY | HOUR | MINUTE}
```
下方为简单的示例：
CREATE JOB my_job ON SCHEDULE EVERY 1 MINUTE DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
该语句表示创建一个名为 my_job 的作业，每分钟执行一次，执行的操作是将 db2.tbl2 中的数据导入到 db1.tbl1 中。

## 使用示例
创建一次性的 Job：在 2025-01-01 00:00:00 时执行一次，将 db2.tbl2 中数据导入到 db1.tbl1 中。
```sql
CREATE JOB my_job ON SCHEDULE AT '2025-01-01 00:00:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
```
创建周期性的 Job，未指定结束时间：在 22025-01-01 00:00:00 时开始每天执行 1 次，将 db2.tbl2 中数据导入到 db1.tbl1 中。
```sql
CREATE JOB my_job ON SCHEDULE EVERY 1 DAY STARTS '2025-01-01 00:00:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2 WHERE  create_time >=  days_add(now(),-1);
```
创建周期性的 Job，指定结束时间：在 2025-01-01 00:00:00 时开始每天执行 1 次，将 db2.tbl2 中的数据导入到 db1.tbl1 中，在 2026-01-01 00:10:00 时结束。
```sql
CREATE JOB my_job ON SCHEDULE EVERY 1 DAY STARTS '2025-01-01 00:00:00' ENDS '2026-01-01 00:10:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2 WHERE create_time >=  days_add(now(),-1);
```
借助 Job 实现异步执行：由于 Job 在 Doris 中是以同步任务的形式创建的，但其执行过程却是异步进行的，这一特性使得 Job 非常适合用于实现异步任务，例如常见的 insert into select 任务。

假设需要将db2.tbl2 中的数据导入到 db1.tbl1 中，这里只需要指定 JOB 为一次性任务，且开始时间设置为当前时间即可。
```sql
CREATE JOB my_job ON SCHEDULE AT current_timestamp DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
```

## 基于 Catalog 与 Job Scheduler 的数据自动同步
以某电商场景为例，用户常常需要从 MySQL 中提取业务数据，并将这些数据同步到 Doris 中进行数据分析，从而支持精准的营销活动。而 Job Scheduler 可与数据湖能力 Multi Catalog 配合，高效完成跨数据源的定期数据同步。

```sql
CREATE TABLE IF NOT EXISTS user.activity (
    `user_id` INT NOT NULL,
    `date` DATE NOT NULL,
    `city` VARCHAR(20),
    `age` SMALLINT,
    `sex` TINYINT,
    `last_visit_date` DATETIME DEFAULT '1970-01-01 00:00:00',
    `cost` BIGINT DEFAULT '0',
    `max_dwell_time` INT DEFAULT '0',
    `min_dwell_time` INT DEFAULT '99999'
);
INSERT INTO user.activity VALUES
    (10000, '2017-10-01', '北京', 20, 0, '2017-10-01 06:00:00', 20, 10, 10),
    (10000, '2017-10-01', '北京', 20, 0, '2017-10-01 07:00:00', 15, 2, 2),
    (10001, '2017-10-01', '北京', 30, 1, '2017-10-01 17:05:00', 2, 22, 22),
    (10002, '2017-10-02', '上海', 20, 1, '2017-10-02 12:59:00', 200, 5, 5),
    (10003, '2017-10-02', '广州', 32, 0, '2017-10-02 11:20:00', 30, 11, 11),
    (10004, '2017-10-01', '深圳', 35, 0, '2017-10-01 10:00:00', 100, 3, 3),
    (10004, '2017-10-03', '深圳', 35, 0, '2017-10-03 10:20:00', 11, 6, 6);
```

| user_id | date      | city | age  | sex  | last_visit_date | cost | max_dwell_time | min_dwell_time |
| ------- | --------- | ---- | ---- | ---- | --------------- | ---- | -------------- | -------------- |
| 10000   | 2017/10/1 | 北京 | 20   | 0    | 2017/10/1 6:00  | 20   | 10             | 10             |
| 10000   | 2017/10/1 | 北京 | 20   | 0    | 2017/10/1 7:00  | 15   | 2              | 2              |
| 10001   | 2017/10/1 | 北京 | 30   | 1    | 2017/10/1 17:05 | 2    | 22             | 22             |
| 10002   | 2017/10/2 | 上海 | 20   | 1    | 2017/10/2 12:59 | 200  | 5              | 5              |
| 10003   | 2017/10/2 | 广州 | 32   | 0    | 2017/10/2 11:20 | 30   | 11             | 11             |
| 10004   | 2017/10/1 | 深圳 | 35   | 0    | 2017/10/1 10:00 | 100  | 3              | 3              |
| 10004   | 2017/10/3 | 深圳 | 35   | 0    | 2017/10/3 10:20 | 11   | 6              | 6              |

以上表为例，用户希望查询符合总消费金额、最后一次访问时间、性别、所在城市这几个数值条件的用户，并将满足条件的用户信息导入到 Doris 中，以便后续的定向推送。

1. 首先，创建一张 Doris 表
```sql
 CREATE TABLE IF NOT EXISTS user_activity
   (
   `user_id` LARGEINT NOT NULL COMMENT "用户id",
   `date` DATE NOT NULL COMMENT "数据灌入日期时间",
   `city` VARCHAR(20) COMMENT "用户所在城市",
   `age` SMALLINT COMMENT "用户年龄",
   `sex` TINYINT COMMENT "用户性别",
   `last_visit_date` DATETIME REPLACE DEFAULT "1970-01-01 00:00:00" COMMENT "用户最后一次访问时间",
   `cost` BIGINT SUM DEFAULT "0" COMMENT "用户总消费",
   `max_dwell_time` INT MAX DEFAULT "0" COMMENT "用户最大停留时间",
   `min_dwell_time` INT MIN DEFAULT "99999" COMMENT "用户最小停留时间"
   )
   AGGREGATE KEY(`user_id`, `date`, `city`, `age`, `sex`)
   DISTRIBUTED BY HASH(`user_id`) BUCKETS 1
   PROPERTIES (
   "replication_allocation" = "tag.location.default: 1"
   );
```  
2. 其次，创建对应 MySQL 库的 Catalog
```sql    
CREATE CATALOG activity PROPERTIES (
   "type"="jdbc",
   "user"="root",
   "password"="123456",
   "jdbc_url" = "jdbc:mysql://127.0.0.1:3306/user?useSSL=false",
   "driver_url" = "mysql-connector-java-5.1.49.jar",
   "driver_class" = "com.mysql.jdbc.Driver"
   );
```  
3. 最后，将 MySQL 数据导入到 Doris 中。采用 Catalog + Insert Into 的方式来导入全量数据，由于全量导入操作可能会引发系统服务波动，通常选择在业务闲暇时进行操作。

- 一次性调度：如下方代码所示，使用一次性任务来定时触发全量导入任务，触发时间为凌晨 3:00。
```sql    
CREATE JOB one_time_load_job
  ON SCHEDULE
  AT '2024-8-10 03:00:00'
  DO
  INSERT INTO user_activity SELECT * FROM activity.user.activity
```  
- 周期调度：用户也可以创建一个周期性的调度任务，定期更新最新的数据。
```sql    
CREATE JOB schedule_load
  ON SCHEDULE EVERY 1 DAY
  DO
  INSERT INTO user_activity SELECT * FROM activity.user.activity where create_time >=  days_add(now(),-1)
```  
## 设计与实现
高效的调度通常伴随着大量的资源消耗，高精度的调度更是如此。传统的实现方式是直接使用 Java 内置的定时调度能力——定时调度线程周期访问，或采用一些定时调度的工具类库，但其在精度以及内存占用上存在较大的问题。为更好保障性能的前提下降低资源的占用，我们选择 TimingWheel 算法与 Disruptor 结合，实现秒级别的任务调度。

具体来说，利用 Netty 的 HashedWheelTimer 实现时间轮算法，Job Manager 会周期性（默认十分钟）地将未来事件放入时间轮中调度。为了保证任务高效触发并避免资源过度占用，采用 Disruptor 构建单生产者多消费者模型。时间轮仅负责触发，并不直接执行任务。对于到期需触发的任务时，会将其放入 Diapatch 线程，由其负责将任务分发至相应的执行线程池，对于需立即执行的任务，则直接将其投递至相应的任务执行线程池中。

对于单次执行事件，将在调度完成后删除事件定义；对于周期性事件，时间轮中的系统事件将定期拉取下一个周期的执行任务。这样可以避免大量任务集中在一个 Bucket 中，减少无意义的遍历、提高处理效率。

而对于事务型任务，Job Scheduler 能够通过与事务的强关联以及事务回调机制，确保事务型任务的执行结果与预期一致，从而保证数据的完整性和一致性。


## 未来规划
Doris Job Scheduler 是一款强大且灵活的任务调度工具，是数据处理中必不可少的功能之一。除了在数据湖分析、内部 ETL 等常见场景的应用外，Job Scheduler 对于异步物化视图的实现也起到关键的作用。异步物化视图是一个预先计算并存储的结果集，其数据更新的频率与源表的变动紧密相关。当源表数据更新频繁时，为确保物化视图中数据保持最新状态，就需要对物化视图定期刷新。因此在 2.1 版本中，我们巧妙地利用 JOB 定时调度功能，保障了物化视图与源表数据的一致性，大幅降低了人工干预的成本。
未来，Doris Job Scheduler 还会支持以下特性：
- 支持通过 UI 界面查看不同时段执行的任务分布情况。
- 支持 JOB 流程编排，即 DAG JOB。这意味着我们可以在内部实现数仓任务编排，与 Catalog 功能叠加将会更高效地完成数据处理和分析工作。
- 支持对导入任务、UPDATE、DELETE 操作进行定时调度。
