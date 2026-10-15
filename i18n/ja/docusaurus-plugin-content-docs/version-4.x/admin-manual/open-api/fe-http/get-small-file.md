---
{
    "title": "小さなファイルの取得アクション",
    "language": "ja",
    "description": "ファイル ID を指定して、小さなファイルマネージャー内のファイルをダウンロードします。"
}
---

# 小さなファイルの取得

## リクエスト

`GET /api/get_small_file`

## 説明

ファイル ID を指定して、小さなファイルマネージャー内のファイルをダウンロードします。
    
## パスパラメータ

なし

## クエリパラメータ

* `token`

    クラスターのトークンです。`doris-meta/image/VERSION` ファイルで確認できます。

* `file_id`
    
    ファイルマネージャーに表示されるファイル ID です。`SHOW FILE` コマンドで確認できます。

## リクエストボディ

なし

## レスポンス

```
< HTTP/1.1 200
< Vary: Origin
< Vary: Access-Control-Request-Method
< Vary: Access-Control-Request-Headers
< Content-Disposition: attachment;fileName=ca.pem
< Content-Type: application/json;charset=UTF-8
< Transfer-Encoding: chunked

... File Content ...
```

エラーが発生した場合は、次のレスポンスを返します。

```
{
	"msg": "File not found or is not content",
	"code": 1,
	"data": null,
	"count": 0
}
```
    
## 例

1. 指定した ID のファイルをダウンロードする

    ```
    GET /api/get_small_file?token=98e8c0a6-3a41-48b8-a72b-0432e42a7fe5&file_id=11002
    
    Response:
    
    < HTTP/1.1 200
    < Vary: Origin
    < Vary: Access-Control-Request-Method
    < Vary: Access-Control-Request-Headers
    < Content-Disposition: attachment;fileName=ca.pem
    < Content-Type: application/json;charset=UTF-8
    < Transfer-Encoding: chunked
    
    ... File Content ...
    ```
