---
{
    "title": "Get Load State",
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

`GET /api/<db>/get_load_state`

## Description

返回指定 label 的导入事务的状态
执行完毕后，会以 Json 格式返回这次导入的相关内容。当前包括以下字段：
	Label：本次导入的 label，如果没有指定，则为一个 uuid
	Status：此命令是否成功执行，Success 表示成功执行
	Message：具体的执行信息
	State: 只有在 Status 为 Success 时才有意义
		UNKNOWN: 没有找到对应的 Label
		PREPARE: 对应的事务已经 prepare，但尚未提交
		COMMITTED: 事务已经提交，不能被 cancel
		VISIBLE: 事务提交，并且数据可见，不能被 cancel
		ABORTED: 事务已经被 ROLLBACK，导入已经失败
    
## Path parameters

* `<db>`

    指定数据库

## Query parameters

* `label`

    指定导入 label

## Request body

无

## Response

```
{
	"msg": "success",
	"code": 0,
	"data": "VISIBLE",
	"count": 0
}
```

如 label 不存在，则返回：

```
{
	"msg": "success",
	"code": 0,
	"data": "UNKNOWN",
	"count": 0
}
```
    
## 示例

1. 获取指定 label 的导入事务的状态。

    ```
    GET /api/example_db/get_load_state?label=my_label
    
    {
    	"msg": "success",
    	"code": 0,
    	"data": "VISIBLE",
    	"count": 0
    }
    ```
