---
{
    "title": "설정 조회",
    "language": "ko",
    "description": "Config Action은 현재 FE 설정 정보를 조회하는 데 사용됩니다."
}
---

# 설정 조회 {#config-action}

## 요청 {#request}

```
GET /rest/v1/config/fe/
```

## 설명 {#description}

Config Action은 현재 FE 설정 정보를 조회하는 데 사용됩니다.

## 경로 매개변수 {#path-parameters}

없음

## 쿼리 매개변수 {#query-parameters}

* `conf_item`

    선택 사항입니다. FE 설정에서 지정한 항목을 반환합니다.

## 요청 본문 {#request-body}

없음

## 응답 {#response}

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

반환 결과는 `System Action`과 동일하며, 테이블에 대한 설명입니다.
