---
{
   "title": "Power BI",
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

## Power BI Introduction

Power BI is a collection of software services and application connectors that can connect to multiple data sources, including Excel, SQL Server, Azure, Google Analytics, etc., so that users can easily consolidate and clean their data. With Power BI's data modeling, users can create relational models, data analysis expressions, and data relationships to support advanced data analysis and visualization. Power BI offers a wealth of visualization options, including ICONS, maps, dashboards, and custom visualization tools to help users make a more intuitive sense of data.

Apache Doris is highly compatible with MySQL protocol and can be connected to Power BI and Apache Doris through MySQL Driver. At present, internal data modeling, data query and visualization processing of Apache Doris have been officially supported in Power BI.

## Precondition

If you do not have Power BI desktop installed, you can download it from https://www.microsoft.com/en-us/power-platform/products/power-bi/desktop

## Connector configuration of Power BI and Doris
:::info Note
Currently verified using MySQL JDBC Connector version 8.0.26
:::

Download and installation MySQL Connector
Download link: https://downloads.mysql.com/archives/c-net/. Select version 8.0.26. There are incompatibilities in higher versions


## Load data locally and create models

1. Start the Power BI Desktop
2. Open the Power BI Desktop screen and click Create Report. If a local report exists, you can open it.

   ![start page](/images/powerbi/bi-powerbi-en-2.png)

3. Click get data. In the dialog box that is displayed, select MySQL database.

   ![get data](/images/powerbi/bi-powerbi-en-3.png)

4. Configure the database connection information and enter ip:port in the server text box. The default port number for Doris is 9030.

   ![connection information](/images/powerbi/bi-powerbi-en-4.png)

5. Click OK in the previous step and select "Database" in the new connection window to connect, and fill in the connection information of Doris in the username and password.

   ![uname and pwd](/images/powerbi/bi-powerbi-en-5.png)

6. Load the selected table to the Power BI Desktop

   ![load data](/images/powerbi/bi-powerbi-en-6.png)

7. Configure statistical compass

   ![create compass](/images/powerbi/bi-powerbi-en-7.png)

8. Save statistical compass to location

   ![save file](/images/powerbi/bi-powerbi-en-8.png)

## Set  data refresh automatic

1. Download the On-premises data gateway. Download address: https://learn.microsoft.com/en-us/power-bi/connect-data/service-gateway-personal-mode
2. Install the On-premises data gateway

   ![gateway install](/images/powerbi/bi-powerbi-en-9.png)

3. Log into Power BI Online and import the local model in your workspace

   ![upload](/images/powerbi/bi-powerbi-en-10-zh.png)

4. Click the model to set the automatic refresh time

   ![click module](/images/powerbi/bi-powerbi-en-11.png)

5. The data refresh configuration requires a gataway connection. After the gateway is enabled locally, you can see the  started gateway in the gateway connection locally. Select the local gateway. 

   ![config gateway](/images/powerbi/bi-powerbi-en-12.png)

6. Configure the refresh schedule to complete the automatic data refresh on Power BI

   ![make plan](/images/powerbi/bi-powerbi-en-13.png)

