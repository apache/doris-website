---
{
    "title": "데이터 레이크하우스 FAQ",
    "language": "ko",
    "description": "인증서 문제, Kerberos 인증, JDBC Catalog, Hive Catalog, HDFS, DLF Catalog 및 진단 도구를 다루는 Apache Doris 데이터 레이크하우스 FAQ 및 문제 해결 가이드입니다."
}
---

## 인증서 문제 {#certificate-issues}

1. 쿼리 실행 시 `curl 77: Problem with the SSL CA cert.` 오류가 발생합니다. 이는 현재 시스템 인증서가 너무 오래되어 로컬에서 업데이트해야 한다는 의미입니다.
    - 최신 CA 인증서는 `https://curl.se/docs/caextract.html`에서 다운로드할 수 있습니다.
    - 다운로드한 `cacert-xxx.pem`을 `/etc/ssl/certs/` 디렉터리에 넣습니다. 예: `sudo cp cacert-xxx.pem /etc/ssl/certs/ca-certificates.crt`.

2. 쿼리 실행 시 다음 오류가 발생합니다. `ERROR 1105 (HY000): errCode = 2, detailMessage = (x.x.x.x)[CANCELLED][INTERNAL_ERROR]error setting certificate verify locations: CAfile: /etc/ssl/certs/ca-certificates.crt CApath: none`.

    ```
    yum install -y ca-certificates
    ln -s /etc/pki/ca-trust/extracted/openssl/ca-bundle.trust.crt /etc/ssl/certs/ca-certificates.crt
    ```

## Kerberos {#kerberos}

1. Kerberos 인증을 사용하는 Hive Metastore에 연결할 때 `GSS initiate failed` 오류가 발생합니다.

    일반적으로 Kerberos 인증 정보가 잘못되어 발생합니다. 다음 단계에 따라 문제를 해결할 수 있습니다.

    1. 1.2.1 이전 버전에서는 Doris가 의존하는 libhdfs3 라이브러리에 gsasl이 활성화되어 있지 않았습니다. 1.2.2 이상 버전으로 업데이트하세요.
    2. 각 구성 요소에 올바른 keytab과 principal이 설정되어 있는지 확인하고, 모든 FE 및 BE 노드에 keytab 파일이 있는지 확인합니다.

        1. `hadoop.kerberos.keytab`/`hadoop.kerberos.principal`: Hadoop HDFS에 접근할 때 사용하며, HDFS에 해당하는 값을 입력합니다.
        2. `hive.metastore.kerberos.principal`: Hive Metastore에 사용합니다.

    3. principal의 IP를 도메인 이름으로 바꿔 봅니다(기본 자리표시자인 `_HOST`는 사용하지 마세요).
    4. 모든 FE 및 BE 노드에 `/etc/krb5.conf` 파일이 있는지 확인합니다.

2. Hive Catalog를 통해 Hive 데이터베이스에 연결할 때 다음 오류가 발생합니다. `RemoteException: SIMPLE authentication is not enabled. Available:[TOKEN, KERBEROS]`.

    `show databases` 및 `show tables`에는 문제가 없지만 쿼리 실행 중 오류가 발생한다면 다음 두 단계를 따릅니다.
    - `core-site.xml` 및 `hdfs-site.xml`을 `fe/conf` 및 `be/conf` 디렉터리에 넣습니다.
    - BE 노드에서 Kerberos `kinit`을 실행하고 BE를 재시작한 후 쿼리를 실행합니다.

3. Kerberos가 설정된 테이블을 쿼리할 때 `GSSException: No valid credentials provided (Mechanism level: Failed to find any Kerberos Ticket)` 오류가 발생하면, 일반적으로 FE 및 BE 노드를 재시작하여 해결할 수 있습니다.

    - 모든 노드를 재시작하기 전에 `-Djavax.security.auth.useSubjectCredsOnly=false`를 `"${DORIS_HOME}/be/conf/be.conf"`의 JAVA_OPTS 매개변수에 설정합니다. 이렇게 하면 애플리케이션 대신 하위 메커니즘을 통해 JAAS 자격 증명 정보를 가져옵니다.
    - 일반적인 JAAS 오류의 해결 방법은 [JAAS 문제 해결](https://docs.oracle.com/javase/8/docs/technotes/guides/security/jgss/tutorials/Troubleshooting.html)을 참조하세요.
    
4. Catalog에서 Kerberos를 설정할 때 발생하는 `Unable to obtain password from user` 오류는 다음과 같이 해결합니다.

    - `klist -kt your.keytab`으로 확인하여 사용 중인 principal이 klist에 표시되는지 확인합니다.
    - Catalog 설정에 `yarn.resourcemanager.principal` 등의 누락된 설정이 있는지 확인합니다.
    - 위 항목에 문제가 없다면 시스템 패키지 관리자로 설치한 JDK 버전이 특정 암호화 알고리즘을 지원하지 않기 때문일 수 있습니다. JDK를 수동으로 설치하고 `JAVA_HOME` 환경 변수를 설정하는 것을 고려하세요.
    - Kerberos는 일반적으로 AES-256 암호화를 사용합니다. Oracle JDK에는 JCE를 설치해야 합니다. 일부 OpenJDK 배포판은 암호화 강도 제한이 없는 JCE를 자동으로 제공하므로 별도로 설치할 필요가 없습니다.
    - JCE 버전은 JDK 버전에 대응합니다. JDK 버전에 맞는 JCE zip 패키지를 다운로드하고 `$JAVA_HOME/jre/lib/security` 디렉터리에 압축을 풉니다.
        - JDK6: [JCE6](http://www.oracle.com/technetwork/java/javase/downloads/jce-6-download-429243.html)
        - JDK7: [JCE7](http://www.oracle.com/technetwork/java/embedded/embedded-se/downloads/jce-7-download-432124.html)
        - JDK8: [JCE8](http://www.oracle.com/technetwork/java/javase/downloads/jce8-download-2133166.html)

5. KMS를 사용하는 HDFS에 접근할 때 `java.security.InvalidKeyException: Illegal key size` 오류가 발생하면 JDK를 Java 8 u162 이상 버전으로 업그레이드하거나, 해당 버전의 JCE Unlimited Strength Jurisdiction Policy Files를 설치합니다.

6. Catalog에서 Kerberos를 설정한 후 `SIMPLE authentication is not enabled. Available:[TOKEN, KERBEROS]` 오류가 발생하면 `core-site.xml` 파일을 `"${DORIS_HOME}/be/conf"` 디렉터리에 넣습니다.

    HDFS에 접근할 때 `No common protection layer between client and server` 오류가 발생하면 클라이언트와 서버의 `hadoop.rpc.protection` 속성이 일치하는지 확인합니다.

    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <?xml-stylesheet type="text/xsl" href="configuration.xsl"?>

    <configuration>

        <property>
            <name>hadoop.security.authentication</name>
            <value>kerberos</value>
        </property>

    </configuration>
    ```

7. Kerberos가 설정된 상태에서 Broker Load를 사용할 때 `Cannot locate default realm.` 오류가 발생하는 경우:

    설정 항목 `-Djava.security.krb5.conf=/your-path`를 `JAVA_OPTS`에 추가합니다. 이 설정은 Broker Load용 `start_broker.sh` 스크립트에 적용합니다.

8. Catalog에서 Kerberos 설정을 사용하는 경우 `hadoop.username` 속성을 동시에 사용할 수 없습니다.

9. JDK 17로 Kerberos에 접근하기

    JDK 17로 Doris를 실행하고 Kerberos 서비스에 접근할 때, 더 이상 사용이 권장되지 않는 암호화 알고리즘으로 인해 문제가 발생할 수 있습니다. `allow_weak_crypto=true` 속성을 `krb5.conf`에 추가하거나 Kerberos의 암호화 알고리즘을 업그레이드해야 합니다.

    자세한 내용은 다음을 참조하세요. <https://seanjmullan.org/blog/2021/09/14/jdk17#kerberos>

## JDBC Catalog {#jdbc-catalog}

1. JDBC Catalog를 통해 SQLServer에 연결할 때 발생하는 오류: `unable to find valid certification path to requested target`

    `trustServerCertificate=true` 옵션을 `jdbc_url`에 추가합니다.

2. JDBC Catalog를 통해 MySQL 데이터베이스에 연결할 때 중국어 문자가 깨지거나 중국어 문자 쿼리 조건이 올바르게 처리되지 않는 경우

    `useUnicode=true&characterEncoding=utf-8`을 `jdbc_url`에 추가합니다.

    > 참고: 1.2.3 버전부터는 JDBC Catalog를 통해 MySQL 데이터베이스에 연결할 때 이 매개변수들이 자동으로 추가됩니다.

3. JDBC Catalog를 통해 MySQL 데이터베이스에 연결할 때 발생하는 오류: `Establishing SSL connection without server's identity verification is not recommended`

    `useSSL=true`를 `jdbc_url`에 추가합니다.

4. JDBC Catalog를 사용하여 MySQL 데이터를 Doris로 동기화할 때 날짜 데이터 동기화 오류가 발생합니다. MySQL 버전과 MySQL 드라이버 패키지가 일치하는지 확인합니다. 예를 들어 MySQL 8 이상 버전에는 `com.mysql.cj.jdbc.Driver` 드라이버가 필요합니다.

5. 단일 필드가 너무 크면 쿼리 실행 중 BE 측에서 Java 메모리 OOM이 발생합니다.

    JDBC Scanner가 JDBC를 통해 데이터를 읽을 때 세션 변수 `batch_size`는 JVM에서 배치당 처리하는 행 수를 결정합니다. 단일 필드가 너무 크면 `field_size * batch_size`(JVM 정적 메모리 및 데이터 복사 오버헤드를 고려한 근삿값)가 JVM 메모리 한도를 초과하여 OOM이 발생할 수 있습니다.

    해결 방법:

    - `batch_size` 값을 줄이려면 `set batch_size = 512;`를 실행합니다. 기본값은 4064입니다.
    - BE JVM 메모리를 늘리려면 `-Xmx` 매개변수를 `JAVA_OPTS`에서 수정합니다. 예: `-Xmx8g`.

## Hive Catalog {#hive-catalog}

1. Hive Catalog를 통해 Iceberg 또는 Hive 테이블에 접근할 때 발생하는 오류: `failed to get schema` 또는 `Storage schema reading not supported`

    다음 방법을 시도해 볼 수 있습니다.

    - `iceberg` 런타임 관련 jar 패키지를 Hive의 `lib/` 디렉터리에 넣습니다.

    - `hive-site.xml`에 다음을 설정합니다.

        ```
        metastore.storage.schema.reader.impl=org.apache.hadoop.hive.metastore.SerDeStorageSchemaReader
        ```

        설정을 완료한 후 Hive Metastore를 재시작해야 합니다.

    - Catalog 속성에 `"get_schema_from_table" = "true"`를 추가합니다.

        이 매개변수는 2.1.10 및 3.0.6 버전부터 지원됩니다.

2. Hive Catalog에 연결할 때 발생하는 오류: `Caused by: java.lang.NullPointerException`

    fe.log에 다음 스택 트레이스가 있는 경우:

    ```
    Caused by: java.lang.NullPointerException
        at org.apache.hadoop.hive.ql.security.authorization.plugin.AuthorizationMetaStoreFilterHook.getFilteredObjects(AuthorizationMetaStoreFilterHook.java:78) ~[hive-exec-3.1.3-core.jar:3.1.3]
        at org.apache.hadoop.hive.ql.security.authorization.plugin.AuthorizationMetaStoreFilterHook.filterDatabases(AuthorizationMetaStoreFilterHook.java:55) ~[hive-exec-3.1.3-core.jar:3.1.3]
        at org.apache.hadoop.hive.metastore.HiveMetaStoreClient.getAllDatabases(HiveMetaStoreClient.java:1548) ~[doris-fe.jar:3.1.3]
        at org.apache.hadoop.hive.metastore.HiveMetaStoreClient.getAllDatabases(HiveMetaStoreClient.java:1542) ~[doris-fe.jar:3.1.3]
        at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method) ~[?:1.8.0_181]
    ```

    `"metastore.filter.hook" = "org.apache.hadoop.hive.metastore.DefaultMetaStoreFilterHookImpl"`을 `CREATE CATALOG` 문에 추가하여 해결해 봅니다.

3. Hive Catalog를 생성한 후 `show tables`는 정상적으로 작동하지만 쿼리 실행 시 `java.net.UnknownHostException: xxxxx` 오류가 발생하는 경우

    Catalog의 PROPERTIES에 다음을 추가합니다.

    ```
    'fs.defaultFS' = 'hdfs://<your_nameservice_or_actually_HDFS_IP_and_port>'
    ```

4. Hive 1.x의 ORC 형식 테이블에서는 기본 ORC 파일 스키마에 `_col0`, `_col1`, `_col2` 등의 시스템 컬럼 이름이 사용될 수 있습니다. 이 경우 Catalog 설정에서 `hive.version`을 1.x.x로 지정하여 Hive 테이블의 컬럼 이름과 매핑합니다.

    ```sql
    CREATE CATALOG hive PROPERTIES (
        'hive.version' = '1.x.x'
    );
    ```

5. Catalog로 테이블 데이터를 쿼리할 때 `Invalid method name`과 같은 Hive Metastore 관련 오류가 발생하면 `hive.version` 매개변수를 설정합니다.

6. ORC 형식의 테이블을 쿼리할 때 FE에서 `Could not obtain block` 또는 `Caused by: java.lang.NoSuchFieldError: types` 오류가 발생한다면, 기본적으로 FE가 HDFS에 접근하여 파일 정보를 가져오고 파일 분할을 수행하기 때문일 수 있습니다. 일부 환경에서는 FE가 HDFS에 접근하지 못할 수 있습니다. 다음 매개변수를 추가하면 해결할 수 있습니다. `"hive.exec.orc.split.strategy" = "BI"`. 다른 옵션으로는 HYBRID(기본값)와 ETL이 있습니다.

7. Hive에서는 Hudi 테이블의 파티션 필드 값을 찾을 수 있지만 Doris에서는 찾을 수 없는 경우가 있습니다. 현재 Doris와 Hive는 Hudi를 쿼리하는 방식이 다릅니다. Doris에서는 Hudi 테이블의 avsc 파일 구조에 파티션 필드를 추가해야 합니다. 추가하지 않으면 Doris는 partition_val이 비어 있는 상태로 쿼리합니다(`hoodie.datasource.hive_sync.partition_fields=partition_val`을 설정한 경우에도 마찬가지입니다).

    ```
    {
        "type": "record",
        "name": "record",
        "fields": [{
            "name": "partition_val",
            "type": [
                "null",
                "string"
                ],
            "doc": "Preset partition field, empty string when not partitioned",
            "default": null
            },
            {
            "name": "name",
            "type": "string",
            "doc": "Name"
            },
            {
            "name": "create_time",
            "type": "string",
            "doc": "Creation time"
            }
        ]
    }
    ```

8. Hive 외부 테이블을 쿼리할 때 `java.lang.ClassNotFoundException: Class com.hadoop.compression.lzo.LzoCodec not found` 오류가 발생하면 Hadoop 환경에서 `hadoop-lzo-*.jar`를 찾아 `"${DORIS_HOME}/fe/lib/"` 디렉터리에 넣고 FE를 재시작합니다. 2.0.2 버전부터는 이 파일을 FE의 `custom_lib/` 디렉터리에 넣을 수 있습니다(디렉터리가 없으면 수동으로 생성합니다). 이렇게 하면 클러스터 업그레이드 시 `lib` 디렉터리가 교체되어 파일이 손실되는 것을 방지할 수 있습니다.

9. serde를 `org.apache.hadoop.hive.contrib.serde2.MultiDelimitserDe`로 지정하여 Hive 테이블을 생성한 후, 테이블에 접근할 때 `storage schema reading not supported` 오류가 발생하면 다음 설정을 `hive-site.xml` 파일에 추가하고 HMS 서비스를 재시작합니다.

    ```xml
    <property>
        <name>metastore.storage.schema.reader.impl</name>
        <value>org.apache.hadoop.hive.metastore.SerDeStorageSchemaReader</value>
    </property>
    ```

10. 오류: `java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty`. FE 로그에 기록된 전체 오류 메시지는 다음과 같습니다.

    ```
    org.apache.doris.common.UserException: errCode = 2, detailMessage = S3 list path failed. path=s3://bucket/part-*,msg=errors while get file status listStatus on s3://bucket: com.amazonaws.SdkClientException: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    org.apache.doris.common.UserException: errCode = 2, detailMessage = S3 list path exception. path=s3://bucket/part-*, err: errCode = 2, detailMessage = S3 list path failed. path=s3://bucket/part-*,msg=errors while get file status listStatus on s3://bucket: com.amazonaws.SdkClientException: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    org.apache.hadoop.fs.s3a.AWSClientIOException: listStatus on s3://bucket: com.amazonaws.SdkClientException: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    Caused by: com.amazonaws.SdkClientException: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    Caused by: javax.net.ssl.SSLException: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    Caused by: java.lang.RuntimeException: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    Caused by: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    ```

    FE 노드에서 `update-ca-trust`(CentOS/RockyLinux)를 사용하여 CA 인증서를 업데이트한 후 FE 프로세스를 재시작해 봅니다.

11. BE 오류: `java.lang.InternalError`. `be.INFO`에 다음과 유사한 오류가 있는 경우:

    ```
    W20240506 15:19:57.553396 266457 jni-util.cpp:259] java.lang.InternalError
            at org.apache.hadoop.io.compress.zlib.ZlibDecompressor.init(Native Method)
            at org.apache.hadoop.io.compress.zlib.ZlibDecompressor.<init>(ZlibDecompressor.java:114)
            at org.apache.hadoop.io.compress.GzipCodec$GzipZlibDecompressor.<init>(GzipCodec.java:229)
            at org.apache.hadoop.io.compress.GzipCodec.createDecompressor(GzipCodec.java:188)
            at org.apache.hadoop.io.compress.CodecPool.getDecompressor(CodecPool.java:183)
            at org.apache.parquet.hadoop.CodecFactory$HeapBytesDecompressor.<init>(CodecFactory.java:99)
            at org.apache.parquet.hadoop.CodecFactory.createDecompressor(CodecFactory.java:223)
            at org.apache.parquet.hadoop.CodecFactory.getDecompressor(CodecFactory.java:212)
            at org.apache.parquet.hadoop.CodecFactory.getDecompressor(CodecFactory.java:43)
    ```

    Doris에 내장된 `libz.a`가 시스템 환경의 `libz.so`와 충돌하기 때문입니다. 이 문제를 해결하려면 먼저 `export LD_LIBRARY_PATH=/path/to/be/lib:$LD_LIBRARY_PATH`를 실행한 후 BE 프로세스를 재시작합니다.

12. Hive에 데이터를 삽입할 때 `HiveAccessControlException Permission denied: user [user_a] does not have [UPDATE] privilege on [database/table]` 오류가 발생합니다.

    데이터를 삽입한 후에는 관련 통계 정보를 업데이트해야 하며, 이 업데이트 작업에는 ALTER 권한이 필요합니다. 따라서 Ranger에서 해당 사용자에게 ALTER 권한을 추가해야 합니다.

13. ORC 파일을 쿼리할 때 다음과 같은 오류가
    `Orc row reader nextBatch failed. reason = Can't open /usr/share/zoneinfo/+08:00`
    발생하는 경우입니다.

    먼저 현재 세션의 `time_zone` 설정을 확인합니다. `Asia/Shanghai`와 같이 지역 기반 시간대 이름을 사용하는 것이 좋습니다.

    세션 시간대가 이미 `Asia/Shanghai`로 설정되어 있는데도 쿼리가 실패한다면 ORC 파일이 `+08:00` 시간대로 생성되었다는 의미입니다. 쿼리 실행 중 ORC 푸터를 파싱할 때 이 시간대가 필요합니다. 이 경우 `/usr/share/zoneinfo/` 디렉터리에 심볼릭 링크를 만들어 `+08:00`가 동등한 시간대를 가리키도록 해 볼 수 있습니다.

14. JSON SerDe(예: `org.openx.data.jsonserde.JsonSerDe`)를 사용하는 Hive 테이블을 쿼리할 때 발생하는 오류: `failed to get schema` 또는 `Storage schema reading not supported`

    Hive 테이블이 JSON 형식으로 저장된 경우(ROW FORMAT SERDE가 `org.openx.data.jsonserde.JsonSerDe`인 경우), Hive Metastore가 기본 방식으로 테이블의 스키마 정보를 읽지 못할 수 있습니다. 이로 인해 Doris에서 쿼리할 때 다음 오류가 발생합니다.

    ```
    errCode = 2, detailMessage = failed to get schema for table xxx in db xxx.
    reason: org.apache.hadoop.hive.metastore.api.MetaException:
    java.lang.UnsupportedOperationException: Storage schema reading not supported
    ```

    Catalog 속성에 `"get_schema_from_table" = "true"`를 추가하면 해결할 수 있습니다. 이 매개변수는 Doris가 기본 스토리지의 Schema Reader에 의존하는 대신 Hive 테이블 메타데이터에서 직접 스키마를 가져오도록 지시합니다.

    ```sql
    CREATE CATALOG hive PROPERTIES (
        'type' = 'hms',
        'hive.metastore.uris' = 'thrift://x.x.x.x:9083',
        'get_schema_from_table' = 'true'
    );
    ```

    이 매개변수는 2.1.10 및 3.0.6 버전부터 지원됩니다.

15. Hive Catalog 테이블을 쿼리할 때 쿼리 계획 수립이 매우 느리고, `nereids cost too much time` 오류가 발생하며, HMS에 접근할 때마다 일정하게 긴 시간(예: 약 10초)이 걸립니다.

    **근본 원인 분석:**

    일반적으로 이 문제는 HMS RPC 자체의 실행 속도가 느려서 발생하는 것이 아닙니다. 가장 흔한 근본 원인은 **Doris FE 노드의 잘못된 DNS 설정**입니다.
    Hive Metastore Client 초기화 단계에서는 호스트 이름 해석이 수행됩니다. 설정된 DNS 서버에 접근할 수 없거나 서버가 응답하지 않으면 새로운 HMS 클라이언트 연결을 맺을 때마다 DNS 이름 해석 타임아웃(일반적으로 10초)이 발생하여 메타데이터 조회 속도가 크게 느려집니다.

    **주요 증상:**

    - **정상적인 네트워크 연결:** HMS 포트에 접근할 수 있지만 Doris의 메타데이터 접근은 여전히 매우 느립니다.
    - **일정한 지연:** 지연 시간이 항상 고정된 타임아웃 임곗값(예: 10초)에 도달합니다.
    - **우회 방법의 한계:** Catalog 속성에서 HMS 클라이언트 타임아웃 매개변수를 늘리는 것만으로는 오류를 가릴 뿐, 연결마다 발생하는 고정된 10초 지연을 없애지 못합니다.

    **문제 해결 단계:**

    Doris FE 노드에서 다음 명령을 실행하여 DNS 및 호스트 이름 해석을 확인합니다.

    ```bash
    # Check current DNS server configuration
    cat /etc/resolv.conf
    # Test if the DNS server is reachable and measure resolution latency
    ping <nameserver_ip>
    dig @<nameserver_ip> example.com
    dig @<nameserver_ip> -x <hms_ip>
    ```

    **해결 방법(하나 선택):**
    1. **DNS 설정 수정(권장):** Doris FE 노드의 `nameserver` 항목을 `/etc/resolv.conf`에서 올바르게 수정하여 DNS 서비스에 접근할 수 있고 응답이 빠른지 확인합니다. 로컬 네트워크 환경에서 DNS가 필요하지 않다면 유효하지 않은 nameserver 항목을 주석 처리하는 것을 고려하세요.
    2. **정적 호스트 매핑 설정:** FE 노드의 `/etc/hosts`에 HMS 노드의 IP와 호스트 이름 매핑을 추가합니다.
    3. **Catalog 속성 표준화:** Catalog를 생성할 때는 IP 주소만 사용하는 대신 이름 해석이 가능한 호스트 이름을 `hive.metastore.uris` 속성에 사용하는 것을 적극 권장합니다.

16. Hive Catalog 테이블 쿼리가 간헐적으로 매우 오랫동안 멈추거나 최적화기 타임아웃 오류인 `nereids cost too much time`을 바로 반환하지만, 그 직후의 쿼리는 정상적으로 실행됩니다.

    **문제 설명:**

    이 현상은 일반적으로 Catalog를 한동안 사용하지 않은 후에 발생합니다. HMS RPC를 시작할 때 풀에 남아 있는 오래된 연결을 재사용하면 Socket Timeout(기본값 10s) 동안 요청이 멈춥니다. Hive Client의 내부 재시도 메커니즘으로 인해 여러 번 재시도하면 대기 시간이 누적되어 20-30초에 이를 수 있습니다. 이 때문에 쿼리 계획 수립 단계가 매우 느려지고, Doris FE 최적화기 타임아웃 오류인 `nereids cost too much time`이 자주 발생합니다. 해당 연결이 제거되고 다시 생성되면 성능이 정상으로 돌아옵니다.

    **근본 원인 분석:**

    Doris는 연결을 재사용하기 위해 HMS Catalog마다 Client Pool을 유지합니다. 복잡한 네트워크 환경(예: VPC 간 통신, 방화벽 또는 NAT 게이트웨이를 경유하는 환경)에서는 유휴 TCP 연결이 `idle timeout` 이후 네트워크 장비에 의해 아무런 통지 없이 회수되는 경우가 많습니다. 이러한 장비는 일반적으로 양쪽 엔드포인트에 알리는 FIN/RST 패킷을 보내지 않으므로 Doris는 여전히 연결이 유효하다고 판단합니다. 이런 "좀비 연결"을 재사용하면 Socket Timeout이 모두 경과한 후에야 실패를 감지하고 재시도를 시작합니다.

    **문제 해결 단계:**

    - Doris FE와 HMS 사이에 방화벽, NAT 게이트웨이 또는 로드 밸런서가 있는지 확인합니다.
    - **Pulse (hms-tools)** 진단 도구를 사용합니다. 도구에서 네트워크 연결은 빠르지만 오랜 유휴 시간 이후 RPC를 실행할 때 10s의 배수에 해당하는 일정한 지연이 나타난다면, 유휴 연결이 통지 없이 회수되고 있음을 확인할 수 있습니다.

    **해결 방법:**

    Catalog 속성에서 연결 수명을 네트워크 장비의 유휴 타임아웃보다 약간 짧게 설정합니다. Hive의 기본 소켓 수명 속성을 사용하는 것이 좋습니다.

    ```sql
    CREATE CATALOG hive_catalog PROPERTIES (
        "type" = "hms",
        "hive.metastore.uris" = "thrift://<hms_host>:<port>",
        -- Set a value shorter than your network's idle timeout (e.g., 300s)
        "hive.metastore.client.socket.lifetime" = "300s"
    );
    ```

    이 속성을 설정하면 HMS Client는 RPC를 보내기 전에 연결이 생성된 후 경과한 시간을 확인합니다. 이 시간이 `lifetime`을 초과하면 미리 다시 연결하여 오래된 연결로 인한 장시간 멈춤과 최적화기 타임아웃을 방지합니다.

## HDFS {#hdfs}

1. HDFS 3.x에 접근할 때 `java.lang.VerifyError: xxx` 오류가 발생하는 경우, 1.2.1 이전 버전의 Doris는 Hadoop 2.8에 의존한다는 점을 확인하세요. Hadoop을 2.10.2로 업데이트하거나 Doris를 1.2.2 이후 버전으로 업그레이드해야 합니다.

2. Hedged Read를 사용하여 느린 HDFS 읽기를 최적화합니다. 경우에 따라 HDFS의 높은 부하로 인해 특정 HDFS의 데이터 복제본을 읽는 시간이 길어져 전체 쿼리 효율이 떨어질 수 있습니다. HDFS Client는 Hedged Read 기능을 제공합니다. 이 기능은 읽기 요청이 일정 임곗값을 초과해도 반환되지 않으면 다른 읽기 스레드를 시작하여 동일한 데이터를 읽고, 먼저 반환된 결과를 사용합니다.

    참고: 이 기능은 HDFS 클러스터의 부하를 증가시킬 수 있으므로 신중하게 사용하세요.

    다음과 같이 이 기능을 활성화할 수 있습니다.

    ```sql
    CREATE CATALOG regression PROPERTIES (
        'type' = 'hms',
        'hive.metastore.uris' = 'thrift://172.21.16.47:7004',
        'dfs.client.hedged.read.threadpool.size' = '128',
        'dfs.client.hedged.read.threshold.millis' = '500'
    );
    ```

    `dfs.client.hedged.read.threadpool.size`는 Hedged Read에 사용하는 스레드 수를 나타내며, 이 스레드들은 HDFS Client에서 공유합니다. 일반적으로 동일한 HDFS 클러스터에 대해 BE 노드들은 HDFS Client를 공유합니다.
    
    `dfs.client.hedged.read.threshold.millis`는 밀리초 단위의 읽기 임곗값입니다. 읽기 요청이 이 임곗값을 초과해도 반환되지 않으면 Hedged Read가 실행됩니다.
    
    활성화하면 Query Profile에서 관련 매개변수를 확인할 수 있습니다.
    
    `TotalHedgedRead`: Hedged Read가 시작된 횟수입니다.
    
    `HedgedReadWins`: 성공한 Hedged Read 횟수입니다(추가 요청이 시작되어 원래 요청보다 빠르게 반환된 횟수).
    
    이 값은 단일 쿼리가 아닌 단일 HDFS Client의 누적 값이라는 점에 유의하세요. 동일한 HDFS Client를 여러 쿼리에서 재사용할 수 있습니다.

3. `Couldn't create proxy provider class org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider`

    FE 및 BE의 시작 스크립트에서는 환경 변수 `HADOOP_CONF_DIR`이 CLASSPATH에 추가됩니다. `HADOOP_CONF_DIR`이 존재하지 않거나 잘못된 경로를 가리키는 등 올바르게 설정되지 않은 경우, 잘못된 `xxx-site.xml` 파일을 불러와 잘못된 정보를 읽을 수 있습니다.

    `HADOOP_CONF_DIR`이 올바르게 설정되어 있는지 확인하거나 이 환경 변수를 제거합니다.

4. `BlockMissingExcetpion: Could not obtain block: BP-XXXXXXXXX No live nodes contain current block`

    다음 해결 방법을 시도할 수 있습니다.
    - `hdfs fsck file -files -blocks -locations`를 사용하여 파일이 정상인지 확인합니다.
    - `telnet`을 사용하여 DataNode와의 연결을 확인합니다.

        오류 로그에 다음 오류가 출력될 수 있습니다.
        
        ```
        No live nodes contain current block Block locations: DatanodeInfoWithStorage[10.70.150.122:50010,DS-7bba8ffc-651c-4617-90e1-6f45f9a5f896,DISK]
        ```
        
        먼저 Doris 클러스터와 `10.70.150.122:50010` 사이의 연결을 확인할 수 있습니다.
        
        또한 일부 HDFS 클러스터는 내부 및 외부 IP를 사용하는 이중 네트워크를 구성합니다. 이 경우 통신에 도메인 이름이 필요하며, Catalog 속성에 다음을 추가해야 합니다. `"dfs.client.use.datanode.hostname" = "true"`.
        
        이와 함께 `hdfs-site.xml` 파일이 있는 `fe/conf` 및 `be/conf`에서도 해당 매개변수가 true로 설정되어 있는지 확인합니다.

    - DataNode 로그를 확인합니다.

        다음 오류가 발생하는 경우:

        ```
        org.apache.hadoop.hdfs.server.datanode.DataNode: Failed to read expected SASL data transfer protection handshake from client at /XXX.XXX.XXX.XXX:XXXXX. Perhaps the client is running an older version of Hadoop which does not support SASL data transfer protection
        ```

        현재 HDFS에는 암호화된 전송이 활성화되어 있지만 클라이언트에는 활성화되어 있지 않아 발생한 오류입니다.

        다음 해결 방법 중 하나를 사용합니다.
        - `hdfs-site.xml` 및 `core-site.xml`을 `fe/conf` 및 `be/conf`에 복사합니다. (권장)
        - `hdfs-site.xml`에서 해당 설정인 `dfs.data.transfer.protection`을 찾아 Catalog에 이 매개변수를 설정합니다.

5. Hive Catalog 테이블을 쿼리할 때 발생하는 오류: `RPC response has a length of xxx exceeds maximum data length`

    예:

    ```
    RPC response has a length of 1213486160 exceeds maximum data length
    ```

    `1213486160`의 십육진수 표현은 `0x48545450`이며, ASCII 문자열 `"HTTP"`에 해당합니다. 이는 Doris FE가 HDFS NameNode RPC 포트에 연결하려 했으나 HTTP 응답을 받았다는 의미입니다.

    근본 원인은 Catalog 또는 `hdfs-site.xml`에 설정된 HDFS NameNode 포트가 잘못되었다는 것입니다. RPC 포트가 필요한 곳에 HTTP 포트가 사용되었습니다. HDFS NameNode는 일반적으로 두 가지 유형의 포트를 제공합니다.

    - **RPC 포트**(기본값: `8020` 또는 `9000`): HDFS 클라이언트 통신에 사용합니다(Doris에서 사용해야 하는 올바른 포트입니다).
    - **HTTP 포트**(기본값: `9870` 또는 `50070`): NameNode Web UI에 사용합니다.

    Catalog 속성이나 `hdfs-site.xml`에서 HDFS NameNode 포트 설정을 확인합니다. 해당 파일은 `fe/conf` 및 `be/conf`에 있으며, 포트는 RPC 포트(`dfs.namenode.rpc-address`)여야 하고 HTTP 포트(`dfs.namenode.http-address`)가 아니어야 합니다.

## DLF Catalog {#dlf-catalog}

1. DLF Catalog를 사용할 때 BE가 JindoFS 데이터를 읽는 중 `Invalid address` 오류가 발생하면 로그에 표시된 도메인 이름과 IP의 매핑을 `/etc/hosts`에 추가합니다.

2. 데이터 읽기 권한이 없다면 `hadoop.username` 속성을 사용하여 권한이 있는 사용자를 지정합니다.

3. DLF Catalog의 메타데이터는 DLF와 일치해야 합니다. DLF로 메타데이터를 관리할 때 Hive에 새로 가져온 파티션이 DLF에 의해 동기화되지 않아 DLF와 Hive의 메타데이터가 일치하지 않을 수 있습니다. 이를 해결하려면 DLF가 Hive 메타데이터를 완전히 동기화하도록 해야 합니다.

## 기타 문제 {#other-issues}

1. Binary 타입을 Doris에 매핑한 후 쿼리 결과의 문자가 깨지는 경우

    Doris는 기본적으로 Binary 타입을 지원하지 않으므로 다양한 데이터 레이크나 데이터베이스의 Binary 타입을 Doris에 매핑할 때는 일반적으로 String 타입을 사용합니다. String 타입은 출력 가능한 문자만 표시할 수 있습니다. Binary 데이터의 내용을 쿼리해야 한다면 `TO_BASE64()` 함수를 사용하여 Base64 인코딩으로 변환한 후 추가로 처리할 수 있습니다.

2. Parquet 파일 분석

    Parquet 파일을 쿼리할 때는 시스템마다 생성하는 Parquet 파일의 형식이 다를 수 있습니다. 예를 들어 RowGroups의 수나 인덱스 값 등이 다를 수 있으므로, 문제를 파악하거나 성능을 분석하기 위해 Parquet 파일의 메타데이터를 확인해야 할 때가 있습니다. 사용자가 Parquet 파일을 더 편리하게 분석할 수 있도록 다음 도구를 제공합니다.

    1. [Apache Parquet Cli 1.14.0](https://github.com/morningman/tools/releases/download/apache-parquet-cli-1.14.0/apache-parquet-cli-1.14.0.tar.xz)을 다운로드하고 압축을 풉니다.
    2. 분석할 Parquet 파일을 로컬 컴퓨터로 다운로드합니다. 파일 경로는 `/path/to/file.parquet`이라고 가정합니다.
    3. 다음 명령을 사용하여 Parquet 파일의 메타데이터를 분석합니다.

        `./parquet-tools meta /path/to/file.parquet`

    4. 더 많은 기능은 [Apache Parquet Cli 문서](https://github.com/apache/parquet-java/tree/apache-parquet-1.14.0/parquet-cli)를 참조하세요.

## 진단 도구 {#diagnostic-tools}

### Pulse {#pulse}

[Pulse](https://github.com/CalvinKirs/Pulse)는 데이터 레이크 환경의 인프라 의존성을 진단하도록 설계된 경량 연결 테스트 도구 모음입니다. 외부 테이블에 접근할 때 발생하는 환경 관련 문제를 빠르게 파악할 수 있도록 여러 전문 도구를 포함합니다.

Pulse는 다음과 같은 주요 도구 모음으로 구성됩니다.

1.  **HMS 진단 도구 (`hms-tools`)**:
    *   Hive Metastore(HMS) 문제 해결을 위해 특별히 설계되었습니다.
    *   상태 확인, ping 테스트, 객체 메타데이터 조회 및 설정 진단을 지원합니다.
    *   **성능 벤치마킹**: `bench` 모드를 제공하여 HMS의 응답 분포와 지연 시간을 측정하고, 메타데이터 계층이 병목인지 판단하는 데 도움을 줍니다.

2.  **Kerberos 진단 도구 (`kerberos-tools`)**:
    *   Kerberos 인증을 사용하는 환경에서 `krb5.conf` 설정을 검증하는 데 사용합니다.
    *   KDC 접근 가능 여부 테스트, keytab 파일 검사 및 로그인 테스트를 지원하여 보안 계층이 연결을 차단하고 있지 않은지 확인합니다.

3.  **객체 스토리지 진단 도구 (`s3-tools`, `gcs-tools`, `azure-blob-cpp`)**:
    *   주요 클라우드 스토리지 서비스(AWS S3, Google GCS, Azure Blob Storage)를 위한 진단 도구입니다.
    *   "액세스 거부" 또는 "버킷을 찾을 수 없음"과 같은 일반적인 외부 테이블 접근 문제를 해결하는 데 사용합니다.
    *   자격 증명 출처 및 STS 자격 정보 검증과 버킷 수준 작업 테스트를 지원합니다.

**명령 예제(HMS):**

```bash
# Test basic HMS connectivity and latency details using hms-tools
java -jar hms-tools.jar ping --uris thrift://<hms_host>:<port> --count 3 --verbose

# Benchmark actual metadata RPC response distribution using hms-tools
java -jar hms-tools.jar bench --uris thrift://<hms_host>:<port> --rpc get_all_databases --iterations 10
```

메타데이터 접근이 느리거나 외부 테이블 연결에 실패하면 문제 유형(예: 인증 실패, 느린 메타데이터 조회, 스토리지 접근 불가)에 맞는 Pulse 도구를 사용하여 조사하는 것이 좋습니다. `connect` 단계는 매우 빠르지만 전체 초기화 과정에서 크고 일정한 지연이 발생한다면, 위의 FAQ를 참조하여 FE 노드의 DNS 및 호스트 이름 해석 설정을 확인하세요.
