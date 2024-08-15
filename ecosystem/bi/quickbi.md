---
{
"title": "Quick BI",
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
Quick BI is a data warehouse-based business intelligence tool that helps enterprises set up impressive visual analyses quickly. Quick BI supports a variety of data sources, including databases like MySQL, Oracle, SQL Server, and Apache Doris, as well as file formats such as Excel, CSV, and JSON. It offers a wealth of visualization components, such as tables, charts, and maps, allowing users to easily achieve data visualization through simple drag-and-drop operations.

## Data connection and application
1. Login Quick BI and create a workspace.
2. Click Data Source under the current workspace.

   ![create workspace](/images/bi-quickbi-en-1.png)

3. Select Apache Doris in the already created data source and fill in the corresponding Apache Doris connection information.

   ![Doris information](/images/bi-quickbi-en-2.png)

4. Once the connection is successful, you can see the data source we created in the data source list.

   ![data source](/images/bi-quickbi-en-3.png)

5. Create a dataset in the data source we created, using the TPC-H dataset as an example. After the dataset is created, you can set the corresponding report.

   ![Doris table](/images/bi-quickbi-en-4.png)
