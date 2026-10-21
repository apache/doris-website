---
{
    "title": "workload_policy",
    "language": "ko",
    "description": "Workload Policies의 구성 정보를 기록합니다."
}
---

## 개요 {#overview}

Workload Policies의 구성 정보를 기록합니다.

## 데이터베이스 {#database}


`information_schema`


## 테이블 정보 {#table-information}

| 열 이름        | 타입         | 설명                                           |
| -------------- | ------------ | ---------------------------------------------- |
| ID             | bigint       | Workload Policy의 ID                           |
| NAME           | varchar(256) | Workload Policy의 이름                         |
| CONDITION      | text         | Workload Policy의 조건                         |
| ACTION         | text         | Workload Policy의 동작                         |
| PRIORITY       | int          | Workload Policy의 우선순위                     |
| ENABLED        | boolean      | Workload Policy의 활성화 여부                  |
| VERSION        | int          | Workload Policy의 버전                         |
| WORKLOAD_GROUP | text         | Policy에 바인딩된 Workload Group의 이름        |
