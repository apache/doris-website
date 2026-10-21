---
{
    "title": "workload_group_resource_usage",
    "language": "ko",
    "description": "Workload Group 리소스의 사용량 정보를 저장합니다."
}
---

## 개요 {#overview}

Workload Group 리소스의 사용량 정보를 저장합니다.

## 데이터베이스 {#database}


`information_schema`


## 테이블 정보 {#table-information}

| 열 이름                      | 타입   | 설명                                      |
| ---------------------------- | ------ | ----------------------------------------- |
| BE_ID                        | bigint | Backend의 ID                              |
| WORKLOAD_GROUP_ID            | bigint | Workload Group의 ID                       |
| MEMORY_USAGE_BYTES           | bigint | 메모리 사용량(바이트)                     |
| CPU_USAGE_PERCENT            | double | CPU 사용률                                |
| LOCAL_SCAN_BYTES_PER_SECOND  | bigint | 로컬 스캔 데이터 처리 속도(초당 바이트)   |
| REMOTE_SCAN_BYTES_PER_SECOND | bigint | 원격 스캔 데이터 처리 속도(초당 바이트)   |
