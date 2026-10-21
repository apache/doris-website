---
{
    "title": "schema_privileges",
    "language": "ko",
    "description": "데이터베이스의 권한 정보를 조회합니다."
}
---

## 개요 {#overview}

데이터베이스의 권한 정보를 조회합니다.

## 데이터베이스 {#database}


`information_schema`


## 테이블 정보 {#table-information}

| 컬럼 이름      | 유형         | 설명                                                |
| -------------- | ------------ | --------------------------------------------------- |
| GRANTEE        | varchar(81)  | 권한을 부여받은 사용자                              |
| TABLE_CATALOG  | varchar(512) | Catalog 이름. 항상 'def'                            |
| TABLE_SCHEMA   | varchar(64)  | 데이터베이스 이름                                   |
| PRIVILEGE_TYPE | varchar(64)  | 권한 유형                                           |
| IS_GRANTABLE   | varchar(3)   | 다른 사용자에게 권한을 부여할 수 있는지 여부         |
