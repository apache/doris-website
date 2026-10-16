---
{
    "title": "システム情報の取得（System Action）",
    "language": "ja",
    "description": "System Action は Doris に組み込まれた Proc システムの情報を取得するために使用します。"
}
---

# システム情報の取得（System Action）

## リクエスト

```
GET /rest/v1/system
```

## 説明

System Action は Doris に組み込まれた Proc システムの情報を取得するために使用します。
    
## パスパラメータ

なし

## クエリパラメータ

* `path`

    省略可能なパラメータです。Proc のパスを指定します。

## リクエストボディ

なし

## レスポンス
    
`/dbs/10003/10054/partitions/10053/10055` を例に示します。
    
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
    
data 内の `column_names` は列見出しの情報で、`href_columns` は表内でハイパーリンクになっている列を示します。`rows` 配列の各要素は表の行を表します。`__hrefPaths` は表のデータではなく、`href_columns` の各列に順番に対応するリンク URL です。
