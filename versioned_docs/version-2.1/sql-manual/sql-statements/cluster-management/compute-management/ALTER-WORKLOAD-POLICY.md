---
{
"title": "ALTER WORKLOAD POLICY",
"language": "en"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements. See the NOTICE file
distributed with this work for additional information
regarding copyright ownership. The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied. See the License for the
specific language governing permissions and limitations
under the License.
-->



## 描述（Description）

修改一个 Workload Group 的属性，目前只支持修改属性，不支持修改 action 和 condition。

## 语法（Syntax）

```SQL
ALTER WORKLOAD POLICY <workload_policy_name> PROPERTIES( <properties> )
```

## 必选参数（Required Parameters）

**<workload_policy_name>**

Workload Policy 的 name

**<properties>**

1. enabled，取值为 true 或 false，默认值为 true，表示当前 policy 处于启用状态，false 表示当前 policy 处于禁用状态。
2.  priority，取值范围为 0 到 100 的正整数，默认值为 0，代表 policy 的优先级，该值越大，优先级越高。这个属性的主要作用是，当匹配到多个 policy 时，选择优先级最高的 policy。
3. workload_group，目前一个 policy 可以绑定一个 workload group，代表这个 policy 只对某个 workload group 生效。默认为空，代表对所有查询生效。

## 权限控制（Access Control Requirements）

至少具有`ADMIN_PRIV`权限

## 示例（Examples）

1. 禁用一个 Workload Policy

```Java
alter workload policy cancel_big_query properties('enabled'='false')
```