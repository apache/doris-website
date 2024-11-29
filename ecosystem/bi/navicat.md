---
{
    "title": "Navicat",
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

## Introduction

Navicat is a powerful database management tool that supports many major database systems, including MySQL, MariaDB, SQL Server, PostgreSQL, and Apache Doris. It provides intuitive user interface and rich functions to make database management, development and maintenance more efficient and convenient.

Apache Doris is highly compatible with the MySQL protocol, and you can use Navicat's MySQL connection method to connect to Apache Doris and query data in the internal and external catalog.

## Add data source

:::info Note
Currently verified using Navicat Premium version 15.0.25
:::

1. Start Navicat
2. In the upper left corner of the Navicat window, click the Connection icon, and select MySQL from the database connection options displayed.

   ![add connection 1](/images/bi-navicat-en-1.png)

3. Configure Doris connection information and test connection

   In the **main** tab of the **Connection Settings** window, configure the following connection information:

 - Connection Name: indicates the connection name of the current connection.
 - Host: indicates the IP address of the FE host in the Doris cluster.
 - Port: indicates the FE query port of the Doris cluster.
 - User name: The username used to log in to the Doris cluster.
 - Password: User password used to log in to the Doris cluster.

  Fill in the corresponding Doris connection information and click the test connection. If the information is correct and the network is connected, it will indicate that the connection is successful.

  ![test connection](/images/bi-navicat-en-2.png)

4. Connect  database

   After the database connection is established, you can see the created data source connection in the left database connection navigation, and you can click on the new query connection through Navicat to manage the database.

   ![new query](/images/bi-navicat-en-3.png)
