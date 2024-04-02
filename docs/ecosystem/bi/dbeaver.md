---
{
    "title": "DBeaver",
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

DBeaver is a cross-platform database tool for developers, database administrators, analysts and anyone who works with data.

Apache Doris is highly compatible with the MySQL protocol. You can use DBeaver's MySQL driver to connect to Apache Doris and query data in the internal catalog and external catalog.

## Preconditions

Dbeaver installed
You can visit https://dbeaver.io to download and install DBeaver

## Add data source

:::info Note
Currently verified using DBeaver version 24.0.0
:::

1. Start DBeaver

2. Click the plus sign (**+**) icon in the upper left corner of the DBeaver window, or select **Database > New Database Connection** in the menu bar to open the **Connect to a database** interface.
   
    ![add connection 1](/images/dbeaver1.png)

    ![add connection 2](/images/dbeaver2.png)

3. Select the MySQL driver

    In the **Select your database** window, select **MySQL**.

    ![chose driver](/images/dbeaver3.png)

4. Configure Doris connection

    In the **main** tab of the **Connection Settings** window, configure the following connection information:

  - Server Host: FE host IP address of the Doris cluster.
  - Port: FE query port of Doris cluster, such as 9030.
  - Database: The target database in the Doris cluster.
  - Username: The username used to log in to the Doris cluster, such as admin.
  - Password: User password used to log in to the Doris cluster.

   :::tip
   Database can be used to distinguish between internal catalog and external catalog. If only the Database name is filled in, the current data source will be connected to the internal catalog by default. If the format is catalog.db, the current data source will be connected to the catalog filled in Database by default, as shown in DBeaver The database tables are also database tables in the connected catalog, so you can use DBeaver's MySQL driver to create multiple Doris data sources to manage different Catalogs in Doris.
   :::

   :::info Note
   Managing the external catalog connected to Doris through the Database form of catalog.db requires Doris version 2.1.0 and above.
   :::

  - internal catalog
    ![connect internal catalog](/images/dbeaver4.png)
  - external catalog
    ![connect external catalog](/images/dbeaver5.png)

5. Test data source connection

   After filling in the connection information, click Test Connection in the lower left corner to verify the accuracy of the database connection information. DBeaver returns to the following dialog box to confirm the configuration of the connection information. Click OK to confirm that the configured connection information is correct. Then click Finish in the lower right corner to complete the connection configuration.
   ![test connection](/images/dbeaver6.png)

6. Connect to database

   After the database connection is established, you can see the created data source connection in the database connection navigation on the left, and you can connect and manage the database through DBeaver.
   ![create connection](/images/dbeaver7.png)

## Function support
- fully support
  - Visual viewing class
    - Databases
      - Tables
      - Views
    - Users
      - Administer
    - Session Manager
    - System Info
      - Session Variables
      - Global Variables
      - Engines
      - Charsets
      - User Priviages
      - Plugin
    - Operation class
      - SQL editor
      - SQL console
- basic support

    The basic support part means that you can click to view without error, but due to protocol compatibility issues, there may be incomplete display.

  - Visual viewing class
    - dash board
    - Users/user/properties
    - Session Status
    - Global Status
- not support

  The unsupported part means that when using DBeaver to manage Doris, errors may be reported when performing certain visual operations, or some visual operations are not verified.
  Such as visual creation of database tables, schema change, addition, deletion and modification of data, etc.
