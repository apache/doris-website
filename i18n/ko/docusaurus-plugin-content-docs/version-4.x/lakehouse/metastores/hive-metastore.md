---
{
    "title": "Hive Metastore",
    "language": "ko",
    "description": "이 문서는 CREATE CATALOG 문을 통해 Hive MetaStore 서비스에 연결하고 접근할 때 지원되는 모든 매개변수를 설명합니다."
}
---

이 문서는 `CREATE CATALOG` 문을 통해 Hive MetaStore 서비스에 연결하고 접근할 때 지원되는 모든 매개변수를 설명합니다.

## 지원되는 Catalog 유형 {#supported-catalog-types}

| Catalog 유형 | 유형 식별자 (type) | 설명                      |
| ------------ | ---------------------- | -------------------------------- |
| Hive         | hms                    | Hive Metastore에 연결하는 Catalog |
| Iceberg      | iceberg                | Iceberg 테이블 형식용 Catalog |
| Paimon       | paimon                 | Apache Paimon 테이블 형식용 Catalog |

## 공통 매개변수 개요 {#common-parameters-overview}

다음 매개변수는 여러 Catalog 유형에서 공통으로 사용됩니다.

| 매개변수 이름                     | 이전 이름                       | 필수 여부 | 기본값 | 설명                                                                                                                                                                              |
| ---------------------------------- | --------------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| hive.metastore.uris                |                                   | 예      | 없음    | Hive Metastore의 URI 주소입니다. 쉼표로 구분하여 여러 URI를 지정할 수 있습니다. 예: 'hive.metastore.uris' = 'thrift://127.0.0.1:9083','hive.metastore.uris' = 'thrift://127.0.0.1:9083,thrift://127.0.0.1:9084' |
| hive.metastore.authentication.type | hadoop.security.authentication    | 아니요       | simple  | Metastore 인증 방식입니다. simple(기본값) 또는 kerberos를 지원합니다. 3.0 이하 버전에서는 hadoop.security.authentication 속성으로 인증 방식이 결정되었습니다. 3.1 버전부터는 Hive Metastore 인증 방식을 별도로 지정할 수 있습니다. 예: 'hive.metastore.authentication.type' = 'kerberos' |
| hive.metastore.service.principal   | hive.metastore.kerberos.principal | 아니요       | 빈 값   | Hive 서버 principal입니다. _HOST 플레이스홀더를 지원합니다. 예: 'hive.metastore.service.principal' = 'hive/_HOST@EXAMPLE.COM'                                                               |
| hive.metastore.client.principal    | hadoop.kerberos.principal         | 아니요       | 빈 값   | Doris가 Hive MetaStore 서비스에 연결할 때 사용하는 Kerberos principal입니다.                                                                                                                  |
| hive.metastore.client.keytab       | hadoop.kerberos.keytab            | 아니요       | 빈 값   | Kerberos keytab 파일 경로입니다.                                                                                                                                                               |
| hive.metastore.username            | hadoop.username                   | 아니요       | hadoop  | Hive Metastore 사용자 이름으로, Kerberos를 사용하지 않는 모드에서 사용됩니다.                                                                                                                                      |
| hive.conf.resources                |                                   | 아니요       | 빈 값   | hive-site.xml 구성 파일 경로로, 상대 경로를 사용합니다.                                                                                                                             |
| hive.metastore.client.socket.timeout                |                                   | 아니요    | 기본값은 FE 구성 매개변수 `hive_metastore_client_timeout_second`의 값이며, 해당 매개변수의 기본값은 10초입니다. | 이 매개변수는 4.0.3 버전부터 지원됩니다. Hive Metastore Client 연결을 통해 메타데이터에 접근할 때의 제한 시간입니다. 메타데이터의 양이 많으면(예: 파티션이 많은 경우) 이 값을 늘릴 수 있습니다. |

> 참고:
>
> 3.1.0 이전 버전에서는 이전 이름을 사용하세요.

### 필수 매개변수 {#required-parameters}

* `hive.metastore.uris`: Hive Metastore의 URI 주소를 반드시 지정해야 합니다.

### 선택적 매개변수 {#optional-parameters}

* `hive.metastore.authentication.type`: 인증 방식입니다. 기본값은 `simple`이며, `kerberos`도 선택할 수 있습니다.

* `hive.metastore.service.principal`: Hive MetaStore 서비스의 Kerberos principal입니다. Kerberos 인증을 사용할 때 반드시 지정해야 합니다.

* `hive.metastore.client.principal`: Doris가 Hive MetaStore 서비스에 연결할 때 사용하는 Kerberos principal입니다. Kerberos 인증을 사용할 때 반드시 지정해야 합니다.

* `hive.metastore.client.keytab`: Kerberos keytab 파일 경로입니다. Kerberos 인증을 사용할 때 반드시 지정해야 합니다.

* `hive.metastore.username`: Hive MetaStore 서비스에 연결할 때 사용하는 사용자 이름입니다. Kerberos를 사용하지 않는 모드에서 사용되며, 기본값은 `hadoop`입니다.

* `hive.conf.resources`: hive-site.xml 구성 파일 경로입니다. Hive Metastore 서비스에 연결하기 위한 구성을 구성 파일에서 읽어야 할 때 사용합니다.

### 인증 방식 {#authentication-methods}

#### Simple 인증 {#simple-authentication}

* `simple`: Kerberos를 사용하지 않는 모드로, Hive Metastore 서비스에 직접 연결합니다.

#### Kerberos 인증 {#kerberos-authentication}

Kerberos 인증을 사용하여 Hive Metastore 서비스에 연결하려면 다음 매개변수를 구성하세요.

* `hive.metastore.authentication.type`: `kerberos`로 설정합니다.

* `hive.metastore.service.principal`: Hive MetaStore 서비스의 Kerberos principal입니다.

* `hive.metastore.client.principal`: Doris가 Hive MetaStore 서비스에 연결할 때 사용하는 Kerberos principal입니다.

* `hive.metastore.client.keytab`: Kerberos keytab 파일 경로입니다.

```sql
'hive.metastore.authentication.type' = 'kerberos',
'hive.metastore.service.principal' = 'hive/_HOST@EXAMPLE.COM',
'hive.metastore.client.principal' = 'hive/doris.cluster@EXAMPLE.COM',
'hive.metastore.client.keytab' = '/etc/security/keytabs/hive.keytab'
```

Kerberos 인증이 활성화된 Hive MetaStore 서비스를 사용할 때는 모든 FE 노드에 동일한 keytab 파일이 있어야 합니다. 또한 Doris 프로세스를 실행하는 사용자에게 keytab 파일 읽기 권한이 있어야 하며, krb5 구성 파일이 올바르게 구성되어 있어야 합니다.

일반적인 Kerberos 구성 문제와 모범 사례는 [Kerberos](../best-practices/kerberos.md)를 참고하세요.

### 구성 파일 매개변수 {#configuration-file-parameters}

#### `hive.conf.resources` {#hiveconfresources}

Hive Metastore 서비스에 연결하기 위한 구성을 구성 파일에서 읽어야 하는 경우, `hive.conf.resources` 매개변수로 구성 파일 경로를 설정할 수 있습니다.

> 참고: `hive.conf.resources` 매개변수는 상대 경로만 지원하므로 절대 경로를 사용하지 마세요. 기본 경로는 `${DORIS_HOME}/plugins/hadoop_conf/` 디렉터리 아래입니다. fe.conf의 hadoop_config_dir을 수정하여 다른 디렉터리를 지정할 수 있습니다.

예: `'hive.conf.resources' = 'hms-1/hive-site.xml'`

## Catalog 유형별 정보 {#catalog-type-specific-data}

다음은 공통 매개변수 외에 각 Catalog 유형에서 사용하는 전용 매개변수입니다.

### Hive Catalog {#hive-catalog}

| 매개변수 이름      | 이전 이름 | 필수 여부 | 기본값 | 설명                                                          |
| ------------------- | ----------- | -------- | ------- | -------------------------------------------------------------------- |
| type                |             | 예      | 없음    | Catalog 유형으로, Hive Catalog에서는 hms로 고정됩니다.                         |
| hive.metastore.type |             | 아니요       | 'hms'   | 메타데이터 Catalog 유형으로, Hive Metastore에서는 hms로 고정됩니다. HiveMetaStore를 사용할 때는 반드시 hms여야 합니다. |

#### 예제 {#examples}

1. 인증을 사용하지 않는 Hive Metastore를 메타데이터 서비스로 사용하고 S3 스토리지 서비스를 사용하는 Hive Catalog를 생성합니다.

   ```sql
   CREATE CATALOG hive_hms_s3_test_catalog PROPERTIES (
       'type' = 'hms',
       'hive.metastore.uris' = 'thrift://127.0.0.1:9383',
       's3.access_key' = 'S3_ACCESS_KEY',
       's3.secret_key' = 'S3_SECRET_KEY',
       's3.region' = 's3.ap-east-1.amazonaws.com'
   );
   ```

2. Kerberos 인증이 활성화된 Hive Metastore를 메타데이터 서비스로 사용하고 S3 스토리지 서비스를 사용하는 Hive Catalog를 생성합니다.

   ```sql
    CREATE CATALOG hive_hms_on_oss_kerberos_new_catalog PROPERTIES (
       'type' = 'hms',
       'hive.metastore.uris' = 'thrift://127.0.0.1:9583',
       'hive.metastore.client.principal'='hive/presto-master.docker.cluster@LABS.TERADATA.COM',
       'hive.metastore.client.keytab' = '/mnt/keytabs/hive-presto-master.keytab',
       'hive.metastore.service.principal' = 'hive/hadoop-master@LABS.TERADATA.COM',
       'hive.metastore.authentication.type'='kerberos',
       'hadoop.security.auth_to_local' = 'RULE:[2:\$1@\$0](.*@LABS.TERADATA.COM)s/@.*//
                          RULE:[2:\$1@\$0](.*@OTHERLABS.TERADATA.COM)s/@.*//
                          RULE:[2:\$1@\$0](.*@OTHERREALM.COM)s/@.*//
                          DEFAULT',
       'oss.access_key' = 'OSS_ACCESS_KEY',
       'oss.secret_key' = 'OSS_SECRET_KEY',
       'oss.endpoint' = 'oss-cn-beijing.aliyuncs.com'
   );
   ```

### Iceberg Catalog {#iceberg-catalog}

| 매개변수 이름       | 이전 이름 | 필수 여부 | 기본값 | 설명                                                          |
| -------------------- | ----------- | -------- | ------- | -------------------------------------------------------------------- |
| type                 |             | 예      | 없음    | Catalog 유형으로, Iceberg에서는 iceberg로 고정됩니다.                          |
| iceberg.catalog.type |             | 아니요       | 없음    | 메타데이터 Catalog 유형으로, Hive Metastore에서는 hms로 고정됩니다. HiveMetaStore를 사용할 때는 반드시 hms여야 합니다. |
| warehouse            |             | 아니요       | 없음    | Iceberg warehouse 경로입니다.                                               |

#### 예제 {#examples-1}

1. Hive Metastore를 메타데이터 서비스로 사용하고 S3 스토리지 서비스를 사용하는 Iceberg Catalog를 생성합니다.

    ```sql
     CREATE CATALOG iceberg_hms_s3_test_catalog PROPERTIES (
        'type' = 'iceberg',
        'iceberg.catalog.type' = 'hms',
        'hive.metastore.uris' = 'thrift://127.0.0.1:9383',
        'warehouse' = 's3://doris/iceberg_warehouse/',
        's3.access_key' = 'S3_ACCESS_KEY',
        's3.secret_key' = 'S3_SECRET_KEY',
        's3.region' = 's3.ap-east-1.amazonaws.com'
    );
    ```

2. 여러 Kerberos 환경에서 Kerberos 인증이 활성화된 Hive Metastore를 메타데이터 서비스로 사용하고 S3 스토리지 서비스를 사용하는 Iceberg Catalog를 생성합니다.

    ```sql
    CREATE CATALOG IF NOT EXISTS iceberg_hms_on_oss_kerberos_new_catalog PROPERTIES (
        'type' = 'iceberg',
        'iceberg.catalog.type' = 'hms',
        'hive.metastore.uris' = 'thrift://127.0.0.1:9583',
        'warehouse' = 'oss://doris/iceberg_warehouse/',
        'hive.metastore.client.principal'='hive/presto-master.docker.cluster@LABS.TERADATA.COM',
        'hive.metastore.client.keytab' = '/mnt/keytabs/hive-presto-master.keytab',
        'hive.metastore.service.principal' = 'hive/hadoop-master@LABS.TERADATA.COM',
        'hive.metastore.authentication.type'='kerberos',
        'hadoop.security.auth_to_local' = 'RULE:[2:\$1@\$0](.*@LABS.TERADATA.COM)s/@.*//
                           RULE:[2:\$1@\$0](.*@OTHERLABS.TERADATA.COM)s/@.*//
                           RULE:[2:\$1@\$0](.*@OTHERREALM.COM)s/@.*//
                           DEFAULT',
        'oss.access_key' = 'OSS_ACCESS_KEY',
        'oss.secret_key' = 'OSS_SECRET_KEY',
        'oss.endpoint' = 'oss-cn-beijing.aliyuncs.com'
    );
    ```

### Paimon Catalog {#paimon-catalog}

| 매개변수 이름      | 이전 이름 | 필수 여부 | 기본값    | 설명                                                         |
| ------------------- | ----------- | -------- | ---------- | ------------------------------------------------------------------- |
| type                |             | 예      | 없음       | Catalog 유형으로, Paimon에서는 paimon으로 고정됩니다.                           |
| paimon.catalog.type |             | 아니요       | filesystem | HiveMetaStore를 사용할 때는 반드시 hms여야 합니다. 기본값은 메타데이터를 파일 시스템에 저장하는 filesystem입니다. |
| warehouse           |             | 예      | 없음       | Paimon warehouse 경로입니다.                                               |

#### 예제 {#examples-2}

1. Hive Metastore를 메타데이터 서비스로 사용하고 S3 스토리지 서비스를 사용하는 Paimon Catalog를 생성합니다.

    ```sql
     CREATE CATALOG IF NOT EXISTS paimon_hms_s3_test_catalog PROPERTIES (
        'type' = 'paimon',
        'paimon.catalog.type' = 'hms',
        'hive.metastore.uris' = 'thrift://127.0.0.1:9383',
        'warehouse' = 's3://doris/paimon_warehouse/',
        's3.access_key' = 'S3_ACCESS_KEY',
        's3.secret_key' = 'S3_SECRET_KEY',
        's3.region' = 's3.ap-east-1.amazonaws.com'
    );
    ```

2. 여러 Kerberos 환경에서 Kerberos 인증이 활성화된 Hive Metastore를 메타데이터 서비스로 사용하고 S3 스토리지 서비스를 사용하는 Paimon Catalog를 생성합니다.

    ```sql
     CREATE CATALOG IF NOT EXISTS paimon_hms_on_oss_kerberos_new_catalog PROPERTIES (
        'type' = 'paimon',
        'paimon.catalog.type' = 'hms',
        'hive.metastore.uris' = 'thrift://127.0.0.1:9583',
        'warehouse' = 's3://doris/iceberg_warehouse/',
        'hive.metastore.client.principal'='hive/presto-master.docker.cluster@LABS.TERADATA.COM',
        'hive.metastore.client.keytab' = '/mnt/keytabs/hive-presto-master.keytab',
        'hive.metastore.service.principal' = 'hive/hadoop-master@LABS.TERADATA.COM',
        'hive.metastore.authentication.type'='kerberos',
        'hadoop.security.auth_to_local' = 'RULE:[2:\$1@\$0](.*@LABS.TERADATA.COM)s/@.*//
                           RULE:[2:\$1@\$0](.*@OTHERLABS.TERADATA.COM)s/@.*//
                           RULE:[2:\$1@\$0](.*@OTHERREALM.COM)s/@.*//
                           DEFAULT',
        'oss.access_key' = 'OSS_ACCESS_KEY',
        'oss.secret_key' = 'OSS_SECRET_KEY',
        'oss.endpoint' = 'oss-cn-beijing.aliyuncs.com'
    );
    ```
## HMS 접근 포트 요구 사항 {#hms-access-port-requirements}

Doris가 HMS에 접근하려면 최소한 다음 포트가 열려 있어야 합니다.

| 서비스        | 포트 용도          | 기본 포트 | 프로토콜 |
|----------------|-----------------------|--------------|----------|
| Hive Metastore | Thrift (메타데이터 접근) | 9083         | TCP      |

참고:
- 포트는 `hive-site.xml`에서 변경할 수 있습니다. 항상 실제 구성을 따르세요.
- Kerberos 인증이 활성화된 경우, Doris에서 Kerberos KDC로 네트워크 연결이 가능한지 확인하세요. KDC 구성에서 변경하지 않았다면 KDC는 기본적으로 TCP 포트 88에서 수신 대기합니다.

## 자주 묻는 질문(FAQ) {#frequently-asked-questions-faq}

- Q1: hive-site.xml은 필수인가요?

    아니요. 해당 파일에서 구성을 읽어야 할 때만 사용합니다.

- Q2: 모든 노드에 keytab 파일이 있어야 하나요?

    예. 모든 FE 노드에서 지정된 경로에 접근할 수 있어야 합니다.

- Q3: 쓰기 기능, 즉 Doris에서 Hive/Iceberg 데이터베이스/테이블을 생성할 때 무엇에 주의해야 하나요?

    테이블 생성에는 스토리지 측 메타데이터 작업, 즉 스토리지 시스템 접근이 수반되므로, Hive MetaStore 서비스 서버 측에 해당 스토리지 매개변수를 구성해야 합니다. 예를 들어 S3, OSS 및 기타 스토리지 서비스의 접근 매개변수를 구성해야 합니다. 객체 스토리지를 기반 스토리지 시스템으로 사용할 때는 쓰기 대상 버킷이 구성된 Region과 일치하는지 확인하세요.
