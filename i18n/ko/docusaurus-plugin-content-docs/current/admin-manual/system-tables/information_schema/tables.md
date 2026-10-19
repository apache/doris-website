---
{
    "title": "테이블",
    "language": "ko",
    "description": "모든 테이블 정보를 저장합니다."
}
---

## 개요 {#overview}

모든 테이블 정보를 저장합니다.

## 데이터베이스 {#database}


`information_schema`


## 테이블 정보 {#table-information}

| 열 이름         | 유형          | 설명                                                         |
| --------------- | ------------- | ------------------------------------------------------------ |
| TABLE_CATALOG   | varchar(512)  | 테이블이 속한 Catalog                                        |
| TABLE_SCHEMA    | varchar(64)   | 테이블이 속한 데이터베이스                                   |
| TABLE_NAME      | varchar(64)   | 테이블 이름                                                  |
| TABLE_TYPE      | varchar(64)   | 테이블 유형: SYSTEM VIEW, VIEW, BASE TABLE                    |
| ENGINE          | varchar(64)   | 테이블의 스토리지 엔진 유형                                   |
| VERSION         | bigint        | 유효하지 않은 값                                             |
| ROW_FORMAT      | varchar(10)   | 유효하지 않은 값                                             |
| TABLE_ROWS      | bigint        | 테이블의 예상 행 수                                          |
| AVG_ROW_LENGTH  | bigint        | 테이블의 평균 행 크기                                        |
| DATA_LENGTH     | bigint        | 테이블의 예상 크기                                           |
| MAX_DATA_LENGTH | bigint        | 유효하지 않은 값                                             |
| INDEX_LENGTH    | bigint        | 유효하지 않은 값                                             |
| DATA_FREE       | bigint        | 유효하지 않은 값                                             |
| AUTO_INCREMENT  | bigint        | 유효하지 않은 값                                             |
| CREATE_TIME     | datetime      | 테이블이 생성된 시간                                         |
| UPDATE_TIME     | datetime      | 테이블 데이터가 마지막으로 업데이트된 시간                   |
| CHECK_TIME      | datetime      | 유효하지 않은 값                                             |
| TABLE_COLLATION | varchar(32)   | 고정값: utf-8                                                |
| CHECKSUM        | bigint        | 유효하지 않은 값                                             |
| CREATE_OPTIONS  | varchar(255)  | 유효하지 않은 값                                             |
| TABLE_COMMENT   | varchar(2048) | 테이블에 대한 설명                                           |
