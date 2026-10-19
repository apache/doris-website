---
{
    "title": "SHOW CREATE SYNC MATERIALIZED VIEW",
    "language": "ko",
    "description": "구체화된 뷰의 생성 문을 조회합니다."
}
---

## 설명 {#description}

구체화된 뷰의 생성 문을 조회합니다.

## 구문 {#syntax}

```sql
SHOW CREATE MATERIALIZED VIEW <materialized_view_name> ON <table_name>
```

## 필수 매개변수 {#required-parameters}

**1. `<materialized_view_name>`**

> 구체화된 뷰의 이름입니다.

**2. `<table_name>`**

> 구체화된 뷰가 속한 테이블입니다.

## 반환 값 {#return-values}

|열 이름 | 설명   |
| -- |------|
| TableName | 테이블 이름   |
| ViewName | 구체화된 뷰 이름 |
| CreateStmt | 구체화된 뷰를 생성하는 데 사용되는 문 |

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한 | 객체 | 비고                                                        |
| --------- | ------ | ------------------------------------------------------------ |
| SELECT_PRIV/LOAD_PRIV/ALTER_PRIV/CREATE_PRIV/DROP_PRIV | 테이블  | 현재 구체화된 뷰가 속한 테이블에 대한 권한이 필요합니다 |

## 예제 {#examples}

1. 동기 구체화된 뷰의 생성 문 조회

   ```sql
   SHOW CREATE MATERIALIZED VIEW sync_agg_mv on lineitem;
   ```
   
