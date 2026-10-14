---
{
    "title": "バックエンド一覧の取得（Backends Action）",
    "language": "ja",
    "description": "Backends Action は、Backend の IP、PORT などの情報を含む Backend の一覧を返します。"
}
---

# バックエンド一覧の取得（Backends Action）

## リクエスト

```
GET /api/backends
```

## 説明

Backends Action は、Backend の IP、PORT などの情報を含む Backend の一覧を返します。

## パスパラメータ

なし

## クエリパラメータ

* `is_alive`

    省略可能です。稼働中の BE ノードのみを返すかどうかを指定します。デフォルトは false で、すべての BE ノードを返します。

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
