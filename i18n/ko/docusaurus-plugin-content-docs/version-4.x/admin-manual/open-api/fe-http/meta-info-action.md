---
{
    "title": "메타 정보 액션 | Fe Http",
    "language": "ko",
    "description": "메타 정보 액션은 클러스터의 데이터베이스 목록, 테이블 구조 등 메타데이터 정보를 가져오는 데 사용됩니다.",
    "sidebar_label": "메타 정보 액션"
}
---

# 메타 정보 액션 {#meta-info-action}

메타 정보 액션은 클러스터의 데이터베이스 목록, 테이블 구조 등 메타데이터 정보를 가져오는 데 사용됩니다.

## 데이터베이스 목록 {#list-database}

### 요청 {#request}

```
GET /api/meta/namespaces/<ns_name>/databases
```

### 설명 {#description}

모든 데이터베이스 이름을 알파벳순으로 정렬한 목록을 가져옵니다.

### 경로 매개변수 {#path-parameters}

없음

### 쿼리 매개변수 {#query-parameters}

* `limit`

    반환할 결과 행 수를 제한합니다.
    
* `offset`

    페이지네이션 정보로, `limit`와 함께 사용해야 합니다.
    
### 요청 본문 {#request-body}

없음

### 응답 {#response}

```
{
	"msg": "OK",
	"code": 0,
	"data": [
	   "db1", "db2", "db3", ...  
	],
	"count": 3
}
```

* data 필드는 데이터베이스 이름 목록을 반환합니다.

## 테이블 목록 {#list-table}

### 요청 {#request-1}

```
GET /api/meta/namespaces/<ns_name>/databases/<db_name>/tables
```

### 설명 {#description-1}

지정된 데이터베이스의 테이블 목록을 알파벳순으로 정렬하여 가져옵니다.

### 경로 매개변수 {#path-parameters-1}

* `<db_name>`

    데이터베이스를 지정합니다.

### 쿼리 매개변수 {#query-parameters-1}

* `limit`

    반환할 결과 행 수를 제한합니다.
    
* `offset`

    페이지네이션 정보로, `limit`와 함께 사용해야 합니다.

### 요청 본문 {#request-body-1}

없음

### 응답 {#response-1}

```
{
	"msg": "OK",
	"code": 0,
	"data": [
	   "tbl1", "tbl2", "tbl3", ...  
	],
	"count": 0
}
```

* data 필드는 테이블 이름 목록을 반환합니다.

## 스키마 정보 {#schema-info}

### 요청 {#request-2}

```
GET /api/meta/namespaces/<ns_name>/databases/<db_name>/tables/<tbl_name>/schema
```

### 설명 {#description-2}

지정된 데이터베이스에서 지정된 테이블의 구조 정보를 가져옵니다.

### 경로 매개변수 {#path-parameters-2}

* `<db_name>`

    데이터베이스 이름을 지정합니다.
    
* `<tbl_name>`

    테이블 이름을 지정합니다.

### 쿼리 매개변수 {#query-parameters-2}

* `with_mv`

    선택 사항입니다. 지정하지 않으면 기본 테이블의 구조를 반환하며, 지정하면 모든 rollup 인덱스도 함께 반환합니다.

### 요청 본문 {#request-body-2}

없음

### 응답 {#response-2}

```
GET /api/meta/namespaces/default/databases/db1/tables/tbl1/schema

{
	"msg": "success",
	"code": 0,
	"data": {
		"tbl1": {
			"schema": [{
					"Field": "k1",
					"Type": "INT",
					"Null": "Yes",
					"Extra": "",
					"Default": null,
					"Key": "true"
				},
				{
					"Field": "k2",
					"Type": "INT",
					"Null": "Yes",
					"Extra": "",
					"Default": null,
					"Key": "true"
				}
			],
			"is_base": true
		}
	},
	"count": 0
}
```

```
GET /api/meta/namespaces/default/databases/db1/tables/tbl1/schema?with_mv=1

{
	"msg": "success",
	"code": 0,
	"data": {
		"tbl1": {
			"schema": [{
					"Field": "k1",
					"Type": "INT",
					"Null": "Yes",
					"Extra": "",
					"Default": null,
					"Key": "true"
				},
				{
					"Field": "k2",
					"Type": "INT",
					"Null": "Yes",
					"Extra": "",
					"Default": null,
					"Key": "true"
				}
			],
			"is_base": true
		},
		"rollup1": {
			"schema": [{
				"Field": "k1",
				"Type": "INT",
				"Null": "Yes",
				"Extra": "",
				"Default": null,
				"Key": "true"
			}],
			"is_base": false
		}
	},
	"count": 0
}
```

* data 필드는 기본 테이블 또는 rollup 테이블의 구조 정보를 반환합니다.
