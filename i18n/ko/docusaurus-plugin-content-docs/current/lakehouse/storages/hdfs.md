---
{
    "title": "HDFS | 저장소",
    "language": "ko",
    "description": "이 문서는 HDFS에 접근하는 데 필요한 매개변수를 설명합니다. 이 매개변수는 다음 항목에 적용됩니다:",
    "sidebar_label": "HDFS"
}
---

# HDFS {#hdfs}

이 문서는 HDFS에 접근하는 데 필요한 매개변수를 설명합니다. 이 매개변수는 다음 항목에 적용됩니다:

* Catalog 속성
* Table Valued Function 속성
* Broker Load 속성
* Export 속성
* Outfile 속성
* 백업 및 복원

## 매개변수 개요 {#parameter-overview}

|속성 이름 | 기존 이름 | 설명 | 기본값 | 필수 여부 |
| --- | --- | --- | --- | --- |
| hdfs.authentication.type | hadoop.security.authentication | 인증 유형을 지정합니다. 사용 가능한 값은 kerberos 또는 simple입니다. kerberos를 선택하면 시스템은 Kerberos 인증을 사용하여 HDFS와 상호 작용합니다. simple을 사용하면 인증을 수행하지 않으며, 인증이 필요 없는 HDFS 클러스터에 적합합니다. kerberos를 선택하려면 해당 principal과 keytab을 구성해야 합니다. | simple | 아니요 |
| hdfs.authentication.kerberos.principal | hadoop.kerberos.principal | 인증 유형이 kerberos인 경우 Kerberos principal을 지정합니다. Kerberos principal은 일반적으로 서비스 이름, 호스트 이름, 도메인 이름을 포함하는 고유한 식별 문자열입니다. | - | 아니요 |
| hdfs.authentication.kerberos.keytab | hadoop.kerberos.keytab | Kerberos 인증에 사용할 keytab 파일 경로를 지정합니다. keytab 파일은 암호화된 자격 증명을 저장하므로 사용자가 비밀번호를 직접 입력하지 않아도 시스템이 자동으로 인증할 수 있습니다. | - | 아니요 |
| hdfs.impersonation.enabled | - | true이면 HDFS 사용자 가장 기능을 활성화합니다. core-site.xml에 구성된 프록시 사용자가 Doris 로그인 사용자를 대신하여 HDFS 작업을 수행합니다. | 아직 지원되지 않음 | - |
| hadoop.username | - | 인증 유형이 simple인 경우 이 사용자를 사용하여 HDFS에 접근합니다. 기본적으로 Doris 프로세스를 실행하는 Linux 시스템 사용자를 사용하여 접근합니다. | - | - |
| hadoop.config.resources | - | 상대 경로를 사용하여 HDFS 구성 파일 디렉터리를 지정합니다(hdfs-site.xml 및 core-site.xml을 포함해야 함). 기본 디렉터리는 (FE/BE) 배포 디렉터리 아래의 /plugins/hadoop/conf/입니다(fe.conf/be.conf의 hadoop_config_dir을 수정하여 기본 경로를 변경할 수 있음). 모든 FE 및 BE 노드에 동일한 상대 경로를 구성해야 합니다. 예: hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml | - | - |
| dfs.nameservices | - | HDFS 고가용성 클러스터 매개변수를 수동으로 구성합니다. hadoop.config.resources 구성을 사용하면 hdfs-site.xml에서 매개변수를 자동으로 읽습니다. dfs.ha.namenodes.your-nameservice, dfs.namenode.rpc-address.your-nameservice.nn1, dfs.client.failover.proxy.provider 등의 매개변수와 함께 사용해야 합니다. | - | - |

> 3.1 이전 버전에서는 기존 이름을 사용하세요.

## 인증 구성 {#authentication-configuration}

HDFS는 두 가지 인증 방식을 지원합니다:

* Simple
* Kerberos

### Simple 인증 {#simple-authentication}

Simple 인증은 Kerberos가 활성화되지 않은 HDFS 클러스터에 적합합니다.

Simple 인증을 사용할 때는 다음 매개변수를 설정하거나 기본값을 그대로 사용할 수 있습니다:

```sql
"hdfs.authentication.type" = "simple"
```

Simple 인증 모드에서는 `hadoop.username` 매개변수로 사용자 이름을 지정할 수 있습니다. 지정하지 않으면 현재 프로세스의 사용자 이름을 기본값으로 사용합니다.

예:

`lakers` 사용자 이름으로 HDFS에 접근

```sql
"hdfs.authentication.type" = "simple",
"hadoop.username" = "lakers"
```

기본 시스템 사용자로 HDFS에 접근

```sql
"hdfs.authentication.type" = "simple"
```

### Kerberos 인증 {#kerberos-authentication}

Kerberos 인증은 Kerberos가 활성화된 HDFS 클러스터에 적합합니다.

Kerberos 인증을 사용하려면 다음 매개변수를 설정해야 합니다:

```sql
"hdfs.authentication.type" = "kerberos",
"hdfs.authentication.kerberos.principal" = "<your_principal>",
"hdfs.authentication.kerberos.keytab" = "<your_keytab>"
```

Kerberos 인증 모드에서는 Kerberos principal과 keytab 파일 경로를 설정해야 합니다.

Doris는 `hdfs.authentication.kerberos.principal` 속성으로 지정된 신원으로 HDFS에 접근하며, keytab으로 지정된 keytab을 사용하여 Principal을 인증합니다.

> 참고:
>
> keytab 파일은 모든 FE 및 BE 노드의 동일한 경로에 있어야 하며, Doris 프로세스를 실행하는 사용자에게 해당 keytab 파일의 읽기 권한이 있어야 합니다.

예:

```sql
"hdfs.authentication.type" = "kerberos",
"hdfs.authentication.kerberos.principal" = "hdfs/hadoop@HADOOP.COM",
"hdfs.authentication.kerberos.keytab" = "/etc/security/keytabs/hdfs.keytab",
```
일반적인 Kerberos 구성 문제를 해결하려면 [Kerberos FAQ](../best-practices/kerberos.md/#faq)를 참조하세요.

## HDFS HA 구성 {#hdfs-ha-configuration}

HDFS HA 모드가 활성화된 경우 `dfs.nameservices` 관련 매개변수를 구성해야 합니다:

```sql
'dfs.nameservices' = '<your-nameservice>',
'dfs.ha.namenodes.<your-nameservice>' = '<nn1>,<nn2>',
'dfs.namenode.rpc-address.<your-nameservice>.<nn1>' = '<nn1_host:port>',
'dfs.namenode.rpc-address.<your-nameservice>.<nn2>' = '<nn2_host:port>',
'dfs.client.failover.proxy.provider.<your-nameservice>' = 'org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider',
```

예:

```sql
'dfs.nameservices' = 'nameservice1',
'dfs.ha.namenodes.nameservice1' = 'nn1,nn2',
'dfs.namenode.rpc-address.nameservice1.nn1' = '172.21.0.2:8088',
'dfs.namenode.rpc-address.nameservice1.nn2' = '172.21.0.3:8088',
'dfs.client.failover.proxy.provider.nameservice1' = 'org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider',
```

4.1.5부터는 `hadoop.config.resources`에 쉼표로 구분하여 지정하는 XML 경로에 상위 디렉터리를 나타내는 `..` 경로 요소를 포함할 수 없습니다. 슬래시와 백슬래시 구분자를 모두 검사합니다. `conf/core-site.xml,conf/hdfs-site.xml`과 같은 일반 경로를 사용하세요. `../`를 사용하여 상위 디렉터리에 접근하지 마세요.

## 구성 파일 {#configuration-files}

> 이 기능은 버전 3.1.0부터 지원됩니다.

Doris는 `hadoop.config.resources` 매개변수를 통해 HDFS 구성 파일 디렉터리를 지정할 수 있습니다.

구성 파일 디렉터리에는 `hdfs-site.xml` 및 `core-site.xml` 파일이 있어야 합니다. 기본 디렉터리는 (FE/BE) 배포 디렉터리 아래의 `/plugins/hadoop_conf/`입니다. 모든 FE 및 BE 노드에 동일한 상대 경로를 구성해야 합니다.

구성 파일에 이 문서에서 앞서 설명한 매개변수가 포함되어 있으면 사용자가 명시적으로 구성한 매개변수가 우선 적용됩니다. 구성 파일은 `hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml`과 같이 쉼표로 구분하여 여러 개 지정할 수 있습니다.

**예:**

```sql
-- Multiple configuration files
'hadoop.config.resources'='hdfs-cluster-1/core-site.xml,hdfs-cluster-1/hdfs-site.xml'
-- Single configuration file
'hadoop.config.resources'='hdfs-cluster-2/hdfs-site.xml'
```

## HDFS IO 최적화 {#hdfs-io-optimization}

경우에 따라 HDFS 부하가 높으면 HDFS의 데이터 복제본을 읽는 데 시간이 오래 걸려 전체 쿼리 효율이 저하될 수 있습니다. 다음은 이와 관련된 최적화 설정입니다.

### Hedged Read {#hedged-read}

HDFS Client는 Hedged Read 기능을 제공합니다. 읽기 요청이 일정 임계 시간을 초과해도 응답을 반환하지 않으면, 이 기능은 다른 읽기 스레드를 시작하여 동일한 데이터를 읽고 먼저 반환된 결과를 사용합니다.

참고: 이 기능은 HDFS 클러스터의 부하를 높일 수 있으므로 신중하게 사용하세요.

다음과 같이 이 기능을 활성화할 수 있습니다:

```sql
"dfs.client.hedged.read.threadpool.size" = "128",
"dfs.client.hedged.read.threshold.millis" = "500"
```

* `dfs.client.hedged.read.threadpool.size`

    Hedged Read에 사용되는 스레드 수를 나타내며, 이 스레드들은 하나의 HDFS Client에서 공유됩니다. 일반적으로 하나의 HDFS 클러스터에서는 BE 노드들이 하나의 HDFS Client를 공유합니다.

* `dfs.client.hedged.read.threshold.millis`

    밀리초 단위의 읽기 임계 시간입니다. 읽기 요청이 이 임계 시간을 초과해도 응답을 반환하지 않으면 Hedged Read가 시작됩니다.

기능을 활성화하면 Query Profile에서 관련 매개변수를 확인할 수 있습니다:

* `TotalHedgedRead`

    Hedged Read가 시작된 횟수입니다.

* `HedgedReadWins`

    Hedged Read 시도가 성공한 횟수입니다(시작된 후 원래 요청보다 빠르게 결과를 반환한 경우).

여기에 표시되는 값은 단일 쿼리의 값이 아니라 하나의 HDFS Client에 대한 누적값입니다. 여러 쿼리가 동일한 HDFS Client를 재사용합니다.

### dfs.client.socket-timeout {#dfsclientsocket-timeout}

`dfs.client.socket-timeout`은 Hadoop HDFS의 클라이언트 구성 매개변수로, 클라이언트가 DataNode 또는 NameNode와 연결을 설정하거나 데이터를 읽을 때 적용되는 소켓 시간 제한을 밀리초 단위로 설정합니다. 이 매개변수의 기본값은 일반적으로 60,000밀리초입니다.

이 매개변수 값을 줄이면 네트워크 지연, DataNode의 느린 응답 또는 연결 예외가 발생했을 때 클라이언트가 더 빨리 시간 초과를 감지하고 재시도하거나 다른 노드로 전환할 수 있습니다. 이를 통해 대기 시간을 줄이고 시스템 응답 속도를 높일 수 있습니다. 예를 들어, 일부 테스트에서는 `dfs.client.socket-timeout`을 더 작은 값(예: 5000밀리초)으로 설정하여 DataNode의 지연이나 장애를 빠르게 감지하고 긴 대기 시간을 피할 수 있었습니다.

참고:

* 시간 제한을 너무 짧게 설정하면 네트워크 상태가 불안정하거나 노드 부하가 높을 때 시간 초과 오류가 자주 발생하여 작업 안정성에 영향을 줄 수 있습니다.

* 응답 속도와 시스템 안정성 사이의 균형을 맞출 수 있도록 실제 네트워크 환경과 시스템 부하에 따라 이 매개변수 값을 적절히 조정하는 것이 좋습니다.

* 클라이언트가 HDFS와 통신할 때 올바른 시간 제한을 사용하도록 클라이언트 구성 파일(예: `hdfs-site.xml`)에 이 매개변수를 설정해야 합니다.

`dfs.client.socket-timeout` 매개변수를 적절히 구성하면 시스템의 안정성과 신뢰성을 유지하면서 I/O 응답 속도를 높일 수 있습니다.

## HDFS 접근에 필요한 포트(NameNode \& DataNode만 해당) {#hdfs-access-port-requirements-namenode--datanode-only}

Doris가 HDFS에 접근하려면 다음 포트가 열려 있어야 합니다:

| 서비스   | 포트 용도                  | 기본 포트 | 프로토콜|
|-----------|-------------------------------|--------------|---------|
| NameNode  | RPC(클라이언트/메타데이터 접근)  | 8020         |TCP      |
| DataNode  | 데이터 전송(블록 I/O)     | 9866         |TCP       |

참고:
- 포트는 `core-site.xml` \& `hdfs-site.xml`에서 변경할 수 있습니다. 실제 구성에 지정된 값을 사용하세요.
- Kerberos 인증을 활성화한 경우 Doris에서 Kerberos KDC 서비스에도 접근할 수 있어야 합니다. KDC는 기본적으로 TCP 포트 88에서 수신하지만, 실제 포트는 KDC 구성에 따라야 합니다.

## HDFS 디버깅 {#debugging-hdfs}

Hadoop 환경 구성은 복잡하며, 경우에 따라 연결 문제나 접근 성능 저하가 발생할 수 있습니다. 다음은 사용자가 연결 문제와 기본적인 성능 문제를 빠르게 진단하는 데 도움이 되는 타사 도구입니다.

### HDFS Client {#hdfs-client}

* Java: <https://github.com/morningman/hdfs-client-java>

* CPP: <https://github.com/morningman/hdfs-client-cpp>

이 두 도구를 사용하면 HDFS 연결과 읽기 성능을 빠르게 확인할 수 있습니다. 대부분의 Hadoop 종속성이 Doris 자체의 Hadoop 종속성과 같으므로 Doris의 HDFS 접근 시나리오를 최대한 유사하게 재현할 수 있습니다.

Java 버전은 Java를 사용하여 HDFS에 접근하며, Doris FE 측에서 HDFS에 접근하는 로직을 재현할 수 있습니다.

CPP 버전은 C++에서 libhdfs를 호출하여 HDFS에 접근하며, Doris BE 측에서 HDFS에 접근하는 로직을 재현할 수 있습니다.

자세한 사용 방법은 각 코드 저장소의 README를 참조하세요.
