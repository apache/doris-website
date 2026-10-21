---
{
    "title": "CANCEL REPAIR TABLE",
    "language": "ko",
    "description": "CANCEL REPAIR TABLE 문은 지정한 테이블 또는 파티션의 우선순위가 높은 복구 작업을 취소하는 데 사용됩니다."
}
---

## 설명 {#description}

`CANCEL REPAIR TABLE` 문은 지정한 테이블 또는 파티션의 우선순위가 높은 복구 작업을 취소하는 데 사용됩니다. 이 문은 다음 기능을 제공합니다.

- 테이블 전체의 우선순위가 높은 복구 작업을 취소할 수 있습니다.
- 지정한 파티션의 우선순위가 높은 복구 작업을 취소할 수 있습니다.
- 시스템의 기본 복제본 복구 메커니즘에는 영향을 주지 않습니다.

## 구문 {#syntax}

```sql
ADMIN CANCEL REPAIR TABLE <table_name> [ PARTITION (<partition_name> [, ...]) ];
```

## 필수 매개변수 {#required-parameters}

**1. `<table_name>`**

> 복구 작업을 취소할 테이블의 이름을 지정합니다.
>
> 테이블 이름은 해당 데이터베이스 내에서 고유해야 합니다.

## 선택적 매개변수 {#optional-parameters}

**1. `PARTITION (<partition_name> [, ...])`**

> 복구 작업을 취소할 파티션 이름 목록을 지정합니다.
>
> 이 매개변수를 지정하지 않으면 테이블 전체의 우선순위가 높은 복구 작업을 취소합니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한            | 대상        | 설명                                          |
| :-------------- | :---------- | :-------------------------------------------- |
| ADMIN           | 시스템      | 이 명령을 실행하려면 사용자에게 ADMIN 권한이 있어야 합니다. |

## 사용 시 참고 사항 {#usage-notes}

- 이 문은 우선순위가 높은 복구 작업만 취소하며, 시스템의 기본 복제본 복구 메커니즘은 중지하지 않습니다.
- 취소 후에도 시스템은 기본 스케줄링 방식으로 복제본을 계속 복구합니다.
- 우선순위가 높은 복구 작업을 다시 설정해야 하는 경우 `ADMIN REPAIR TABLE` 명령을 사용할 수 있습니다.
- 이 명령은 실행 직후 적용됩니다.

## 예제 {#examples}

- 테이블 전체의 우선순위가 높은 복구 작업 취소:

    ```sql
    ADMIN CANCEL REPAIR TABLE tbl;
    ```

- 지정한 파티션의 우선순위가 높은 복구 작업 취소:

    ```sql
    ADMIN CANCEL REPAIR TABLE tbl PARTITION(p1, p2);
    ```
