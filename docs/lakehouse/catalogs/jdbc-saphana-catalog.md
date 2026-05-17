---
{
    "title": "SAP HANA JDBC Catalog",
    "language": "en",
    "description": "The Doris JDBC Catalog supports connecting to the SAP HANA database through the standard JDBC interface."
}
---

The Doris JDBC Catalog supports connecting to the SAP HANA database through the standard JDBC interface. This document describes how to configure the SAP HANA database connection.

For an overview of the JDBC Catalog, please refer to: [JDBC Catalog Overview](./jdbc-catalog-overview.md)

## Usage Notes

To connect to the SAP HANA database, you need

* SAP HANA 2.0 or higher.

* The JDBC driver for the SAP HANA database, which you can download from the [Maven Repository](https://mvnrepository.com/artifact/com.sap.cloud.db.jdbc/ngdbc). It is recommended to use version ngdbc 2.4.51 or above.

* Network connection between each Doris FE and BE node and the SAP HANA server, with the default port being 30015.

## Connecting to SAP HANA

```sql
CREATE CATALOG saphana_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password' = 'pwd',
    'jdbc_url' = 'jdbc:sap://Hostname:Port/?optionalparameters',
    'driver_url' = 'ngdbc-2.4.51.jar',
    'driver_class' = 'com.sap.db.jdbc.Driver'
)
```

For more information on the JDBC URL format and parameters supported by the SAP HANA JDBC driver, please refer to [SAP HANA](https://help.sap.com/docs/).

## Hierarchical Mapping

When mapping SAP HANA, the Database in Doris corresponds to a Schema under the specified DataBase in SAP HANA (the "DATABASE" in the `jdbc_url` parameter). The Table under the Database in Doris corresponds to the Tables under the Schema in SAP HANA. The mapping relationship is as follows:

| Doris    | SAP HANA |
| -------- | -------- |
| Catalog  | Database |
| Database | Schema   |
| Table    | Table    |

## Column Type Mapping

| SAP HANA Type      | Doris Type                        | Comment                                                      |
| ------------------ | --------------------------------- | ------------------------------------------------------------ |
| boolean            | boolean                           |                                                              |
| tinyint            | tinyint                           |                                                              |
| smalling           | smalling                          |                                                              |
| integer            | int                               |                                                              |
| bigint             | bigint                            |                                                              |
| smalldecimal(P, S) | decimal(P, S) or double or string | If precision is not specified, the double type is used. If the precision exceeds the maximum precision supported by Doris, the string type is used. |
| decimal(P, S)      | decimal(P, S) or double or string | Same as above.                                               |
| real               | float                             |                                                              |
| double             | double                            |                                                              |
| date               | date                              |                                                              |
| time               | string                            |                                                              |
| timestamp(S)       | datetime(S)                       |                                                              |
| seconddate         | datetime(S)                       |                                                              |
| varchar            | string                            |                                                              |
| nvarchar           | string                            |                                                              |
| alphanum           | string                            |                                                              |
| shorttext          | string                            |                                                              |
| char(N)            | char(N)                           |                                                              |
| nchar(N)           | char(N)                           |                                                              |
| other              | UNSUPPORTED                       |                                                              |