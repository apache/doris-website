---
{
    "title": "backend_active_tasks",
    "language": "ko",
    "description": "Backend에서 현재 실행 중인 쿼리 또는 데이터 적재 작업의 리소스 사용량을 확인합니다."
}
---

## 개요 {#overview}

Backend에서 현재 실행 중인 쿼리 또는 데이터 적재 작업의 리소스 사용량을 확인합니다.

## 데이터베이스 {#database}


`information_schema`


## 테이블 정보 {#table-information}

| 열 이름                   | 유형         | 설명                                             |
| ------------------------- | ------------ | ------------------------------------------------ |
| BE_ID                     | bigint       | 작업을 실행하는 Backend의 ID                     |
| FE_HOST                   | varchar(256) | 작업을 보낸 Frontend의 주소                       |
| QUERY_ID                  | varchar(256) | 쿼리 ID                                          |
| TASK_TIME_MS              | bigint       | 작업 실행 시간                                   |
| TASK_CPU_TIME_MS          | bigint       | 작업이 사용한 CPU 시간                           |
| SCAN_ROWS                 | bigint       | 스캔한 행 수                                     |
| SCAN_BYTES                | bigint       | 스캔한 바이트 수                                 |
| BE_PEAK_MEMORY_BYTES      | bigint       | 최대 메모리 사용량                               |
| CURRENT_USED_MEMORY_BYTES | bigint       | 현재 메모리 사용량                               |
| SHUFFLE_SEND_BYTES        | bigint       | 셔플하여 전송한 바이트 수                         |
| SHUFFLE_SEND_ROWS         | bigint       | 셔플하여 전송한 행 수                             |
| QUERY_TYPE                | varchar(256) | 쿼리 유형                                        |
