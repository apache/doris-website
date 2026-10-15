---
{
    "title": "メタデータ情報の表示（Show Meta Info Action）",
    "language": "ja",
    "description": "一部のメタデータ情報を表示します。"
}
---

# メタデータ情報の表示（Show Meta Info Action）

## リクエスト

`GET /api/show_meta_info`

## 説明

一部のメタデータ情報を表示します。
    
## パスパラメータ

なし

## クエリパラメータ

* action

    取得するメタデータ情報の種類を指定します。現在、以下をサポートしています。
    
    * `SHOW_DB_SIZE`

        指定したデータベースのデータサイズをバイト単位で取得します。
        
    * `SHOW_HA`

        FE メタデータログのリプレイ状態と選出可能なグループの状態を取得します。

## リクエストボディ

なし

## レスポンス


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

1. クラスター内の各データベースのデータサイズを確認する

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
    
2. FE の選出グループの状態を確認する

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
