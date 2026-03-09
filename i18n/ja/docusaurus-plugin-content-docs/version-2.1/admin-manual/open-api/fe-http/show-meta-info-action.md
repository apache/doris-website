---
{
  "title": "Meta情報表示アクション",
  "language": "ja",
  "description": "一部のメタデータ情報を表示するために使用されます"
}
---
# Show Meta Info Action

## Request

`GET /api/show_meta_info`

## Description

いくつかのメタデータ情報を表示するために使用されます
    
## Path parameters

无

## Query parameters

* action

    取得するメタデータ情報のタイプを指定します。現在、以下をサポートしています：
    
    * `SHOW_DB_SIZE`

        指定されたデータベースのデータサイズをバイト単位で取得します。
        
    * `SHOW_HA`

        FEメタデータログの再生状態と選出可能グループの状態を取得します。

## Request body

None

## Response


* `SHOW_DB_SIZE`

    ```
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"default_cluster:information_schema": 0,
    		"default_cluster:db1": 381
    	},
    	"count": 0
    }
    ```
* `SHOW_HA`

    ```
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"can_read": "true",
    		"role": "MASTER",
    		"is_ready": "true",
    		"last_checkpoint_version": "1492",
    		"last_checkpoint_time": "1596465109000",
    		"current_journal_id": "1595",
    		"electable_nodes": "",
    		"observer_nodes": "",
    		"master": "10.81.85.89"
    	},
    	"count": 0
    }
    ```
## 例

1. クラスター内の各データベースのデータサイズを表示する

    ```
    GET /api/show_meta_info?action=show_db_size
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"default_cluster:information_schema": 0,
    		"default_cluster:db1": 381
    	},
    	"count": 0
    }
    ```
2. FE選出グループの状況を確認する

    ```
    GET /api/show_meta_info?action=show_ha
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"can_read": "true",
    		"role": "MASTER",
    		"is_ready": "true",
    		"last_checkpoint_version": "1492",
    		"last_checkpoint_time": "1596465109000",
    		"current_journal_id": "1595",
    		"electable_nodes": "",
    		"observer_nodes": "",
    		"master": "10.81.85.89"
    	},
    	"count": 0
    }
    ```
