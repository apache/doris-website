---
{
    "title": "HUDI_META",
    "language": "ko",
    "description": "hudimeta 테이블 값 함수(tvf)는 hudi 메타데이터, 작업 이력, 테이블의 타임라인, instant 상태 등을 읽는 데 사용합니다."
}
---

## 설명 {#description}

`hudi_meta` 테이블 값 함수(tvf)는 hudi 메타데이터, 작업 이력, 테이블의 타임라인, instant 상태 등을 읽는 데 사용합니다.

3.1.0부터 지원됩니다.

## 구문 {#syntax}

```sql
HUDI_META(
    "table" = "<table>", 
    "query_type" = "<query_type>"
  );
```

## 필수 매개변수 {#required-parameters}
`hudi_meta` 테이블 함수(tvf)의 각 매개변수는 `"key"="value"` 쌍입니다.

| 필드        | 설명                                                                                                                        |
|--------------|------------------------------------------------------------------------------------------------------------------------------------|
| `<table>`    | 조회하려는 hudi 테이블의 전체 이름으로, `database_name.table_name` 형식으로 지정해야 합니다. |
| `<query_type>` | 조회하려는 메타데이터의 유형입니다. 현재는 `timeline`만 지원합니다.                                                    |


## 예제 {#examples}

- hudi 테이블의 타임라인 메타데이터를 읽고 조회합니다.

    ```sql
    select * from hudi_meta("table" = "ctl.db.tbl", "query_type" = "timeline");
    ```

- `desc function`과 함께 사용할 수 있습니다:
    
    ```sql
    desc function hudi_meta("table" = "ctl.db.tbl", "query_type" = "timeline");
    ```

- hudi 테이블의 타임라인을 확인합니다.
    
    ```sql
    select * from hudi_meta("table" = "hudi_ctl.test_db.test_tbl", "query_type" = "timeline");
    ```
    ```text
    +-------------------+--------+--------------------------+-----------+-----------------------+
    | timestamp         | action | file_name                | state     | state_transition_time |
    +-------------------+--------+--------------------------+-----------+-----------------------+
    | 20240724195843565 | commit | 20240724195843565.commit | COMPLETED | 20240724195844269     |
    | 20240724195845718 | commit | 20240724195845718.commit | COMPLETED | 20240724195846653     |
    | 20240724195848377 | commit | 20240724195848377.commit | COMPLETED | 20240724195849337     |
    | 20240724195850799 | commit | 20240724195850799.commit | COMPLETED | 20240724195851676     |
    +-------------------+--------+--------------------------+-----------+-----------------------+
    ```

- timestamp로 필터링합니다.

    ```sql
    select * from hudi_meta("table" = "hudi_ctl.test_db.test_tbl", "query_type" = "timeline") where timestamp = 20240724195843565;
    ```
    ```text
    +-------------------+--------+--------------------------+-----------+-----------------------+
    | timestamp         | action | file_name                | state     | state_transition_time |
    +-------------------+--------+--------------------------+-----------+-----------------------+
    | 20240724195843565 | commit | 20240724195843565.commit | COMPLETED | 20240724195844269     |
    +-------------------+--------+--------------------------+-----------+-----------------------+
    ```
