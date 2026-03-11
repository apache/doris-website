---
{
  "title": "FEログファイルを取得",
  "language": "ja",
  "description": "ユーザーはHTTPインターフェースを通じてFEログファイルを取得することができます。"
}
---
# FE ログファイルの取得

## リクエスト

`HEAD /api/get_log_file`

`GET /api/get_log_file`

## 説明

ユーザーはHTTPインターフェースを通じてFEログファイルを取得できます。

HEAD リクエストは指定されたログタイプのログファイル一覧を取得するために使用されます。GET リクエストは指定されたログファイルをダウンロードするために使用されます。

## Path parameters

なし

## Query parameters

* `type`

    ログタイプを指定します。以下のタイプがサポートされています：
    
    * `fe.audit.log`: Frontend の監査ログ。

* `file`

    ファイル名を指定します

## Request body

なし

## Response

* `HEAD`

    ```
    HTTP/1.1 200 OK
    file_infos: {"fe.audit.log":24759,"fe.audit.log.20190528.1":132934}
    content-type: text/html
    connection: keep-alive
    ```
返されたヘッダーは、指定されたタイプの現在のすべてのログファイルと各ファイルのサイズを一覧表示します。

* `GET`

    指定されたログファイルをテキスト形式でダウンロードします

## 例

1. 対応するタイプのログファイル一覧を取得する

    ```
    HEAD /api/get_log_file?type=fe.audit.log
    
    Response:
    
    HTTP/1.1 200 OK
    file_infos: {"fe.audit.log":24759,"fe.audit.log.20190528.1":132934}
    content-type: text/html
    connection: keep-alive
    ```
返されたヘッダーで、`file_infos`フィールドはファイルリストと対応するファイルサイズ（バイト単位）をjson形式で表示します

2. ログファイルをダウンロード

    ```
    GET /api/get_log_file?type=fe.audit.log&file=fe.audit.log.20190528.1
    
    Response:
    
    < HTTP/1.1 200
    < Vary: Origin
    < Vary: Access-Control-Request-Method
    < Vary: Access-Control-Request-Headers
    < Content-Disposition: attachment;fileName=fe.audit.log
    < Content-タイプ: application/octet-stream;charset=UTF-8
    < Transfer-Encoding: chunked
    
    ... File Content ...
    ```
