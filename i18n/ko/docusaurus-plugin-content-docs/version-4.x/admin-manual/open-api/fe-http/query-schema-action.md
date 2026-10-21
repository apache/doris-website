---
{
    "title": "쿼리 스키마 액션",
    "language": "ko",
    "description": "쿼리 스키마 액션은 지정된 SQL에서 참조하는 테이블의 생성문을 반환할 수 있습니다. 로컬에서 일부 쿼리 시나리오를 테스트하는 데 사용할 수 있습니다."
}
---

# 쿼리 스키마 액션 {#query-schema-action}


## 요청 {#request}

```
POST /api/query_schema/<ns_name>/<db_name>
```

## 설명 {#description}

쿼리 스키마 액션은 지정된 SQL에서 참조하는 테이블의 생성문을 반환할 수 있습니다. 로컬에서 일부 쿼리 시나리오를 테스트하는 데 사용할 수 있습니다.

이 API는 버전 1.2에서 도입되었습니다.

## 경로 매개변수 {#path-parameters}

* `<db_name>`

    데이터베이스 이름을 지정합니다. 이 데이터베이스는 현재 세션의 기본 데이터베이스로 간주되며, SQL의 테이블 이름에 데이터베이스 이름이 명시되어 있지 않으면 사용됩니다.

## 쿼리 매개변수 {#query-parameters}

없음

## 요청 본문 {#request-body}

```
text/plain

sql
```

* "sql" 필드는 SQL 문자열입니다.

## 응답 {#response}

* 반환값

    ```
    CREATE TABLE `tbl1` (
      `k1` int(11) NULL,
      `k2` int(11) NULL
    ) ENGINE=OLAP
    DUPLICATE KEY(`k1`, `k2`)
    COMMENT 'OLAP'
    DISTRIBUTED BY HASH(`k1`) BUCKETS 3
    PROPERTIES (
    "replication_allocation" = "tag.location.default: 1",
    "in_memory" = "false",
    "storage_format" = "V2",
    "disable_auto_compaction" = "false"
    );

    CREATE TABLE `tbl2` (
      `k1` int(11) NULL,
      `k2` int(11) NULL
    ) ENGINE=OLAP
    DUPLICATE KEY(`k1`, `k2`)
    COMMENT 'OLAP'
    DISTRIBUTED BY HASH(`k1`) BUCKETS 3
    PROPERTIES (
    "replication_allocation" = "tag.location.default: 1",
    "in_memory" = "false",
    "storage_format" = "V2",
    "disable_auto_compaction" = "false"
    );
    ```

## 예제 {#example}

1. 로컬 파일 1.sql에 SQL을 작성합니다.

    ```
    select tbl1.k2 from tbl1 join tbl2 on tbl1.k1 = tbl2.k1;
    ```

2. curl을 사용하여 테이블 생성문을 가져옵니다.

    ```
    curl -X POST -H 'Content-Type: text/plain'  -uroot: http://127.0.0.1:8030/api/query_schema/internal/db1 -d@1.sql
    ```
