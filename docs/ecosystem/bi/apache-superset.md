---
{
"title": "Apache Superset",
"language": "en"
}
---

## Introduction
Apache Superset is an open-source data exploration platform. It supports a rich variety of data source connections and numerous visualization methods. It also enables fine-grained access control for users. The main features of this tool include self-service analysis, customizable dashboards, visualization of analytical results (with export functionality), and user/role permission control. Moreover, it integrates an SQL editor for conducting SQL editing and queries.

In Apache Superset version 3.1 official support has been introduced for querying and visualizing both internal and external data from Apache Doris.
## Preconditions
Ensure you have completed the following tool installations:
1. Install the Python client for Apache Doris on the Apache Superset server.
   pip install pydoris
2. Install Apache Superset version 3.1 or above. For detailed instructions, refer to [Installing Superset from PyPI](https://superset.apache.org/docs/installation/installing-superset-from-pypi/) or [Installing Superset Locally Using Docker Compose](https://hub.docker.com/r/apache/superset).
## Add data source
1. You can access Superset by visiting the corresponding startup port.

   ![login page](/images/bi-superset-en-1.png)

2. Select the "Add Database Connection" option after logging into Superset.

   ![add databases](/images/bi-superset-en-2.png)

3. In the connection page, select the "Apache Doris" option.

   ![select databases](/images/bi-superset-en-3.png)

4. Fill in the SQLAlchemy URI information in the connection details and proceed with the relevant connectivity verification.

   ![test connection](/images/bi-superset-en-4.png)

When creating a data source in Apache Superset, please pay attention to the following two points:
- Choose Apache Doris as the data source in SUPPORTED DATABASES.
- In the SQLAlchemy URI, fill in the URI following the Apache Doris SQLAlchemy URI format as shown below.

  ```doris://<User>:<Password>@<Host>:<Port>/<Catalog>.<Database>```
- URI parameters are explained as follows:
  - User: The username for logging into the Apache Doris cluster, e.g., admin.
  - Password: The password for logging into the Apache Doris cluster.
  - Host: The IP address of the FE (Frontend) host in the Apache Doris cluster.
  - Port: The query port of the FE in the Apache Doris cluster, e.g. 9030.
  - Catalog: The target Catalog in the Apache Doris cluster. Both Internal Catalog and External Catalog are supported.
  - Database: The target database in the Apache Doris cluster. Both internal and external databases are supported.


:::tip
1. When deploying Apache Superset using the latest Docker image, if you encounter the issue of not finding the Apache Doris data source, it may be because the default [Apache Superset Docker image](https://hub.docker.com/r/apache/superset) includes only basic data source builds. You need to manually install the pydoris package. You can refer to the 'How to extend this image' section in the Apache Superset Docker tutorial for the deployment steps of Apache Superset.
2. It is recommended to use Apache Doris 2.0.4 and above.
:::
