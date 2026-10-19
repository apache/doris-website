---
{
    "title": "schemata",
    "language": "ko",
    "description": "데이터베이스 관련 정보를 확인합니다."
}
---

## 개요 {#overview}

데이터베이스 관련 정보를 확인합니다.

## 데이터베이스 {#database}


`information_schema`


## 테이블 정보 {#table-information}

| 열 이름                    | 유형         | 설명                                                  |
| -------------------------- | ------------ | ----------------------------------------------------- |
| CATALOG_NAME               | varchar(512) | Catalog 이름                                          |
| SCHEMA_NAME                | varchar(32)  | 데이터베이스 이름                                     |
| DEFAULT_CHARACTER_SET_NAME | varchar(32)  | MySQL 호환성만을 위한 항목으로, 실제 기능은 없습니다. |
| DEFAULT_COLLATION_NAME     | varchar(32)  | MySQL 호환성만을 위한 항목으로, 실제 기능은 없습니다. |
| SQL_PATH                   | varchar(512) | MySQL 호환성만을 위한 항목으로, 실제 기능은 없습니다. |
| DEFAULT_ENCRYPTION         | varchar(3)   | MySQL 호환성만을 위한 항목으로, 실제 기능은 없습니다. |
