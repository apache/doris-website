---
{
    "title": "CREATE RESOURCE",
    "language": "ko",
    "description": "이 문은 리소스를 생성하는 데 사용됩니다. root 또는 admin 사용자만 리소스를 생성할 수 있습니다. 현재 Spark, ODBC, S3 외부 리소스를 지원합니다."
}
---

## 설명 {#description}

이 문은 리소스를 생성하는 데 사용됩니다. root 또는 admin 사용자만 리소스를 생성할 수 있습니다. 현재 Spark, ODBC, S3 외부 리소스를 지원합니다.
향후에는 쿼리용 Spark/GPU, 외부 스토리지용 HDFS/S3, ETL용 MapReduce 등 다른 외부 리소스가 Doris에 추가될 수 있습니다.

## 구문 {#syntax}

```sql
CREATE [EXTERNAL] RESOURCE "<resource_name>"
PROPERTIES (
   `<property>`
    [ , ... ]
);
```

## 매개변수 {#parameters}

1.`<property>`

`<property>`의 형식은 `<key>` = `<value>`이며, `<key>`에 사용할 수 있는 구체적인 값은 다음과 같습니다.

| 매개변수 | 설명 | 필수 여부 |
| -- | -- | -- |
| `<type>` | 리소스 유형을 지정합니다. 지원되는 유형: spark/odbc_catalog/s3/jdbc/hdfs/hms/es. | Y |

`<type>`에 따라 PROPERTIES의 매개변수가 달라집니다. 자세한 내용은 예제를 참고하세요.


## 예제 {#examples}

**1. yarn 클러스터 모드에서 spark0이라는 Spark 리소스를 생성합니다.**

   ```sql
   CREATE EXTERNAL RESOURCE "spark0"
   PROPERTIES
   (
     "type" = "spark",
     "spark.master" = "yarn",
     "spark.submit.deployMode" = "cluster",
     "spark.jars" = "xxx.jar,yyy.jar",
     "spark.files" = "/tmp/aaa,/tmp/bbb",
     "spark.executor.memory" = "1g",
     "spark.yarn.queue" = "queue0",
     "spark.hadoop.yarn.resourcemanager.address" = "127.0.0.1:9999",
     "spark.hadoop.fs.defaultFS" = "hdfs://127.0.0.1:10000",
     "working_dir" = "hdfs://127.0.0.1:10000/tmp/doris",
     "broker" = "broker0",
     "broker.username" = "user0",
     "broker.password" = "password0"
   );
   ```

Spark 관련 매개변수는 다음과 같습니다.
   - spark.master: 필수 항목이며, 현재 yarn, spark://host:port를 지원합니다.
   - spark.submit.deployMode: Spark 프로그램의 배포 모드입니다. 필수 항목이며, cluster와 client를 모두 지원합니다.
   - spark.hadoop.yarn.resourcemanager.address: master가 yarn인 경우 필수입니다.
   - spark.hadoop.fs.defaultFS: master가 yarn인 경우 필수입니다.
   - 그 밖의 매개변수는 선택 사항입니다. [여기](http://spark.apache.org/docs/latest/configuration.html)를 참고하세요.

   

   Spark를 ETL에 사용할 때는 Working_dir과 broker를 지정해야 합니다. 각 매개변수의 설명은 다음과 같습니다.

   - working_dir: ETL에서 사용하는 디렉터리입니다. spark를 ETL 리소스로 사용하는 경우 필수입니다. 예: hdfs://host:port/tmp/doris.
   - broker: broker 이름입니다. spark를 ETL 리소스로 사용하는 경우 필수입니다. `ALTER SYSTEM ADD BROKER` 명령을 사용하여 미리 구성해야 합니다.
   - broker.property_key: ETL에서 생성한 중간 파일을 읽을 때 broker가 지정해야 하는 인증 정보입니다.

**2. ODBC 리소스를 생성합니다.**

   ```sql
   CREATE EXTERNAL RESOURCE `oracle_odbc`
   PROPERTIES (
   "type" = "odbc_catalog",
   "host" = "192.168.0.1",
   "port" = "8086",
   "user" = "test",
   "password" = "test",
   "database" = "test",
   "odbc_type" = "oracle",
   "driver" = "Oracle 19 ODBC driver"
   );
   ```

   ODBC 관련 매개변수는 다음과 같습니다.
   - hosts: 외부 데이터베이스의 IP 주소
   - driver: ODBC 외부 테이블의 드라이버 이름으로, be/conf/odbcinst.ini의 Driver 이름과 같아야 합니다.
   - odbc_type: 외부 데이터베이스의 유형으로, 현재 oracle, mysql, postgresql을 지원합니다.
   - user: 외부 데이터베이스의 사용자 이름
   - password: 해당 사용자의 비밀번호 정보
   - charset: 연결 문자 집합
   - ODBC Driver별로 사용자 지정 매개변수도 설정할 수 있습니다. 해당 ODBC Driver의 설명을 참고하세요.

**3. S3 리소스를 생성합니다.**

   ```sql
   CREATE RESOURCE "remote_s3"
   PROPERTIES
   (
      "type" = "s3",
      "s3.endpoint" = "bj.s3.com",
      "s3.region" = "bj",
      "s3.access_key" = "bbb",
      "s3.secret_key" = "aaaa",
      -- the followings are optional
      "s3.connection.maximum" = "50",
      "s3.connection.request.timeout" = "3000",
      "s3.connection.timeout" = "1000"
   );
   ```

   S3 리소스를 [콜드/핫 데이터 분리](../../../../table-design/tiered-storage/overview)에 사용하는 경우 필수 필드를 추가해야 합니다.
   ```sql
   CREATE RESOURCE "remote_s3"
   PROPERTIES
   (
      "type" = "s3",
      "s3.endpoint" = "bj.s3.com",
      "s3.region" = "bj",
      "s3.access_key" = "bbb",
      "s3.secret_key" = "aaaa",
      -- required by cooldown
      "s3.root.path" = "/path/to/root",
      "s3.bucket" = "test-bucket"
   );
   ```

   S3 관련 매개변수는 다음과 같습니다.
   - 필수 매개변수
       - `s3.endpoint`: s3 엔드포인트
       - `s3.region`:s3 리전
       - `s3.root.path`: s3 루트 디렉터리
       - `s3.access_key`: s3 액세스 키
       - `s3.secret_key`: s3 비밀 키
       - `s3.bucket`：s3 버킷
   - 선택적 매개변수
       - `s3.connection.maximum`: s3 최대 연결 수로, 기본값은 50입니다.
       - `s3.connection.request.timeout`: s3 요청 제한 시간으로, 단위는 밀리초이며 기본값은 3000입니다.
       - `s3.connection.timeout`: s3 연결 제한 시간으로, 단위는 밀리초이며 기본값은 1000입니다.

    Doris also supported `AWS Assume Role` for creating S3 Resource , please refer to [AWS integration](../../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication).

**4. JDBC 리소스를 생성합니다.**

   ```sql
   CREATE RESOURCE mysql_resource PROPERTIES (
      "type"="jdbc",
      "user"="root",
      "password"="123456",
      "jdbc_url" = "jdbc:mysql://127.0.0.1:3316/doris_test?useSSL=false",
      "driver_url" = "https://repo1.maven.org/maven2/mysql/mysql-connector-java/8.0.25/mysql-connector-java-8.0.25.jar",
   "driver_class" = "com.mysql.cj.jdbc.Driver"
   );
   ```

   JDBC 관련 매개변수는 다음과 같습니다.
   - user：데이터베이스에 연결하는 데 사용하는 사용자 이름
   - password：데이터베이스에 연결하는 데 사용하는 비밀번호
   - jdbc_url: 지정된 데이터베이스에 연결하는 데 사용하는 식별자
   - driver_url: JDBC 드라이버 패키지의 URL
   - driver_class: JDBC 드라이버의 클래스

**5. HDFS 리소스를 생성합니다.**

   ```sql
   CREATE RESOURCE hdfs_resource PROPERTIES (
      "type"="hdfs",
      "hadoop.username"="user",
      "dfs.nameservices" = "my_ha",
      "dfs.ha.namenodes.my_ha" = "my_namenode1, my_namenode2",
      "dfs.namenode.rpc-address.my_ha.my_namenode1" = "nn1_host:rpc_port",
      "dfs.namenode.rpc-address.my_ha.my_namenode2" = "nn2_host:rpc_port",
      "dfs.client.failover.proxy.provider.my_ha" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
   );
   ```

   HDFS 관련 매개변수는 다음과 같습니다.
   - fs.defaultFS: namenode 주소 및 포트
   - hadoop.username: hdfs 사용자 이름
   - dfs.nameservices: hadoop에서 HA를 활성화한 경우 fs nameservice를 설정하세요. hdfs-site.xml을 참고하세요.
   - dfs.ha.namenodes.[nameservice ID]：nameservice 내 각 NameNode의 고유 식별자입니다. hdfs-site.xml을 참고하세요.
   - dfs.namenode.rpc-address.[nameservice ID].[name node ID]`：각 NameNode가 수신 대기할 정규화된 RPC 주소입니다. hdfs-site.xml을 참고하세요.
   - dfs.client.failover.proxy.provider.[nameservice ID]：HDFS 클라이언트가 Active NameNode에 연결하는 데 사용하는 Java 클래스입니다. 일반적으로 org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider입니다.

**6. HMS 리소스를 생성합니다.**

   HMS 리소스는 [HMS Catalog](../../../../lakehouse/catalogs/hive-catalog.mdx)을 생성하는 데 사용됩니다.
   ```sql
   CREATE RESOURCE hms_resource PROPERTIES (
      'type'='hms',
      'hive.metastore.uris' = 'thrift://127.0.0.1:7004',
      'dfs.nameservices'='HANN',
      'dfs.ha.namenodes.HANN'='nn1,nn2',
      'dfs.namenode.rpc-address.HANN.nn1'='nn1_host:rpc_port',
      'dfs.namenode.rpc-address.HANN.nn2'='nn2_host:rpc_port',
      'dfs.client.failover.proxy.provider.HANN'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider'
   );
   ```

   HMS 관련 매개변수는 다음과 같습니다.
   - hive.metastore.uris: hive metastore 서버 주소
   선택 사항:
   - dfs.*: hive 데이터가 hdfs에 있는 경우 HDFS 리소스 매개변수를 추가하거나 hive-site.xml을 fe/conf에 복사해야 합니다.
   - s3.*: hive 데이터가 s3에 있는 경우 S3 리소스 매개변수를 추가해야 합니다. [Aliyun Data Lake Formation](https://www.aliyun.com/product/bigdata/dlf)을 사용하는 경우 hive-site.xml을 fe/conf에 복사하세요.

**7. ES 리소스를 생성합니다.**

   ```sql
   CREATE RESOURCE es_resource PROPERTIES (
      "type"="es",
      "hosts"="http://127.0.0.1:29200",
      "nodes_discovery"="false",
      "enable_keyword_sniff"="true"
   );
   ```

   ES 관련 매개변수는 다음과 같습니다.
   - hosts: ES 연결 주소입니다. 하나 이상의 노드를 지정할 수 있으며, 로드 밸런싱도 지원합니다.
   - user: ES 사용자 이름
   - password: 사용자의 비밀번호
   - enable_docvalue_scan: 쿼리 필드의 값을 가져오기 위해 ES/Lucene 컬럼 스토리지를 활성화할지 여부입니다. 기본값은 true입니다.
   - enable_keyword_sniff: ES에서 문자열 분할 유형인 text.fields를 탐지하여 keyword로 쿼리할지 여부입니다(기본값은 true이며, false이면 분할된 내용을 매칭합니다).
   - nodes_discovery: ES 노드 검색을 활성화할지 여부입니다. 기본값은 true입니다. 네트워크가 격리된 환경에서는 이 매개변수를 false로 설정하세요. 지정된 노드에만 연결합니다.
   - http_ssl_enabled: ES 클러스터에서 https 접근 모드를 활성화할지 여부입니다. 현재 FE/BE는 모든 인증서를 신뢰하도록 구현되어 있습니다.
