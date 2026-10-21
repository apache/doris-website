---
{
    "title": "workload_group_privileges",
    "language": "ko",
    "description": "Workload Group의 권한 정보를 저장합니다."
}
---

## 개요 {#overview}

Workload Group의 권한 정보를 저장합니다.

## 데이터베이스 {#database}


`information_schema`


## 테이블 정보 {#table-information}

| 컬럼 이름           | 타입         | 설명                                     |
| ------------------- | ------------ | ---------------------------------------- |
| GRANTEE             | varchar(64)  | 권한이 부여된 사용자                     |
| WORKLOAD_GROUP_NAME | varchar(256) | Workload Group의 이름                    |
| PRIVILEGE_TYPE      | varchar(64)  | 권한 유형                                |
| IS_GRANTABLE        | varchar(3)   | 다른 사용자에게 권한을 부여할 수 있는지 여부 |
