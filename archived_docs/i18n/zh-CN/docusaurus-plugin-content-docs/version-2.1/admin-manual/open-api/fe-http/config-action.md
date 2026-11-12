---
{
    "title": "Config Action",
    "language": "zh-CN",
    "description": "Config Action 用于获取当前 FE 的配置信息"
}
---

## Request

```
GET /rest/v1/config/fe/
```

## Description

Config Action 用于获取当前 FE 的配置信息
    
## Path parameters

无

## Query parameters

* `conf_item`

    可选参数。返回 FE 的配置信息中的指定项。

## Request body

无

## Response

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"column_names": ["Name", "Value"],
		"rows": [{
			"Value": "DAY",
			"Name": "sys_log_roll_interval"
		}, {
			"Value": "23",
			"Name": "consistency_check_start_time"
		}, {
			"Value": "4096",
			"Name": "max_mysql_service_task_threads_num"
		}, {
			"Value": "1000",
			"Name": "max_unfinished_load_job"
		}, {
			"Value": "100",
			"Name": "max_routine_load_job_num"
		}, {
			"Value": "SYNC",
			"Name": "master_sync_policy"
		}]
	},
	"count": 0
}
```
    
返回结果同 `System Action`。是一个表格的描述。
