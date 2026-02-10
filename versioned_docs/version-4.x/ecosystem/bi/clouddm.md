---
{
    "title": "CloudDM",
    "language": "en",
    "description": "CloudDM, developed by Clougence, is a powerful cross-platform database management tool designed for both teams and individual users."
}
---

## Introduction
CloudDM, developed by Clougence, is a powerful cross-platform database management tool designed for both teams and individual users.

It provides dedicated support for key features of Apache Doris, offering capabilities such as data access, data masking, visual editing, and database CI/CD workflows.

## Preconditions
Install CloudDM. You can download and install CloudDM from https://www.cdmgr.com/.

## Add data source

:::info Note
CloudDM version should be 2.8.0.0 or above.
:::

1. Log in to CloudDM.
2. Click **DataSources** > **Add DataSources**.
3. Select **Doris** for the Type.

   ![add datasource](/images/clouddm1-en.png)

4. Enter the following required information to connect to the Doris instance. 
   - Client Address: The FE query port of the Doris cluster, for example: hostID:9030. 
   - Account: Username used to log in to the Doris cluster, for example: admin. 
   - Password: Password used to log in to the Doris cluster.

  :::tip
  CloudDM can manage both internal catalogs and external catalogs in Doris.
  :::

  :::info Note
  Managing the external catalog connected to Doris through the Database form of catalog.db requires Doris version 2.1.0 and above.
  :::

5. Click **Query Settings** in the top navigation bar. Then enable **Data Management**. 

   ![enable data manage](/images/clouddm2-en.png)

6. Access data.     
   In the database connection navigation panel on the left, you can view the added Doris connection. Then you can start to manage the data through **CloudDM**.

   ![connect to data source](/images/clouddm3-en.png)

## Function support
- Query Client
  - Visually manage database objects in Doris
  - Write and execute SQL in the console
  - Export query results

- Team Collaboration
  - Statement-level authorization with table-level granularity
  - Workflow and approval for SQL requests
  - Database CI/CD
  - Data masking for sensitive information
  - SQL review rules