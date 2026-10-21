---
{
    "title": "시스템 작업",
    "language": "ko",
    "description": "시스템 작업은 Doris에 내장된 Proc 시스템의 정보를 조회하는 데 사용됩니다."
}
---

# 시스템 작업 {#system-action}

## 요청 {#request}

```
GET /rest/v1/system
```

## 설명 {#description}

시스템 작업은 Doris에 내장된 Proc 시스템의 정보를 조회하는 데 사용됩니다.

## 경로 매개변수 {#path-parameters}

없음

## 쿼리 매개변수 {#query-parameters}

* `path`

    proc의 경로를 지정하는 선택적 매개변수입니다.

## 요청 본문 {#request-body}

없음

## 응답 {#response}

`/dbs/10003/10054/partitions/10053/10055`를 예로 들면 다음과 같습니다.

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"href_columns": ["TabletId", "MetaUrl", "CompactionStatus"],
		"column_names": ["TabletId", "ReplicaId", "BackendId", "SchemaHash", "Version", "VersionHash", "LstSuccessVersion", "LstSuccessVersionHash", "LstFailedVersion", "LstFailedVersionHash", "LstFailedTime", "DataSize", "RowCount", "State", "LstConsistencyCheckTime", "CheckVersion", "CheckVersionHash", "VersionCount", "PathHash", "MetaUrl", "CompactionStatus"],
		"rows": [{
			"SchemaHash": "1294206575",
			"LstFailedTime": "\\N",
			"LstFailedVersion": "-1",
			"MetaUrl": "URL",
			"__hrefPaths": ["http://192.168.100.100:8030/rest/v1/system?path=/dbs/10003/10054/partitions/10053/10055/10056", "http://192.168.100.100:8043/api/meta/header/10056", "http://192.168.100.100:8043/api/compaction/show?tablet_id=10056"],
			"CheckVersionHash": "-1",
			"ReplicaId": "10057",
			"VersionHash": "4611804212003004639",
			"LstConsistencyCheckTime": "\\N",
			"LstSuccessVersionHash": "4611804212003004639",
			"CheckVersion": "-1",
			"Version": "6",
			"VersionCount": "2",
			"State": "NORMAL",
			"BackendId": "10032",
			"DataSize": "776",
			"LstFailedVersionHash": "0",
			"LstSuccessVersion": "6",
			"CompactionStatus": "URL",
			"TabletId": "10056",
			"PathHash": "-3259732870068082628",
			"RowCount": "21"
		}]
	},
	"count": 1
}
```

data 부분의 `column_names`는 헤더 정보이며, `href_columns`는 테이블에서 어떤 열이 하이퍼링크 열인지 나타냅니다. `rows` 배열의 각 요소는 행 하나를 나타냅니다. 이 중 `__hrefPaths`는 테이블 데이터가 아니라 하이퍼링크 열의 링크 URL이며, `href_columns`의 각 열과 일대일로 대응합니다.
