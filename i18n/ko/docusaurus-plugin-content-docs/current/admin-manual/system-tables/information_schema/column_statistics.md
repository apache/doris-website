---
{
    "title": "컬럼 통계 | Information Schema",
    "language": "ko",
    "description": "이 테이블은 MySQL 동작과의 호환성을 위해서만 사용되며 항상 비어 있습니다.",
    "sidebar_label": "컬럼 통계"
}
---

# 컬럼 통계 {#column-statistics}

## 개요 {#overview}

이 테이블은 MySQL 동작과의 호환성을 위해서만 사용되며 항상 비어 있습니다. Doris 내 데이터의 실제 통계 정보를 반영하지 않습니다. Doris가 수집한 통계 정보를 확인하려면 [통계](../../../query-acceleration/optimization-technology-principle/statistics#viewing-column-statistics) 섹션을 참조하세요.

## 데이터베이스 {#database}


`information_schema`


## 테이블 정보 {#table-information}

| 컬럼 이름 | 타입        | 설명 |
| ----------- | ----------- | ----------- |
| SCHEMA_NAME | varchar(64) |             |
| TABLE_NAME  | varchar(64) |             |
| COLUMN_NAME | varchar(64) |             |
| HISTOGRAM   | json        |             |
