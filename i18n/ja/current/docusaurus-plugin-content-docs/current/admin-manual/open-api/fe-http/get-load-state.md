---
{
  "title": "負荷状態を取得",
  "language": "ja",
  "description": "指定されたラベルのロードトランザクションのステータスを返します。指定されたトランザクションのステータスのJSON形式文字列を返します：Label：The"
}
---
# Get Load State

## Request

`GET /api/<db>/get_load_state`

## Description

指定されたラベルのロードトランザクションのステータスを返します
指定されたトランザクションのステータスのJSON形式文字列を返します:
	Label: 指定されたラベル。
	Status: このリクエストの成功可否。
	Message: エラーメッセージ
	State: 
		UNKNOWN/PREPARE/COMMITTED/VISIBLE/ABORTED
    
## Path parameters

* `<db>`

    データベースを指定

## Query parameters

* `label`

    ラベルを指定

## Request body

なし

## Response

```
{
	"msg": "success",
	"code": 0,
	"data": "VISIBLE",
	"count": 0
}
```
ラベルが存在しない場合は、以下を返します：

```
{
	"msg": "success",
	"code": 0,
	"data": "UNKNOWN",
	"count": 0
}
```
## 例

1. 指定されたラベルのロードトランザクションのステータスを取得します。

    ```
    GET /api/example_db/get_load_state?label=my_label
    
    {
    	"msg": "success",
    	"code": 0,
    	"data": "VISIBLE",
    	"count": 0
    }
    ```
