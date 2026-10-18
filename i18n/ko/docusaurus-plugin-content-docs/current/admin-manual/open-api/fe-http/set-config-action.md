---
{
    "title": "설정 변경 작업",
    "language": "ko",
    "description": "FE의 설정을 동적으로 변경하는 데 사용합니다. 이 명령은 ADMIN SET FRONTEND CONFIG 명령을 통해 전달됩니다."
}
---

# 설정 변경 작업 {#set-config-action}

## 요청 {#request}

`GET /api/_set_config`

## 설명 {#description}

FE의 설정을 동적으로 변경하는 데 사용합니다. 이 명령은 `ADMIN SET FRONTEND CONFIG` 명령을 통해 전달됩니다. 단, 해당 FE 노드의 설정만 변경하며, `MasterOnly` 설정 항목을 Master FE 노드로 자동 전달하지 않습니다.

## 경로 매개변수 {#path-parameters}

없음

## 쿼리 매개변수 {#query-parameters}

* `confkey1=confvalue1`

    변경할 설정 이름을 지정합니다. 이 매개변수의 값은 변경할 설정값입니다.

* `persist`

     변경한 설정을 영구 저장할지 여부입니다. 기본값은 false이며, 영구 저장하지 않습니다. true이면 변경한 설정 항목이 `fe_custom.conf` 파일에 기록되며 FE를 다시 시작한 후에도 적용됩니다.

* `reset_persist`
    기존에 영구 저장된 설정을 지울지 여부입니다. persist 매개변수가 true일 때만 적용됩니다. 이전 버전과의 호환성을 위해 reset_persist의 기본값은 true입니다.
	persist가 true이고 reset_persist가 설정되지 않았거나 true이면, `fe_custom.conf` 파일의 설정을 모두 지운 후 변경한 설정을 `fe_custom.conf`에 기록합니다.
	persist가 true이고 reset_persist가 false이면, 기존 설정을 유지하면서 변경한 설정 항목을 `fe_custom.conf`에 추가합니다.


## 요청 본문 {#request-body}

없음

## 응답 {#response}

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

`set` 필드는 설정에 성공한 항목을 나타냅니다. `err` 필드는 설정에 실패한 항목을 나타냅니다. `persist` 필드는 영구 저장 정보를 나타냅니다.

## 예제 {#examples}

1. `storage_min_left_capacity_bytes`, `replica_ack_policy`, `agent_task_resend_wait_time_ms`의 값을 설정합니다.

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

2. `max_bytes_per_broker_scanner`를 설정하고 영구 저장합니다.

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

	fe/conf 디렉터리에 fe_custom.conf 파일이 생성됩니다:
	```
	#THIS IS AN AUTO GENERATED CONFIG FILE.
    #You can modify this file manually, and the configurations in this file
    #will overwrite the configurations in fe.conf
    #Wed Jul 28 12:43:14 CST 2021
    max_bytes_per_broker_scanner=21474836480
    ```
