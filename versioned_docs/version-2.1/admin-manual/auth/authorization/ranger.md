---
{
    "title": "Ranger Authorization",
    "language": "en",
    "description": "Apache Ranger is a security framework used for monitoring, enabling services,"
}
---

Apache Ranger is a security framework used for monitoring, enabling services, and comprehensive data security access management on the Hadoop platform. After using Ranger, permissions configured on the Ranger side replace the execution of Grant statements in Doris for authorization. For Ranger installation and configuration, see below: Installing and Configuring Doris Ranger Plugin.

## Ranger Example

### Change Doris Configuration
1. In the `fe/conf/fe.conf` file, configure the authorization method as `ranger access_controller_type=ranger-doris`.
2. Create a `ranger-doris-security.xml` file in the conf directory of all FEs with the following content:

   ```
   <?xml version="1.0" encoding="UTF-8"?>
   <?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
   <configuration>
       <property>
           <name>ranger.plugin.doris.policy.cache.dir</name>
           <value>/path/to/ranger/cache/</value>
       </property>
       <property>
           <name>ranger.plugin.doris.policy.pollIntervalMs</name>
           <value>30000</value>
       </property>
       <property>
           <name>ranger.plugin.doris.policy.rest.client.connection.timeoutMs</name>
           <value>60000</value>
       </property>
       <property>
           <name>ranger.plugin.doris.policy.rest.client.read.timeoutMs</name>
           <value>60000</value>
       </property>
       <property>
           <name>ranger.plugin.doris.policy.rest.url</name>
           <value>http://172.21.0.32:6080</value>
       </property>
       <property>
           <name>ranger.plugin.doris.policy.source.impl</name>
           <value>org.apache.ranger.admin.client.RangerAdminRESTClient</value>
       </property>
       <property>
           <name>ranger.plugin.doris.service.name</name>
           <value>doris</value>
       </property>
   </configuration>
   ```

   Among which, the `ranger.plugin.doris.policy.cache.dir` and `ranger.plugin.doris.policy.rest.url` need to be modified to their actual values.
3. Start the cluster.

### Permission Example
1. Create `user1` in Doris.
2. In Doris, first use the `admin` user to create a Catalog: `hive`.
3. Create `user1` in Ranger.

#### Global Permissions
Equivalent to the internal Doris authorization statement `grant select_priv on *.*.* to user1`;
- The global option can be found in the dropdown box at the same level as the catalog.
- Only `*` can be entered in the input box.

  ![global](/images/ranger/global.png)

#### Catalog Permissions
Equivalent to the internal Doris authorization statement `grant select_priv on hive.*.* to user1`;

![catalog](/images/ranger/catalog.png)

#### Database Permissions
Equivalent to the internal Doris authorization statement `grant select_priv on hive.db1.* to user1`;

![database](/images/ranger/database.png)

#### Table Permissions
> Here, the term "table" generally refers to tables, views, and asynchronous materialized views.

Equivalent to the internal Doris authorization statement `grant select_priv on hive.db1.tbl1 to user1`;

![table](/images/ranger/table.png)

#### Column Permissions
Equivalent to the internal Doris authorization statement `grant select_priv(col1,col2) on hive.db1.tbl1 to user1`;

![column](/images/ranger/column.png)

#### Resource Permissions
Equivalent to the internal Doris authorization statement `grant usage_priv on resource 'resource1' to user1`;
- The resource option can be found in the dropdown box at the same level as the catalog.

![resource](/images/ranger/resource.png)

#### Workload Group Permissions
Equivalent to the internal Doris authorization statement `grant usage_priv on workload group 'group1' to user1`;
- The workload group option can be found in the dropdown box at the same level as the catalog.

![group1](/images/ranger/group1.png)

### Row-Level Permissions Example

> Supported in version 2.1.3

1. Refer to the permission example to grant `user1` the select permission on the `internal.db1.user` table.
2. In Ranger, add a Row Level Filter policy

   ![Row Policy Example](/images/ranger/ranger-row-policy.jpeg)

3. Log in to Doris with `user1`. Execute `select * from internal.db1.user`, and only see the data that meets the condition `id > 3` and `age = 2`.

### Data Masking Example

> Supported in version 2.1.3

1. Refer to the permission example to grant `user1` the select permission on the `internal.db1.user` table.
2. In Ranger, add a Masking policy

   ![Data Mask Example](/images/ranger/ranger-data-mask.png)

3. Log in to Doris with `user1`. Execute `select * from internal.db1.user`, and see the phone number is masked according to the specified rule.

## Frequently Asked Questions
1. How to view the log when Ranger access fails?

   Create a `log4j.properties` file in the `conf` directory of all FEs, with the following content:

    ```
	log4j.rootLogger = warn,stdout,D

	log4j.appender.stdout = org.apache.log4j.ConsoleAppender
	log4j.appender.stdout.Target = System.out
	log4j.appender.stdout.layout = org.apache.log4j.PatternLayout
	log4j.appender.stdout.layout.ConversionPattern = [%-5p] %d{yyyy-MM-dd HH:mm:ss,SSS} method:%l%n%m%n
	
	log4j.appender.D = org.apache.log4j.DailyRollingFileAppender
	log4j.appender.D.File = /path/to/fe/log/ranger.log
	log4j.appender.D.Append = true
	log4j.appender.D.Threshold = INFO
	log4j.appender.D.layout = org.apache.log4j.PatternLayout
	log4j.appender.D.layout.ConversionPattern = %-d{yyyy-MM-dd HH:mm:ss}  [ %t:%r ] - [ %p ]  %m%n
	```

   Change `log4j.appender.D.File` to the actual path, which is used to store the Ranger plugin log.
2. A Row Level Filter policy has been configured, but the user encounters a permission denied error when querying.

   The Row Level Filter policy is solely used to restrict users from accessing specific records within a table's data; authorization for the user must still be granted through an ACCESS POLICY.
3. After creating the service, only the 'admin' user has permission by default` Root 'user does not have permission

   As shown in the image, when creating the service, add the configuration `default.policy.users`. If you need to configure multiple users with full permissions, separate them with `,`.
   ![default policy](/images/ranger/default-policy.png)
4. After using Ranger for authentication, is internal authorization still effective?

   Currently, Ranger does not support configuring global-level permissions, so internal authorization like `GRANT priv ON *.*.*` remains effective, while permissions at other levels are not functional.

## Install and Configure Doris Ranger Plugin

### Install Plugin

1. Download the following files

    - [ranger-doris-plugin-3.0.0-SNAPSHOT.jar](https://selectdb-doris-1308700295.cos.ap-beijing.myqcloud.com/release/ranger/2.1/ranger-doris-plugin-3.0.0-SNAPSHOT.jar)
    - [mysql-connector-java-8.0.25.jar](https://selectdb-doris-1308700295.cos.ap-beijing.myqcloud.com/release/jdbc_driver/mysql-connector-java-8.0.25.jar)

2. Place the downloaded files in the `ranger-plugins/doris` directory of the Ranger service, such as:

   ```
   /usr/local/service/ranger/ews/webapp/WEB-INF/classes/ranger-plugins/doris/ranger-doris-plugin-3.0.0-SNAPSHOT.jar
   /usr/local/service/ranger/ews/webapp/WEB-INF/classes/ranger-plugins/doris/mysql-connector-java-8.0.25.jar
   ```

3. Restart the Ranger service.

4. Download [ranger-servicedef-doris.json](https://github.com/morningman/ranger/blob/doris-ranger-plugin-2.1/agents-common/src/main/resources/service-defs/ranger-servicedef-doris.json)

5. Execute the following command to upload the definition file to the Ranger service:

   ```
   curl -u user:password -X POST \
       -H "Accept: application/json" \
       -H "Content-Type: application/json" \
       http://172.21.0.32:6080/service/plugins/definitions \
       -d@ranger-servicedef-doris.json
   ```

   Replace the username and password with the actual login credentials for the Ranger WebUI.

   The service address and port can be found in the `ranger-admin-site.xml` configuration file, in the `ranger.service.http.port` configuration item.

   If the execution is successful, a JSON-formatted service definition will be returned, such as:

   ```
   {
     "id": 207,
     "guid": "d3ff9e41-f9dd-4217-bb5f-3fa9996454b6",
     "isEnabled": true,
     "createdBy": "Admin",
     "updatedBy": "Admin",
     "createTime": 1705817398112,
     "updateTime": 1705817398112,
     "version": 1,
     "name": "doris",
     "displayName": "Apache Doris",
     "implClass": "org.apache.ranger.services.doris.RangerServiceDoris",
     "label": "Doris",
     "description": "Apache Doris",
     "options": {
       "enableDenyAndExceptionsInPolicies": "true"
     },
     ...
   }
   ```

   If you want to recreate the service definition, you can use the following command to delete the service definition and then re-upload it:

   ```
   curl -v -u user:password -X DELETE \
   http://172.21.0.32:6080/service/plugins/definitions/207
   ```

   Replace `207` with the actual ID returned when creating the service definition.

   Before deleting, you need to delete the Doris service created in the Ranger WebUI.

   You can also use the following command to list the current service definitions and get the ID:

   ```
   curl -v -u user:password -X GET \
   http://172.21.0.32:6080/service/plugins/definitions/
   ```

### Configure Plugin

After installation, open the Ranger WebUI, and you can see the Apache Doris plugin in the Service Manager interface:

![ranger](/images/ranger/ranger1.png)

Click the `+` button next to the plugin to add a Doris service:

![ranger2](/images/ranger/ranger2.png)

The Config Properties section has the following parameters:

- `Username`/`Password`: The username and password of the Doris cluster. It is recommended to use the Admin user.
- `jdbc.driver_class`: The JDBC driver used to connect to Doris. `com.mysql.cj.jdbc.Driver`
- `jdbc.url`: The JDBC URL connection string of the Doris cluster. `jdbc:mysql://172.21.0.101:9030?useSSL=false`
- Additional parameters:
    - `resource.lookup.timeout.value.in.ms`: The timeout for getting metadata, recommended to set to `10000`, which is 10 seconds.

You can click `Test Connection` to check if the connection is successful.

After clicking `Add`, you can see the created service in the Service Manager interface of the Apache Doris plugin. Click the service to start configuring Ranger.
