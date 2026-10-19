---
{
    "title": "character_sets",
    "language": "ko",
    "description": "지원되는 문자 집합을 확인합니다. 이 테이블은 MySQL 동작과의 호환성을 위해서만 사용되며, 실제로 사용되는 문자 집합을 반영하지 않습니다. "
}
---

## 개요 {#overview}

지원되는 문자 집합을 확인합니다. 이 테이블은 MySQL 동작과의 호환성을 위해서만 사용되며, Doris에서 실제로 사용하는 문자 집합을 반영하지 않습니다.

## 데이터베이스 {#database}


`information_schema`


## 테이블 정보 {#table-information}

| 열 이름              | 타입         | 설명                                                         |
| -------------------- | ------------ | ------------------------------------------------------------ |
| CHARACTER_SET_NAME   | varchar(512) | 문자 집합의 이름                                             |
| DEFAULT_COLLATE_NAME | varchar(64)  | 기본 정렬 규칙의 이름                                        |
| DESCRIPTION          | varchar(64)  | 문자 집합에 대한 상세 설명                                   |
| MAXLEN               | bigint       | 문자 집합에서 단일 문자가 차지하는 최대 바이트 수             |
