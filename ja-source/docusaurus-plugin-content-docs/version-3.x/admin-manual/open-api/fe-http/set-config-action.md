---
{
  "title": "Config設定アクション",
  "language": "ja",
  "description": "FEの設定を動的に設定するために使用されます。このコマンドはADMIN SET FRONTEND CONFIGコマンドを通じて渡されます。"
}
---
# Set Config Action

## リクエスト

`GET /api/_set_config`

## 説明

FEの設定を動的に設定するために使用されます。このコマンドは`ADMIN SET FRONTEND CONFIG`コマンドを通じて渡されます。ただし、このコマンドは対応するFEノードの設定のみを設定します。そして、`MasterOnly`設定項目をMaster FEノードに自動的に転送しません。

## パスパラメータ

なし

## クエリパラメータ

* `confkey1=confvalue1`

    設定する設定名を指定し、その値は変更する設定値です。

* `persist`

     変更された設定を永続化するかどうか。デフォルトはfalseで、永続化されないことを意味します。trueの場合、変更された設定項目は`fe_custom.conf`ファイルに書き込まれ、FEが再起動された後も有効になります。

* `reset_persist`
    元のpersist設定をクリアするかどうかは、persistパラメータがtrueの場合にのみ有効です。元のバージョンとの互換性のため、reset_persistのデフォルトはtrueです。
	persistがtrueに設定され、reset_persistが設定されていないかreset_persistがtrueの場合、この変更された設定が`fe_custom.conf`に書き込まれる前に、`fe_custom.conf`ファイル内の設定がクリアされます。
	persistがtrueに設定され、reset_persistがfalseの場合、この変更された設定項目は`fe_custom.conf`に増分的に追加されます。

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
`set`フィールドは正常に設定された設定を示します。`err`フィールドは設定に失敗した設定を示します。`persist`フィールドは永続化情報を示します。

## 例

1. `storage_min_left_capacity_bytes`、`replica_ack_policy`、`agent_task_resend_wait_time_ms`の値を設定します。

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
2. `max_bytes_per_broker_scanner` を設定して永続化します。

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
fe/confディレクトリはfe_custom.confファイルを生成します：

	```
	#THIS IS AN AUTO GENERATED CONFIG FILE.
    #You can modify this file manually, and the configurations in this file
    #will overwrite the configurations in fe.conf
    #Wed Jul 28 12:43:14 CST 2021
    max_bytes_per_broker_scanner=21474836480
    ```
