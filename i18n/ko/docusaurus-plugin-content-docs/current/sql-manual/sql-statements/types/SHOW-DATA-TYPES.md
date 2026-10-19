---
{
    "title": "SHOW DATA TYPES",
    "language": "ko",
    "description": "이 문은 지원되는 모든 데이터 타입을 확인하는 데 사용됩니다."
}
---

## 설명 {#description}

    This statement is used to view all supported data types.

## 구문 {#syntax}

```sql
SHOW DATA TYPES;
```

## 반환 값 {#return-value}

| 열 이름 | 설명      |
|-------------|------------------|
| TypeName    | 타입 이름 |
| Size        | 바이트 단위 크기    |

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자에게는 별도의 권한이 필요하지 않습니다.

## 예제 {#example}

- 지원되는 모든 데이터 타입 표시

    ```sql
    SHOW DATA TYPES;
    ```
    ```text
    +----------------+------+
    | TypeName       | Size |
    +----------------+------+
    | AGG_STATE      | 16   |
    | ARRAY          | 32   |
    | BIGINT         | 8    |
    | BITMAP         | 16   |
    | BOOLEAN        | 1    |
    | CHAR           | 16   |
    | DATE           | 16   |
    | DATETIME       | 16   |
    | DATETIMEV2     | 8    |
    | DATEV2         | 4    |
    | DECIMAL128     | 16   |
    | DECIMAL32      | 4    |
    | DECIMAL64      | 8    |
    | DECIMALV2      | 16   |
    | DOUBLE         | 8    |
    | FLOAT          | 4    |
    | HLL            | 16   |
    | INT            | 4    |
    | IPV4           | 4    |
    | IPV6           | 16   |
    | JSON           | 16   |
    | LARGEINT       | 16   |
    | MAP            | 24   |
    | QUANTILE_STATE | 16   |
    | SMALLINT       | 2    |
    | STRING         | 16   |
    | TIMESTAMP_NS   | 8    |
    | TINYINT        | 1    |
    | VARCHAR        | 16   |
    +----------------+------+
    ```
