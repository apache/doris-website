---
{
    "title": "DROP STATS",
    "language": "ko",
    "description": "지정한 테이블과 열의 통계 정보를 삭제합니다. 열 이름을 지정하지 않으면,"
}
---

## 설명 {#description}

지정한 테이블과 열의 통계 정보를 삭제합니다. 열 이름을 지정하지 않으면 모든 열의 통계 정보가 삭제됩니다.

## 구문 {#syntax}

```sql
DROP STATS <table_name> [ <column_names> ]
```

각 항목의 정의는 다음과 같습니다.

```sql
column_names
  :
  (<column_name>, [ <column_name>... ])
```

## 필수 매개변수 {#required-parameters}

**<table_name>**

> 테이블의 식별자(이름)입니다.

## 선택적 매개변수 {#optional-parameters}

**<column_names>**

> 열 식별자(이름)의 목록입니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다.

| 권한 | 객체 | 비고 |
| :-------- | :----- | :---- |
| DROP_PRIV | 테이블  |       |

## 예시 {#examples}

- table1의 모든 열에 대한 통계 정보 삭제

  ```sql
  DROP STATS table1
  ```
- table1의 col1과 col2에 대한 통계 정보 삭제

  ```sql
  DROP STATS table1 (col1, col2)
  ```
