---
{
    "title": "BE 探活",
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



## 请求路径

`GET /api/health`

## 描述

给监控服务提供的探活接口，请求能响应代表 BE 状态正常。

## 请求参数
无    

## 请求体
无

## 响应

    ```json
    {"status": "OK","msg": ""}
    ```

## 示例


    ```shell
    curl http://127.0.0.1:8040/api/health
    ```

