---
{
  "title": "セッション操作",
  "language": "ja",
  "description": "Session Actionは現在のセッション情報を取得するために使用されます。"
}
---
# Session Action

## Request

`GET /rest/v1/session`

`GET /rest/v1/session/all`

## 説明

Session Actionは現在のセッション情報を取得するために使用されます。
    
## パスパラメータ

なし

## クエリパラメータ

なし

## リクエストボディ

なし

## 現在のセッション情報の取得

`GET /rest/v1/session`

## レスポンス

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"column_names": ["Id", "User", "Host", "Cluster", "Db", "Command", "Time", "State", "Info"],
		"rows": [{
			"User": "root",
			"Command": "Sleep",
			"State": "",
			"Cluster": "default_cluster",
			"Host": "10.81.85.89:31465",
			"Time": "230",
			"Id": "0",
			"Info": "",
			"Db": "db1"
		}]
	},
	"count": 2
}
```
## すべてのFEセッション情報を取得

`GET /rest/v1/session/all`

## レスポンス

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"column_names": ["FE", "Id", "User", "Host", "Cluster", "Db", "Command", "Time", "State", "Info"],
		"rows": [{
		    "FE": "10.14.170.23",
			"User": "root",
			"Command": "Sleep",
			"State": "",
			"Cluster": "default_cluster",
			"Host": "10.81.85.89:31465",
			"Time": "230",
			"Id": "0",
			"Info": "",
			"Db": "db1"
		},
		{
            "FE": "10.14.170.24",
			"User": "root",
			"Command": "Sleep",
			"State": "",
			"Cluster": "default_cluster",
			"Host": "10.81.85.88:61465",
			"Time": "460",
			"Id": "1",
			"Info": "",
			"Db": "db1"
		}]
	},
	"count": 2
}
```
返される結果は`System Action`と同じです。テーブルの説明です。
