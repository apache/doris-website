---
{
    "title": "session_variables",
    "language": "ko",
    "description": "세션 변수 정보를 조회합니다."
}
---

## 개요 {#overview}

세션 변수 정보를 조회합니다.

## 데이터베이스 {#database}


`information_schema`


## 테이블 정보 {#table-information}

| 컬럼 이름      | 타입          | 설명                                                     |
| -------------- | ------------- | -------------------------------------------------------- |
| VARIABLE_NAME  | varchar(64)   | 변수 이름                                                |
| VARIABLE_VALUE | varchar(1024) | 현재 값                                                  |
| DEFAULT_VALUE  | varchar(1024) | 기본값                                                   |
| CHANGED        | varchar(4)    | 현재 값이 기본값과 다른지 여부                            |
