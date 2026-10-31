---
{
    "title": "System Action",
    "language": "zh-CN",
    "description": "System Action 用于 Doris 内置的 Proc 系统的相关信息。"
}
---

## Request

```
GET /rest/v1/system
```

## Description

System Action 用于 Doris 内置的 Proc 系统的相关信息。
    
## Path parameters

无

## Query parameters

* `path`

    可选参数，指定 proc 的 path

## Request body

无

## Response
    
以 `/dbs/10003/10054/partitions/10053/10055` 为例：
    
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
    
其中 data 部分的 `column_names` 是表头信息，`href_columns` 表示表中的哪些列是超链接列。`rows` 数组中的每个元素表示一行。其中 `__hrefPaths ` 不是表数据，而是超链接列的链接 URL，和 `href_columns` 中的列一一对应。
