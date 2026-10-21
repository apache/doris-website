---
{
    "title": "SHOW LOAD",
    "language": "ko",
    "description": "지정된 데이터 적재 작업의 실행 상태를 표시하는 데 사용하는 문입니다."
}
---

## 설명 {#description}

지정된 데이터 적재 작업의 실행 상태를 표시하는 데 사용하는 문입니다.

## 구문 {#syntax}

```sql
SHOW LOAD
[FROM <db_name>]
[
   WHERE
   [LABEL  = [ "<your_label>" | LIKE "<label_matcher>"]]
   [ STATE = { " PENDING " | " ETL " | " LOADING " | " FINISHED " | " CANCELLED " } ]
]
[ORDER BY { <col_name> | <expr> | <position> }]
[LIMIT <limit>[OFFSET <offset>]];
```

## 선택적 매개변수 {#optional-parameters}

**1. `<db_name>`**

> `db_name`을 지정하지 않으면 현재 기본 데이터베이스를 사용합니다.

**2. `<label_matcher>`**

> `LABEL LIKE = "<label_matcher>"`를 사용하면 레이블에 `label_matcher`가 포함된 데이터 적재 작업을 찾습니다.

**3. `<your_label>`**

> `LABEL = "<your_label>"`을 사용하면 지정된 레이블과 정확히 일치하는 작업을 찾습니다.

**4. STATE = { " PENDING " | " ETL " | " LOADING " | " FINISHED " | " CANCELLED " }**

> `PENDING`을 지정하면 상태가 `STATE = "PENDING"`인 작업을 찾습니다. 다른 상태 키워드에도 동일하게 적용됩니다.

**5. `<col_name>`**

> 정렬에 사용할 결과 집합의 컬럼 이름을 지정합니다.

**6. `<expr>`**

> 표현식을 사용하여 정렬합니다.

**7. `<position>`**

> `SELECT` 목록에서 컬럼의 위치를 기준으로 정렬합니다(1부터 시작).

**8. `<limit>`**

> `LIMIT`를 지정하면 조건에 일치하는 레코드를 `limit`개 표시합니다. 지정하지 않으면 모든 레코드를 표시합니다.

**9. `<offset>`**

> 쿼리 결과를 표시하기 시작할 오프셋을 `offset`으로 지정합니다. 기본 오프셋은 0입니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다.

| 권한 | 객체 | 참고 사항 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV | 데이터베이스 | 데이터베이스의 테이블에 대한 데이터 적재 권한이 필요합니다. |

## 반환 값 {#return-value}

지정된 데이터 적재 작업의 상세 상태를 반환합니다.

## 예제 {#examples}

1. 기본 데이터베이스의 모든 데이터 적재 작업을 표시합니다.

    ```sql
    SHOW LOAD;
    ```

2. 지정된 데이터베이스에서 레이블에 문자열 "2014_01_02"가 포함된 데이터 적재 작업 중 가장 오래된 작업 10개를 표시합니다.

    ```sql
    SHOW LOAD FROM example_db WHERE LABEL LIKE "2014_01_02" LIMIT 10;
    ```

3. 지정된 데이터베이스에서 레이블이 "load_example_db_20140102"인 데이터 적재 작업을 `LoadStartTime` 기준 내림차순으로 정렬하여 표시합니다.

    ```sql
    SHOW LOAD FROM example_db WHERE LABEL = "load_example_db_20140102" ORDER BY LoadStartTime DESC;
    ```

4. 지정된 데이터베이스에서 레이블이 "load_example_db_20140102"이고 상태가 "loading"인 데이터 적재 작업을 `LoadStartTime` 기준 내림차순으로 정렬하여 표시합니다.

    ```sql
    SHOW LOAD FROM example_db WHERE LABEL = "load_example_db_20140102" AND STATE = "loading" ORDER BY LoadStartTime DESC;
    ```

5. 지정된 데이터베이스의 데이터 적재 작업을 `LoadStartTime` 기준 내림차순으로 정렬하고, 쿼리 결과 10개를 오프셋 5부터 표시합니다.

    ```sql
    SHOW LOAD FROM example_db ORDER BY LoadStartTime DESC limit 5,10;
    SHOW LOAD FROM example_db ORDER BY LoadStartTime DESC limit 10 offset 5;
    ```

6. 소규모 배치 데이터 적재 중 상태를 확인하는 명령입니다.

    ```text
    curl --location-trusted -u {user}:{passwd} http://{hostname}:{port}/api/{database}/_load_info?label={labelname}
    ```
