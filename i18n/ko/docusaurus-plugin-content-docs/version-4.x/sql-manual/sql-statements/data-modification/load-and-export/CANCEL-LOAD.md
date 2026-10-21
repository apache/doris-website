---
{
    "title": "CANCEL LOAD",
    "language": "ko",
    "description": "이 문은 지정된 레이블의 데이터 적재 작업을 취소하거나, 퍼지 매칭을 통해 데이터 적재 작업을 일괄 취소하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 지정된 `label`의 데이터 적재 작업을 취소하거나, 퍼지 매칭을 통해 데이터 적재 작업을 일괄 취소하는 데 사용됩니다.

## 구문 {#syntax}

```sql
CANCEL LOAD
[FROM <db_name>]
WHERE [LABEL = "<load_label>" | LABEL like "<label_pattern>" | STATE = { "PENDING" | "ETL" | "LOADING" } ]
```

## 필수 매개변수 {#required-parameters}

**1. `<db_name>`**

> 취소할 데이터 적재 작업이 속한 데이터베이스의 이름입니다.

## 선택적 매개변수 {#optional-parameters}

**1. `<load_label>`**

> `LABEL = "<load_label>"`을 사용하면 지정된 레이블과 정확히 일치하는 작업을 찾습니다.

**2. `<label_pattern>`**

> `LABEL LIKE "<label_pattern>"`을 사용하면 레이블에 `label_pattern`이 포함된 데이터 적재 작업을 찾습니다.

**3. STATE = { " PENDING " | " ETL " | " LOADING " }**

> `PENDING`을 지정하면 상태가 `STATE = "PENDING"`인 작업을 취소합니다. 다른 상태에도 동일하게 적용됩니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한 | 객체 | 설명 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV | 데이터베이스 | 데이터베이스 내 테이블에 대한 데이터 적재 권한이 필요합니다. |

## 사용 참고 사항 {#usage-notes}

- `State`에 따른 작업 취소는 버전 1.2.0부터 지원됩니다.
- `PENDING`, `ETL` 또는 `LOADING` 상태인 미완료 데이터 적재 작업만 취소할 수 있습니다.
- 일괄 취소 시 Doris는 해당하는 모든 데이터 적재 작업이 원자적으로 취소되는 것을 보장하지 않습니다. 즉, 일부 데이터 적재 작업만 성공적으로 취소될 수 있습니다. 사용자는 `SHOW LOAD` 문으로 작업 상태를 확인하고 `CANCEL LOAD` 문을 다시 실행할 수 있습니다.

## 예제 {#examples}

1. 레이블이 `example_db_test_load_label`인 데이터 적재 작업을 `example_db` 데이터베이스에서 취소합니다.

   ```sql
   CANCEL LOAD
   FROM example_db
   WHERE LABEL = "example_db_test_load_label";
   ```

2. 레이블에 `example_`이 포함된 모든 데이터 적재 작업을 `example_db` 데이터베이스에서 취소합니다.

   ```sql
   CANCEL LOAD
   FROM example_db
   WHERE LABEL like "%example_%";
   ```

3. `LOADING` 상태인 데이터 적재 작업을 취소합니다.

   ```sql
   CANCEL LOAD
   FROM example_db
   WHERE STATE = "loading";
   ```
