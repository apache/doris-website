---
{
  "title": "バックエンドアクション",
  "language": "ja",
  "description": "Backends Actionは、BackendのIP、PORT、その他の情報を含むBackendsリストを返します。"
}
---
# Backends Action

## リクエスト

```
GET /api/backends
```
## 説明

Backends Actionは、BackendのIP、PORT、その他の情報を含むBackendsリストを返します。

## パスパラメータ

なし

## クエリパラメータ

* `is_alive`

    オプションパラメータ。生存しているBEノードを返すかどうか。デフォルトはfalseで、すべてのBEノードが返されることを意味します。

## リクエストボディ

なし

## レスポンス

```
{
    "msg": "success",
    "code": 0,
    "data": {
        "backends": [
            {
                "ip": "192.1.1.1",
                "http_port": 8040,
                "is_alive": true
            }
        ]
    },
    "count": 0
}
```
