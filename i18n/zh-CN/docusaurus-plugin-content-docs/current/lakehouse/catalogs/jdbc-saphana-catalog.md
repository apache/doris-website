---
{
    "title": "SAP HANA JDBC Catalog",
    "language": "zh-CN",
    "description": "Doris JDBC Catalog 支持通过标准 JDBC 接口连接 SAP HANA 数据库。本文档介绍如何配置 SAP HANA 数据库连接。"
}
---

Doris JDBC Catalog 支持通过标准 JDBC 接口连接 SAP HANA 数据库。本文档介绍如何配置 SAP HANA 数据库连接。

关于 JDBC Catalog 概述，请参阅：[ JDBC Catalog 概述](./jdbc-catalog-overview.md)

## 使用须知

要连接到 SAP HANA 数据库，您需要

* SAP HANA 2.0 或更高版本。

* SAP HANA 数据库的 JDBC 驱动程序，您可以从 [Maven 仓库](https://mvnrepository.com/artifact/com.sap.cloud.db.jdbc/ngdbc)下载最新或指定版本的 SAP HANA JDBC 驱动程序。推荐使用 ngdbc 2.4.51 以上的版本。

* Doris 每个 FE 和 BE 节点和 SAP HANA 服务器之间的网络连接，默认端口为 30015。

## 连接 SAP HANA

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

有关 SAP HANA JDBC 驱动程序支持的 JDBC URL 格式和参数的更多信息，请参阅 [SAP HANA](https://help.sap.com/docs/)。

## 层级映射

映射 SAP HANA 时，Doris 的 Database 对应于 SAP HANA 中指定 DataBase（`jdbc_url` 参数中的 "DATABASE"）下的一个 Schema。而 Doris 的 Database 下的 Table 则对应于 SAP HANA 中 Schema 下的 Tables。即映射关系如下：

| Doris    | SAP HANA |
| -------- | -------- |
| Catalog  | Database |
| Database | Schema   |
| Table    | Table    |

## 列类型映射

| SAP HANA Type      | Doris Type                        | Comment                                                      |
| ------------------ | --------------------------------- | ------------------------------------------------------------ |
| boolean            | boolean                           |                                                              |
| tinyint            | tinyint                           |                                                              |
| smalling           | smalling                          |                                                              |
| integer            | int                               |                                                              |
| bigint             | bigint                            |                                                              |
| smalldecimal(P, S) | decimal(P, S) or double or string | 如果没有指定精度，则使用 double 类型承接。如果精度超过 Doris 支持的最大精度，则使用 string 承接。 |
| decimal(P, S)      | decimal(P, S) or double or string | 同上。                                                          |
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
