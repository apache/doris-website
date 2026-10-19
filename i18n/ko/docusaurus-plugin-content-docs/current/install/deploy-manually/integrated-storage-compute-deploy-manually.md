---
{
    "title": "스토리지·컴퓨팅 통합 클러스터 수동 배포",
    "sidebar_label": "스토리지·컴퓨팅 통합 클러스터 수동 배포",
    "language": "ko",
    "description": "Linux에서 Apache Doris 스토리지·컴퓨팅 통합 클러스터를 수동으로 배포하는 방법을 설명합니다. FE/BE 노드 배포, 구성 및 검증을 다루며, 프로덕션 클러스터 구축에 적합합니다.",
    "keywords": [
      "Doris 배포",
      "스토리지·컴퓨팅 통합 배포",
      "FE 노드 배포",
      "BE 노드 배포",
      "Doris 클러스터 구축",
      "Doris 수동 설치"
    ]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Cluster deployment / Environment acceptance -->

스토리지·컴퓨팅 통합 클러스터 배포는 다음 네 단계로 진행합니다.

1. **FE Master 노드 배포**: 첫 번째 FE 노드를 Master 노드로 배포합니다.
  
2. **FE 클러스터 배포(선택 사항)**: Follower 또는 Observer FE 노드를 추가하여 FE 클러스터를 배포합니다.
  
3. **BE 노드 배포**: FE 클러스터에 BE 노드를 등록합니다.

4. **클러스터 정상 동작 확인**: 배포 후 클러스터에 연결하여 정상 동작을 확인합니다.

배포를 시작하기 전에 해당 Doris 버전을 [다운로드](https://doris.apache.org/download)할 수 있습니다.

## 사전 요구 사항 {#prerequisites}

배포를 시작하기 전에 다음 조건을 충족하는지 확인합니다.

| 점검 항목 | 요구 사항 | 관련 문서 |
|--------|------|---------|
| 운영 체제 | CentOS 7+ / Ubuntu 22.04+ | [운영 체제 점검](../preparation/os-checking.md) |
| JDK 버전 | JDK 17+ | - |
| 네트워크 | 노드 간 통신이 가능하고 포트에 접근할 수 있어야 함 | [환경 점검](../preparation/env-checking.md) |
| 디스크 공간 | FE 100GB+ 권장, BE 500GB+ 권장 | [클러스터 계획](../preparation/cluster-planning.md) |

[환경 점검](../preparation/env-checking.md), [운영 체제 점검](../preparation/os-checking.md), [클러스터 계획](../preparation/cluster-planning.md) 등 사전 점검과 계획을 완료한 후 스토리지·컴퓨팅 통합 클러스터 배포를 시작할 수 있습니다.


## 1단계: FE Master 노드 배포 {#step-1-deploy-the-fe-master-node}

1. **메타데이터 경로 생성**

   FE를 배포할 때는 BE 노드와 다른 디스크에 데이터를 저장하는 것이 좋습니다.

   설치 패키지의 압축을 풀면 기본 `doris-meta` 디렉터리가 포함되어 있습니다. 메타데이터 전용 디렉터리를 생성하고 기본 `doris-meta` 디렉터리가 이를 가리키도록 심볼릭 링크를 만드는 것이 좋습니다. 프로덕션 환경에서는 전용 SSD 디스크를 사용하고, Doris 설치 디렉터리 아래에 배치하지 마세요. 개발 및 테스트 환경에서는 기본 구성을 사용해도 됩니다.

   ```SQL
   ## Use a separate disk for FE metadata
   mkdir -p <doris_meta_created>
      
   ## Create FE metadata directory symlink
   ln -s <doris_meta_created> <doris_meta_original>
   ```

2. **FE 구성 파일 수정**

   FE 구성 파일은 FE 배포 경로 아래의 `conf` 디렉터리에 있습니다. FE 노드를 시작하기 전에 `conf/fe.conf`를 수정해야 합니다.

    FE 노드를 배포하기 전에 다음 구성을 조정하는 것이 좋습니다.

   ```Bash
   ## modify Java Heap
   JAVA_OPTS="-Xmx16384m -XX:+UseMembar -XX:SurvivorRatio=8 -XX:MaxTenuringThreshold=7 -XX:+PrintGCDateStamps -XX:+PrintGCDetails -XX:+UseConcMarkSweepGC -XX:+UseParNewGC -XX:+CMSClassUnloadingEnabled -XX:-CMSParallelRemarkEnabled -XX:CMSInitiatingOccupancyFraction=80 -XX:SoftRefLRUPolicyMSPerMB=0 -Xloggc:$DORIS_HOME/log/fe.gc.log.$DATE"
      
   ## modify case sensitivity
   lower_case_table_names = 1
     
   ## modify network CIDR 
   priority_networks = 10.1.3.0/24
      
   ## modify Java Home
   JAVA_HOME = <your-java-home-path>
   ```

   매개변수 설명은 다음과 같습니다. 더 자세한 구성 항목은 [FE 구성 항목](../../admin-manual/config/fe-config)을 참조하세요.

   | 매개변수                                                         | 권장 사항                                                  |
   | ------------------------------------------------------------ | --------------------------------------------------------- |
   | JAVA_OPTS                                                    | `-Xmx`로 Java Heap 크기를 조정합니다. 프로덕션 환경에서는 16G 이상을 권장합니다.   |
   | [lower_case_table_names ](../../admin-manual/config/fe-config#lower_case_table_names) | 대소문자 구분 여부를 설정합니다. 1(대소문자 구분 안 함)로 설정하는 것이 좋습니다. (이 매개변수는 클러스터 생성 후 수정할 수 없습니다.)            |
   | [priority_networks ](../../admin-manual/config/fe-config#priority_networks) | 노드의 IP 주소를 기준으로 지정하는 네트워크 CIDR입니다. FQDN 환경에서는 생략할 수 있습니다. |
   | JAVA_HOME                                                    | Doris가 운영 체제와 독립된 JDK 환경을 사용하도록 설정하는 것이 좋습니다.                |
   
3. **FE 프로세스 시작**

   다음 명령으로 FE 프로세스를 시작합니다.

   ```Shell
   bin/start_fe.sh --daemon
   ```

   FE 프로세스는 백그라운드에서 시작되며, 로그는 기본적으로 `log/` 디렉터리에 저장됩니다. 시작에 실패하면 `log/fe.log` 또는 `log/fe.out`에서 오류 메시지를 확인합니다.

4. **FE 시작 상태 확인**

   MySQL 클라이언트로 Doris 클러스터에 연결합니다. 초기 사용자는 `root`이며, 기본 비밀번호는 비어 있습니다.

   ```SQL

   mysql -uroot -P<fe_query_port> -h<fe_ip_address>

   ```

   Doris 클러스터에 연결한 후 `show frontends` 명령으로 FE 상태를 확인할 수 있습니다. 일반적으로 다음 항목을 확인합니다.

   - Alive가 `true`이면 노드가 실행 중임을 나타냅니다.

   - Join이 `true`이면 노드가 클러스터에 가입했음을 나타내지만, 현재 클러스터에 연결되어 있다는 의미는 아닙니다(연결이 끊어진 상태일 수 있습니다).

   - IsMaster가 true이면 현재 노드가 Master 노드임을 나타냅니다.

## 2단계: FE 클러스터 배포(선택 사항) {#step-2-deploy-the-fe-cluster-optional}

테스트 및 검증에는 단일 FE 노드를 사용할 수 있습니다. 프로덕션 환경에서는 최소 3개의 노드를 배포하는 것이 좋습니다. FE Master 노드를 배포한 후 FE Follower 노드 두 개를 추가로 배포해야 합니다.

1. **메타데이터 디렉터리 생성**

   FE Master 노드 배포 절차를 참조하여 `doris-meta` 디렉터리를 생성합니다.

2. **FE Follower 구성 파일 수정**

   FE Master 노드 배포 절차를 참조하여 FE Follower 구성 파일을 수정합니다. 일반적으로 FE Master 구성 파일을 그대로 복사하여 사용할 수 있습니다.

3. **Doris 클러스터에 새 FE Follower 노드 등록**

   새 FE 노드를 시작하기 전에 먼저 FE 클러스터에 등록해야 합니다.

   ```Bash
   ## connect a alive FE node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
   
   ## register a new FE follower node
   ALTER SYSTEM ADD FOLLOWER "<fe_ip_address>:<fe_edit_log_port>"
   ```

   Observer 노드를 추가하려면 `ADD OBSERVER` 명령을 사용합니다.

   ```Bash
   ## register a new FE observer node
   ALTER SYSTEM ADD OBSERVER "<fe_ip_address>:<fe_edit_log_port>"
   ```

   :::caution 참고
   - FE Follower 노드 수(Master 포함)는 홀수여야 합니다. 고가용성을 위해 3개의 노드를 배포하는 것이 좋습니다.

   - FE를 고가용성 모드(Master 1개, Follower 2개)로 배포한 경우, FE 읽기 용량을 수평 확장하려면 Observer FE를 추가하는 것이 좋습니다.
   :::

4. **FE Follower 노드 시작**

   다음 명령으로 FE Follower 노드를 시작하고 메타데이터를 자동으로 동기화합니다.

   ```Shell
   bin/start_fe.sh --helper <helper_fe_ip>:<fe_edit_log_port> --daemon
   ```

   여기서 `helper_fe_ip`는 FE 클러스터에서 실행 중인 노드 중 하나의 IP 주소입니다. `--helper` 매개변수는 FE를 처음 시작할 때만 필요하며, 이후 재시작할 때는 필요하지 않습니다.

5. **Follower 노드 상태 확인**

   FE Master 노드와 마찬가지로, Follower 노드를 추가한 후 `show frontends` 명령으로 노드 상태를 확인합니다. IsMaster가 false여야 합니다.

## 3단계: BE 노드 배포 {#step-3-deploy-be-nodes}

1. **데이터 디렉터리 생성**

   BE 프로세스는 데이터 연산 및 저장을 담당합니다. 데이터 디렉터리는 기본적으로 `be/storage` 아래에 배치됩니다. 프로덕션 환경에서는 일반적으로 BE 데이터와 BE 배포 파일을 서로 다른 디스크에 저장합니다. BE는 여러 디스크의 I/O 용량을 더 잘 활용할 수 있도록 데이터를 여러 디스크에 분산하여 저장하는 기능을 지원합니다.

   ```Bash
   ## Create a BE data storage directory on each data disk
   mkdir -p <be_storage_root_path>
   ```

2. **BE 구성 파일 수정**

   BE 구성 파일은 BE 배포 경로 아래의 `conf` 디렉터리에 있습니다. BE 노드를 시작하기 전에 `conf/be.conf`를 수정해야 합니다.

   ```Bash
   ## modify storage path for BE node
   storage_root_path=/home/disk1/doris,medium:HDD;/home/disk2/doris,medium:SSD
   
   ## modify network CIDR 
   priority_networks = 10.1.3.0/24
   
   ## modify Java Home in be/conf/be.conf
   JAVA_HOME = <your-java-home-path>
   ```
   
   매개변수 설명은 다음과 같습니다.

   | 매개변수                                                         | 권장 사항                                                  |
   | ------------------------------------------------------------ | --------------------------------------------------------- |
   | [priority_networks](../../admin-manual/config/be-config#priority_networks) | 노드의 IP 주소를 기준으로 지정하는 네트워크 CIDR입니다. FQDN 환경에서는 생략할 수 있습니다. |
   | JAVA_OPTS                                                    | `-Xmx`로 Java Heap 크기를 조정합니다. 프로덕션 환경에서는 2G 이상을 권장합니다.   |
   | JAVA_HOME                                                    | Doris가 운영 체제와 독립된 JDK 환경을 사용하도록 설정하는 것이 좋습니다.                |

3. **Doris에 BE 노드 등록**

   BE 노드를 시작하기 전에 FE 클러스터에 등록해야 합니다.

   ```Bash
   ## connect a alive FE node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
      
   ## register BE node
   ALTER SYSTEM ADD BACKEND "<be_ip_address>:<be_heartbeat_service_port>"
   ```

4. **BE 프로세스 시작**

   다음 명령으로 BE 프로세스를 시작합니다.

   ```Bash
   bin/start_be.sh --daemon
   ```

   BE 프로세스는 백그라운드에서 시작되며, 로그는 기본적으로 `log/` 디렉터리에 저장됩니다. 시작에 실패하면 `log/be.log` 또는 `log/be.out`에서 오류 메시지를 확인합니다.

5. **BE 시작 상태 확인**

   Doris 클러스터에 연결한 후 `show backends` 명령으로 BE 노드 상태를 확인할 수 있습니다.

   ```Bash
   ## connect a alive FE node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
      
   ## check BE node status
   show backends;
   ```

   일반적으로 다음 항목에 주의합니다.

   - Alive가 true이면 노드가 실행 중임을 나타냅니다.

   - TabletNum은 노드에 있는 Tablet 수를 나타냅니다. 새로 추가된 노드에서는 데이터 균형 조정이 수행되며, TabletNum은 점차 평균값에 가까워집니다.

## 4단계: 클러스터 정상 동작 확인 {#step-4-verify-cluster-correctness}

1. **데이터베이스에 로그인**

   MySQL 클라이언트로 Doris 클러스터에 로그인합니다.

   ```Bash
   ## connect a alive fe node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
   ```

2. **Doris 설치 정보 확인**

   `show frontends`와 `show backends`를 사용하여 데이터베이스의 각 인스턴스 정보를 확인합니다.
   
   ```SQL
   -- check fe status
   show frontends;

   -- check be status
   show backends;
   ```

3. **Doris 클러스터 비밀번호 변경**

   Doris 클러스터를 생성하면 시스템이 기본적으로 비밀번호가 비어 있는 `root` 사용자를 자동으로 생성합니다. 보안을 강화하려면 클러스터를 생성한 직후 `root` 사용자의 새 비밀번호를 설정하는 것이 좋습니다.

   ```SQL
   -- check the current user
   select user();  
   +------------------------+  
   | user()                 |  
   +------------------------+  
   | 'root'@'192.168.88.30' |  
   +------------------------+  
        
   -- modify the password for current user
   SET PASSWORD = PASSWORD('doris_new_passwd');
   ```

4. **테스트 테이블 생성 및 데이터 삽입**

   클러스터가 정상적으로 동작하는지 확인하려면 새로 생성한 클러스터에 테스트 테이블을 생성하고 테스트 데이터를 삽입할 수 있습니다.

   ```SQL
   -- create a test database
   create database testdb;
    
   -- create a test table
   CREATE TABLE testdb.table_hash
   (
       k1 TINYINT,
       k2 DECIMAL(10, 2) DEFAULT "10.5",
       k3 VARCHAR(10) COMMENT "string column",
       k4 INT NOT NULL DEFAULT "1" COMMENT "int column"
   )
   COMMENT "my first table"
   DISTRIBUTED BY HASH(k1) BUCKETS 32;
   ```

   Doris는 MySQL 프로토콜과 호환되므로 `INSERT` 문으로 데이터를 삽입할 수 있습니다.

   ```SQL
   -- insert data
   INSERT INTO testdb.table_hash VALUES
   (1, 10.1, 'AAA', 10),
   (2, 10.2, 'BBB', 20),
   (3, 10.3, 'CCC', 30),
   (4, 10.4, 'DDD', 40),
   (5, 10.5, 'EEE', 50);
   
   -- check the data
   SELECT * from testdb.table_hash;
   +------+-------+------+------+
   | k1   | k2    | k3   | k4   |
   +------+-------+------+------+
   |    3 | 10.30 | CCC  |   30 |
   |    4 | 10.40 | DDD  |   40 |
   |    5 | 10.50 | EEE  |   50 |
   |    1 | 10.10 | AAA  |   10 |
   |    2 | 10.20 | BBB  |   20 |
   +------+-------+------+------+
   ```

---

## 참고 사항 {#notes}

- FE 메타데이터 디렉터리에는 전용 SSD 디스크를 사용하는 것이 좋습니다. Doris 설치 디렉터리 아래에 배치하지 마세요.
- BE 데이터 디렉터리는 `storage_root_path` 매개변수를 사용하여 여러 디스크에 걸쳐 구성할 수 있으며, 형식은 `path1,medium:HDD;path2,medium:SSD`입니다.
- 프로덕션 환경에서는 고가용성을 위해 FE Follower 노드 3개를 배포하는 것이 좋습니다.
- `lower_case_table_names` 매개변수는 클러스터 생성 후 수정할 수 없습니다. 초기화 시 설정을 확인합니다.
- `priority_networks` 매개변수는 노드 IP의 서브넷과 일치하도록 실제 네트워크에 맞게 구성해야 합니다.

## 자주 묻는 질문 {#frequently-asked-questions}

### 질문: FE 시작 실패는 어떻게 해결하나요? {#q-how-do-i-troubleshoot-fe-startup-failures}

1. Java 환경 확인: `echo $JAVA_HOME`을 실행하여 JDK가 설치되어 있는지 확인합니다.
2. 로그 확인: `tail -100 log/fe.log`를 실행하여 `Exception` 또는 `ERROR`를 찾습니다.
3. 일반적인 오류:
   - **포트가 이미 사용 중임**: `query_port`(기본값 9030)가 이미 사용 중인지 `fe.conf`의 설정을 확인합니다.
   - **메타데이터 디렉터리 권한**: `doris-meta` 디렉터리에 읽기 및 쓰기 권한이 있는지 확인합니다.

### 질문: BE를 FE 클러스터에 등록할 수 없으면 어떻게 해야 하나요? {#q-what-should-i-do-if-a-be-cannot-register-with-the-fe-cluster}

1. FE 클러스터의 정상 실행 여부 확인: `show frontends`를 실행하여 Alive 상태를 확인합니다.
2. 네트워크 연결 확인: `telnet <fe_ip> 9030`을 실행하여 포트 연결을 테스트합니다.
3. BE 구성 확인: `priority_networks`가 `be.conf`에 실제 IP와 일치하도록 설정되어 있는지 확인합니다.
4. BE 로그 확인: `tail -100 log/be.log`를 실행하여 등록 실패 원인을 찾습니다.

### 질문: 클러스터 상태는 어떻게 확인하나요? {#q-how-do-i-check-cluster-health}

```SQL
-- Check FE status
SHOW FRONTENDS;

-- Check BE status
SHOW BACKENDS;
-- Confirm that Alive is true for all BEs
```

### 질문: root 비밀번호를 잊어버렸을 때 어떻게 재설정하나요? {#q-how-do-i-reset-the-password-if-i-forget-the-root-password}

FE 노드에서 127.0.0.1을 통해 연결하면 비밀번호 없이 root로 로그인할 수 있습니다. 로그인한 후 비밀번호를 변경합니다.

```Bash
mysql -h127.0.0.1 -P9030 -uroot

-- Reset password
SET PASSWORD = PASSWORD('your_new_password');
```

---

## 문제 해결 {#troubleshooting}

| 증상 | 가능한 원인 | 해결 방법 |
|---------|---------|---------|
| FE가 시작되지 않음 | 포트가 이미 사용 중임 | `fe.conf`에서 포트를 변경하거나 해당 포트를 사용하는 프로세스를 종료합니다 |
| FE 메타데이터 동기화 실패 | 네트워크 문제 또는 노드 연결 끊김 | 노드 간 네트워크를 점검하고 `priority_networks`가 올바르게 구성되어 있는지 확인합니다 |
| BE 등록 실패 | FE 클러스터를 사용할 수 없음 | 하나 이상의 FE 노드가 Alive 상태인지 확인합니다 |
| BE가 Alive 상태이지만 Tablet이 없음 | 데이터 균형 조정이 완료되지 않음 | 잠시 기다립니다. 새 노드는 자동으로 데이터 균형 조정을 수행합니다 |
| 비밀번호 변경 실패 | 구문 오류 또는 권한 문제 | `SET PASSWORD = PASSWORD('new_password')` 구문을 사용합니다 |
