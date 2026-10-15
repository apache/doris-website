---
{
    "title": "ヘルスチェック（Health Action）",
    "language": "ja",
    "description": "クラスター内で現在稼働している BE ノードの数と、停止している BE ノードの数を返します。"
}
---

# ヘルスチェック（Health Action）

## リクエスト

`GET /api/health`

## 説明

クラスター内で現在稼働している BE ノードの数と、停止している BE ノードの数を返します。
    
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
