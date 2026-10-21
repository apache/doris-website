---
{
    "title": "ALTER JOB",
    "language": "ko",
    "description": "ALTER JOB을 사용하여 일시 중지된 Streaming Job을 업데이트하고, 런타임 속성이나 SQL을 변경하며, MySQL 또는 PostgreSQL CDC 진행 위치를 정확한 JSON offset으로 재설정합니다."
}
---

## 설명 {#description}

Streaming Job의 런타임 속성, 실행 SQL 또는 Auto Table Creation Sync 구성을 수정합니다. `PAUSED` 상태의 Streaming Job만 수정할 수 있으며, 각 문에는 실제 변경 사항이 하나 이상 포함되어야 합니다.

## 구문 {#syntax}

```sql
ALTER JOB <job_name>
[
    PROPERTIES (<job_property>[, ...])
]
[
    <Insert_Command>
    | FROM <source_type> (<source_property>[, ...])
      TO DATABASE <target_db> (<target_property>[, ...])
]
```

## 필수 매개변수 {#required-parameters}

**1. `<job_name>`**
> 수정할 Job의 이름입니다.

## 선택적 매개변수 {#optional-parameters}

**1. `<job_property>`**
> `max_interval`, `compute_group`, `session.*` 등의 Job 속성을 수정하거나 JSON `offset`으로 CDC 위치를 재설정합니다.

**2. `<Insert_Command>`**
> TVF 모드 Job이 실행하는 INSERT SQL을 수정합니다. `DO` 키워드는 `ALTER JOB`에서 사용하지 마세요.

**3. `<source_property>` 및 `<target_property>`**
> Auto Table Creation Sync의 소스 측 또는 대상 측 속성을 수정합니다. 데이터 소스 유형과 대상 데이터베이스는 변경할 수 없습니다.

:::note
Auto Table Creation Sync에서는 `jdbc_url`, `database`, `schema`, `include_tables`, `exclude_tables`, 소스 측 `offset`, `snapshot_split_size`, `snapshot_parallelism`, 테이블별 매핑 매개변수, `slot_name` 또는 `publication_name`을 변경할 수 없습니다. CDC 위치를 재설정하려면 Job 속성 `offset`을 사용하세요.

CDC Stream TVF 모드에서는 대상 테이블, TVF 유형, `type`, `jdbc_url`, `database`, `schema`, `table`, `snapshot_split_size`, `snapshot_parallelism`, `slot_name` 또는 `publication_name`을 변경할 수 없습니다. INSERT SQL을 수정하여 자격 증명, 드라이버 또는 변경 가능한 다른 매개변수를 교체할 수 있습니다.
:::

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한 | 객체 | Job 유형 | 참고 |
|:--------------|:-----------|:------------------------|:------------------------|
| LOAD_PRIV | 데이터베이스(DB) | Streaming | 이 작업은 **LOAD** 권한으로 수행할 수 있습니다 |

## 예제 {#examples}

- my_job의 세션 변수 수정

   ```sql
    ALTER JOB my_job
    PROPERTIES(
    "session.insert_max_filter_ratio"="0.5" 
    );
    ```
- my_job의 SQL 문 수정

   ```sql
    ALTER JOB my_job
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

    ```sql
    ALTER JOB my_job
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
    );
    ``` 

- S3 Job my_job의 동기화 진행 위치 수정

```sql
ALTER JOB my_job
PROPERTIES(
    'offset' = '{"fileName":"regression/load/data/example_0.csv"}'
);
```

- MySQL CDC Job을 정확한 Binlog offset으로 재설정

```sql
ALTER JOB mysql_cdc_job
PROPERTIES (
    "offset" = '{"file":"binlog.000001","pos":"154"}'
);
```

- PostgreSQL CDC Job을 정확한 LSN으로 재설정

```sql
ALTER JOB pg_cdc_job
PROPERTIES (
    "offset" = '{"lsn":"12345678"}'
);
```

CDC 위치는 Job이 `PAUSED` 상태일 때만 수정할 수 있습니다. `offset` 속성에는 위에 표시된 형식의 정확한 JSON offset만 지정할 수 있으며, `initial`, `snapshot`, `earliest` 또는 `latest`는 지정할 수 없습니다.
