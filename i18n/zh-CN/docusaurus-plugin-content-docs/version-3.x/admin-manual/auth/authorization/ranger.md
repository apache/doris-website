---
{
    "title": "Ranger 鉴权",
    "language": "zh-CN",
    "description": "Apache Ranger 是一个用来在 Hadoop 平台上进行监控，启用服务，以及全方位数据安全访问管理的安全框架。 使用 ranger 后，会通过在 Ranger 侧配置权限代替在 Doris 中执行 Grant 语句授权。"
}
---

Apache Ranger 是一个用来在 Hadoop 平台上进行监控，启用服务，以及全方位数据安全访问管理的安全框架。
使用 ranger 后，会通过在 Ranger 侧配置权限代替在 Doris 中执行 Grant 语句授权。
Ranger 的安装和配置见下文：安装和配置 Doris Ranger 插件

## Ranger 示例
### 更改 Doris 配置
1. 在 fe/conf/fe.conf 文件中配置鉴权方式为 ranger access_controller_type=ranger-doris
2. 在所有 FE 的 conf 目录创建 `ranger-doris-security.xml` 文件，内容如下：

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

   其中需要将 `ranger.plugin.doris.policy.cache.dir` 和 `ranger.plugin.doris.policy.rest.url` 改为实际值。
3. 启动集群
### 权限示例
1. 在 Doris 中创建 `user1`。
2. 在 Doris 中，先使用 `admin` 用户创建一个 Catalog：`hive`。
3. 在 Ranger 中创建 `user1`。

#### 全局权限
相当于 Doris 内部授权语句的 `grant select_priv on *.*.* to user1`;
- catalog 同级下拉框可以找到 global 选项
- 输入框里只能输入 `*`

  ![global](/images/ranger/global.png)

#### Catalog 权限
相当于 Doris 内部授权语句的 `grant select_priv on hive.*.* to user1`;

![catalog](/images/ranger/catalog.png)

#### Database 权限
相当于 Doris 内部授权语句的 `grant select_priv on hive.tpch.* to user1`;

![database](/images/ranger/database.png)

#### Table 权限
> 这里的table泛指 表/视图/异步物化视图

相当于 Doris 内部授权语句的 `grant select_priv on hive.tpch.user to user1`;

![table](/images/ranger/table.png)

#### 列权限
相当于 Doris 内部授权语句的 `grant select_priv(name,age) on hive.tpch.user to user1`;

![column](/images/ranger/column.png)

#### Resource 权限
相当于 Doris 内部授权语句的 `grant usage_priv on resource 'resource1' to user1`;
- catalog 同级下拉框可以找到 resource 选项

![resource](/images/ranger/resource.png)

#### Workload Group 权限
相当于 Doris 内部授权语句的 `grant usage_priv on workload group 'group1' to user1`;
- catalog 同级下拉框可以找到 workload group 选项

![group1](/images/ranger/group1.png)

#### Compute Group 权限

> 3.0.6 版本支持

相当于 Doris 内部授权语句的 `grant usage_priv on compute group 'group1' to user1`;
- catalog 同级下拉框可以找到 compute group 选项

![compute group](/images/ranger/compute-group.png)

#### Storage Vault 权限

> 3.0.6 版本支持

相当于 Doris 内部授权语句的 `grant usage_priv on storage vault 'vault1' to user1`;
- catalog 同级下拉框可以找到 storage vault 选项

![storage vault](/images/ranger/storage-vault.png)

### 行权限示例

> 2.1.3 版本支持

1. 参考 权限示例 给 user1 分配 internal.db1.user 表的 select 权限。
2. 在 Ranger 中添加一个 Row Level Filter policy

   ![Row Policy 示例](/images/ranger/ranger-row-policy.jpeg)

3. 使用 user1 登录 Doris。执行 `select * from internal.db1.user`，只能看到满足 `id > 3` 且 `age = 2` 的数据。

### 数据脱敏示例

> 2.1.3 版本支持

1. 参考 权限示例 给 user1 分配 internal.db1.user 表的 select 权限。
2. 在 Ranger 中添加一个 Masking policy

   ![Data Mask 示例](/images/ranger/ranger-data-mask.png)

3. 使用 user1 登录 Doris。执行 `select * from internal.db1.user`，看到的 phone 是按照指定规则脱敏后的数据。
## 常见问题
1. ranger 访问失败，怎么查看日志

   在所有 FE 的 conf 目录创建 log4j.properties 文件，内容如下：

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

   其中 `log4j.appender.D.File` 改为实际值，用于存放 Ranger 插件的日志。
2. 配置了 Row Level Filter policy ，但是用户查询时报没有权限

   Row Level Filter policy 仅用来限制用户访问表中数据的特定记录， 仍需通过 ACCESS POLICY 为用户授权
3. 创建服务后，默认仅 `admin` 用户有权限， `root` 用户没有权限

   如图所示，创建服务的时候，添加配置 `default.policy.users` ，如需配置多个用户拥有全部权限，用 `,` 分隔
   ![default policy](/images/ranger/default-policy.png)

4. 使用 ranger 鉴权后，内部授权还有用么？

   不能用，也不能创建/删除角色

## 安装和配置 Doris Ranger 插件
### 安装插件

1. 下载以下文件

    - [ranger-doris-plugin-3.0.0-SNAPSHOT.jar](https://selectdb-doris-1308700295.cos.ap-beijing.myqcloud.com/ranger/ranger-doris-plugin-3.0.0-SNAPSHOT.jar)
    - [mysql-connector-java-8.0.25.jar](https://selectdb-doris-1308700295.cos.ap-beijing.myqcloud.com/release/jdbc_driver/mysql-connector-java-8.0.25.jar)

2. 将下载好的文件放到 Ranger 服务的 `ranger-plugins/doris` 目录下，如：

   ```
   /usr/local/service/ranger/ews/webapp/WEB-INF/classes/ranger-plugins/doris/ranger-doris-plugin-3.0.0-SNAPSHOT.jar
   /usr/local/service/ranger/ews/webapp/WEB-INF/classes/ranger-plugins/doris/mysql-connector-java-8.0.25.jar
   ```

3. 重启 Ranger 服务。

4. 下载 [ranger-servicedef-doris.json](https://github.com/morningman/ranger/blob/doris-plugin/agents-common/src/main/resources/service-defs/ranger-servicedef-doris.json)

5. 执行以下命令上传定义文件到 Ranger 服务：

   ```
   curl -u user:password -X POST \
       -H "Accept: application/json" \
       -H "Content-Type: application/json" \
       http://172.21.0.32:6080/service/plugins/definitions \
       -d@ranger-servicedef-doris.json
   ```

   其中用户名密码是登录 Ranger WebUI 所使用的用户名密码。

   服务地址端口可以再 `ranger-admin-site.xml` 配置文件的 `ranger.service.http.port` 配置项查看。

   如执行成功，会返回 Json 格式的服务定义，如：

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

   如想重新创建，则可以使用以下命令删除服务定义后，再重新上传：

   ```
   curl -v -u user:password -X DELETE \
   http://172.21.0.32:6080/service/plugins/definitions/207
   ```

   其中 `207` 是创建时返回的 id。删除前，需在 Ranger WebUI 界面删除已创建的 Doris 服务。

   也可以通过以下命令列举当前已添加的服务定义，以便获取 id：

   ```
   curl -v -u user:password -X GET \
   http://172.21.0.32:6080/service/plugins/definitions/
   ```
### 配置插件

安装完毕后，打开 Ranger WebUI，可以再 Service Manger 界面中看到 Apache Doris 插件：

![ranger](/images/ranger/ranger1.png)

点击插件旁边的 `+` 号添加一个  Doris 服务：

![ranger2](/images/ranger/ranger2.png)

Config Properties 部分参数含义如下：

- `Username`/`Pasword`：Doris 集群的用户名密码，这里建议使用 Admin 用户。
- `jdbc.driver_class`：连接 Doris 使用的 JDBC 驱动。`com.mysql.cj.jdbc.Driver`
- `jdbc.url`：Doris 集群的 JDBC url 连接串。`jdbc:mysql://172.21.0.101:9030?useSSL=false`
- 额外参数：
    - `resource.lookup.timeout.value.in.ms`：获取元信息的超时时间，建议填写 `10000`，即 10 秒。

可以点击 `Test Connection` 检查是否可以联通。

之后点击 `Add` 添加服务。

之后，可以在 Service Manger 界面的 Apache Doris 插件中看到创建的服务，点击服务，即可开始配置 Ranger。
