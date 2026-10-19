---
{
    "title": "rowsets",
    "language": "ko",
    "description": "Rowset의 기본 정보를 반환합니다."
}
---

## 개요 {#overview}

Rowset의 기본 정보를 반환합니다.

## 데이터베이스 {#database}


`information_schema`


## 테이블 정보 {#table-information}

| 열 이름                | 유형        | 설명                                                         |
| ---------------------- | ----------- | ------------------------------------------------------------ |
| BACKEND_ID             | bigint      | Backend를 고유하게 식별하는 ID입니다.                         |
| ROWSET_ID              | varchar(64) | Rowset을 고유하게 식별하는 ID입니다.                          |
| TABLET_ID              | bigint      | Tablet을 고유하게 식별하는 ID입니다.                          |
| ROWSET_NUM_ROWS        | bigint      | Rowset에 포함된 데이터 행의 수입니다.                         |
| TXN_ID                 | bigint      | Rowset에 데이터를 기록한 트랜잭션의 ID입니다.                 |
| NUM_SEGMENTS           | bigint      | Rowset에 포함된 Segment의 수입니다.                          |
| START_VERSION          | bigint      | Rowset의 시작 버전 번호입니다.                               |
| END_VERSION            | bigint      | Rowset의 끝 버전 번호입니다.                                 |
| INDEX_DISK_SIZE        | bigint      | Rowset 내 인덱스가 차지하는 저장 공간입니다.                  |
| DATA_DISK_SIZE         | bigint      | Rowset 내 데이터가 차지하는 저장 공간입니다.                 |
| CREATION_TIME          | datetime    | Rowset이 생성된 시각입니다.                                  |
| NEWEST_WRITE_TIMESTAMP | datetime    | Rowset에 가장 최근에 데이터를 기록한 시각입니다.             |
| SCHEMA_VERSION         | int         | Rowset 데이터에 대응하는 테이블의 Schema 버전 번호입니다.    |
