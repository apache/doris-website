---
{
    "title": "查询 tablet 信息",
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

`GET /tablets_json?limit={int}`

## Description

获取特定 BE 节点上指定数量的 tablet 的 tablet id 和 schema hash 信息

## Query parameters

* `limit`
    返回的 tablet 数量，选填，默认 1000 个，可填`all`返回全部 tablet。

## Request body

无

## Response

    ```json
    {
        msg: "OK",
        code: 0,
        data: {
            host: "10.38.157.107",
            tablets: [
                {
                    tablet_id: 11119,
                    schema_hash: 714349777
                },

                    ...

                {
                    tablet_id: 11063,
                    schema_hash: 714349777
                }
            ]
        },
        count: 30
    }
    ```
## 示例


    ```shell
    curl http://127.0.0.1:8040/api/tablets_json?limit=123

    ```

