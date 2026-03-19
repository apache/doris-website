---
{
  "title": "アップロードアクション",
  "language": "ja",
  "description": "Upload Actionは現在主にFEのフロントエンドページにサービスを提供しており、ユーザーが小さなテストファイルを読み込むために使用されます。"
}
---
# Upload Action

Upload Actionは現在主にFEのフロントエンドページにサービスを提供し、ユーザーが小さなテストファイルを読み込むために使用されます。

## Upload load file

FEノードにファイルをアップロードするために使用され、後でファイルを読み込むことができます。現在は最大100MBまでのファイルのアップロードのみサポートしています。

### Request

```
POST /api/<namespace>/<db>/<tbl>/upload
```
### パラメータ

* `<namespace>`

    Namespace、現在は `default_cluster` のみサポート
        
* `<db>`

    データベースを指定
    
* `<tbl>`

    テーブルを指定

### クエリパラメータ

* `column_separator`

    オプション、ファイルの列区切り文字を指定。デフォルトは `\t`
    
* `preview`

    オプション、`true` に設定すると、`column_separator` に従って分割された最大10行のデータ行が返却結果に表示されます。

### リクエストボディ

アップロードするファイルの内容、Content-typeは `multipart/form-data`

### レスポンス

```
{
	"msg": "success",
	"code": 0,
	"data": {
        "id": 1,
        "uuid": "b87824a4-f6fd-42c9-b9f1-c6d68c5964c2",
        "originFileName": "data.txt",
        "fileSize": 102400,
        "absPath": "/path/to/file/data.txt"
        "maxColNum" : 5
	},
	"count": 1
}
```
## アップロードされたファイルを読み込む

### リクエスト

```
PUT /api/<namespace>/<db>/<tbl>/upload
```
### パスパラメータ

* `<namespace>`

    ネームスペース、現在は `default_cluster` のみサポート
    
* `<db>`

    データベースを指定
    
* `<tbl>`

    テーブルを指定

### クエリパラメータ

* `file_id`

    ロードファイルIDを指定。これはファイルをアップロードするAPIによって返される。

* `file_uuid`

    ファイルuuidを指定。これはファイルをアップロードするAPIによって返される。
    
### Header

headerのオプションは、Stream Loadリクエストのheaderのものと同じです。

### リクエストボディ

なし

### レスポンス

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"TxnId": 7009,
		"Label": "9dbdfb0a-120b-47a2-b078-4531498727cb",
		"Status": "Success",
		"Message": "OK",
		"NumberTotalRows": 3,
		"NumberLoadedRows": 3,
		"NumberFilteredRows": 0,
		"NumberUnselectedRows": 0,
		"LoadBytes": 12,
		"LoadTimeMs": 71,
		"BeginTxnTimeMs": 0,
		"StreamLoadPutTimeMs": 1,
		"ReadDataTimeMs": 0,
		"WriteDataTimeMs": 13,
		"CommitAndPublishTimeMs": 53
	},
	"count": 1
}
```
### 例

```
PUT /api/default_cluster/db1/tbl1/upload?file_id=1&file_uuid=b87824a4-f6fd-42c9-b9f1-c6d68c5964c2
```
