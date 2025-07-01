---
{
    "title": "Cancel Load Action",
    "language": "zh-CN"
}
---

# Cancel Load Action

## Request

`POST /api/<db>/_cancel`

## Description

用于取消掉指定label的导入任务。
执行完成后，会以Json格式返回这次导入的相关内容。当前包括以下字段
    Status: 是否成功cancel
        Success: 成功cancel事务
        其他: cancel失败
    Message: 具体的失败信息
    
## Path parameters

* `<db>`

    指定数据库名称

## Query parameters

* `<label>`

    指定导入label

## Request body

无

## Response

* 取消成功

    ```
    {
    	"msg": "OK",
    	"code": 0,
    	"data": null,
    	"count": 0
    }
    ```

* 取消失败

    ```
    {
    	"msg": "Error msg...",
    	"code": 1,
    	"data": null,
    	"count": 0
    }
    ```
    
## Examples

1. 取消指定label的导入事务

    ```
    POST /api/example_db/_cancel?label=my_label1

    Response:
    {
    	"msg": "OK",
    	"code": 0,
    	"data": null,
    	"count": 0
    }
    ```
    




