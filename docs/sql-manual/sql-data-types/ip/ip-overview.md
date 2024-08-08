---
{
    "title": "Overview",
    "language": "en"
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



IP data types store IP addresses in a binary format, which is faster and more space-efficient for querying compared to storing them as strings. There are two supported IP data types:

- **[IPv4](../ip/IPV4.md)**: It stores IPv4 addresses as a 4-byte binary value. It is used in conjunction with the `ipv4_*` family of functions.
- **[IPv6](../ip/IPV6.md)**: It stores IPv6 addresses as a 16-byte binary value. It is used in conjunction with the `ipv6_*` family of functions.