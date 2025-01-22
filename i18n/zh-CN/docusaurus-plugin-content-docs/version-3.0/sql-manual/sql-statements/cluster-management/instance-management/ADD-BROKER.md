---
{
    "title": "ADD BROKER",
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




## 描述

该语句用于添加一个或者多个 BROKER 节点。

## 语法

```sql
ALTER SYSTEM ADD BROKER <broker_name> "<host>:<ipc_port>" [,"<host>:<ipc_port>" [, ...] ];
```

## 必选参数
**1. \<broker_name\>**

给添加的 `broker` 进程起的名字。同一个集群中的 broker_name 建议保持一致。

**2. \<host\>**

需要添加的 `broker` 进程所在节点的 `IP` ，如果启用了 `FQDN`，则使用该节点的 `FQDN`。

**3. \<ipc_port\>**

需要添加的 `broker` 进程所在节点的 `PORT` ，该端口默认值为 `8000`。

## 输出字段
无

## 权限控制
执行该操作的用户需要具备 `NODE_PRIV` 的权限。

## 示例

1. 增加两个 Broker

```sql
ALTER SYSTEM ADD BROKER "host1:port", "host2:port";
```
2. 增加一个 Broker，使用 FQDN

```sql
ALTER SYSTEM ADD BROKER "broker_fqdn1:port";
```


