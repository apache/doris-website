---
{
    "title": "セッションアクション",
    "language": "ja",
    "description": "セッションアクションは、現在のセッション情報を取得するために使用します。"
}
---

# セッションアクション

## リクエスト

`GET /rest/v1/session`

`GET /rest/v1/session/all`

## 説明

セッションアクションは、現在のセッション情報を取得するために使用します。
    
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

## すべての FE のセッション情報の取得

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
    
返される結果は `System Action` と同じです。これは表の説明です。
