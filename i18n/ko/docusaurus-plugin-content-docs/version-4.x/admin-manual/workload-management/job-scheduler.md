---
{
    "title": "작업 스케줄러",
    "sidebar_label": "작업 스케줄러",
    "language": "ko",
    "description": "Apache Doris Job Scheduler는 외부 스케줄링 시스템 없이 초 단위 정밀도로 예약 작업을 스케줄링할 수 있습니다. 정기적인 데이터 적재, ETL, 여러 소스 간 동기화 등의 작업을 자동화합니다.",
    "keywords": ["Job Scheduler", "예약 작업", "작업 스케줄링", "예약 스케줄링", "데이터 동기화", "ETL", "Doris 예약 작업"]
}
---

<!-- Knowledge type: Feature overview + Procedure -->

## 개요 {#overview}

Apache Doris에 내장된 **Job Scheduler**는 미리 정의한 계획에 따라 실행되는 작업 관리 시스템입니다. 외부 스케줄링 도구에 의존하지 않고 지정된 시점이나 일정한 간격으로 SQL 작업을 자동으로 트리거합니다. 2.1 버전부터 Job Scheduler는 초 단위 스케줄링 정밀도를 제공합니다.

**주요 사용 사례:**

- 정기적인 데이터 적재 및 ETL 처리로 수동 개입 감소
- Multi-Catalog와 함께 여러 데이터 소스 간 정기적인 동기화 수행
- 만료되었거나 유효하지 않은 데이터를 정기적으로 정리하여 저장 공간 확보
- 비동기 구체화된 뷰의 정기적인 새로 고침

**핵심 기능:**

| 기능 | 설명 |
|------|------|
| 초 단위 정밀도 | TimingWheel 알고리즘을 사용하여 초 단위 정밀도로 이벤트를 트리거합니다 |
| 유연한 스케줄링 | 일회성 및 반복 스케줄링을 모두 지원하며, 반복 Job에는 시작 시각과 종료 시각을 선택적으로 지정할 수 있습니다 |
| 고성능 큐 | Disruptor를 기반으로 고성능 생산자-소비자 모델을 구성하여 실행 과부하를 방지합니다 |
| 추적 가능한 실행 기록 | 최근 Task 실행 기록을 보관하며(보관 개수 설정 가능), 명령을 통해 조회할 수 있습니다 |
| 고가용성 | Doris 자체 고가용성 메커니즘을 활용하며 자동 장애 복구를 지원합니다 |

**관련 문서:** [CREATE JOB](../../sql-manual/sql-statements/job/CREATE-JOB)

---

## 구문 {#syntax}

<!-- Knowledge type: Reference -->

완전한 Job 생성 구문은 다음 세 부분으로 구성됩니다.

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

**구문 구성 요소:**

| 절 | 설명 |
|------|------|
| `CREATE JOB job_name` | 데이터베이스 내에서 작업을 고유하게 식별하는 Job 이름을 지정합니다 |
| `ON SCHEDULE AT timestamp` | 일회성 스케줄링: 지정된 시점에 한 번 실행합니다. 즉시 실행하려면 `CURRENT_TIMESTAMP`를 사용합니다 |
| `ON SCHEDULE EVERY interval` | 반복 스케줄링: 지정된 간격으로 반복 실행합니다 |
| `STARTS timestamp` | (선택 사항) 반복 스케줄의 시작 시각입니다. 즉시 시작하려면 `CURRENT_TIMESTAMP`를 사용합니다 |
| `ENDS timestamp` | (선택 사항) 반복 스케줄의 종료 시각입니다 |
| `DO execute_sql` | 트리거될 때 실행할 SQL 문입니다(현재는 INSERT 문만 지원) |

**간격에 사용할 수 있는 단위:** `WEEK`, `DAY`, `HOUR`, `MINUTE`

---

## 예제 {#examples}

<!-- Knowledge type: Procedure -->

### 일회성 작업 {#one-time-task}

2025-01-01 00:00:00에 한 번 실행하여 `db2.tbl2`의 데이터를 `db1.tbl1`에 적재합니다.

```sql
CREATE JOB my_job
    ON SCHEDULE AT '2025-01-01 00:00:00'
    DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
```

### 반복 작업(종료 시각 없음) {#recurring-task-without-an-end-time}

2025-01-01 00:00:00부터 매일 한 번 증분 데이터 적재를 실행합니다.

```sql
CREATE JOB my_job
    ON SCHEDULE EVERY 1 DAY
    STARTS '2025-01-01 00:00:00'
    DO INSERT INTO db1.tbl1
       SELECT * FROM db2.tbl2
       WHERE create_time >= days_add(now(), -1);
```

### 반복 작업(종료 시각 있음) {#recurring-task-with-an-end-time}

2025-01-01부터 매일 데이터 적재를 실행하고 2026-01-01 00:10:00에 자동으로 중지합니다.

```sql
CREATE JOB my_job
    ON SCHEDULE EVERY 1 DAY
    STARTS '2025-01-01 00:00:00'
    ENDS '2026-01-01 00:10:00'
    DO INSERT INTO db1.tbl1
       SELECT * FROM db2.tbl2
       WHERE create_time >= days_add(now(), -1);
```

### 비동기 실행 {#asynchronous-execution}

Doris에서 Job은 동기적으로 생성되지만 실제 실행은 비동기로 이루어집니다. 따라서 실행 시간이 긴 `INSERT INTO SELECT` 작업과 같은 비동기 작업에 적합합니다.

시작 시각을 `CURRENT_TIMESTAMP`로 설정하면 Job이 생성된 직후 비동기로 실행됩니다.

```sql
CREATE JOB my_job
    ON SCHEDULE AT CURRENT_TIMESTAMP
    DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
```

---

## Catalog와 Job Scheduler를 사용한 자동 데이터 동기화 {#automatic-data-synchronization-with-catalog-and-job-scheduler}

<!-- Knowledge type: Procedure -->

전자상거래 환경에서 정밀 마케팅을 위한 분석을 수행하려면 MySQL에서 비즈니스 데이터를 주기적으로 추출하여 Doris로 동기화해야 하는 경우를 생각해 보겠습니다. Job Scheduler는 Multi-Catalog와 함께 데이터 소스 간 정기적인 데이터 동기화를 효율적으로 수행할 수 있습니다.

**1단계: MySQL 원본 데이터 준비**

MySQL에 다음과 같은 사용자 활동 테이블이 있다고 가정합니다.

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
    (10000, '2017-10-01', 'Beijing',   20, 0, '2017-10-01 06:00:00', 20,  10, 10),
    (10000, '2017-10-01', 'Beijing',   20, 0, '2017-10-01 07:00:00', 15,  2,  2),
    (10001, '2017-10-01', 'Beijing',   30, 1, '2017-10-01 17:05:00', 2,   22, 22),
    (10002, '2017-10-02', 'Shanghai',  20, 1, '2017-10-02 12:59:00', 200, 5,  5),
    (10003, '2017-10-02', 'Guangzhou', 32, 0, '2017-10-02 11:20:00', 30,  11, 11),
    (10004, '2017-10-01', 'Shenzhen',  35, 0, '2017-10-01 10:00:00', 100, 3,  3),
    (10004, '2017-10-03', 'Shenzhen',  35, 0, '2017-10-03 10:20:00', 11,  6,  6);
```

| user_id | date       | city      | age | sex | last_visit_date     | cost | max_dwell_time | min_dwell_time |
|---------|------------|-----------|-----|-----|---------------------|------|----------------|----------------|
| 10000   | 2017-10-01 | Beijing   | 20  | 0   | 2017-10-01 06:00:00 | 20   | 10             | 10             |
| 10000   | 2017-10-01 | Beijing   | 20  | 0   | 2017-10-01 07:00:00 | 15   | 2              | 2              |
| 10001   | 2017-10-01 | Beijing   | 30  | 1   | 2017-10-01 17:05:00 | 2    | 22             | 22             |
| 10002   | 2017-10-02 | Shanghai  | 20  | 1   | 2017-10-02 12:59:00 | 200  | 5              | 5              |
| 10003   | 2017-10-02 | Guangzhou | 32  | 0   | 2017-10-02 11:20:00 | 30   | 11             | 11             |
| 10004   | 2017-10-01 | Shenzhen  | 35  | 0   | 2017-10-01 10:00:00 | 100  | 3              | 3              |
| 10004   | 2017-10-03 | Shenzhen  | 35  | 0   | 2017-10-03 10:20:00 | 11   | 6              | 6              |

목표는 쿼리를 통해 지출 금액, 방문 시각, 성별, 도시 조건에 맞는 사용자를 조회하고, 후속 정밀 추천에 활용할 수 있도록 해당 데이터를 Doris에 적재하는 것입니다.

**2단계: Doris에 대상 테이블 생성**

```sql
CREATE TABLE IF NOT EXISTS user_activity (
    `user_id`        LARGEINT NOT NULL COMMENT "User id",
    `date`           DATE     NOT NULL COMMENT "Data ingestion date",
    `city`           VARCHAR(20)      COMMENT "User city",
    `age`            SMALLINT         COMMENT "User age",
    `sex`            TINYINT          COMMENT "User gender",
    `last_visit_date` DATETIME REPLACE DEFAULT "1970-01-01 00:00:00" COMMENT "Last visit time",
    `cost`           BIGINT SUM DEFAULT "0"     COMMENT "Total spending",
    `max_dwell_time` INT    MAX DEFAULT "0"     COMMENT "Maximum dwell time",
    `min_dwell_time` INT    MIN DEFAULT "99999" COMMENT "Minimum dwell time"
)
AGGREGATE KEY(`user_id`, `date`, `city`, `age`, `sex`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

**3단계: MySQL Catalog 생성**

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

**4단계: 데이터 동기화를 수행할 예약 Job 생성**

전체 데이터 적재는 시스템 부하에 변동을 일으킬 수 있으므로 일반적으로 이른 새벽과 같이 이용이 적은 시간대에 예약합니다.

- **일회성 스케줄링**(전체 데이터 적재, 오전 3:00에 한 번 트리거):

    ```sql
    CREATE JOB one_time_load_job
        ON SCHEDULE AT '2024-08-10 03:00:00'
        DO INSERT INTO user_activity
           SELECT * FROM activity.user.activity;
    ```

- **반복 스케줄링**(최신 데이터를 매일 증분 동기화):

    ```sql
    CREATE JOB schedule_load
        ON SCHEDULE EVERY 1 DAY
        DO INSERT INTO user_activity
           SELECT * FROM activity.user.activity
           WHERE last_visit_date >= days_add(now(), -1);
    ```

---

## 설계 및 구현 {#design-and-implementation}

<!-- Knowledge type: Concept -->

정밀도가 높은 스케줄링에는 리소스 사용량이 많아진다는 과제가 따릅니다. 기존 Java 예약 스레드 방식은 스케줄링 정밀도와 메모리 사용량 모두에서 한계가 있습니다. 이를 해결하기 위해 Job Scheduler는 **TimingWheel 알고리즘과 Disruptor**를 결합하여 리소스 사용량을 낮게 유지하면서 성능을 확보합니다.

**핵심 메커니즘:**

1. **타이밍 휠 트리거**: 타이밍 휠 알고리즘은 Netty의 `HashedWheelTimer`로 구현됩니다. Job Manager는 기본적으로 십 분마다 향후 실행할 이벤트를 타이밍 휠에 미리 적재하여 스케줄링합니다.
2. **Disruptor 디스패치**: 타이밍 휠은 이벤트만 트리거하며 작업을 직접 실행하지 않습니다. 실행 시점이 된 작업은 먼저 Dispatch 스레드로 전달되고, 이 스레드가 해당 실행 스레드 풀로 작업을 전달합니다. 즉시 실행해야 하는 작업은 실행 스레드 풀로 직접 전달됩니다.
3. **이벤트 수명 주기 관리**: 일회성 작업은 스케줄링이 완료되면 이벤트 정의가 자동으로 삭제됩니다. 반복 작업의 경우 타이밍 휠이 다음 주기의 실행 계획을 주기적으로 가져옵니다. 이를 통해 같은 버킷에 작업이 많이 쌓이는 것을 방지하고 처리 효율을 높입니다.
4. **트랜잭션 일관성**: 트랜잭션 작업의 경우 Job Scheduler는 트랜잭션과의 긴밀한 연계 및 콜백 메커니즘을 사용하여 작업 실행 결과가 예상과 일치하고 데이터 무결성이 유지되도록 합니다.

---

## 로드맵 {#roadmap}

<!-- Knowledge type: Roadmap -->

Job Scheduler는 비동기 구체화된 뷰를 사용하는 환경에서도 중요한 역할을 합니다. 원본 테이블의 데이터가 자주 변경될 때 Job Scheduler는 구체화된 뷰의 새로 고침을 주기적으로 트리거하여 뷰가 원본 데이터와 일관성을 유지하도록 합니다.

향후 릴리스에는 다음 기능이 계획되어 있습니다.

- **작업 분포 시각화**: 서로 다른 시간 구간에 걸친 작업 실행 분포를 확인할 수 있는 UI를 제공합니다.
- **DAG 워크플로 오케스트레이션**: JOB 워크플로 오케스트레이션(DAG JOB)을 지원하여 Doris 내부에서 데이터 웨어하우스 작업의 의존 관계를 조율할 수 있도록 합니다. Catalog와 결합하면 데이터 처리 및 분석을 더욱 효율적으로 수행할 수 있습니다.
- **지원 작업 확대**: UPDATE 및 DELETE 등의 작업을 예약 실행하는 기능을 지원합니다.
