---
{
    "title": "ブートストラップアクション",
    "language": "ja",
    "description": "FE が起動したかどうかを確認するために使用します。パラメータを指定しない場合は、起動に成功したかどうかのみを返します。"
}
---

# ブートストラップアクション

## リクエスト

`GET /api/bootstrap`

## 説明

FE が起動したかどうかを確認するために使用します。パラメータを指定しない場合は、起動に成功したかどうかのみを返します。`token` と `cluster_id` を指定すると、より詳細な情報を返します。
    
## パスパラメータ

なし

## クエリパラメータ

* `cluster_id`

    クラスタ ID です。`doris-meta/image/VERSION` ファイルで確認できます。
    
* `token`

    クラスタトークンです。`doris-meta/image/VERSION` ファイルで確認できます。

## リクエストボディ

なし

## レスポンス

* パラメータを指定しない場合

    ```
    {
    	"msg": "OK",
    	"code": 0,
    	"data": null,
    	"count": 0
    }
    ```
    
    コードが 0 の場合、FE ノードが正常に起動したことを示します。0 以外のエラーコードは、その他のエラーを示します。
    
* `token` と `cluster_id` を指定する場合

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
    
    * `queryPort` は FE ノードの MySQL プロトコルポートです。
    * `rpcPort` は FE ノードの Thrift RPC ポートです。
    * `maxReplayedJournal` は、FE ノードが現在再生済みのメタデータジャーナル ID の最大値を表します。
    * `arrowFlightSqlPort` は FE ノードの Arrow Flight SQL ポートです。
    
## 例

1. パラメータを指定しない場合

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
    
2. `token` と `cluster_id` を指定する場合

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
