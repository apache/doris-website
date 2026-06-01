---
{
    "title": "Job Scheduler 定时任务调度",
    "sidebar_label": "定时任务调度",
    "language": "zh-CN",
    "description": "Apache Doris Job Scheduler 支持秒级定时任务调度，无需外部调度系统，可实现数据定期导入、ETL、多数据源同步等自动化操作。",
    "keywords": ["Job Scheduler", "定时任务", "任务调度", "定时调度", "数据同步", "ETL", "Doris 定时任务"]
}
---

<!-- 知识类型: 功能概述 + 操作步骤 -->

## 概述

Apache Doris 内置的 **Job Scheduler** 是一个基于预设计划运行的任务管理系统，能够在指定时间点或按照固定时间间隔自动触发 SQL 操作，无需依赖外部调度工具。自 2.1 版本起，Job Scheduler 的调度精度可达秒级。

**典型应用场景：**

- 周期性数据导入与 ETL 处理，减少人工干预
- 结合 Multi-Catalog 实现多数据源定期同步
- 定期清理过期或无效数据，释放存储空间
- 异步物化视图的定期刷新

**核心特性：**

| 特性 | 说明 |
|------|------|
| 秒级精度 | 采用时间轮（TimingWheel）算法，事件触发精度达秒级 |
| 灵活调度 | 支持一次性调度和周期性调度，周期可设置开始/结束时间 |
| 高性能队列 | 基于 Disruptor 构建高性能生产消费者模型，避免任务执行过载 |
| 执行记录可追溯 | 保存最近 Task 执行记录（数量可配置），可通过命令查询 |
| 高可用 | 依托 Doris 自身高可用机制，支持自动故障恢复 |

**相关文档：** [CREATE JOB](../../sql-manual/sql-statements/job/CREATE-JOB)

---

## 语法说明

<!-- 知识类型: 参考 -->

一条完整的 Job 创建语句包含以下三个部分：

```sql
CREATE JOB job_name
    ON SCHEDULE schedule
    [COMMENT 'string']
    DO execute_sql;

schedule: {
    AT timestamp
    | EVERY interval
      [STARTS timestamp]
      [ENDS timestamp]
}

interval:
    quantity { WEEK | DAY | HOUR | MINUTE }
```

**语法组成说明：**

| 子句 | 说明 |
|------|------|
| `CREATE JOB job_name` | 指定 Job 名称，在数据库中唯一标识该任务 |
| `ON SCHEDULE AT timestamp` | 一次性调度：在指定时间点执行一次；使用 `CURRENT_TIMESTAMP` 表示立即执行 |
| `ON SCHEDULE EVERY interval` | 周期性调度：按指定时间间隔重复执行 |
| `STARTS timestamp` | （可选）周期调度的开始时间；使用 `CURRENT_TIMESTAMP` 表示立即开始 |
| `ENDS timestamp` | （可选）周期调度的结束时间 |
| `DO execute_sql` | 触发时执行的 SQL 语句（目前仅支持 INSERT 语句） |

**interval 支持的单位：** `WEEK`、`DAY`、`HOUR`、`MINUTE`

---

## 使用示例

<!-- 知识类型: 操作步骤 -->

### 一次性任务

在 2025-01-01 00:00:00 执行一次，将 `db2.tbl2` 的数据导入到 `db1.tbl1`：

```sql
CREATE JOB my_job
    ON SCHEDULE AT '2025-01-01 00:00:00'
    DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
```

### 周期性任务（不设结束时间）

从 2025-01-01 00:00:00 开始，每天执行一次增量导入：

```sql
CREATE JOB my_job
    ON SCHEDULE EVERY 1 DAY
    STARTS '2025-01-01 00:00:00'
    DO INSERT INTO db1.tbl1
       SELECT * FROM db2.tbl2
       WHERE create_time >= days_add(now(), -1);
```

### 周期性任务（设置结束时间）

从 2025-01-01 开始每天导入，至 2026-01-01 00:10:00 自动停止：

```sql
CREATE JOB my_job
    ON SCHEDULE EVERY 1 DAY
    STARTS '2025-01-01 00:00:00'
    ENDS '2026-01-01 00:10:00'
    DO INSERT INTO db1.tbl1
       SELECT * FROM db2.tbl2
       WHERE create_time >= days_add(now(), -1);
```

### 异步执行任务

Job 在 Doris 中以同步方式创建，但实际执行是异步进行的，适合实现异步任务（如耗时较长的 `INSERT INTO SELECT`）。

将开始时间设为 `CURRENT_TIMESTAMP`，Job 创建后会立即异步执行：

```sql
CREATE JOB my_job
    ON SCHEDULE AT CURRENT_TIMESTAMP
    DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
```

---

## 基于 Catalog 与 Job Scheduler 实现数据自动同步

<!-- 知识类型: 操作步骤 -->

以电商场景为例：用户需要定期从 MySQL 中提取业务数据，同步到 Doris 中进行数据分析，支持精准营销。Job Scheduler 可与 Multi-Catalog 配合，高效完成跨数据源的定期数据同步。

**步骤一：准备 MySQL 源数据**

假设 MySQL 中存在如下用户活动数据表：

```sql
CREATE TABLE IF NOT EXISTS user.activity (
    `user_id`        INT      NOT NULL,
    `date`           DATE     NOT NULL,
    `city`           VARCHAR(20),
    `age`            SMALLINT,
    `sex`            TINYINT,
    `last_visit_date` DATETIME DEFAULT '1970-01-01 00:00:00',
    `cost`           BIGINT   DEFAULT '0',
    `max_dwell_time` INT      DEFAULT '0',
    `min_dwell_time` INT      DEFAULT '99999'
);

INSERT INTO user.activity VALUES
    (10000, '2017-10-01', '北京', 20, 0, '2017-10-01 06:00:00', 20,  10, 10),
    (10000, '2017-10-01', '北京', 20, 0, '2017-10-01 07:00:00', 15,  2,  2),
    (10001, '2017-10-01', '北京', 30, 1, '2017-10-01 17:05:00', 2,   22, 22),
    (10002, '2017-10-02', '上海', 20, 1, '2017-10-02 12:59:00', 200, 5,  5),
    (10003, '2017-10-02', '广州', 32, 0, '2017-10-02 11:20:00', 30,  11, 11),
    (10004, '2017-10-01', '深圳', 35, 0, '2017-10-01 10:00:00', 100, 3,  3),
    (10004, '2017-10-03', '深圳', 35, 0, '2017-10-03 10:20:00', 11,  6,  6);
```

| user_id | date       | city | age | sex | last_visit_date     | cost | max_dwell_time | min_dwell_time |
|---------|------------|------|-----|-----|---------------------|------|----------------|----------------|
| 10000   | 2017-10-01 | 北京 | 20  | 0   | 2017-10-01 06:00:00 | 20   | 10             | 10             |
| 10000   | 2017-10-01 | 北京 | 20  | 0   | 2017-10-01 07:00:00 | 15   | 2              | 2              |
| 10001   | 2017-10-01 | 北京 | 30  | 1   | 2017-10-01 17:05:00 | 2    | 22             | 22             |
| 10002   | 2017-10-02 | 上海 | 20  | 1   | 2017-10-02 12:59:00 | 200  | 5              | 5              |
| 10003   | 2017-10-02 | 广州 | 32  | 0   | 2017-10-02 11:20:00 | 30   | 11             | 11             |
| 10004   | 2017-10-01 | 深圳 | 35  | 0   | 2017-10-01 10:00:00 | 100  | 3              | 3              |
| 10004   | 2017-10-03 | 深圳 | 35  | 0   | 2017-10-03 10:20:00 | 11   | 6              | 6              |

目标是查询满足消费金额、访问时间、性别、城市等条件的用户，并将其导入 Doris 进行后续精准推送。

**步骤二：在 Doris 中创建目标表**

```sql
CREATE TABLE IF NOT EXISTS user_activity (
    `user_id`        LARGEINT NOT NULL COMMENT "用户 id",
    `date`           DATE     NOT NULL COMMENT "数据灌入日期时间",
    `city`           VARCHAR(20)      COMMENT "用户所在城市",
    `age`            SMALLINT         COMMENT "用户年龄",
    `sex`            TINYINT          COMMENT "用户性别",
    `last_visit_date` DATETIME REPLACE DEFAULT "1970-01-01 00:00:00" COMMENT "用户最后一次访问时间",
    `cost`           BIGINT SUM DEFAULT "0"     COMMENT "用户总消费",
    `max_dwell_time` INT    MAX DEFAULT "0"     COMMENT "用户最大停留时间",
    `min_dwell_time` INT    MIN DEFAULT "99999" COMMENT "用户最小停留时间"
)
AGGREGATE KEY(`user_id`, `date`, `city`, `age`, `sex`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

**步骤三：创建 MySQL Catalog**

```sql
CREATE CATALOG activity PROPERTIES (
    "type"       = "jdbc",
    "user"       = "root",
    "password"   = "123456",
    "jdbc_url"   = "jdbc:mysql://127.0.0.1:3306/user?useSSL=false",
    "driver_url" = "mysql-connector-java-5.1.49.jar",
    "driver_class" = "com.mysql.jdbc.Driver"
);
```

**步骤四：创建调度 Job 执行数据同步**

全量导入可能引发系统波动，通常安排在业务低峰期（如凌晨）执行。

- **一次性调度**（全量导入，在凌晨 3:00 触发一次）：

    ```sql
    CREATE JOB one_time_load_job
        ON SCHEDULE AT '2024-08-10 03:00:00'
        DO INSERT INTO user_activity
           SELECT * FROM activity.user.activity;
    ```

- **周期性调度**（每日增量同步最新数据）：

    ```sql
    CREATE JOB schedule_load
        ON SCHEDULE EVERY 1 DAY
        DO INSERT INTO user_activity
           SELECT * FROM activity.user.activity
           WHERE last_visit_date >= days_add(now(), -1);
    ```

---

## 设计与实现原理

<!-- 知识类型: 概念解释 -->

高精度调度面临高资源消耗的挑战。传统 Java 定时线程方案在调度精度和内存占用上存在明显不足。为此，Job Scheduler 采用 **TimingWheel 算法 + Disruptor** 的组合方案，在保障性能的同时降低资源占用。

**核心机制：**

1. **时间轮触发**：利用 Netty 的 `HashedWheelTimer` 实现时间轮算法，Job Manager 每十分钟（默认）将未来事件预先放入时间轮进行调度。
2. **Disruptor 分发**：时间轮仅负责触发，不直接执行任务。到期任务先进入 Dispatch 线程，再由其分发至对应的执行线程池；需立即执行的任务则直接投递至执行线程池。
3. **事件生命周期管理**：一次性任务在调度完成后自动删除事件定义；周期性任务则由时间轮定期拉取下一周期的执行计划，避免大量任务集中在同一 Bucket 中，提高处理效率。
4. **事务一致性保障**：对于事务型任务，Job Scheduler 通过与事务的强关联及回调机制，确保任务执行结果与预期一致，保证数据完整性。

---

## 未来规划

<!-- 知识类型: 路线图 -->

Job Scheduler 在异步物化视图场景中同样发挥关键作用——当源表数据频繁更新时，Job Scheduler 负责定期触发物化视图刷新，确保视图数据与源表保持一致。

后续版本计划新增以下能力：

- **可视化任务分布**：支持通过 UI 界面查看不同时段的任务执行分布情况。
- **DAG 流程编排**：支持 JOB 流程编排（DAG JOB），在 Doris 内部实现数仓任务依赖编排，结合 Catalog 功能可更高效地完成数据处理与分析。
- **更多操作支持**：支持对 UPDATE、DELETE 等操作进行定时调度。
