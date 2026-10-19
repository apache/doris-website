---
{
    "title": "ANALYZE",
    "language": "ko",
    "description": "이 문은 열 통계를 수집하는 데 사용합니다."
}
---

## 설명 {#description}

이 문은 열 통계를 수집하는 데 사용합니다. 테이블(특정 열을 지정할 수 있음) 또는 전체 데이터베이스를 대상으로 열 통계를 수집할 수 있습니다.

## 구문 {#syntax}

```sql
ANALYZE {TABLE <table_name> [ (<column_name> [, ...]) ] | DATABASE <database_name>}
    [ [ WITH SYNC ] [ WITH SAMPLE {PERCENT | ROWS} <sample_rate> ] ];
```

## 필수 매개변수 {#required-parameters}

**1. `<table_name>`**

> 대상 테이블입니다. 이 매개변수와 <database_name> 매개변수 중 반드시 하나만 지정해야 합니다.

**2. `<database_name>`**

> 대상 데이터베이스입니다. 이 매개변수와 <table_name> 매개변수 중 반드시 하나만 지정해야 합니다.

## 선택적 매개변수 {#optional-parameters}

**1. `<column_name>`**

> 대상 열입니다. `table_name`에 존재하는 열이어야 합니다. 쉼표로 구분하여 여러 열 이름을 지정할 수 있습니다.

**2. `WITH SYNC`**

> 동기 방식으로 통계를 수집합니다. 수집이 완료된 후 반환합니다. 지정하지 않으면 비동기 방식으로 실행합니다.

**3. `WITH SAMPLE {PERCENT | ROWS} <sample_rate>`**

> 샘플링 방식으로 통계를 수집하도록 지정합니다. 지정하지 않으면 기본적으로 전체 데이터를 대상으로 수집합니다. <sample_rate>는 샘플링 매개변수입니다. PERCENT 샘플링을 사용하면 샘플링 비율을 지정하고, ROWS 샘플링을 사용하면 샘플링할 행 수를 지정합니다.

## 반환 값 {#return-value}

| 열 | 설명           |
| -- |--------------|
| Job_Id | 고유 작업 ID           |
| Catalog_Name |   Catalog 이름           |
| DB_Name | 데이터베이스 이름           |
| Columns | 열 이름 목록        |

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다:

| 권한 | 객체 | 설명                                    |
|:--------------| :------------- |:------------------------------------------------|
| SELECT_PRIV   | 테이블    | ANALYZE를 실행할 때는 쿼리 대상 테이블에 대한 SELECT_PRIV 권한이 필요합니다. |

## 예제 {#examples}

1. lineitem 테이블의 10%를 샘플링하여 통계를 수집합니다.

```sql
ANALYZE TABLE lineitem WITH SAMPLE PERCENT 10;
```

2. lineitem 테이블에서 100,000개 행을 샘플링하여 통계를 수집합니다.

```sql
ANALYZE TABLE lineitem WITH SAMPLE ROWS 100000;
```
