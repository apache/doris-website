---
{
    "title": "Config Action",
    "language": "en",
    "description": "Config Action is used to obtain current FE configuration information."
}
---

# Config Action

## Request

```
GET /rest/v1/config/fe/
```

## Description

Config Action is used to obtain current FE configuration information.
    
## Path parameters

None

## Query parameters

* `conf_item`

    Optional parameters. Return specified item in FE configuration.

## Request body

None

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
    
The returned result is the same as `System Action`. Is a description of the table.