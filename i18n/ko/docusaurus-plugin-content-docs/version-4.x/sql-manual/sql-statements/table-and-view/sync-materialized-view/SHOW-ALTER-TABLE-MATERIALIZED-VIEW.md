---
{
    "title": "SHOW ALTER TABLE MATERIALIZED VIEW",
    "language": "ko",
    "description": "동기식 구체화된 뷰 빌드 작업의 상태를 확인합니다."
}
---

## 설명 {#description}

동기식 구체화된 뷰 빌드 작업의 상태를 확인합니다.

동기식 구체화된 뷰 생성은 비동기 작업이므로, 사용자는 구체화된 뷰 생성 작업을 제출한 후 명령어를 통해 동기식 구체화된 뷰의 빌드 상태를 비동기적으로 확인해야 합니다.

## 구문 {#syntax}


```sql
SHOW ALTER TABLE MATERIALIZED VIEW FROM <database>
```

## 필수 매개변수 {#required-parameters}

**1. `<database>`**

> 동기식 구체화된 뷰의 기본 테이블이 속한 데이터베이스입니다.

## 권한 {#permissions}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다.

| 권한  | 객체 | 설명                                                        |
| ---------- | ------ | ------------------------------------------------------------ |
| ALTER_PRIV | 테이블  | 현재 구체화된 뷰가 속한 테이블에 대한 ALTER_PRIV 권한이 필요합니다 |

## 예제 {#example}

```sql
SHOW ALTER TABLE MATERIALIZED VIEW FROM doc_db;
```
