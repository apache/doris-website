---
{
    "title": "frontend_metrics",
    "language": "ko"
}
---

## 개요 {#overview}

Frontend 노드의 메트릭을 조회하는 데 사용합니다.

## 데이터베이스 {#database}


`information_schema`


## 테이블 정보 {#table-information}

| 컬럼 이름         | 타입         | 설명                                                         |
| ----------------- | ------------ | ------------------------------------------------------------ |
| FE                | varchar(256) | Frontend 인스턴스의 IP 주소                                   |
| METRIC_NAME       | varchar(256) | 메트릭의 이름                                                |
| METRIC_TYPE       | varchar(256) | 메트릭의 유형                                                |
| METRIC_VALUE      | varchar(256) | 메트릭의 값                                                  |
| TAG               | varchar(256) | 메트릭의 태그                                                |
