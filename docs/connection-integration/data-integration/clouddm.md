---
{
    "title": "CloudDM",
    "language": "en",
    "description": "Use CloudDM to connect to Apache Doris and manage Doris data sources, with support for data access, masking, visual editing, and database CI/CD."
}
---

## Overview

<!-- Knowledge type: Scenario description -->
<!-- Applicable scenario: Use CloudDM to connect to and manage Apache Doris data sources -->

CloudDM, developed by Clougence, is a cross-platform database tool for teams and individual users. It helps users perform database changes and management securely, efficiently, and in compliance with regulations.

In Apache Doris scenarios, CloudDM provides dedicated adaptations for Doris features, supporting data access, data masking, visual editing, and database CI/CD. After reading this article, you can complete the following tasks:

- Add a Doris data source in CloudDM.
- Enable data management for a Doris instance and test the connection.
- Use CloudDM to access and manage Doris data.

## Preparation

<!-- Knowledge type: Prerequisites -->
<!-- Applicable scenario: Check the CloudDM installation and verify the version before connecting to Doris -->

| Item | Requirement |
|-------|------|
| CloudDM | CloudDM is installed. You can visit the [CloudDM official website](https://www.cdmgr.com/) to download and install it. |
| Verified version | This article is verified with CloudDM 2.8.0.0. |

## Connect to a Doris data source

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Create a Doris data source connection in CloudDM -->

### 1. Add a Doris data source

1. Log in to CloudDM.
2. In the navigation bar, click **Data Source Management** > **Add Data Source**.
3. Select the Doris data source.

![Add a data source](/images/next/connection-integration/data-integration/clouddm/clouddm1-en.png)

### 2. Configure connection information

On the add data source page, configure the following connection information:

| Item | Description |
|-------|------|
| Client address | The FE query port of the Doris cluster machine, for example, `hostID:9030`. |
| Account | The username used to log in to the Doris cluster, for example, `admin`. |
| Password | The password of the user used to log in to the Doris cluster. |

:::tip
Doris is divided into `internal catalog` and `external catalog`, and CloudDM can manage both of them at the same time.
:::

:::info Note
To manage the Doris `external catalog` in the form of `catalog.db` databases, the Doris version must be 2.1.0 or later.
:::

### 3. Enable data management and test the connection

At the top, click **Query Settings** > **Query Configuration** to enable data management for the Doris instance and test the connection.

![Enable the data source](/images/next/connection-integration/data-integration/clouddm/clouddm2-en.png)

### 4. Access Doris data

After the database connection is established, you can see the connected data source in the database connection navigation on the left, and connect to and manage the database through CloudDM.

![Establish the connection](/images/next/connection-integration/data-integration/clouddm/clouddm3-en.png)

## Supported Doris management scenarios

<!-- Knowledge type: Feature support -->
<!-- Applicable scenario: Understand which Doris management capabilities CloudDM supports -->

CloudDM supports the following two categories of Doris features:

| Scenario | Supported capabilities |
|---------|---------|
| Query client | Visually manage database objects in Doris; write SQL in the console to operate Doris; export query results. |
| Team usage | Statement-level authorization down to the table level; ticket approval; database CI/CD; sensitive data masking; SQL review rules. |
