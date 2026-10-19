---
{
    "title": "CANCEL BACKUP",
    "language": "ko",
    "description": "이 문은 진행 중인 BACKUP 작업을 취소하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 진행 중인 BACKUP 작업을 취소하는 데 사용됩니다.

## 구문 {#syntax}

```sql
CANCEL BACKUP FROM <db_name>;
```

## 매개변수 {#parameters}

**1.`<db_name>`**

백업 작업이 속한 데이터베이스의 이름입니다.

## 예제 {#example}

1. example_db의 BACKUP 작업을 취소합니다.

```sql
CANCEL BACKUP FROM example_db;
```
