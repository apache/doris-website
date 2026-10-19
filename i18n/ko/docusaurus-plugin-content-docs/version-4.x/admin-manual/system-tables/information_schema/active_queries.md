---
{
    "title": "active_queries",
    "language": "ko",
    "description": "현재 실행 중인 쿼리를 조회하는 데 사용됩니다"
}
---

## 개요 {#overview}

현재 실행 중인 쿼리를 조회하는 데 사용됩니다

## 데이터베이스 {#database}


`information_schema`


## 테이블 정보 {#table-information}

| 열 이름           | 타입         | 설명                                                         |
| ----------------- | ------------ | ------------------------------------------------------------ |
| QUERY_ID          | varchar(256) | 쿼리의 ID                                                    |
| QUERY_START_TIME  | varchar(256) | 쿼리 시작 시간                                               |
| QUERY_TIME_MS     | bigint       | 쿼리 실행 시간                                               |
| WORKLOAD_GROUP_ID | bigint       | 쿼리가 속한 Workload Group의 ID                              |
| DATABASE          | varchar(256) | 쿼리가 실행된 데이터베이스                                   |
| FRONTEND_INSTANCE | varchar(256) | 쿼리 요청을 수신한 Frontend 인스턴스의 IP 주소                |
| QUEUE_START_TIME  | varchar(256) | 대기열에서 대기를 시작한 시간. 대기하지 않은 경우 비어 있음    |
| QUEUE_END_TIME    | varchar(256) | 대기열에서 대기를 마친 시간. 대기하지 않은 경우 비어 있음      |
| QUERY_STATUS      | varchar(256) | 쿼리 상태                                                    |
| SQL               | text         | 쿼리 문의 텍스트                                             |
