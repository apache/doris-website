---
{
    "title": "CREATE CATALOG",
    "language": "en"
}
---

## Description

This statement is used to create an external catalog

## Syntax

```sql
CREATE CATALOG [IF NOT EXISTS] <catalog_name> [ COMMENT "<comment>"]
	PROPERTIES ("<key>"="<value>" [, ... ]);
```

## Required Parameters

**1. `<catalog_name>`**
The name of the catalog to be created.

**2. `"<key>"="<value>"`**
The parameters for creating the catalog.

## Optional Parameters

**1. `<comment>`**
The comment for the catalog to be created.

## Access Control Requirements
| Privilege   | Object  | Notes                                                                 |
|:------------|:--------|:----------------------------------------------------------------------|
| CREATE_PRIV | Catalog | The CREATE_PRIV permission for the corresponding catalog is required. |

## Examples

1. Create catalog hive

	```sql
	CREATE CATALOG hive comment 'hive catalog' PROPERTIES (
		'type'='hms',
		'hive.metastore.uris' = 'thrift://127.0.0.1:7004',
		'dfs.nameservices'='HANN',
		'dfs.ha.namenodes.HANN'='nn1,nn2',
		'dfs.namenode.rpc-address.HANN.nn1'='nn1_host:rpc_port',
		'dfs.namenode.rpc-address.HANN.nn2'='nn2_host:rpc_port',
		'dfs.client.failover.proxy.provider.HANN'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider'
	);
	```

2. Create catalog es

	```sql
	CREATE CATALOG es PROPERTIES (
		"type"="es",
		"hosts"="http://127.0.0.1:9200"
	);
	```

3. Create catalog jdbc

	**mysql**

	```sql
	CREATE CATALOG jdbc PROPERTIES (
		"type"="jdbc",
		"user"="root",
		"password"="123456",
		"jdbc_url" = "jdbc:mysql://127.0.0.1:3316/doris_test?useSSL=false",
		"driver_url" = "https://doris-community-test-1308700295.cos.ap-hongkong.myqcloud.com/jdbc_driver/mysql-connector-java-8.0.25.jar",
		"driver_class" = "com.mysql.cj.jdbc.Driver"
	);
	```

	**postgresql**

	```sql
	CREATE CATALOG jdbc PROPERTIES (
		"type"="jdbc",
		"user"="postgres",
		"password"="123456",
		"jdbc_url" = "jdbc:postgresql://127.0.0.1:5432/demo",
		"driver_url" = "file:///path/to/postgresql-42.5.1.jar",
		"driver_class" = "org.postgresql.Driver"
	);
	```

	**clickhouse**

	```sql
	CREATE CATALOG jdbc PROPERTIES (
		"type"="jdbc",
		"user"="default",
		"password"="123456",
		"jdbc_url" = "jdbc:clickhouse://127.0.0.1:8123/demo",
		"driver_url" = "file:///path/to/clickhouse-jdbc-0.3.2-patch11-all.jar",
		"driver_class" = "com.clickhouse.jdbc.ClickHouseDriver"
	)
	```

	**oracle**
	```sql
	CREATE CATALOG jdbc PROPERTIES (
		"type"="jdbc",
		"user"="doris",
		"password"="123456",
		"jdbc_url" = "jdbc:oracle:thin:@127.0.0.1:1521:helowin",
		"driver_url" = "file:///path/to/ojdbc8.jar",
		"driver_class" = "oracle.jdbc.driver.OracleDriver"
	);	
	```

	**SQLServer**
	```sql
	CREATE CATALOG sqlserver_catalog PROPERTIES (
		"type"="jdbc",
		"user"="SA",
		"password"="Doris123456",
		"jdbc_url" = "jdbc:sqlserver://localhost:1433;DataBaseName=doris_test",
		"driver_url" = "file:///path/to/mssql-jdbc-11.2.3.jre8.jar",
		"driver_class" = "com.microsoft.sqlserver.jdbc.SQLServerDriver"
	);	
	```

    **SAP HANA**
    ```sql
	CREATE CATALOG saphana_catalog PROPERTIES (
       "type"="jdbc",
       "user"="SYSTEM",
       "password"="SAPHANA",
       "jdbc_url" = "jdbc:sap://localhost:31515/TEST",
       "driver_url" = "file:///path/to/ngdbc.jar",
       "driver_class" = "com.sap.db.jdbc.Driver"
	);
    ```

    **Trino**
    ```sql
	CREATE CATALOG trino_catalog PROPERTIES (
       "type"="jdbc",
       "user"="hadoop",
       "password"="",
       "jdbc_url" = "jdbc:trino://localhost:8080/hive",
       "driver_url" = "file:///path/to/trino-jdbc-389.jar",
       "driver_class" = "io.trino.jdbc.TrinoDriver"
	);
    ```

    **OceanBase**
    ```sql
	CREATE CATALOG oceanbase_catalog PROPERTIES (
       "type"="jdbc",
       "user"="root",
       "password"="",
       "jdbc_url" = "jdbc:oceanbase://localhost:2881/demo",
       "driver_url" = "file:///path/to/oceanbase-client-2.4.2.jar",
       "driver_class" = "com.oceanbase.jdbc.Driver"
	);
    ```


