---
{
   "title": "FineBI",
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

## FineBI Introduction

As a business intelligence product, FineBI has a system architecture of data processing, real-time analysis, multidimensional analysis Dashboard and other functions. FineBI supports rich data source connection and analysis and management of tables with multiple views. FineBI can successfully support the modeling and visualization of internal and external data of Apache Doris.

## Precondition

Install FineBI 5.0 or later, Download link: https://intl.finebi.com/

## Login and Connection

1. Create  account and  log in FineBI

   ![login page](/images/bi-finebi-en-1.png)

2. Select the Built-in database, If you need to select an external database configuration, the documentation is available：https://help.fanruan.com/finebi-en/doc-view-4437.html

   :::info Note
   It is recommended to select the built-in database as the information repository of FineBI. The database type selected here is not the target database for querying and analyzing data, but the database for storing and maintaining FineBI model, dashboard and other information. FineBI needs to add, delete, modify and check it.
   :::

   ![select database](/images/bi-finebi-en-2.png)

3. Click the Management System button and select the database connection management in Data Connections to create a new database connection.

   ![data connection](/images/bi-finebi-en-3.png)

4. On the new database connection page, select MySQL database

   ![select connection](/images/bi-finebi-en-4.png)

5. Fill in the link information of the Doris database

    - Parameters are described as follows：

        - Username：The username for logging into Doris。

        - Password：Password of the current user。

        - Host：IP address of the FE host in the Doris cluster。

        - Port：FE query port of the Doris cluster。

        - Coding：Encoding format of the Doris cluster。

        - Name Database：Target database in Doris cluster。

   ![connection information](/images/bi-finebi-en-5-1.png)

6. Click the test link. Connection succeeded is displayed when the connection information is correct

   ![connection test](/images/bi-finebi-en-6.png)

## Create  model

1. In the "Public Data" section, click to create a new dataset. Then click the database table

   ![new dataset](/images/bi-finebi-en-7.png)

2. You need to import tables in the existing database connection

   ![select table](/images/bi-finebi-en-8-2.png)

3. You need to refresh each imported table after importing the table. You can analyze the table in the topic only after refreshing the table

   ![refresh table](/images/bi-finebi-en-9.png)

4. Add the imported public data to the edited topic, and then conduct compass analysis and configuration according to business logic.

   ![data analysis](/images/bi-finebi-en-10.png)