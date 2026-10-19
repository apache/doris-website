---
{
    "title": "CREATE JOB",
    "language": "ko",
    "description": "Doris Job은 정해진 계획에 따라 실행되는 작업입니다. 특정 시각이나 지정된 시간 간격에 따라 미리 정의된 작업을 실행하는 데 사용됩니다,"
}
---

## 설명 {#description}

Doris Job은 정해진 계획에 따라 실행되는 작업입니다. 특정 시각이나 지정된 시간 간격에 따라 미리 정의된 작업을 실행하여 작업을 자동으로 수행할 수 있도록 돕습니다. 기능적으로는 운영 체제의 예약 작업(Linux의 cron, Windows의 예약 작업 등)과 유사합니다.

작업에는 `ONE_TIME`과 `RECURRING`의 두 가지 유형이 있습니다. `ONE_TIME` 유형의 작업은 지정된 시점에 실행되며, 주로 일회성 작업에 사용됩니다. `RECURRING` 유형의 작업은 지정된 시간 간격으로 반복 실행되며, 주로 주기적인 작업에 사용됩니다.
`RECURRING` 유형의 작업은 `STARTS/ENDS`를 통해 시작 시간과 종료 시간을 지정할 수 있습니다. 시작 시간을 지정하지 않으면 기본 최초 실행 시간은 현재 시간에 스케줄링 주기를 더한 시점입니다. 종료 시간을 지정하면 해당 시간에 작업 실행이 종료됩니다. 종료 시간에 도달하거나, 종료 시간을 초과하거나, 다음 실행 주기가 종료 시간을 초과하게 되면 FINISHED 상태로 변경되며, 이 시점부터 더 이상 태스크가 생성되지 않습니다.

작업에는 4가지 상태(`RUNNING`, `STOPPED`, `PAUSED`, `FINISHED`)가 있습니다. 

초기 상태는 `RUNNING`입니다. `RUNNING` 상태의 작업은 설정된 스케줄링 주기에 따라 실행할 TASK를 생성합니다. 작업이 완료되고 종료 시간에 도달하면 상태가 `FINISHED`로 변경됩니다.

`PAUSED` 상태의 작업은 RESUME 작업을 통해 재개할 수 있으며, RUNNING 상태로 변경됩니다.

`STOPPED` 상태는 사용자가 직접 중지를 요청하면 적용되며, 실행 중인 작업이 취소되고 해당 작업이 삭제됩니다.

`FINISHED` 상태의 작업은 시스템에 24시간 동안 보관되며, 24시간 후에 삭제됩니다.

JOB은 작업 정보만 나타냅니다. 실행 시에는 TASK가 생성됩니다. TASK 상태는 `PENDING`, `RUNNING`, `SUCCEESS`, `FAILED`, `CANCELED`로 나뉩니다.
`PENDING`은 실행 시각이 되었지만 리소스가 할당되기를 기다리는 상태를 의미합니다. 리소스가 할당되면 상태가 `RUNNING`으로 변경됩니다. 실행 성공 또는 실패에 따라 상태가 `SUCCESS`/`FAILED`로 변경됩니다.
`CANCELED`는 취소된 상태를 의미합니다. TASK는 최종 상태인 `SUCCESS`/`FAILED`를 영구 저장합니다. 다른 상태는 실행 중에 확인할 수 있지만, 재시작하면 확인할 수 없습니다.

## 구문 {#syntax}

```sql
CREATE
    JOB  
    <job_name>
    ON SCHEDULE <schedule>
    [ COMMENT <string> ]
    DO <sql_body> 
```

각 항목은 다음과 같습니다.

```sql
schedule:
  { AT <at_timestamp> | EVERY <interval> [STARTS <start_timestamp> ] [ENDS <end_timestamp> ] }
```

각 항목은 다음과 같습니다.

```sql
interval:
  quantity { WEEK | DAY | HOUR | MINUTE }
```

## 필수 매개변수 {#required-parameters}

**1. `<job_name>`**
> 데이터베이스에서 고유한 이벤트를 식별하는 작업 이름입니다. 작업 이름은 전역적으로 고유해야 합니다. 같은 이름의 작업이 이미 존재하면 오류가 발생합니다. **inner_** 접두사는 시스템 내부 용도로 예약되어 있으므로 사용자는 **inner_**로 시작하는 이름을 만들 수 없습니다.

**2. `<schedule>`**
> ON SCHEDULE 절은 작업의 유형, 실행 시각 및 실행 빈도를 지정합니다. 일회성 작업이나 주기적인 작업을 지정할 수 있습니다.

**3. `<sql_body>`**
> DO 절은 작업이 실행될 때 수행할 동작, 즉 SQL 문을 지정합니다.

## 선택적 매개변수 {#optional-parameters}

**1. `AT <at_timestamp>`**
> 형식: 'YYYY-MM-DD HH:MM:SS'. **일회성 이벤트**에 사용하며, 지정된 날짜와 시각에 이벤트를 한 번만 실행하도록 지정합니다. 실행이 완료되면 작업 상태가 FINISHED로 변경됩니다.

**2. `EVERY <interval>`**
> 주기적으로 반복되는 작업을 나타내며, 작업의 실행 빈도를 지정합니다. 키워드 뒤에는 시간 간격을 지정해야 하며, 일, 시간, 분, 초 또는 주 단위를 사용할 수 있습니다.

**3. `STARTS <start_timestamp>`**
> 형식: 'YYYY-MM-DD HH:MM:SS'. 작업의 시작 시간을 지정합니다. 지정하지 않으면 현재 시간 이후의 다음 실행 시점부터 실행됩니다. 시작 시간은 현재 시간보다 이후여야 합니다.

**4. `ENDS <end_timestamp>`**
> 형식: 'YYYY-MM-DD HH:MM:SS'. 작업의 종료 시간을 지정합니다. 지정하지 않으면 계속 실행됩니다. 날짜는 현재 시간보다 이후여야 합니다. STARTS로 시작 시간을 지정한 경우 종료 시간은 시작 시간보다 이후여야 합니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다.

| 권한          | 객체       | 비고                                                                    |
|:--------------|:-----------|:------------------------------------------------------------------------|
| ADMIN_PRIV    | 데이터베이스 | 현재 이 작업은 **ADMIN** 권한으로만 수행할 수 있습니다 |

## 사용 시 참고 사항 {#usage-notes}

- TASK는 최신 기록 100개만 보관합니다.

- 현재는 **내부 테이블에 대한 INSERT** 작업만 지원하며, 앞으로 더 많은 작업을 지원할 예정입니다.

- 다음 예약 작업의 실행 시각이 되어 작업을 스케줄링해야 할 때, 현재 JOB에 이전에 생성되어 아직 실행 중인 태스크가 있으면 이번 스케줄링은 건너뜁니다. 따라서 실행 간격을 적절하게 설정하는 것이 매우 중요합니다.

## 예제 {#examples}

- 매분 실행되는 my_job이라는 작업을 생성합니다. 수행할 동작은 db2.tbl2의 데이터를 db1.tbl1에 적재하는 것입니다.

  ```sql
  CREATE JOB my_job ON SCHEDULE EVERY 1 MINUTE DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
  ```

- 2020-01-01 00:00:00에 한 번 실행하여 db2.tbl2의 데이터를 db1.tbl1에 적재하는 일회성 작업을 생성합니다.

  ```sql
  CREATE JOB my_job ON SCHEDULE AT '2020-01-01 00:00:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
  ```

- 2020-01-01 00:00:00부터 매일 한 번 실행되는 주기적인 작업을 생성합니다. 수행할 동작은 db2.tbl2의 데이터를 db1.tbl1에 적재하는 것입니다.

  ```sql
  CREATE JOB my_job ON SCHEDULE EVERY 1 DAY STARTS '2020-01-01 00:00:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2 WHERE create_time >= days_add(now(),-1);
  ```

- 2020-01-01 00:00:00부터 매일 한 번 실행되는 주기적인 작업을 생성합니다. 수행할 동작은 db2.tbl2의 데이터를 db1.tbl1에 적재하는 것입니다. 작업은 2020-01-01 00:10:00에 종료됩니다.

  ```sql
  CREATE JOB my_job ON SCHEDULE EVERY 1 DAY STARTS '2020-01-01 00:00:00' ENDS '2020-01-01 00:10:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2 create_time >= days_add(now(),-1);
  ```

## 모범 사례 {#best-practices}

- 많은 작업이 동시에 실행되어 태스크가 누적되고 시스템의 정상적인 운영에 영향을 주지 않도록 작업을 적절하게 관리합니다.
- 태스크 실행 간격은 합리적인 범위로 설정해야 하며, 적어도 태스크 실행 시간보다는 길어야 합니다.

## 관련 문서 {#related-documents}

- [JOB 일시 중지](../job/PAUSE-JOB.md)
- [JOB 재개](../job/RESUME-JOB.md)
- [JOB 삭제](../job/DROP-JOB.md)
- [JOB 쿼리](../../../sql-manual/sql-functions/table-valued-functions/jobs.md)
- [TASKS 쿼리](../../sql-functions/table-valued-functions/jobs.md)

## 설정 {#config}

**fe.conf**

- job_dispatch_timer_job_thread_num은 예약된 태스크를 분배하는 데 사용하는 스레드 수이며, 기본값은 2입니다. 주기적으로 실행되는 태스크가 많으면 이 매개변수 값을 늘릴 수 있습니다.

- job_dispatch_timer_job_queue_size는 태스크가 누적될 때 예약된 태스크를 저장하는 큐의 크기이며, 기본값은 1024입니다. 많은 태스크가 동시에 실행되는 경우 이 매개변수 값을 늘릴 수 있습니다. 그렇지 않으면 큐가 가득 차서 제출된 태스크가 차단 상태로 전환되고, 이후 태스크를 제출하지 못하게 됩니다.

- finished_job_cleanup_threshold_time_hour는 완료된 태스크를 정리하는 시간 임계값입니다. 단위는 시간이며, 기본값은 24시간입니다.

- job_insert_task_consumer_thread_num = 10; Insert 태스크를 실행하는 데 사용하는 스레드 수입니다. 값은 0보다 커야 하며, 그렇지 않으면 기본값인 5가 사용됩니다.
