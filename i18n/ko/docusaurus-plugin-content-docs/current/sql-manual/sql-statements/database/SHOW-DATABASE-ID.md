---
{
    "title": "SHOW DATABASE ID",
    "language": "ko",
    "description": "데이터베이스 ID를 기준으로 해당 데이터베이스 이름을 조회하는 데 사용하는 문입니다(관리자 전용)."
}
---

## 설명 {#description}

데이터베이스 ID를 기준으로 해당 데이터베이스 이름을 조회하는 데 사용하는 문입니다(관리자 전용).

## 구문 {#syntax}

```sql
SHOW DATABASE <database_id>
```

## 필수 매개변수 {#required-parameters}

** 1. `<database_id>`**
>  데이터베이스에 해당하는 ID 번호

## 반환 값 {#return-value}

| 열 | 설명 |
|:---------|:-----------|
| DbName |  데이터베이스 이름|

## 권한 관리 {#permission-control}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다.

| 권한         | 대상   | 비고            |
|:-----------|:-----|:--------------|
| ADMIN_PRIV | 전체 클러스터 | 전체 클러스터에 대한 관리자 권한이 필요합니다 |

## 예제 {#example}

- 데이터베이스 ID를 기준으로 해당 데이터베이스 이름 조회

    ```sql
    SHOW DATABASE 10396;
    ```

    ```text
    +------------+
    | DbName     |
    +------------+
    | example_db |
    +------------+
    ```
