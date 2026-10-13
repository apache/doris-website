---
{
    "title": "ログインアクション",
    "language": "ja",
    "description": "サービスにログインします。"
}
---

# ログインアクション

## リクエスト

`POST /rest/v1/login`

## 説明

サービスにログインします。
    
## パスパラメータ

なし

## クエリパラメータ

なし

## リクエストボディ

なし

## レスポンス

* ログイン成功

    ```
    {
    	"msg": "Login success!",
    	"code": 200
    }
    ```

* ログイン失敗

    ```
    {
    	"msg": "Error msg...",
    	"code": xxx,
    	"data": "Error data...",
    	"count": 0
    }
    ```
