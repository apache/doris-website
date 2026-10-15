---
{
    "title": "FE ログファイルの取得",
    "language": "ja",
    "description": "HTTP インターフェースを介して FE のログファイルを取得できます。"
}
---

# FE ログファイルの取得

## リクエスト

`HEAD /api/get_log_file`

`GET /api/get_log_file`

## 説明

HTTP インターフェースを介して FE のログファイルを取得できます。

HEAD リクエストは、指定したログタイプのログファイル一覧を取得するために使用します。GET リクエストは、指定したログファイルをダウンロードするために使用します。
    
## パスパラメータ

なし

## クエリパラメータ

* `type`

    ログタイプを指定します。次のタイプをサポートしています。
    
    * `fe.audit.log`: Frontend の監査ログ。

* `file`

    ファイル名を指定します。


## リクエストボディ

なし

## レスポンス

* `HEAD`

    ```
    HTTP/1.1 200 OK
    file_infos: {"fe.audit.log":24759,"fe.audit.log.20190528.1":132934}
    content-type: text/html
    connection: keep-alive
    ```
    
    返されるヘッダーには、指定したタイプの現在のログファイルと各ファイルのサイズがすべて列挙されます。
    
* `GET`

    指定したログファイルをテキスト形式でダウンロードします。
    
## 例

1. 指定したタイプのログファイル一覧を取得する

    ```
    HEAD /api/get_log_file?type=fe.audit.log
    
    Response:
    
    HTTP/1.1 200 OK
    file_infos: {"fe.audit.log":24759,"fe.audit.log.20190528.1":132934}
    content-type: text/html
    connection: keep-alive
    ```
    
    返されるヘッダーの `file_infos` フィールドには、ファイル一覧と各ファイルのサイズ（バイト単位）が JSON 形式で表示されます。
    
2. ログファイルをダウンロードする
    
    ```
    GET /api/get_log_file?type=fe.audit.log&file=fe.audit.log.20190528.1
    
    Response:
    
    < HTTP/1.1 200
    < Vary: Origin
    < Vary: Access-Control-Request-Method
    < Vary: Access-Control-Request-Headers
    < Content-Disposition: attachment;fileName=fe.audit.log
    < Content-Type: application/octet-stream;charset=UTF-8
    < Transfer-Encoding: chunked
    
    ... File Content ...
    ```
