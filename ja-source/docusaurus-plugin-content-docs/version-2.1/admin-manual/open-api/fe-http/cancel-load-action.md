---
{
  "title": "ロード操作をキャンセル",
  "language": "ja",
  "description": "指定されたlabelのload transactionをキャンセルするために使用されます。"
}
---
# Cancel Load Action

## Request

`POST /api/<db>/_cancel`

## 詳細

指定されたラベルのロード トランザクションをキャンセルするために使用されます。
戻り値
    JSON形式の文字列を返します:
    Status: 
        Success: キャンセル成功
        Others: キャンセル失敗
    Message: キャンセル失敗時のエラーメッセージ
    
## Path parameters

* `<db>`

    データベース名を指定します

## Query parameters

* `<label>`

    ロードラベルを指定します

## Request body

なし

## Response

* キャンセル成功

    ```
    {
    	"msg": "OK",
    	"code": 0,
    	"data": null,
    	"count": 0
    }
    ```
* キャンセルに失敗しました

    ```
    {
    	"msg": "Error msg...",
    	"code": 1,
    	"data": null,
    	"count": 0
    }
    ```
## 例

1. 指定されたラベルのロードトランザクションをキャンセルする

    ```
    POST /api/example_db/_cancel?label=my_label1

    Response:
    {
    	"msg": "OK",
    	"code": 0,
    	"data": null,
    	"count": 0
    }
    ```
