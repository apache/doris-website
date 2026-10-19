---
{
    "title": "SHOW DATABASES",
    "language": "ko",
    "description": "이 문은 현재 조회할 수 있는 데이터베이스를 표시하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 현재 조회할 수 있는 데이터베이스를 표시하는 데 사용됩니다.

## 구문 {#syntax}

```sql
SHOW DATABASES [FROM <catalog>] [<filter_expr>];
```

## 선택적 매개변수 {#optional-parameters}

** 1. `<catalog>`**
>  해당 Catalog

** 2. `<filter_expr>`**
>  지정한 조건으로 필터링

## 반환 값 {#return-value}

| 열 | 설명 |
|:---------|:-----------|
| Database |  데이터베이스 이름|

## 권한 제어 {#permission-control}

이 SQL 명령을 실행하는 사용자에게는 최소한 다음 권한이 있어야 합니다.

| 권한         | 대상    | 비고             |
|:-----------|:------|:---------------|
| SELECT_PRIV | 해당 데이터베이스 | 해당 데이터베이스에 대한 읽기 권한 필요 |

## 예제 {#examples}

- 현재 모든 데이터베이스의 이름을 표시합니다.

   ```sql
   SHOW DATABASES;
   ```

   ```text
   +--------------------+
   | Database           |
   +--------------------+
   | test               |
   | information_schema |
   +--------------------+
   ```

- `hms_catalog`에 있는 모든 데이터베이스의 이름을 표시합니다.

   ```sql
   SHOW DATABASES FROM hms_catalog;
   ```

   ```text
   +---------------+
   | Database      |
   +---------------+
   | default       |
   | tpch          |
   +---------------+
   ```

- 현재 데이터베이스 중 표현식 `like 'infor%'`로 필터링한 모든 데이터베이스의 이름을 표시합니다.

   ```sql
   SHOW DATABASES like 'infor%';
   ```

   ```text
   +--------------------+
   | Database           |
   +--------------------+
   | information_schema |
   +--------------------+
   ```
