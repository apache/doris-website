---
{
  "title": "設定アクション",
  "language": "ja",
  "description": "Config Actionは、現在のFE設定情報を取得するために使用されます。"
}
---
# Config Action

## リクエスト

```
GET /rest/v1/config/fe/
```
## 説明

Config Actionは、現在のFE設定情報を取得するために使用されます。
    
## パスパラメータ

なし

## クエリパラメータ

* `conf_item`

    オプションパラメータ。FE設定内の指定された項目を返します。

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
返された結果は`System Action`と同じです。テーブルの説明です。
