---
{
    "title": "DROP MATERIALIZED VIEW",
    "language": "ko",
    "description": "동기식 구체화된 뷰를 삭제합니다."
}
---

## 설명 {#description}

동기식 구체화된 뷰를 삭제합니다.

## 구문 {#syntax}


```sql
DROP MATERIALIZED VIEW 
[ IF EXISTS ] <materialized_view_name>
ON <table_name>
```

## 필수 매개변수 {#required-parameters}

**1. `<materialized_view_name>`**

> 삭제할 구체화된 뷰의 이름입니다.

**2. `<table_name>`**

> 구체화된 뷰가 속한 테이블입니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한       | 객체   | 설명                                                         |
| ---------- | ------ | ------------------------------------------------------------ |
| ALTER_PRIV | 테이블 | 삭제할 구체화된 뷰가 속한 테이블에 대한 ALTER_PRIV 권한이 필요합니다 |

## 예시 {#example}

동기식 구체화된 뷰 `sync_agg_mv`를 `lineitem` 테이블에서 삭제합니다.


```sql
DROP MATERIALIZED VIEW sync_agg_mv on lineitem;
```
