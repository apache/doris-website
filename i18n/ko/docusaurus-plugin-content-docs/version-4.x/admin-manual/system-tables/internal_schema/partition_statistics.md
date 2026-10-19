---
{
    "title": "partition_statistics",
    "language": "ko",
    "description": "파티션 통계"
}
---

## 개요 {#overview}

파티션 통계

## 데이터베이스 {#database}


`__internal_schema`


## 테이블 정보 {#table-information}

| 컬럼 이름          | 타입           | 설명                                             |
| ------------------ | -------------- | ------------------------------------------------ |
| catalog_id         | varchar(64)    | Catalog ID                                       |
| db_id              | varchar(64)    | 데이터베이스 ID                                  |
| tbl_id             | varchar(64)    | 테이블 ID                                        |
| idx_id             | varchar(64)    | 인덱스 ID                                        |
| part_name          | varchar(64)    | 파티션 이름                                      |
| part_id            | bigint         | 파티션 ID                                        |
| col_id             | varchar(64)    | 컬럼 ID, 현재는 컬럼 이름을 저장                  |
| count              | bigint         | 행 수                                            |
| ndv                | hll            | 고유 값 수                                       |
| null_count         | bigint         | NULL 개수                                        |
| min                | varchar(65533) | 최솟값                                           |
| max                | varchar(65533) | 최댓값                                           |
| data_size_in_bytes | bigint         | 바이트 단위 데이터 크기                          |
| update_time        | datetime       | 현재 통계의 마지막 업데이트 시간                 |
