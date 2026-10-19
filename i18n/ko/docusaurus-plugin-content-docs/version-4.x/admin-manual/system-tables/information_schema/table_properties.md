---
{
    "title": "table_properties",
    "language": "ko",
    "description": "테이블(내부 테이블 및 외부 테이블 포함)의 속성 정보를 확인하는 데 사용됩니다."
}
---

## 개요 {#overview}

테이블(내부 테이블 및 외부 테이블 포함)의 속성 정보를 확인하는 데 사용됩니다.

## 데이터베이스 {#database}


`information_schema`


## 테이블 정보 {#table-information}

| 열 이름        | 유형        | 설명                                    |
| -------------- | ----------- | --------------------------------------- |
| TABLE_CATALOG  | varchar(64) | 테이블이 속한 Catalog                   |
| TABLE_SCHEMA   | varchar(64) | 테이블이 속한 데이터베이스              |
| TABLE_NAME     | varchar(64) | 테이블 이름                             |
| PROPERTY_NAME  | string      | 속성 이름                               |
| PROPERTY_VALUE | string      | 속성 값                                 |
