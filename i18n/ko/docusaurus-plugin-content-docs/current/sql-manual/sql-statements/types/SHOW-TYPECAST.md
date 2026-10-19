---
{
    "title": "SHOW TYPECAST",
    "language": "ko",
    "description": "데이터베이스 내의 모든 타입 변환을 조회합니다. 사용자가 데이터베이스를 지정하면 해당 데이터베이스를 조회하고, 그렇지 않으면 현재 세션이 연결된 데이터베이스를 직접 쿼리합니다."
}
---

## 설명 {#description}

데이터베이스 내의 모든 타입 변환을 조회합니다. 사용자가 데이터베이스를 지정하면 해당 데이터베이스를 조회하고, 그렇지 않으면
현재 세션이 연결된 데이터베이스를 직접 쿼리합니다.

## 구문 {#syntax}

```sql
SHOW TYPE_CAST [ { IN | FROM } <db>]
```

## 필수 매개변수 {#required-parameters}

**1. `<db>`**

쿼리할 데이터베이스의 이름입니다.

## 반환 값 {#return-value}

| 열 이름 | 설명     |
|-------------|-----------------|
| 원본 타입 | 원래 타입   |
| 변환 타입   | 변환 후 타입 |

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한   | 객체        | 참고 사항                                                                                            |
|-------------|---------------|--------------------------------------------------------------------------------------------------|
| `Select_priv` | 데이터베이스(DB) | 데이터베이스 내의 모든 타입 변환을 조회하려면 사용자 또는 역할에 해당 DB의 `Select_priv` 권한이 있어야 합니다. |

## 사용 시 참고 사항 {#usage-notes}

사용자가 데이터베이스를 지정하면 시스템은 지정된 데이터베이스를 쿼리합니다. 그렇지 않으면 기본적으로
현재 세션이 연결된 데이터베이스를 쿼리합니다.

## 예제 {#example}

- TESTDB 데이터베이스의 모든 타입 변환 조회

    ```sql
    SHOW TYPE_CAST IN TESTDB;
    ```
    ```text
    +----------------+----------------+
    | Origin Type    | Cast Type      |
    +----------------+----------------+
    | DATETIMEV2     | BOOLEAN        |
    | DATETIMEV2     | TINYINT        |
    | DATETIMEV2     | SMALLINT       |
    | DATETIMEV2     | INT            |
    | DATETIMEV2     | BIGINT         |
    | DATETIMEV2     | LARGEINT       |
    | DATETIMEV2     | FLOAT          |
    | DATETIMEV2     | DOUBLE         |
    | DATETIMEV2     | DATE           |
    | DATETIMEV2     | DATETIME       |
    | DATETIMEV2     | DATEV2         |
    | DATETIMEV2     | DATETIMEV2     |
    | DATETIMEV2     | DECIMALV2      |
    | DATETIMEV2     | DECIMAL32      |
    | DATETIMEV2     | DECIMAL64      |
    | DATETIMEV2     | DECIMAL128     |
    | DATETIMEV2     | DECIMAL256     |
    | DATETIMEV2     | VARCHAR        |
    | DATETIMEV2     | STRING         |
    | DECIMAL256     | DECIMAL128     |
    | DECIMAL256     | DECIMAL256     |
    | DECIMAL256     | VARCHAR        |
    | DECIMAL256     | STRING         |
    +----------------+----------------+
    ```
