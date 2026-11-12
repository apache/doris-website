---
{
    "title": "Session Action",
    "language": "zh-CN"
}
---

# Session Action

## Request

```
GET /rest/v1/session
```

## Description

Session Action 用于获取当前的会话信息。
    
## Path parameters

无

## Query parameters

无

## Request body

无

## Response

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"column_names": ["Id", "User", "Host", "Cluster", "Db", "Command", "Time", "State", "Info"],
		"rows": [{
			"User": "root",
			"Command": "Sleep",
			"State": "",
			"Cluster": "default_cluster",
			"Host": "10.81.85.89:31465",
			"Time": "230",
			"Id": "0",
			"Info": "",
			"Db": "db1"
		}]
	},
	"count": 2
}
```
    
返回结果同 `System Action`。是一个表格的描述。
