---
{
  "title": "読み込みアクションをキャンセル",
  "language": "ja",
  "description": "指定されたラベルのロードトランザクションをキャンセルするために使用されます。"
}
---
# Cancel Load Action

## Request

`POST /api/<db>/_cancel`

## Description

指定されたラベルのロード取引をキャンセルするために使用されます。
戻り値
    JSON形式の文字列を返します：
    Status: 
        Success: キャンセル成功
        Others: キャンセル失敗
    Message: キャンセルが失敗した場合のエラーメッセージ
    
## Path parameters

* `<db>`

    データベース名を指定します

## Query parameters

* `<label>`

    ロードラベルを指定します

## Request body

None

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
