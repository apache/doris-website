---
{
  "title": "ログインアクション",
  "language": "ja",
  "description": "サービスにログインするために使用されます。"
}
---
# Login Action

## Request

`POST /rest/v1/login`

## Description

サービスへのログインに使用します。
    
## Path parameters

なし

## Query parameters

なし

## Request body

なし

## Response

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
