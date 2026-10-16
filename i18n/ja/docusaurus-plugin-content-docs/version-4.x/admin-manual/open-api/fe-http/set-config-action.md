---
{
    "title": "設定の変更（Set Config Action）",
    "language": "ja",
    "description": "FE の設定を動的に変更します。この操作は ADMIN SET FRONTEND CONFIG コマンドを介して実行されます。"
}
---

# 設定の変更（Set Config Action）

## リクエスト

`GET /api/_set_config`

## 説明

FE の設定を動的に変更します。この操作は `ADMIN SET FRONTEND CONFIG` コマンドを介して実行されます。ただし、このリクエストは対象の FE ノードの設定だけを変更します。`MasterOnly` の設定項目が Master FE ノードに自動転送されることはありません。

## パスパラメータ

なし

## クエリパラメータ

* `confkey1=confvalue1`

    変更する設定項目名と、その設定項目に設定する値を指定します。

* `persist`

    変更した設定を永続化するかどうかを指定します。デフォルトは false で、永続化されません。true の場合、変更した設定項目が `fe_custom.conf` ファイルに書き込まれ、FE の再起動後も有効です。

* `reset_persist`

    永続化済みの設定を消去するかどうかを指定します。persist が true の場合にのみ有効です。以前のバージョンとの互換性のため、reset_persist のデフォルトは true です。
	persist が true で、reset_persist を指定しないか true に設定した場合、`fe_custom.conf` ファイル内の設定を消去してから、変更した設定を `fe_custom.conf` に書き込みます。
	persist が true で reset_persist が false の場合、変更した設定項目が `fe_custom.conf` に追加されます。

## リクエストボディ

なし

## レスポンス

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"set": {
			"key": "value"
		},
		"err": [
			{
		       "config_name": "",
		       "config_value": "",
		       "err_info": ""
		    }
		],
		"persist":""
	},
	"count": 0
}
```

`set` フィールドは設定に成功した項目を示します。`err` フィールドは設定に失敗した項目を示します。`persist` フィールドは永続化に関する情報を示します。

## 例

1. `storage_min_left_capacity_bytes`、`replica_ack_policy`、`agent_task_resend_wait_time_ms` の値を設定します。

    ```
    GET /api/_set_config?storage_min_left_capacity_bytes=1024&replica_ack_policy=SIMPLE_MAJORITY&agent_task_resend_wait_time_ms=true
    
    Response:
    {
    "msg": "success",
    "code": 0,
    "data": {
        "set": {
            "storage_min_left_capacity_bytes": "1024"
        },
        "err": [
            {
                "config_name": "replica_ack_policy",
                "config_value": "SIMPLE_MAJORITY",
                "err_info": "Not support dynamic modification."
            },
            {
                "config_name": "agent_task_resend_wait_time_ms",
                "config_value": "true",
                "err_info": "Unsupported configuration value type."
            }
        ],
        "persist": ""
    },
    "count": 0
    }

	storage_min_left_capacity_bytes  Successfully;    
	replica_ack_policy  Failed, because the configuration item does not support dynamic modification.  
	agent_task_resend_wait_time_ms  Failed, failed to set the boolean type because the configuration item is of type long.
    ```

2. `max_bytes_per_broker_scanner` を設定し、永続化します。

    ```
    GET /api/_set_config?max_bytes_per_broker_scanner=21474836480&persist=true&reset_persist=false
    
    Response:
    {
    "msg": "success",
    "code": 0,
    "data": {
        "set": {
            "max_bytes_per_broker_scanner": "21474836480"
        },
        "err": [],
        "persist": "ok"
    },
    "count": 0
    }
	```

	fe/conf ディレクトリに fe_custom.conf ファイルが生成されます。
	```
	#THIS IS AN AUTO GENERATED CONFIG FILE.
    #You can modify this file manually, and the configurations in this file
    #will overwrite the configurations in fe.conf
    #Wed Jul 28 12:43:14 CST 2021
    max_bytes_per_broker_scanner=21474836480
    ```