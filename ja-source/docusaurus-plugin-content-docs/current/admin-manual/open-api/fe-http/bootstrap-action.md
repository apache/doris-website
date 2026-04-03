---
{
  "title": "Bootstrap アクション",
  "language": "ja",
  "description": "FEが開始されたかどうかを判定するために使用されます。パラメータが提供されない場合、起動が成功したかどうかのみが返されます。"
}
---
# Bootstrap Action

## Request

`GET /api/bootstrap`

## 詳細

FEが開始されたかどうかを判定するために使用されます。パラメータが提供されない場合、起動が成功したかどうかのみが返されます。`token`と`cluster_id`が提供された場合、より詳細な情報が返されます。
    
## Path parameters

none

## Query parameters

* `cluster_id`

    クラスターID。ファイル`doris-meta/image/VERSION`で確認できます。
    
* `token`

    クラスタートークン。ファイル`doris-meta/image/VERSION`で確認できます。

## Request body

none

## Response

* パラメータが提供されない場合

    ```
    {
    	"msg": "OK",
    	"code": 0,
    	"data": null,
    	"count": 0
    }
    ```
コード0は、FEノードが正常に開始されたことを意味します。0以外のエラーコードは、その他のエラーを示します。

* `token`と`cluster_id`を提供してください

    ```
    {
    	"msg": "OK",
    	"code": 0,
    	"data": {
    		"queryPort": 9030,
    		"rpcPort": 9020,
            "arrowFlightSqlPort": 9040,
    		"maxReplayedJournal": 17287
    	},
    	"count": 0
    }
    ```
* `queryPort`はFEノードのMySQLプロトコルポートです。
    * `rpcPort`はFEノードのthrift RPCポートです。
    * `maxReplayedJournal`はFEノードによって現在再生されている最大メタデータジャーナルIDを表します。
    * `arrowFlightSqlPort`はFEノードのArrow Flight SQLポートです。
    
## 例

1. パラメータなし

    ```
    GET /api/bootstrap

    Response:
    {
    	"msg": "OK",
    	"code": 0,
    	"data": null,
    	"count": 0
    }
    ```
2. `token` と `cluster_id` を提供する

    ```
    GET /api/bootstrap?cluster_id=935437471&token=ad87f6dd-c93f-4880-bcdb-8ca8c9ab3031

    Response:
    {
    	"msg": "OK",
    	"code": 0,
    	"data": {
    		"queryPort": 9030,
    		"rpcPort": 9020,
            "arrowFlightSqlPort": 9040,
    		"maxReplayedJournal": 17287
    	},
    	"count": 0
    }
    ```
