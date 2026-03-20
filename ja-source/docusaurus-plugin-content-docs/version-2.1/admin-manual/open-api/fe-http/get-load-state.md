---
{
  "title": "ロード状態を取得",
  "language": "ja",
  "description": "指定されたラベルのロードトランザクションのステータスを返します。指定されたトランザクションのステータスのJSON形式文字列を返します：Label："
}
---
# Load状態の取得

## リクエスト

`GET /api/<db>/get_load_state`

## 説明

指定されたラベルのロードトランザクションのステータスを返します
指定されたトランザクションのステータスのJSON形式文字列を返します：
	Label: 指定されたラベル。
	Status: このリクエストの成功または失敗。
	Message: エラーメッセージ
	State: 
		UNKNOWN/PREPARE/COMMITTED/VISIBLE/ABORTED
    
## パスパラメータ

* `<db>`

    データベースを指定

## クエリパラメータ

* `label`

    ラベルを指定

## リクエストボディ

なし

## レスポンス

```
{
	"msg": "success",
	"code": 0,
	"data": "VISIBLE",
	"count": 0
}
```
ラベルが存在しない場合、次を返す：

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
