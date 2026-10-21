---
{
    "title": "events",
    "language": "ko",
    "description": "이 테이블은 MySQL 동작과의 호환성을 위해서만 사용되며 항상 비어 있습니다."
}
---

## 개요 {#overview}

이 테이블은 MySQL 동작과의 호환성을 위해서만 사용되며 항상 비어 있습니다.

## 데이터베이스 {#database}


`information_schema`


## 테이블 정보 {#table-information}

| 컬럼 이름            | 타입          | 설명        |
| -------------------- | ------------- | ----------- |
| EVENT_CATALOG        | varchar(64)   |             |
| EVENT_SCHEMA         | varchar(64)   |             |
| EVENT_NAME           | varchar(64)   |             |
| DEFINER              | varchar(77)   |             |
| TIME_ZONE            | varchar(64)   |             |
| EVENT_BODY           | varchar(8)    |             |
| EVENT_DEFINITION     | varchar(512)  |             |
| EVENT_TYPE           | varchar(9)    |             |
| EXECUTE_AT           | datetime      |             |
| INTERVAL_VALUE       | varchar(256)  |             |
| INTERVAL_FIELD       | varchar(18)   |             |
| SQL_MODE             | varchar(8192) |             |
| STARTS               | datetime      |             |
| ENDS                 | datetime      |             |
| STATUS               | varchar(18)   |             |
| ON_COMPLETION        | varchar(12)   |             |
| CREATED              | datetime      |             |
| LAST_ALTERED         | datetime      |             |
| LAST_EXECUTED        | datetime      |             |
| EVENT_COMMENT        | varchar(64)   |             |
| ORIGINATOR           | int           |             |
| CHARACTER_SET_CLIENT | varchar(32)   |             |
| COLLATION_CONNECTION | varchar(32)   |             |
| DATABASE_COLLATION   | varchar(32)   |             |
