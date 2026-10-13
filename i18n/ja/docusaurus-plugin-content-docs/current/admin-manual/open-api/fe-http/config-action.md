---
{
    "title": "設定情報の取得（Config Action）",
    "language": "ja",
    "description": "Config Action は現在の FE の設定情報を取得するために使用します。"
}
---

# 設定情報の取得（Config Action）

## リクエスト

```
GET /rest/v1/config/fe/
```

## 説明

Config Action は現在の FE の設定情報を取得するために使用します。

## パスパラメータ

なし

## クエリパラメータ

* `conf_item`

    省略可能なパラメータです。FE の設定項目を指定すると、その項目を返します。

## リクエストボディ

なし

## レスポンス

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

返される結果は `System Action` と同じ形式で、設定項目を表形式で示します。
