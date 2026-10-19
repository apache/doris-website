---
{
    "title": "DROP INDEX",
    "language": "ko",
    "description": "이 문은 테이블에서 지정한 이름의 인덱스를 삭제하는 데 사용됩니다. 현재는 inverted index와 ann index만 지원합니다."
}
---

## 설명 {#description}

이 문은 테이블에서 지정한 이름의 인덱스를 삭제하는 데 사용됩니다. 현재는 inverted index와 ann index만 지원합니다.

## 구문 {#syntax}

```sql
DROP INDEX [ IF EXISTS ] <index_name> ON [ <db_name> . ] <table_name>;
```

## 필수 매개변수 {#required-parameters}

**1. `<index_name>`**: 인덱스 이름입니다.  

**2. `<table_name>`**：인덱스가 속한 테이블의 이름입니다.  

## 선택 매개변수 {#optional-parameters}

**1. `<db_name>`**：데이터베이스 이름으로, 선택 사항입니다. 지정하지 않으면 기본적으로 현재 데이터베이스를 사용합니다.  

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한                 | 객체               | 설명                                          |
|:---------------------|:-------------------|:----------------------------------------------|
| ALTER_PRIV           | 테이블             | DROP INDEX는 테이블에 대한 ALTER 작업입니다    |

## 예제 {#examples}

- 인덱스 삭제

   ```sql
   DROP INDEX IF EXISTS index_name ON table1 ;
   ```
