---
{
    "title": "컬럼 권한",
    "language": "ko",
    "description": "이 테이블은 MySQL 동작과의 호환성을 위해서만 사용되며 항상 비어 있습니다."
}
---

## 개요 {#overview}

이 테이블은 MySQL 동작과의 호환성을 위해서만 사용되며 항상 비어 있습니다. Doris의 실제 컬럼 권한 정보를 반영하지 않습니다.

## 데이터베이스 {#database}

```
information_schema
```

## 테이블 정보 {#table-information}

| 컬럼 이름    | 유형         | 설명 |
| -------------- | ------------ | ----------- |
| GRANTEE        | varchar(128) |             |
| TABLE_CATALOG  | varchar(512) |             |
| TABLE_SCHEMA   | varchar(64)  |             |
| TABLE_NAME     | varchar(64)  |             |
| COLUMN_NAME    | varchar(64)  |             |
| PRIVILEGE_TYPE | varchar(64)  |             |
| IS_GRANTABLE   | varchar(3)   |             |
