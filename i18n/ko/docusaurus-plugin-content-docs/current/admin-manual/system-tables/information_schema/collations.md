---
{
    "title": "collations",
    "language": "ko",
    "description": "문자 집합의 모든 정렬 방식을 조회합니다. 이 테이블은 MySQL 동작과의 호환성만을 위해 사용되며, 실질적인 의미는 없습니다."
}
---

## 개요 {#overview}

문자 집합의 모든 정렬 방식을 조회합니다. 이 테이블은 MySQL 동작과의 호환성만을 위해 사용되며, 실질적인 의미는 없습니다. Doris에서 실제로 사용하는 문자 정렬 방식을 반영하지 않습니다.

## 데이터베이스 {#database}


`information_schema`


## 테이블 정보 {#table-information}

| 컬럼 이름          | 타입         | 설명                                                     |
| ------------------ | ------------ | -------------------------------------------------------- |
| COLLATION_NAME     | varchar(512) | 문자 집합 정렬 방식의 이름                               |
| CHARACTER_SET_NAME | varchar(64)  | 연결된 문자 집합의 이름                                  |
| ID                 | bigint       | 정렬 방식의 ID                                           |
| IS_DEFAULT         | varchar(64)  | 현재 기본 정렬 방식인지 여부를 나타냅니다.                |
| IS_COMPILED        | varchar(64)  | 서비스에 컴파일되어 포함되어 있는지 여부를 나타냅니다     |
| SORTLEN            | bigint       | 이 정렬 알고리즘이 사용하는 메모리와 관련된 값            |
