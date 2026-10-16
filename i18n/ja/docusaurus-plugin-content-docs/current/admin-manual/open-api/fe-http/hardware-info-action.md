---
{
    "title": "ハードウェア情報の取得（Hardware Info Action）",
    "language": "ja",
    "description": "Hardware Info Action は現在の FE のハードウェア情報を取得するために使用します。"
}
---

# ハードウェア情報の取得（Hardware Info Action）

## リクエスト

```
GET /rest/v1/hardware_info/fe/
```

## 説明

Hardware Info Action は現在の FE のハードウェア情報を取得するために使用します。

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

* `HardwareInfo` フィールドの各値には、HTML 形式で表示されるハードウェア情報のテキストが格納されます。
