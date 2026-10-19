---
{
    "title": "Kerberos 모범 사례",
    "language": "ko",
    "description": "사용자가 Doris를 사용하여 여러 데이터 소스에 걸친 연합 분석 쿼리를 실행할 때,"
}
---

사용자가 Doris를 사용하여 여러 데이터 소스에 걸친 연합 분석 쿼리를 실행할 때, 클러스터마다 서로 다른 Kerberos 인증 자격 증명을 사용할 수 있습니다.

대형 펀드 운용사를 예로 들어 보겠습니다. 이 회사의 내부 데이터 플랫폼은 기능별로 여러 클러스터로 나뉘며, 각 클러스터는 서로 다른 기술 팀이나 업무 팀이 관리합니다. 각 클러스터에는 신원 인증과 접근 제어를 위한 독립적인 Kerberos Realm이 구성되어 있습니다:

- 운영 클러스터는 일일 순자산가치 계산과 위험 평가에 사용되며, 데이터가 엄격하게 격리되어 허가된 서비스만 접근할 수 있습니다(Realm: PROD.FUND.COM).
- 분석 클러스터는 전략 연구와 모델 백테스트에 사용되며, Doris는 TVF를 통해 이 클러스터에 대한 임시 쿼리를 실행합니다(Realm: ANALYSIS.FUND.COM).
- 데이터 레이크 클러스터는 Iceberg Catalog를 통합하여 대규모 과거 시장 데이터, 로그 및 기타 데이터를 보관하고 분석합니다(Realm: LAKE.FUND.COM).

이 클러스터들 사이에는 도메인 간 신뢰 관계가 설정되어 있지 않아 인증 정보를 공유할 수 없습니다. 따라서 이러한 이기종 데이터 소스에 통합적으로 접근하려면 여러 Kerberos 인스턴스의 인증 및 컨텍스트 관리를 동시에 지원해야 합니다.

**이 문서에서는 다중 Kerberos 환경에서 데이터 소스를 구성하고 접근하는 방법을 중점적으로 설명합니다.**

> 이 기능은 3.1+부터 지원됩니다.

## 다중 Kerberos 클러스터 인증 구성 {#multi-kerberos-cluster-authentication-configuration}

### krb5.conf {#krb5conf}

`krb5.conf`에는 Kerberos 구성 정보, KDC 위치, Kerberos 서비스의 일부 **기본값**, 호스트 이름과 Realm 간 매핑 정보가 포함되어 있습니다.

krb5.conf를 적용할 때는 모든 노드에 파일을 배치해야 합니다. 기본 위치는 `/etc/krb5.conf`입니다.

### realms {#realms}

EXAMPLE.COM과 같은 여러 클라이언트의 KDC 및 Kerberos 네트워크 정보를 포함합니다.

여러 클러스터를 구성할 때는 하나의 `krb5.conf`에 여러 Realm을 구성해야 합니다. KDC와 `admin_server`에는 도메인 이름을 사용할 수도 있습니다.

```
[realms]
EMR-IP.EXAMPLE = {
    kdc = 172.21.16.8:88
    admin_server = 172.21.16.8
}
EMR-HOST.EXAMPLE = {
    kdc = emr_hostname
    admin_server = emr_hostname
}
```

### domain_realm {#domain_realm}

Kerberos 서비스가 위치한 노드의 도메인과 Realm 간 매핑을 구성합니다.

```toml
[libdefaults]
dns_lookup_realm = true
dns_lookup_kdc = true
[domain_realm]
172.21.16.8 = EMR-IP.EXAMPLE
emr-host.example = EMR-HOST.EXAMPLE
```

예를 들어 principal이 `emr1/domain_name@realm.com`인 경우, KDC를 조회할 때 `domain_name`을 사용하여 해당 Realm을 찾습니다. 일치하는 항목이 없으면 해당 Realm의 KDC를 찾을 수 없습니다.

Doris의 `log/be.out` 또는 `log/fe.out`에서 `domain_realm`과 관련된 다음 두 가지 오류가 자주 나타납니다:

```
* Unable to locate KDC for realm/Cannot locate KDC

* No service creds
```

### keytab 및 principal {#keytab-and-principal}

다중 Kerberos 클러스터 환경에서는 일반적으로 keytab 파일마다 다른 경로를 사용합니다. 예: `/path/to/serverA.keytab`, `/path/to/serverB.keytab`. 서로 다른 클러스터에 접근할 때는 해당 클러스터의 keytab을 사용해야 합니다.

HDFS 클러스터에서 Kerberos 인증이 활성화되어 있으면, 일반적으로 `hadoop.security.auth_to_local` 속성을 `core-site.xml` 파일에서 확인할 수 있습니다. 이 속성은 Kerberos principal을 짧은 로컬 사용자 이름으로 매핑하는 데 사용되며, Hadoop은 Kerberos 구문 규칙을 재사용합니다.

이 속성을 구성하지 않으면 `NoMatchingRule("No rules applied to` 예외가 발생할 수 있습니다. 다음 코드를 참고하세요:

[hadoop/src/core/org/apache/hadoop/security/KerberosName.java](https://github.com/hanborq/hadoop/blob/master/src/core/org/apache/hadoop/security/KerberosName.java#L399)

`hadoop.security.auth_to_local` 매개변수에는 principal을 위에서 아래 순서대로 RULE과 대조하는 매핑 규칙 집합이 포함됩니다. 일치하는 매핑 규칙을 찾으면 사용자 이름을 출력하고 일치하지 않는 규칙은 무시합니다. 구체적인 구성 형식은 다음과 같습니다:

```
RULE:[<principal translation>](acceptance filter)<short name substitution>
```

다중 클러스터 환경에서 서로 다른 Kerberos 서비스가 사용하는 principal을 매칭하려면 다음 구성을 권장합니다:

```xml
<property>
    <name>hadoop.security.auth_to_local</name>
    <value>RULE:[1:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
           RULE:[2:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
           DEFAULT</value>
</property>
```

위 설정을 사용하여 `hadoop.security.auth_to_local` 속성을 `core-site.xml`에 추가하거나 기존 속성을 교체할 수 있습니다. `core-site.xml`을 `fe/conf`와 `be/conf`에 배치하면 Doris 환경에 적용됩니다.

OUTFILE, EXPORT, Broker Load, Catalog (Hive, Iceberg, Hudi), TVF 등의 기능에 개별적으로 적용하려면 각 기능의 속성에서 직접 구성할 수 있습니다:

```sql
"hadoop.security.auth_to_local" = "RULE:[1:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
                                   RULE:[2:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
                                   DEFAULT"
```

매핑 규칙이 올바르게 일치하는지 검증하려면 서로 다른 클러스터에 접근할 때 다음 오류가 발생하는지 확인합니다:

```
NoMatchingRule: No rules applied to hadoop/domain\_name@EMR-REALM.COM
```

이 오류가 나타나면 매핑이 일치하지 않은 것입니다.

## 모범 사례 {#best-practices}

이 절에서는 [Apache Doris 공식 저장소](https://github.com/apache/doris/tree/master/docker/thirdparties)에서 제공하는 Docker 환경을 사용하여 Kerberos가 적용된 Hive/HDFS 서비스를 Docker로 시작하고, Doris에서 Kerberos가 활성화된 Hive Catalog를 생성하는 방법을 설명합니다.

### 환경 설명 {#environment-description}

* Doris에서 제공하는 Kerberos 서비스를 사용합니다(HIVE 두 세트, KDC 두 세트):

  * Docker 시작 디렉터리: `docker/thirdparties`

  * krb5.conf 템플릿:

    [`docker-compose/kerberos/common/conf/doris-krb5.conf`](https://github.com/apache/doris/blob/master/docker/thirdparties/docker-compose/kerberos/common/conf/doris-krb5.conf)

### 1. keytab 파일 및 권한 준비 {#1-prepare-keytab-files-and-permissions}

로컬 디렉터리에 keytab 파일을 복사합니다:

```bash
mkdir -p ~/doris-keytabs
cp <hive-presto-master.keytab> ~/doris-keytabs/
cp <other-hive-presto-master.keytab> ~/doris-keytabs/
```

인증 실패를 방지하도록 파일 권한을 설정합니다:

```bash
chmod 400 ~/doris-keytabs/*.keytab
```

### 2. krb5.conf 파일 준비 {#2-prepare-krb5conf-file}

1. Doris에서 제공하는 `krb5.conf` 템플릿 파일을 사용합니다.

2. 여러 Kerberos HDFS 클러스터에 동시에 접근해야 한다면 **krb5.conf를 병합**해야 합니다. 기본 요구 사항은 다음과 같습니다:

   * `[realms]`: 모든 클러스터의 Realm과 KDC IP를 작성합니다.

   * `[domain_realm]`: 도메인 또는 IP와 Realm 간 매핑을 작성합니다.

   * `[libdefaults]`: 암호화 알고리즘을 통일합니다(예: des3-cbc-sha1).

3. 예시:

    ```toml
    [libdefaults]
        default_realm = LABS.TERADATA.COM
        allow_weak_crypto = true
        dns_lookup_realm = true
        dns_lookup_kdc = true

    [realms]
        LABS.TERADATA.COM = {
            kdc = 127.0.0.1
            admin_server = 127.0.0.1
        }
        OTHERREALM.COM = {
            kdc = 127.0.0.1
            admin_server = 127.0.0.1
        }

    [domain_realm]
        presto-master.docker.cluster = LABS.TERADATA.COM
        hadoop-master-2 = OTHERREALM.COM
        .labs.teradata.com = LABS.TERADATA.COM
        .otherrealm.com = OTHERREALM.COM
    ```

4. `krb5.conf`를 해당 Docker 디렉터리에 복사합니다:

    ```bash
    cp doris-krb5.conf ~/doris-kerberos/krb5.conf
    ```

### 3. Docker Kerberos 환경 시작 {#3-start-docker-kerberos-environment}

1. 디렉터리로 이동합니다:

    ```bash
    cd docker/thirdparties
    ```

2. Kerberos 환경을 시작합니다:

    ```bash
    ./run-thirdparties-docker.sh -c kerberos
    ```

3. 시작 후 다음 서비스가 실행됩니다:

   * Hive Metastore 1:9583
   * Hive Metastore 2:9683
   * HDFS 1:8520
   * HDFS 2:8620

### 4. 컨테이너 IP 확인 {#4-get-container-ip}

다음 명령으로 Docker IP를 확인합니다:

```bash
docker inspect <container-name> | grep IPAddress
```

또는 127.0.0.1을 직접 사용할 수 있습니다(서비스가 호스트 네트워크에 매핑되어 있어야 합니다).

### 5. Kerberos Hive Catalog 생성 {#5-create-kerberos-hive-catalog}

1. Hive Catalog1

    ```sql
    CREATE CATALOG IF NOT EXISTS multi_kerberos_one
    PROPERTIES (
    "type" = "hms",
    "hive.metastore.uris" = "thrift://127.0.0.1:9583",
    "fs.defaultFS" = "hdfs://127.0.0.1:8520",
    "hadoop.kerberos.min.seconds.before.relogin" = "5",
    "hadoop.security.authentication" = "kerberos",
    "hadoop.kerberos.principal" = "hive/presto-master.docker.cluster@LABS.TERADATA.COM",
    "hadoop.kerberos.keytab" = "/mnt/disk1/gq/keytabs/hive-presto-master.keytab",
    "hive.metastore.sasl.enabled" = "true",
    "hadoop.security.auth_to_local" = "RULE:[2:$1@$0](.*@LABS.TERADATA.COM)s/@.*//
                                        RULE:[2:$1@$0](.*@OTHERLABS.TERADATA.COM)s/@.*//
                                        RULE:[2:$1@$0](.*@OTHERREALM.COM)s/@.*//
                                        DEFAULT",
    "hive.metastore.kerberos.principal" = "hive/hadoop-master@LABS.TERADATA.COM"
    );
    ```

2. Hive Catalog2

    ```sql
    CREATE CATALOG IF NOT EXISTS multi_kerberos_two
    PROPERTIES (
    "type" = "hms",
    "hive.metastore.uris" = "thrift://127.0.0.1:9683",
    "fs.defaultFS" = "hdfs://127.0.0.1:8620",
    "hadoop.kerberos.min.seconds.before.relogin" = "5",
    "hadoop.security.authentication" = "kerberos",
    "hadoop.kerberos.principal" = "hive/presto-master.docker.cluster@OTHERREALM.COM",
    "hadoop.kerberos.keytab" = "/mnt/disk1/gq/keytabs/other-hive-presto-master.keytab",
    "hive.metastore.sasl.enabled" = "true",
    "hadoop.security.auth_to_local" = "RULE:[2:$1@$0](.*@OTHERREALM.COM)s/@.*//
                                        RULE:[2:$1@$0](.*@OTHERLABS.TERADATA.COM)s/@.*//
                                        DEFAULT",
    "hive.metastore.kerberos.principal" = "hive/hadoop-master-2@OTHERREALM.COM"
    );
    ```

이제 다중 Kerberos 클러스터 접근 구성이 완료되었습니다. 서로 다른 Kerberos 자격 증명을 사용하여 두 Hive 클러스터의 데이터를 조회할 수 있습니다.
## 연결 테스트 도구 {#connectivity-testing-tool}

Kerberos와 같은 외부 의존 대상과의 연결을 확인하는 데는
오픈 소스 도구인 **Pulse**를 사용할 수 있습니다.

**Pulse는 독립적인 오픈 소스 연결 테스트 도구입니다.
사용 방법, 설치 세부 정보 및 릴리스 정보는
프로젝트 문서를 참고하세요.**

- 문서: [Kerberos 연결 도구](https://github.com/CalvinKirs/Pulse/tree/main/kerberos-tools)
- 릴리스 패키지: [Kerberos 연결 도구 v1.0.0](https://github.com/CalvinKirs/Pulse/releases/tag/v1.0.0)
## 자주 묻는 질문 {#faq}
1. javax.security.sasl.SaslException: No common protection layer between client and server
   - 원인: 클라이언트의 `hadoop.rpc.protection`이 HDFS 클러스터 설정과 다릅니다.
   - 해결 방법: `hadoop.rpc.protection`을 클라이언트와 HDFS 서버에서 동일하게 설정합니다.

2. No valid credentials provided (Mechanism level: Illegal key size)
   - 원인: Java는 기본적으로 128비트보다 긴 암호화 키를 지원하지 않습니다.
   - 해결 방법: Java Cryptography Extension (JCE) Unlimited Strength Policy를 설치합니다. 압축을 풀어 JAR 파일을 `$JAVA_HOME/jre/lib/security`에 넣은 후 서비스를 다시 시작합니다.

3. Encryption type AES256 CTS mode with HMAC SHA1-96 is not supported/enabled
   - 원인: 현재 Java 환경은 AES256을 지원하지 않지만 Kerberos는 이를 사용할 수 있습니다.
   - 해결 방법: `/etc/krb5.conf`의 `[libdefaults]`에서 지원되는 암호화 방식을 사용하도록 설정하거나, JCE 확장 기능을 설치하여 AES256을 활성화합니다(위와 동일).

4. No valid credentials provided (Mechanism level: Failed to find any Kerberos tgt)
   - 원인: Kerberos가 유효한 Ticket Granting Ticket (TGT)을 찾지 못합니다. 이전에 정상 동작하던 환경이라면 티켓이 만료되었거나 KDC가 다시 시작되었을 수 있습니다. 새로 구성한 환경이라면 `krb5.conf` 또는 keytab이 잘못되었거나 손상되었을 수 있습니다.
   - 해결 방법: `krb5.conf`와 keytab을 확인하고 티켓이 유효한지 점검합니다. `kinit`으로 새 티켓을 발급받아 봅니다.

5. Failure unspecified at GSS-API level (Mechanism level: Checksum failed)
   - 원인: GSS-API 체크섬 검증에 실패했습니다. `kinit`에 잘못된 비밀번호를 사용했거나, keytab이 유효하지 않거나 키 버전이 오래되어 JVM이 비밀번호 로그인으로 전환한 경우입니다.
   - 해결 방법: `kinit`에 올바른 비밀번호를 사용하고 keytab이 최신 상태이며 유효한지 확인합니다.

6. Receive timed out
   - 원인: 불안정한 네트워크 환경이나 패킷 크기가 큰 상황에서 UDP로 KDC와 통신하기 때문입니다.
   - 해결 방법: `/etc/krb5.conf`에 다음 설정을 추가하여 Kerberos가 TCP를 사용하도록 강제합니다:
```shell
[libdefaults]
udp_preference_limit = 1
```

7. javax.security.auth.login.LoginException: Unable to obtain password from user
   - 원인: principal이 keytab과 일치하지 않거나, 애플리케이션이 `krb5.conf` 또는 keytab을 읽을 수 없습니다.
   - 해결 방법:
      - `klist -kt <keytab_file>` 및 `kinit -kt <keytab_file> <principal>` 명령으로 keytab과 principal을 검증합니다.
      - 런타임 사용자가 파일을 읽을 수 있도록 `krb5.conf`와 keytab의 경로 및 권한을 확인합니다.
      - JVM 시작 옵션에 올바른 구성 파일 경로가 지정되어 있는지 확인합니다.

8. Principal not found or Could not resolve Kerberos principal name
   - 원인:
      - principal의 호스트 이름을 확인할 수 없습니다.
      - `_HOST` 자리 표시자가 KDC에서 알 수 없는 호스트 이름으로 확장됩니다.
      - DNS 또는 `/etc/hosts`가 잘못 구성되어 있습니다.
   - 해결 방법:
      - principal의 철자를 확인합니다.
      - 모든 관련 노드(Doris FE/BE 및 KDC)에 올바른 호스트 이름과 IP 간 매핑 항목이 있는지 확인합니다.

9. Cannot find KDC for realm "XXX"
   - 원인: 지정된 Realm의 KDC가 `krb5.conf`에 구성되어 있지 않습니다.
   - 해결 방법:
      - `[realms]`에서 Realm 이름을 확인합니다.
      - `kdc` 주소를 확인합니다.
      - `/etc/krb5.conf`를 변경한 후 BE와 FE를 다시 시작합니다.

10. Request is a replay
   - 원인: KDC가 인증 요청을 중복된 요청으로 판단합니다. 일반적인 원인은 노드 간 시계 차이 또는 여러 서비스에서 동일한 principal을 공유하는 것입니다.
   - 해결 방법:
      - 모든 노드에서 NTP를 활성화하여 시간을 동기화합니다.
      - 서비스 인스턴스마다 `service/_HOST@REALM`과 같은 고유한 principal을 사용하여 공유를 방지합니다.

11. Client not found in Kerberos database
   - 원인: 클라이언트 principal이 Kerberos 데이터베이스에 존재하지 않습니다.
   - 해결 방법: KDC에 principal을 생성합니다.

12. Message stream modified (41)
   - 원인: 특정 OS(예: CentOS 7)와 Kerberos/Java 조합에서 발생하는 알려진 문제입니다.
   - 해결 방법: 공급업체 패치 또는 보안 업데이트를 적용합니다.

13. Pre-authentication information was invalid (24)
   - 원인:
      - 사전 인증 데이터가 유효하지 않습니다.
      - 클라이언트와 KDC 간에 시계 차이가 있습니다.
      - JDK의 암호화 설정이 KDC와 일치하지 않습니다.
   - 해결 방법:
      - 모든 노드의 시간을 동기화합니다.
      - 암호화 설정을 일치시킵니다.
