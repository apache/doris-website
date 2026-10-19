---
{
    "title": "workload_groups",
    "language": "ko",
    "description": "Workload Group의 구성 정보를 기록합니다."
}
---

## 개요 {#overview}

Workload Group의 구성 정보를 기록합니다.

## 데이터베이스 {#database}


`information_schema`


## 테이블 정보 {#table-information}

| 열 이름                        | 유형         | 설명                                                         |
| ------------------------------ | ------------ | ------------------------------------------------------------ |
| ID                             | bigint       | Workload Group의 ID                                          |
| NAME                           | varchar(256) | Workload Group의 이름                                        |
| CPU_SHARE                      | bigint       | Workload Group의 CPU 소프트 제한 가중치                       |
| MEMORY_LIMIT                   | varchar(256) | Workload Group의 메모리 제한                                  |
| ENABLE_MEMORY_OVERCOMMIT       | varchar(256) | Workload Group의 메모리 소프트 제한 활성화 여부                |
| MAX_CONCURRENCY                | bigint       | Workload Group의 최대 동시 실행 수                            |
| MAX_QUEUE_SIZE                 | bigint       | Workload Group의 최대 대기열 크기                             |
| QUEUE_TIMEOUT                  | bigint       | Workload Group의 대기열 제한 시간                             |
| CPU_HARD_LIMIT                 | varchar(256) | Workload Group의 CPU 하드 제한 크기                           |
| SCAN_THREAD_NUM                | bigint       | 로컬 스캔에 사용하는 스레드 수                                |
| MAX_REMOTE_SCAN_THREAD_NUM     | bigint       | 원격 스캔 스레드 풀의 최대 스레드 수                          |
| MIN_REMOTE_SCAN_THREAD_NUM     | bigint       | 원격 스캔 스레드 풀의 최소 스레드 수                          |
| SPILL_THRESHOLD_LOW_WATERMARK  | varchar(256) | Workload Group의 디스크 스필 하한 임계값                      |
| SPILL_THRESHOLD_HIGH_WATERMARK | varchar(256) | Workload Group의 디스크 스필 상한 임계값                      |
| TAG                            | varchar(256) | Workload Group의 태그                                        |
| READ_BYTES_PER_SECOND          | bigint       | 로컬 읽기 시 초당 스캔하는 바이트 수                          |
| REMOTE_READ_BYTES_PER_SECOND   | bigint       | 원격 읽기 시 초당 스캔하는 바이트 수                          |
