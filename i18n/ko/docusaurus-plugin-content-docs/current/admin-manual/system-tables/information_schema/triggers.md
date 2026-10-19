---
{
    "title": "triggers",
    "language": "ko",
    "description": "트리거에 대한 정보를 제공합니다. Doris는 MySQL 호환성을 위해 이 테이블을 지원하며, 이 테이블은 항상 비어 있습니다."
}
---

## 개요 {#overview}

`triggers` 테이블은 트리거에 대한 정보를 제공합니다.
현재 Apache Doris는 MySQL 호환성을 위해 이 테이블을 지원하지만, 사용자 정의 트리거는 지원하지 않습니다. 이 테이블은 항상 비어 있습니다.

## 데이터베이스 {#database}

`information_schema`

## 테이블 정보 {#table-information}

| 열 이름 | 유형 | 설명 |
|---|---|---|
| TRIGGER_CATALOG | varchar(512) | 트리거가 속한 Catalog의 이름입니다. 항상 'def'입니다. |
| TRIGGER_SCHEMA | varchar(64) | 트리거가 속한 스키마(데이터베이스)의 이름입니다. |
| TRIGGER_NAME | varchar(64) | 트리거의 이름입니다. |
| EVENT_MANIPULATION | varchar(6) | 트리거 이벤트(INSERT, UPDATE, DELETE)입니다. |
| EVENT_OBJECT_CATALOG | varchar(512) | 트리거와 연결된 테이블의 Catalog 이름입니다. 항상 'def'입니다. |
| EVENT_OBJECT_SCHEMA | varchar(64) | 트리거와 연결된 테이블의 스키마(데이터베이스) 이름입니다. |
| EVENT_OBJECT_TABLE | varchar(64) | 트리거와 연결된 테이블의 이름입니다. |
| ACTION_ORDER | bigint | 트리거가 정의된 순서입니다. |
| ACTION_CONDITION | varchar(512) | null |
| ACTION_STATEMENT | varchar(512) | 트리거 본문입니다. |
| ACTION_ORIENTATION | varchar(9) | 항상 'ROW'입니다. |
| ACTION_TIMING | varchar(6) | 트리거 실행 시점(BEFORE, AFTER)입니다. |
| ACTION_REFERENCE_OLD_TABLE | varchar(64) | null |
| ACTION_REFERENCE_NEW_TABLE | varchar(64) | null |
| ACTION_REFERENCE_OLD_ROW | varchar(3) | 항상 'OLD'입니다. |
| ACTION_REFERENCE_NEW_ROW | varchar(3) | 항상 'NEW'입니다. |
| CREATED | datetime | 트리거가 생성된 시간입니다. |
| SQL_MODE | varchar(8192) | 트리거 생성 시 적용된 SQL 모드입니다. |
| DEFINER | varchar(77) | 트리거를 생성한 계정입니다. |
| CHARACTER_SET_CLIENT | varchar(32) | 트리거 생성 시 character_set_client 시스템 변수의 세션 값입니다. |
| COLLATION_CONNECTION | varchar(32) | 트리거 생성 시 collation_connection 시스템 변수의 세션 값입니다. |
| DATABASE_COLLATION | varchar(32) | 트리거와 연결된 데이터베이스의 collation입니다. |
