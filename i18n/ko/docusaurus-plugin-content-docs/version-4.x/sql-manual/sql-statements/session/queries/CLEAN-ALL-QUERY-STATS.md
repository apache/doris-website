---
{
    "title": "CLEAN ALL QUERY STATS",
    "language": "ko",
    "description": "이 문은 쿼리 통계를 초기화하는 데 사용됩니다"
}
---

## 설명 {#description}

이 문은 쿼리 통계를 초기화하는 데 사용됩니다

## 구문 {#syntax}

```sql
CLEAN [ { ALL| DATABASE | TABLE } ] QUERY STATS [ { [ FOR <db_name>] | [ { FROM | IN } ] <table_name>]];
```

## 필수 매개변수 {#required-parameters}

**1. `ALL`**

> ALL을 사용하여 모든 쿼리 통계를 초기화합니다

**2. `DATABASE`**

> DATABASE를 사용하여 데이터베이스의 쿼리 통계를 초기화합니다

**3. `TABLE`**

> TABLE을 사용하여 테이블의 쿼리 통계를 초기화합니다

## 선택적 매개변수 {#optional-parameters}

**1. `<db_name>`**

> 이 매개변수를 설정하면 해당 데이터베이스의 통계가 초기화됩니다

**2. `<table_name>`**

> 이 매개변수를 설정하면 해당 테이블의 통계가 초기화됩니다


## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다:

| 권한  | 객체   | 설명                 |
|:-----------|:---------|:--------------------------|
| ADMIN_PRIV | ALL      | ALL을 지정한 경우 ADMIN 권한이 필요합니다     |
| ALTER_PRIV | DATABASE | 데이터베이스를 지정한 경우 해당 데이터베이스에 대한 ALTER 권한이 필요합니다 |
| ADMIN_PRIV | TABLE    | 테이블을 지정한 경우 해당 테이블에 대한 alter 권한이 필요합니다     |


## 예제 {#examples}

```sql
clean all query stats
```

```sql
clean database query stats for test_query_db
```

```sql
clean table query stats from test_query_db.baseall
```
