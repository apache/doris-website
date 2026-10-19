---
{
    "title": "metadata_name_ids",
    "language": "ko",
    "description": "객체의 ID 정보 조회"
}
---

## 개요 {#overview}

객체의 ID 정보를 조회합니다.

## 데이터베이스 {#database}


`information_schema`


## 테이블 정보 {#table-information}

| 열 이름       | 유형         | 설명                 |
| ------------- | ------------ | -------------------- |
| CATALOG_ID    | bigint       | Catalog의 ID         |
| CATALOG_NAME  | varchar(512) | Catalog의 이름       |
| DATABASE_ID   | bigint       | 데이터베이스의 ID    |
| DATABASE_NAME | varchar(64)  | 데이터베이스의 이름  |
| TABLE_ID      | bigint       | 테이블의 ID          |
| TABLE_NAME    | varchar(64)  | 테이블의 이름        |
