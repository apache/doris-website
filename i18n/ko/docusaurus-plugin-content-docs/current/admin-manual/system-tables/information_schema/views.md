---
{
    "title": "views",
    "language": "ko",
    "description": "모든 뷰 정보를 저장합니다."
}
---

## 개요 {#overview}

모든 뷰 정보를 저장합니다.

## 데이터베이스 {#database}


`information_schema`


## 테이블 정보 {#table-information}

| 열 이름              | 타입          | 설명                                              |
| -------------------- | ------------- | ------------------------------------------------- |
| TABLE_CATALOG        | varchar(512)  | Catalog 이름                                      |
| TABLE_SCHEMA         | varchar(64)   | 데이터베이스 이름                                 |
| TABLE_NAME           | varchar(64)   | 뷰 이름                                           |
| VIEW_DEFINITION      | varchar(8096) | 뷰 정의문                                         |
| CHECK_OPTION         | varchar(8)    | 실제로는 아무 효과가 없으며 MySQL 호환성만을 위해 제공됨 |
| IS_UPDATABLE         | varchar(3)    | 실제로는 아무 효과가 없으며 MySQL 호환성만을 위해 제공됨 |
| DEFINER              | varchar(77)   | 실제로는 아무 효과가 없으며 MySQL 호환성만을 위해 제공됨 |
| SECURITY_TYPE        | varchar(7)    | 실제로는 아무 효과가 없으며 MySQL 호환성만을 위해 제공됨 |
| CHARACTER_SET_CLIENT | varchar(32)   | 실제로는 아무 효과가 없으며 MySQL 호환성만을 위해 제공됨 |
| COLLATION_CONNECTION | varchar(32)   | 실제로는 아무 효과가 없으며 MySQL 호환성만을 위해 제공됨 |
