---
{
  "title": "ハードウェア情報アクション",
  "language": "ja",
  "description": "Hardware Info Actionは、現在のFEのハードウェア情報を取得するために使用されます。"
}
---
# Hardware Info Action

## リクエスト

```
GET /rest/v1/hardware_info/fe/
```
## 説明

Hardware Info Actionは、現在のFEのハードウェア情報を取得するために使用されます。

## パスパラメータ

なし

## クエリパラメータ

なし

## リクエストボディ

なし

## レスポンス

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"VersionInfo": {
			"Git": "git://host/core@5bc28f4c36c20c7b424792df662fc988436e679e",
			"Version": "trunk",
			"BuildInfo": "cmy@192.168.1",
			"BuildTime": "Tuesday, 05 September 2019 11:07:42 CST"
		},
		"HardwareInfo": {
			"NetworkParameter": "...",
			"Processor": "...",
			"OS": "...",
			"Memory": "...",
			"FileSystem": "...",
			"NetworkInterface": "...",
			"Processes": "...",
			"Disk": "..."
		}
	},
	"count": 0
}
```
* `HardwareInfo`フィールドの各値の内容は、すべてhtml形式で表示されるハードウェア情報テキストです。
