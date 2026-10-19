---
{
    "title": "컬럼 통계 | 내부 스키마",
    "language": "ko",
    "description": "컬럼 통계",
    "sidebar_label": "컬럼 통계"
}
---

# 컬럼 통계 {#column-statistics}

## 개요 {#overview}

컬럼 통계

## 데이터베이스 {#database}


`__internal_schema`


## 테이블 정보 {#table-information}

| 컬럼 이름          | 타입           | 설명                                             |
| ------------------ | -------------- | ------------------------------------------------ |
| id                 | varchar(4096)  | 고유 ID                                          |
| catalog_id         | varchar(64)    | Catalog의 ID                                     |
| db_id              | varchar(64)    | 데이터베이스의 ID                                |
| tbl_id             | varchar(64)    | 테이블의 ID                                      |
| idx_id             | varchar(64)    | 인덱스의 ID                                      |
| col_id             | varchar(64)    | 컬럼의 ID로, 현재 컬럼 이름을 저장합니다          |
| part_id            | varchar(64)    | 파티션의 ID로, 항상 비어 있습니다                 |
| count              | bigint         | 행 수                                            |
| ndv                | bigint         | 서로 다른 값의 수                                |
| null_count         | bigint         | NULL 수                                          |
| min                | varchar(65533) | 최솟값                                           |
| max                | varchar(65533) | 최댓값                                           |
| data_size_in_bytes | bigint         | 바이트 단위의 데이터 크기                        |
| update_time        | datetime       | 현재 통계의 갱신 시간                            |
