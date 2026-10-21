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

| 열 이름                | 타입        | 설명                                                         |
| ---------------------- | ----------- | ------------------------------------------------------------ |
| BACKEND_ID             | bigint      | Backend를 고유하게 식별하는 Backend ID입니다. |
| ROWSET_ID              | varchar(64) | Rowset을 고유하게 식별하는 Rowset ID입니다. |
| TABLET_ID              | bigint      | Tablet을 고유하게 식별하는 Tablet ID입니다. |
| ROWSET_NUM_ROWS        | bigint      | Rowset에 포함된 데이터 행 수입니다. |
| TXN_ID                 | bigint      | Rowset에 데이터를 기록한 트랜잭션의 ID입니다. |
| NUM_SEGMENTS           | bigint      | Rowset에 포함된 Segment 수입니다. |
| START_VERSION          | bigint      | Rowset의 시작 버전 번호입니다. |
| END_VERSION            | bigint      | Rowset의 끝 버전 번호입니다. |
| INDEX_DISK_SIZE        | bigint      | Rowset 내 인덱스가 차지하는 저장 공간입니다. |
| DATA_DISK_SIZE         | bigint      | Rowset 내 데이터가 차지하는 저장 공간입니다. |
| CREATION_TIME          | datetime    | Rowset 생성 시간입니다. |
| NEWEST_WRITE_TIMESTAMP | datetime    | Rowset의 가장 최근 쓰기 시간입니다. |
| SCHEMA_VERSION         | int         | Rowset 데이터에 해당하는 테이블의 Schema 버전 번호입니다. |
| COMMIT_TSO | varchar(64) | `[start_tso-end_tso]` 형식의 Rowset TSO 범위입니다(dev 전용). 기록된 범위가 없으면 기본값은 `[-1--1]`입니다. |

## COMMIT_TSO 사용법 {#commit_tso-usage}

이 열은 문자열이므로 단일 BIGINT로 정렬하거나 숫자 `-1`과 직접 비교하지 마세요. 범위가 없으면 `[-1--1]`로 표시되며, 단일 커밋 값도 시작/끝 범위로 표시됩니다.

```sql
SELECT BACKEND_ID, ROWSET_ID, COMMIT_TSO
FROM information_schema.rowsets
WHERE COMMIT_TSO <> '[-1--1]'
LIMIT 20;
```

결과에는 범위가 기록된 Rowset이 나열되며, 기록된 범위가 없으면 결과가 비어 있습니다. 상태 확인 및 구성에 대해서는 [TSO](../../cluster-management/tso.md)를 참조하세요.
