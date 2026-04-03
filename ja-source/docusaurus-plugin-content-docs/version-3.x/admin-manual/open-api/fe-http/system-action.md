---
{
  "title": "システムアクション",
  "language": "ja",
  "description": "System ActionはDorisに組み込まれたProcシステムに関する情報を取得するために使用されます。"
}
---
# System Action

## リクエスト

```
GET /rest/v1/system
```
## 説明

System ActionはDorisに組み込まれたProcシステムに関する情報の取得に使用されます。

## パスパラメータ

なし

## クエリパラメータ

* `path`

    オプションパラメータ、procのパスを指定

## リクエストボディ

なし

## レスポンス

`/dbs/10003/10054/partitions/10053/10055`を例とします：

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"href_columns": ["TabletId", "MetaUrl", "CompactionStatus"],
		"column_names": ["TabletId", "ReplicaId", "BackendId", "SchemaHash", "Version", "VersionHash", "LstSuccessVersion", "LstSuccessVersionHash", "LstFailedVersion", "LstFailedVersionHash", "LstFailedTime", "DataSize", "RowCount", "State", "LstConsistencyCheckTime", "CheckVersion", "CheckVersionHash", "VersionCount", "PathHash", "MetaUrl", "CompactionStatus"],
		"rows": [{
			"SchemaHash": "1294206575",
			"LstFailedTime": "\\N",
			"LstFailedVersion": "-1",
			"MetaUrl": "URL",
			"__hrefPaths": ["http://192.168.100.100:8030/rest/v1/system?path=/dbs/10003/10054/partitions/10053/10055/10056", "http://192.168.100.100:8043/api/meta/header/10056", "http://192.168.100.100:8043/api/compaction/show?tablet_id=10056"],
			"CheckVersionHash": "-1",
			"ReplicaId": "10057",
			"VersionHash": "4611804212003004639",
			"LstConsistencyCheckTime": "\\N",
			"LstSuccessVersionHash": "4611804212003004639",
			"CheckVersion": "-1",
			"Version": "6",
			"VersionCount": "2",
			"State": "NORMAL",
			"BackendId": "10032",
			"DataSize": "776",
			"LstFailedVersionHash": "0",
			"LstSuccessVersion": "6",
			"CompactionStatus": "URL",
			"TabletId": "10056",
			"PathHash": "-3259732870068082628",
			"RowCount": "21"
		}]
	},
	"count": 1
}
```
データ部分の`column_names`はヘッダー情報で、`href_columns`はテーブル内のどの列がハイパーリンク列かを示しています。`rows`配列の各要素は1行を表します。その中で、`__hrefPaths`はテーブルデータではなく、ハイパーリンク列のリンクURLであり、`href_columns`内の列と一対一で対応しています。
