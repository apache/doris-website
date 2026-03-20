---
{
  "title": "ヘルスアクション",
  "language": "ja",
  "description": "クラスター内で現在生存しているBEノード数と、ダウンしているBEノード数を返します。"
}
---
# Health Action

## Request

`GET /api/health`

## 詳細

クラスター内で現在生存しているBEノードの数と、ダウンしているBEノードの数を返します。

## Path parameters

なし

## Query parameters

なし

## Request body

なし

## Response

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
