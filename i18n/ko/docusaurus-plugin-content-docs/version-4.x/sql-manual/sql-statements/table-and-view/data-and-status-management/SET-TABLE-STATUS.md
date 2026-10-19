---
{
    "title": "SET TABLE STATUS",
    "language": "ko",
    "description": "SET TABLE STATUS 문은 OLAP 테이블의 상태를 수동으로 설정하는 데 사용됩니다. 이 문은 다음과 같은 기능을 제공합니다:"
}
---

## 설명 {#description}

`SET TABLE STATUS` 문은 OLAP 테이블의 상태를 수동으로 설정하는 데 사용됩니다. 이 문은 다음과 같은 기능을 제공합니다:

- OLAP 테이블의 상태 설정만 지원합니다.
- 테이블 상태를 지정한 대상 상태로 변경할 수 있습니다.
- 테이블 상태로 인해 작업이 차단되는 문제를 해결하는 데 사용됩니다.

**지원되는 상태**:

| 상태              | 설명                                 |
|-------------------|--------------------------------------|
| NORMAL            | 테이블이 정상 상태임을 나타냅니다. |
| ROLLUP            | 테이블에서 ROLLUP 작업이 진행 중임을 나타냅니다. |
| SCHEMA_CHANGE     | 테이블에서 스키마 변경이 진행 중임을 나타냅니다. |
| BACKUP            | 테이블에서 백업 작업이 진행 중임을 나타냅니다. |
| RESTORE           | 테이블에서 복원 작업이 진행 중임을 나타냅니다. |
| WAITING_STABLE    | 테이블이 안정적인 상태가 되기를 기다리고 있음을 나타냅니다. |

## 구문 {#syntax}

```sql
ADMIN SET TABLE <table_name> STATUS PROPERTIES ("<key>" = "<value>" [, ...]);
```

각 항목은 다음과 같습니다:

```sql
<key>
  : "state"

<value>
  : "NORMAL"
  | "ROLLUP"
  | "SCHEMA_CHANGE"
  | "BACKUP"
  | "RESTORE"
  | "WAITING_STABLE"
```

## 필수 매개변수 {#required-parameters}

**1. `<table_name>`**

> 상태를 설정할 테이블의 이름을 지정합니다.
>
> 테이블 이름은 해당 데이터베이스 내에서 고유해야 합니다.

**2. `PROPERTIES ("state" = "<value>")`**

> 테이블의 대상 상태를 지정합니다.
>
> "state" 속성을 반드시 설정해야 하며, 값은 지원되는 상태 중 하나여야 합니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다:

| 권한            | 객체        | 참고 사항                                     |
| :-------------- | :---------- | :-------------------------------------------- |
| ADMIN           | 시스템      | 이 명령을 실행하려면 사용자에게 ADMIN 권한이 있어야 합니다. |

## 사용 시 유의 사항 {#usage-notes}

- 이 명령은 긴급 장애 복구를 위한 것이므로 주의해서 사용하세요.
- OLAP 테이블만 지원하며 다른 유형의 테이블은 지원하지 않습니다.
- 테이블이 이미 대상 상태인 경우 이 명령은 무시됩니다.
- 상태를 잘못 설정하면 시스템 이상이 발생할 수 있으므로 기술 지원 담당자의 안내에 따라 사용하는 것이 좋습니다.
- 상태를 변경한 후에는 즉시 시스템의 운영 상태를 모니터링하는 것이 좋습니다.

## 예시 {#examples}

- 테이블 상태를 NORMAL로 설정:

    ```sql
    ADMIN SET TABLE tbl1 STATUS PROPERTIES("state" = "NORMAL");
    ```

- 테이블 상태를 SCHEMA_CHANGE로 설정:

    ```sql
    ADMIN SET TABLE tbl2 STATUS PROPERTIES("state" = "SCHEMA_CHANGE");
    ```
