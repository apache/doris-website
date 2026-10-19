---
{
    "title": "backend_configuration",
    "language": "ko",
    "description": "Backend의 설정을 조회합니다."
}
---

## 개요 {#overview}

Backend의 설정을 조회합니다.

## 데이터베이스 {#database}


`information_schema`


## 테이블 정보 {#table-information}

| 열 이름      | 유형         | 설명                  |
| ------------ | ------------ | --------------------- |
| BE_ID        | bigint       | Backend의 ID          |
| CONFIG_NAME  | varchar(256) | 설정 이름             |
| CONFIG_TYPE  | varchar(256) | 설정 데이터 유형      |
| CONFIG_VALUE | bigint       | 설정 값               |
| IS_MUTABLE   | bool         | 설정 변경 가능 여부   |
