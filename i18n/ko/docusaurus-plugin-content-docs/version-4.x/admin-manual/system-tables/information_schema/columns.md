---
{
    "title": "columns",
    "language": "ko",
    "description": "모든 열 정보를 조회합니다."
}
---

## 개요 {#overview}

모든 열 정보를 조회합니다.

## 데이터베이스 {#database}


`information_schema`


## 테이블 정보 {#table-information}

| 열 이름                  | 타입          | 설명                                                         |
| ------------------------ | ------------- | ------------------------------------------------------------ |
| TABLE_CATALOG            | varchar(512)  | Catalog 이름                                                 |
| TABLE_SCHEMA             | varchar(64)   | 데이터베이스 이름                                            |
| TABLE_NAME               | varchar(64)   | 테이블 이름                                                  |
| COLUMN_NAME              | varchar(64)   | 열 이름                                                      |
| ORDINAL_POSITION         | bigint        | 테이블 내 열의 위치                                          |
| COLUMN_DEFAULT           | varchar(1024) | 열의 기본값                                                  |
| IS_NULLABLE              | varchar(3)    | NULL 허용 여부                                               |
| DATA_TYPE                | varchar(64)   | 데이터 타입                                                  |
| CHARACTER_MAXIMUM_LENGTH | bigint        | 문자 타입에서 허용되는 최대 문자 수                           |
| CHARACTER_OCTET_LENGTH   | bigint        | 문자 타입에서 허용되는 최대 바이트 수                         |
| NUMERIC_PRECISION        | bigint        | 숫자 타입의 정밀도                                           |
| NUMERIC_SCALE            | bigint        | 숫자 타입의 스케일                                           |
| DATETIME_PRECISION       | bigint        | 날짜 및 시간 타입의 정밀도                                    |
| CHARACTER_SET_NAME       | varchar(32)   | 문자 타입의 문자 집합 이름. 항상 NULL                         |
| COLLATION_NAME           | varchar(32)   | 문자 타입의 정렬 알고리즘 이름. 항상 NULL                     |
| COLUMN_TYPE              | varchar(32)   | 열의 타입                                                    |
| COLUMN_KEY               | varchar(3)    | 'UNI'이면 해당 열이 Unique Key 열임을 나타냄                   |
| EXTRA                    | varchar(27)   | 자동 증가 열이나 생성 열인지 여부 등 열에 대한 추가 정보       |
| PRIVILEGES               | varchar(80)   | 항상 비어 있음                                               |
| COLUMN_COMMENT           | varchar(255)  | 열의 주석 정보                                               |
| COLUMN_SIZE              | bigint        | 열의 너비                                                    |
| DECIMAL_DIGITS           | bigint        | 숫자 타입의 소수 자릿수                                       |
| GENERATION_EXPRESSION    | varchar(64)   | 항상 NULL                                                    |
| SRS_ID                   | bigint        | 항상 NULL                                                    |
