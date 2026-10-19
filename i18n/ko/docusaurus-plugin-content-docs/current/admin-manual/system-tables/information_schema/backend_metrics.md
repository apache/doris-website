---
{
    "title": "backend_metrics",
    "language": "ko"
}
---

## 개요 {#overview}

Backend 노드의 메트릭을 조회하는 데 사용됩니다.

## 데이터베이스 {#database}


`information_schema`


## 테이블 정보 {#table-information}

| 열 이름           | 유형         | 설명                                                         |
| ----------------- | ------------ | ------------------------------------------------------------ |
| BE_ID             | varchar(256) | Backend 인스턴스의 ID                                        |
| BE_IP             | varchar(256) | Backend 인스턴스의 IP 주소                                   |
| METRIC_NAME       | varchar(256) | 메트릭 이름                                                  |
| METRIC_TYPE       | varchar(256) | 메트릭 유형                                                  |
| METRIC_VALUE      | varchar(256) | 메트릭 값                                                    |
| TAG               | varchar(256) | 메트릭 태그                                                  |
