---
{
    "title": "ALTER JOB",
    "language": "ko",
    "description": "사용자는 작업을 수정할 수 있습니다. PAUSE 상태의 작업만 수정할 수 있으며, Streaming 유형의 작업만 수정할 수 있습니다."
}
---

## 설명 {#description}

사용자는 작업을 수정할 수 있습니다. PAUSE 상태의 작업만 수정할 수 있으며, Streaming 유형의 작업만 수정할 수 있습니다.

## 구문 {#syntax}

```SQL
Alter Job <job_name>
[job_properties]
DO <Insert_Command> 
```

## 필수 매개변수 {#required-parameters}

**1. `<job_name>`**
> 작업 이름을 수정합니다.

## 선택적 매개변수 {#optional-parameters}

**1. `<job_properties>`**
> 작업의 속성을 수정합니다.

**1. `<Insert_Command>`**
> 작업에서 실행하는 SQL을 수정합니다.


## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한 | 객체 | 작업 유형 | 비고 |
|:--------------|:-----------|:------------------------|:------------------------|
| LOAD_PRIV | 데이터베이스(DB) | Streaming | **LOAD** 권한으로 이 작업을 수행할 수 있습니다 |

## 예제 {#examples}

- my_job의 세션 변수를 수정합니다.

   ```SQL
    Alter Job my_job
    PROPERTIES(
    "session.insert_max_filter_ratio"="0.5" 
    )
    ```
- my_job의 SQL 문을 수정합니다.

   ```SQL
    Alter Job my_job
    INSERT INTO db1.tbl1 
    SELECT * FROM S3
    (
        "uri" = "s3://bucket/*.csv",
        "s3.access_key" = "<s3_access_key>",
        "s3.secret_key" = "<s3_secret_key>",
        "s3.region" = "<s3_region>",
        "s3.endpoint" = "<s3_endpoint>",
        "format" = "<format>"
    );
    ```  

- my_job의 속성과 SQL 문을 동시에 수정합니다.

    ```SQL
    Alter Job my_job
    PROPERTIES(
    "session.insert_max_filter_ratio"="0.5" 
    )
    INSERT INTO db1.tbl1 
    select * from S3(
        "uri" = "s3://bucket/*.csv",
        "s3.access_key" = "<s3_access_key>",
        "s3.secret_key" = "<s3_secret_key>",
        "s3.region" = "<s3_region>",
        "s3.endpoint" = "<s3_endpoint>",
        "format" = "<format>"
    )
    ``` 

- my_job의 동기화 진행 상태를 수정합니다.

    ```sql
        Alter JOB my_job
        PROPERTIES(
            'offset' = '{"fileName":"regression/load/data/example_0.csv"}'
        )
    ```
