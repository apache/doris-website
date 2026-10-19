---
{
    "title": "global_variables",
    "language": "ko",
    "description": "전역 변수 조회"
}
---

## 개요 {#overview}

전역 변수 조회

## 데이터베이스 {#database}


`information_schema`


## 테이블 정보 {#table-information}

| 열 이름        | 유형          | 설명                                      |
| -------------- | ------------- | ----------------------------------------- |
| VARIABLE_NAME  | varchar(64)   | 변수 이름                                 |
| VARIABLE_VALUE | varchar(1024) | 변수의 현재 값                            |
| DEFAULT_VALUE  | varchar(1024) | 변수의 기본값                             |
| CHANGED        | varchar(4)    | 기본값과 다른지 여부                      |
