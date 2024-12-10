---
{
    "title": "Cancel Load Action",
    "language": "zh-CN"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->



## Request

`POST /api/<db>/_cancel`

## Description

用于取消掉指定 label 的导入任务。
执行完成后，会以 Json 格式返回这次导入的相关内容。当前包括以下字段
    Status: 是否成功 cancel
        Success: 成功 cancel 事务
        其他：cancel 失败
    Message: 具体的失败信息
    
## Path parameters

* `<db>`

    指定数据库名称

## Query parameters

* `<label>`

    指定导入 label

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
    
## 示例

1. 取消指定 label 的导入事务

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
    




