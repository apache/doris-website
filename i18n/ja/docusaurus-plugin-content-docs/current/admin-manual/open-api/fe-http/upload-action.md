---
{
    "title": "アップロードアクション",
    "language": "ja",
    "description": "Upload Action は現在、主に FE のフロントエンドページで使用され、ユーザーが小さなテストファイルをロードするための機能です。"
}
---

# アップロードアクション

:::caution 動作変更（4.1.4）

セキュリティ上の理由により、バージョン **4.1.4** 以降、Upload Action のすべての HTTP エンドポイント（`/api/<namespace>/<db>/<tbl>/upload`、`/api/<namespace>/<db>/<tbl>/upload/load`、`/api/<namespace>/<db>/<tbl>/upload/delete`）は削除されました。これらを呼び出すと 404 が返されます。FE の設定項目 `http_load_submitter_max_worker_threads` も削除されました。

小さなファイルをロードするには、代わりに [Stream Load](../../../data-operate/import/import-way/stream-load-manual) または [INSERT INTO ... SELECT ... FROM S3/HDFS/LOCAL TVF](../../../sql-manual/sql-functions/table-valued-functions/s3) を使用してください。

このドキュメントには、バージョン 4.1.4 より前のエンドポイントのリファレンスを残しています。

:::

Upload Action は現在、主に FE のフロントエンドページで使用され、ユーザーが小さなテストファイルをロードするための機能です。

## ロードするファイルのアップロード

後でロードするファイルを FE ノードにアップロードします。現在、アップロードできるファイルのサイズは最大 100MB です。

### リクエスト

```
POST /api/<namespace>/<db>/<tbl>/upload
```
    
### パスパラメータ

* `<namespace>`

    名前空間。現在は `default_cluster` のみをサポートします。
        
* `<db>`

    データベースを指定します。
    
* `<tbl>`

    テーブルを指定します。

### クエリパラメータ

* `column_separator`

    省略可能です。ファイルの列区切り文字を指定します。デフォルトは `\t` です。
    
* `preview`

    省略可能です。`true` に設定すると、返される結果には `column_separator` に従って分割されたデータ行が最大 10 行表示されます。

### リクエストボディ

アップロードするファイルの内容を指定します。Content-type は `multipart/form-data` です。

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
        "absPath": "/path/to/file/data.txt",
        "maxColNum" : 5
	},
	"count": 1
}
```

## アップロードしたファイルのロード

### リクエスト

```
PUT /api/<namespace>/<db>/<tbl>/upload
```
    
### パスパラメータ

* `<namespace>`

    名前空間。現在は `default_cluster` のみをサポートします。
    
* `<db>`

    データベースを指定します。
    
* `<tbl>`

    テーブルを指定します。

### クエリパラメータ

* `file_id`

    アップロード API から返されたロード対象ファイルの ID を指定します。

* `file_uuid`

    アップロード API から返されたファイルの UUID を指定します。
    
### ヘッダー

ヘッダーで指定できるオプションは、Stream Load リクエストのヘッダーと同じです。

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
