---
{
    "title": "Login Action",
    "language": "zh-CN",
    "description": "用于登录服务。"
}
---

## Request

`POST /rest/v1/login`

## Description

用于登录服务。
    
## Path parameters

无

## Query parameters

无

## Request body

无

## Response

* 登录成功

    ```
    {
    	"msg": "Login success!",
    	"code": 200
    }
    ```

* 登录失败

    ```
    {
    	"msg": "Error msg...",
    	"code": xxx,
    	"data": "Error data...",
    	"count": 0
    }
    ```

