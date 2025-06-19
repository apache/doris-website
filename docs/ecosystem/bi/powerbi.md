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

The Apache Doris community provides a Power BI DirectQuery custom connector based on MySQL ODBC, which supports Apache Doris's internal data modeling, data query, and visualization processing.

## Precondition

- If you don't have Power BI Desktop installed, you can visit [here](https://www.microsoft.com/zh-cn/power-platform/products/power-bi/desktop) to download and install Power BI.
- You need to obtain the [power-bi-doris](https://github.com/velodb/power-bi-doris/blob/master/Doris.mez) custom connector.
- If you don't have Mysql ODBC installed, you need to download and install [Mysql ODBC](https://downloads.mysql.com/archives/c-odbc/) and configure it.

:::info Note
Use MySQL ODBC Driver 5.3
:::

## Power BI and Doris custom connector configuration

1. Refer to the path here: `\Power BI Desktop\Custom Connectors folder`, place the `Doris.mez` custom connector file (if the path does not exist, create it manually as needed).
2. In Power BI Desktop, select `File` > `Options and settings` > `Options` > `Security`, under `Data Extensions`, check `(Not Recommended) Allow any extension to load without validation or warning`.
3. Select `ok` and restart Power BI Desktop.

## Load data locally and create models

1. Start the Power BI Desktop
2. Open the Power BI Desktop screen and click Create Report. If a local report exists, you can open it.

   ![start page](/images/powerbi/bi-powerbi-en-2.png)

3. Click Get Data and select the Doris database in the pop-up window.

   ![get data](/images/powerbi/bi-powerbi-en-3-new.png)

4. Configure the database connection information and enter host:port in the server input box. The default port number of Doris is 9030

   ![connection information](/images/powerbi/bi-powerbi-en-4-new.png)

5. After clicking OK in the previous step, fill in Doris’ connection information in the new connection window.

   ![uname and pwd](/images/powerbi/bi-powerbi-en-5-new.png)

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

