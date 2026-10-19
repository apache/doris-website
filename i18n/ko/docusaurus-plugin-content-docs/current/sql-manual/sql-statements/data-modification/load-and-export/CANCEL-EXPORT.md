---
{
    "title": "CANCEL EXPORT",
    "language": "ko",
    "description": "지정한 레이블의 내보내기 작업을 취소하는 데 사용하는 문입니다. 패턴 매칭으로 여러 내보내기 작업을 한 번에 취소할 수도 있습니다."
}
---

## 설명 {#description}

지정한 레이블의 내보내기 작업을 취소하는 데 사용하는 문입니다. 패턴 매칭으로 여러 내보내기 작업을 한 번에 취소할 수도 있습니다.

## 구문 {#syntax}

```sql
CANCEL EXPORT
[ FROM <db_name> ]
WHERE [ LABEL = "<export_label>" | LABEL like "<label_pattern>" | STATE = "<state>" ]
```

## 선택적 매개변수 {#optional-parameters}

**1. `<db_name>`**

  데이터 내보내기 작업이 속한 데이터베이스의 이름입니다. 생략하면 현재 데이터베이스가 기본값으로 사용됩니다.

**2. `<export_label>`**

  각 가져오기 작업에는 고유한 Label을 할당해야 합니다. 이 작업을 중지하려면 해당 레이블을 지정해야 합니다.

**3. `<label_pattern>`**

  패턴 매칭에 사용할 레이블 표현식입니다. 여러 EXPORT 작업을 취소하려면 `LIKE`를 사용하여 패턴을 매칭할 수 있습니다.

**4. `<state>`**

  상태 옵션: `PENDING`,`IN_QUEUE`,`EXPORTING`.

## 액세스 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한          | 객체      | 설명                                          |
|:--------------|:----------|:----------------------------------------------|
| ALTER_PRIV    | 데이터베이스 | 데이터베이스를 수정할 수 있는 권한이 필요합니다. |


## 사용 시 주의 사항 {#usage-notes}

1. PENDING, IN_QUEUE,EXPORTING 상태로 대기 중인 내보내기 작업만 취소할 수 있습니다.
2. 일괄 취소 시 Doris는 해당하는 모든 내보내기 작업의 원자적 취소를 보장하지 않습니다. 즉, 일부 내보내기 작업만 성공적으로 취소될 수 있습니다. 사용자는 SHOW EXPORT 문으로 작업 상태를 확인하고 CANCEL EXPORT 문을 반복 실행해 볼 수 있습니다.
3. `EXPORTING` 상태의 작업을 취소하면 데이터 일부가 이미 스토리지 시스템으로 내보내졌을 수 있으므로, 사용자가 이 데이터를 처리(삭제)해야 합니다.

## 예제 {#examples}

- example_db 데이터베이스에서 레이블이 `example_db_test_export_label`인 내보내기 작업을 취소합니다.

   ```sql
   CANCEL EXPORT
   FROM example_db
   WHERE LABEL = "example_db_test_export_label" and STATE = "EXPORTING";
   ```

- example*db 데이터베이스에서 example*가 포함된 모든 내보내기 작업을 취소합니다.

   ```sql
   CANCEL EXPORT
   FROM example_db
   WHERE LABEL like "%example%";
   ```

- 상태가 "PENDING"인 모든 내보내기 작업을 취소합니다.

   ```sql
   CANCEL EXPORT
   FROM example_db
   WHERE STATE = "PENDING";
   ```
