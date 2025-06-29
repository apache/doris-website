---
{
  "title": "CloudDM",
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

## introduce

CloudDM is a cross platform database tool developed by ClouGence, suitable for both relational and NoSQL databases.

CloudDM has adapted Apache Doris by adding Doris data sources for data queries and other operations.

## Preconditions

CloudDM installed
Can access https://www.clougence.com/clouddm-personal Download and install CloudDM

## Add data source

:::info Note
The current verification is using CloudDM 3.0.1 version
:::

1. Start CloudDM
2. After clicking on the Data Source Management button above CloudDM, click on the (**+新增数据源 **) icon

   ![add database](/images/clouddm1.png)

3. Configure Doris connection

   On the New Data Source page, select Doris Data Source to configure the following connection information:

   - Client地址：The FE host address of Doris cluster, such as 192.0.0.1:9030.
   - 账号：The username used to log in to the Doris cluster, such as admin.
   - 密码：The user password used to log in to the Doris cluster.
     ![configure connections](/images/clouddm2.png)

4. add data source
   After filling in the connection information, click on "Add Data Source" below. If CloudDM redirects to the following page, 
   the addition is successful. Then click to view the data source and jump to the data query page.
   ![add data source](/images/clouddm3.png)


5. Using database

   After establishing the database connection, you can see the created data source connection in the left
    database connection navigation, and you can connect and manage the database through CloudDM.


   ![query data](/images/clouddm4.png)

## Functional support

- Fully support
    - Visual viewing
        - Databases
            - Tables
            - Views
            - Functions
    - Operational
        - SQL console
        - Visualize the creation of tables
        - Visualize the modification of table structure
        - Visualize the creation Schema
        - Visual addition, deletion, modification, and search

- Not Supported

  Not supporting some means that using CloudDM to manage Doris for certain visualization operations may result in errors, or some visualization operations may not be validated
  Such as adding, deleting, modifying, and querying unverified data types, system information, etc
