---
{
    "title": "Compling on Windows",
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

# Compile on Windows 

This guide is about how to compile Doris source code on the Windows platform using Windows Subsystem for Linux (WSL). WSL allows you to run a Linux system on Windows to compile Doris.

## Prerequisites

1. Windows 10 version 2004 or higher (19041 or higher) or Windows 11

## Compilation steps

### Install WSL2

Refer to the official Microsoft [WSL installation documentation](https://learn.microsoft.com/en-us/windows/wsl/install) for detailed instructions.

### Compile Doris

Once you have WSL2 up and running, you can choose any of the available compilation methods for Doris on Linux:

- [Compile with LDB Toolchain (Recommended)](https://selectdb.feishu.cn/wiki/IjA4w6tXZibnAXkyWTqcVzScn7b)
- [Docker Deployment (Recommended)](https://selectdb.feishu.cn/wiki/P2riwmN8hiqcfukBt1Pc4AKXnXc)

## Note

By default, the data storage drive of WSL2 distribution is the C drive. If needed, you can switch the storage drive in advance to avoid filling up the system drive.
