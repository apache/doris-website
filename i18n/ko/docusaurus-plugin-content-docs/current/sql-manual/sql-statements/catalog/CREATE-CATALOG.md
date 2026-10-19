---
{
    "title": "CREATE CATALOG",
    "language": "ko",
    "description": "이 문은 외부 Catalog를 생성하는 데 사용됩니다"
}
---

## 설명 {#description}

이 문은 외부 Catalog를 생성하는 데 사용됩니다

## 구문 {#syntax}

```sql
CREATE CATALOG [IF NOT EXISTS] <catalog_name> [ COMMENT "<comment>"]
	PROPERTIES ("<key>"="<value>" [, ... ]);
```

## 필수 매개변수 {#required-parameters}

**1. `<catalog_name>`**
생성할 Catalog의 이름입니다.

**2. `"<key>"="<value>"`**
Catalog 생성에 사용할 매개변수입니다.

## 선택적 매개변수 {#optional-parameters}

**1. `<comment>`**
생성할 Catalog의 주석입니다.

## 접근 제어 요구 사항 {#access-control-requirements}
| 권한   | 객체  | 비고                                                                 |
|:------------|:--------|:----------------------------------------------------------------------|
| CREATE_PRIV | Catalog | 해당 Catalog에 대한 CREATE_PRIV 권한이 필요합니다. |

## 예제 {#example}

1. hive Catalog 생성

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

2. es Catalog 생성

	```sql
	CREATE CATALOG es PROPERTIES (
		"type"="es",
		"hosts"="http://127.0.0.1:9200"
	);
	```

3. jdbc Catalog 생성

	**mysql**

	```sql
	CREATE CATALOG jdbc PROPERTIES (
		"type"="jdbc",
		"user"="root",
		"password"="123456",
		"jdbc_url" = "jdbc:mysql://127.0.0.1:3316/doris_test?useSSL=false",
		"driver_url" = "https://repo1.maven.org/maven2/mysql/mysql-connector-java/8.0.25/mysql-connector-java-8.0.25.jar",
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
