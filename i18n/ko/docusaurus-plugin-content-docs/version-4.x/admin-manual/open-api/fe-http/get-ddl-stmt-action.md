---
{
    "title": "DDL 문 조회 액션",
    "language": "ko",
    "description": "지정한 테이블의 테이블 생성문, 파티션 생성문 및 rollup 문을 조회하는 데 사용합니다."
}
---

# DDL 문 조회 액션 {#get-ddl-statement-action}

## 요청 {#request}

`GET /api/_get_ddl`

## 설명 {#description}

지정한 테이블의 테이블 생성문, 파티션 생성문 및 rollup 문을 조회하는 데 사용합니다.

## 경로 매개변수 {#path-parameters}

없음

## 쿼리 매개변수 {#query-parameters}

* `db`

    데이터베이스를 지정합니다.

* `table`

    테이블을 지정합니다.

## 요청 본문 {#request-body}

없음

## 응답 {#response}

```
{
	"msg": "OK",
	"code": 0,
	"data": {
		"create_partition": ["ALTER TABLE `tbl1` ADD PARTITION ..."],
		"create_table": ["CREATE TABLE `tbl1` ..."],
		"create_rollup": ["ALTER TABLE `tbl1` ADD ROLLUP ..."]
	},
	"count": 0
}
```

## 예제 {#examples}

1. 지정한 테이블의 DDL 문 조회

    ```
    GET /api/_get_ddl?db=db1&table=tbl1

    Response
    {
    	"msg": "OK",
    	"code": 0,
    	"data": {
    		"create_partition": [],
    		"create_table": ["CREATE TABLE `tbl1` (\n  `k1` int(11) NULL COMMENT \"\",\n  `k2` int(11) NULL COMMENT \"\"\n) ENGINE=OLAP\nDUPLICATE KEY(`k1`, `k2`)\nCOMMENT \"OLAP\"\nDISTRIBUTED BY HASH(`k1`) BUCKETS 1\nPROPERTIES (\n\"replication_num\" = \"1\",\n\"version_info\" = \"1,0\",\n\"in_memory\" = \"false\",\n\"storage_format\" = \"DEFAULT\"\n);"],
    		"create_rollup": []
    	},
    	"count": 0
    }
    ```
