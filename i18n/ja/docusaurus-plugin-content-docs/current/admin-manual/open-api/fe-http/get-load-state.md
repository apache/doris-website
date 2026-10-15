---
{
    "title": "ロード状態の取得",
    "language": "ja",
    "description": "指定したラベルのロードトランザクションの状態を返します。指定したトランザクションの状態を JSON 形式の文字列で返します。"
}
---

# ロード状態の取得

## リクエスト

`GET /api/<db>/get_load_state`

## 説明

指定したラベルのロードトランザクションの状態を返します。
指定したトランザクションの状態を JSON 形式の文字列で返します。
	ラベル: 指定したラベル。
	ステータス: このリクエストが成功したかどうか。
	メッセージ: エラーメッセージ。
	状態:
		UNKNOWN/PREPARE/COMMITTED/VISIBLE/ABORTED
    
## パスパラメータ

* `<db>`

    データベースを指定します。

## クエリパラメータ

* `label`

    ラベルを指定します。

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

ラベルが存在しない場合は、次のように返されます。

```
{
	"msg": "success",
	"code": 0,
	"data": "UNKNOWN",
	"count": 0
}
```
    
## 例

1. 指定したラベルのロードトランザクションの状態を取得します。

    ```
    GET /api/example_db/get_load_state?label=my_label
    
    {
    	"msg": "success",
    	"code": 0,
    	"data": "VISIBLE",
    	"count": 0
    }
    ```
