---
{
    "title": "IP 类型概览",
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

IP 类型以二进制形式存储 IP 地址，比用字符串存储更省空间查询速度更快，支持 2 种类型：

1. [IPv4](../ip/IPV4.md)：以 4 字节二进制存储 IPv4 地址，配合 ipv4_* 系列函数使用。

2. [IPv6](../ip/IPV6.md)：以 16 字节二进制存储 IPv6 地址，配合 ipv6_* 系列函数使用。