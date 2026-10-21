---
{
    "title": "CANCEL RESTORE",
    "language": "ko",
    "description": "이 문은 진행 중인 RESTORE 작업을 취소하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 진행 중인 RESTORE 작업을 취소하는 데 사용됩니다.

## 구문 {#syntax}

```sql
CANCEL RESTORE FROM <db_name>;
```

## 매개변수 {#parameters}

**1.`<db_name>`**

복원 작업이 속한 데이터베이스의 이름입니다.

## 사용 시 주의 사항 {#usage-notes}

- 복원 과정에서 COMMIT 단계 전후 또는 그 이후에 작업을 취소하면 복원 중인 테이블에 접근할 수 없게 될 수 있습니다. 이 경우 복원 작업을 다시 실행해야만 데이터를 복구할 수 있습니다.

## 예제 {#example}

1. example_db의 RESTORE 작업을 취소합니다.

```sql
CANCEL RESTORE FROM example_db;
```
