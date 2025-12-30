---
{
    "title": "Session Action",
    "language": "zh-CN",
    "description": "Session Action 用于获取当前的会话信息。"
}
---

## Request

`GET /rest/v1/session`



`GET /rest/v1/session/all`



## Description

Session Action 用于获取当前的会话信息。
    
## Path parameters

无

## Query parameters

无

## Request body

无

## 获取当前 FE 的会话信息

`GET /rest/v1/session`

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

## 获取所有 FE 的会话信息

`GET /rest/v1/session/all`

## Response

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"column_names": ["FE", "Id", "User", "Host", "Cluster", "Db", "Command", "Time", "State", "Info"],
		"rows": [{
		    "FE": "10.14.170.23",
			"User": "root",
			"Command": "Sleep",
			"State": "",
			"Cluster": "default_cluster",
			"Host": "10.81.85.89:31465",
			"Time": "230",
			"Id": "0",
			"Info": "",
			"Db": "db1"
		},
		{
            "FE": "10.14.170.24",
			"User": "root",
			"Command": "Sleep",
			"State": "",
			"Cluster": "default_cluster",
			"Host": "10.81.85.88:61465",
			"Time": "460",
			"Id": "1",
			"Info": "",
			"Db": "db1"
		}]
	},
	"count": 2
}
```
    
返回结果同 `System Action`。是一个表格的描述。
