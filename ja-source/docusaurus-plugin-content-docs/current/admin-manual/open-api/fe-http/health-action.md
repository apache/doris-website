---
{
  "title": "ヘルスアクション",
  "language": "ja",
  "description": "クラスター内で現在稼働しているBEノード数と停止しているBEノード数を返します。"
}
---
# Health Action

## リクエスト

`GET /api/health`

## 説明

クラスター内で現在生存しているBEノードの数と、ダウンしているBEノードの数を返します。

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
		"online_backend_num": 10,
		"total_backend_num": 10
	},
	"count": 0
}
```
