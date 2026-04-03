---
{
  "title": "小ファイル取得Action",
  "language": "ja",
  "description": "ファイルIDを通じて、小さなファイルマネージャーでファイルをダウンロードします。"
}
---
# Small Fileの取得

## リクエスト

`GET /api/get_small_file`

## 説明

ファイルIDを通じて、small file manager内のファイルをダウンロードします。
    
## Pathパラメータ

なし

## Queryパラメータ

* `token`

    クラスターのtoken。`doris-meta/image/VERSION`ファイルで確認できます。

* `file_id`
    
    ファイルマネージャーに表示されるファイルID。ファイルIDは`SHOW FILE`コマンドで確認できます。

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
エラーがある場合は、以下を返します：

```
{
	"msg": "File not found or is not content",
	"code": 1,
	"data": null,
	"count": 0
}
```
## 例

1. 指定されたidでファイルをダウンロードする

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
