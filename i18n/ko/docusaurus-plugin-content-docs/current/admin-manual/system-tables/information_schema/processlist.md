---
{
    "title": "processlist",
    "language": "ko",
    "description": "현재 연결 모두 조회"
}
---

## 개요 {#overview}

현재 연결 모두 조회

## 데이터베이스 {#database}


`information_schema`


## 테이블 정보 {#table-information}

| 열 이름           | 유형           | 설명                                 |
| ----------------- | -------------- | ------------------------------------ |
| CURRENT_CONNECTED | varchar(16)    | 더 이상 사용되지 않으며 항상 No      |
| ID                | largeint       | 연결 ID                              |
| USER              | varchar(32)    | 연결된 사용자                        |
| HOST              | varchar(261)   | 연결 주소                            |
| LOGIN_TIME        | datetime       | 로그인 시간                          |
| CATALOG           | varchar(64)    | 현재 Catalog                         |
| DB                | varchar(64)    | 현재 데이터베이스                    |
| COMMAND           | varchar(16)    | 현재 전송된 MySQL 명령 유형           |
| TIME              | int            | 마지막 쿼리의 실행 시간              |
| STATE             | varchar(64)    | 마지막 쿼리의 상태                   |
| QUERY_ID          | varchar(256)   | 마지막 쿼리의 ID                     |
| INFO              | varchar(65533) | 마지막 쿼리의 쿼리문                 |
| FE                | varchar(64)    | 연결된 Front-End (FE)                |
| COMPUTE_GROUP     | varchar(64)    | 사용 중인 Compute Group의 이름       |
