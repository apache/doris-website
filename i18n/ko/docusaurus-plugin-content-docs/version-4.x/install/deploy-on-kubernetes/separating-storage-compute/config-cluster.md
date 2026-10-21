---
{
    "title": "인증 구성",
    "language": "ko",
    "description": "스토리지와 컴퓨트가 분리된 클러스터의 두 가지 클러스터 수준 구성 방식(환경 변수 및 Secret)을 자세히 소개하고, Kerberos 인증 구성을 포함하여 세 가지 비밀번호 구성 시나리오의 전체 절차를 설명합니다.",
    "keywords": ["Doris", "스토리지와 컴퓨트 분리", "Kubernetes", "사용자 이름 및 비밀번호", "Secret", "Kerberos", "인증", "Node_priv"]
}
---

## 이 장에서 학습할 내용 {#what-you-will-learn-in-this-chapter}

- Doris Operator가 클러스터 노드를 관리하는 데 필요한 인증 메커니즘 이해
- 환경 변수 또는 Secret을 사용하여 관리용 인증 정보 구성
- 배포 전, 배포 중, 배포 후의 세 단계에서 사용자 이름과 비밀번호를 올바르게 구성
- 스토리지와 컴퓨트가 분리된 클러스터의 Kerberos 인증 구성

## 구성 원칙 및 시나리오 선택 {#configuration-principles-and-scenario-selection}

### 관리용 인증 정보를 구성해야 하는 이유 {#why-management-credentials-need-to-be-configured}

Doris 노드를 관리하려면 사용자 이름과 비밀번호를 사용하여 MySQL 프로토콜로 실행 중인 FE 노드에 연결해야 합니다. Doris는 [RBAC와 유사한 권한 관리 메커니즘](../../../admin-manual/auth/authentication-and-authorization)을 구현하며, 노드를 관리하려면 사용자에게 [Node_priv](../../../admin-manual/auth/authentication-and-authorization#types-of-permissions) 권한이 있어야 합니다.

기본적으로 Doris Operator는 비밀번호가 없고 모든 권한을 가진 root 사용자를 사용하여 DorisDisaggregatedCluster 리소스에 구성된 클러스터를 배포하고 관리합니다. root 사용자에게 비밀번호를 설정한 후에는 Doris Operator가 클러스터에 대한 자동 관리 작업을 수행할 수 있도록 DorisDisaggregatedCluster 리소스에 Node_priv 권한이 있는 사용자의 이름과 비밀번호를 명시적으로 구성해야 합니다.

### 세 가지 비밀번호 구성 시나리오 비교 {#comparison-of-the-three-password-configuration-scenarios}

클러스터의 단계와 관리 요구 사항에 따라 세 가지 구성 시나리오가 있습니다. 아래 테이블을 참고하여 선택하세요.

| 시나리오 | 사용 시점 | 작업 복잡도 | 코드를 통한 암호화 필요 여부 |
|------|---------|-----------|-----------------|
| 시나리오 1: 배포 중 root 비밀번호 초기화 | 클러스터 최초 배포 | 중간 | 예(두 단계 SHA-1 암호화) |
| 시나리오 2: 배포 중 root가 아닌 관리 사용자 자동 생성(권장) | 클러스터 최초 배포 | 낮음 | 아니요 |
| 시나리오 3: 배포 후 root 비밀번호 설정 | 클러스터가 이미 실행 중인 경우 | 높음 | 아니요 |

### 일반 구성 원칙 {#general-configuration-principles}

비밀번호를 구성할 때 어떤 시나리오를 선택하든 다음 사항에 유의하세요.

- **기존 사용자의 비밀번호는 자동으로 변경되지 않습니다**: root와 admin처럼 이미 존재하는 사용자의 비밀번호는 어떤 경우에도 Operator가 자동으로 변경하지 않습니다. 직접 설정하거나 변경해야 합니다.
- **admin 사용자를 관리 사용자로 사용하는 것은 권장하지 않습니다**: admin 사용자는 일반적으로 클러스터 운영 및 유지 관리가 아닌 데이터베이스 읽기 및 쓰기 작업을 위한 최상위 권한 사용자로 사용됩니다. admin 사용자에게는 일부 Operator 기능에 필요한 특정 권한이 없습니다.
- **root가 아닌 관리 사용자는 전용으로 사용해야 합니다**: 비밀번호 변경 사항이 Operator에 동기화되지 않거나 권한이 사라져 운영 및 유지 관리에 실패하는 상황을 방지하려면, root가 아닌 사용자를 하나의 용도로만 사용하고 다른 용도로는 사용하지 않는 것이 좋습니다.

### 두 가지 인증 정보 전달 방식 {#two-credential-delivery-methods}

DorisDisaggregatedCluster 리소스는 다음 두 가지 인증 정보 구성 방식을 지원합니다. 각 시나리오에서 둘 중 하나를 선택할 수 있습니다.

| 구성 방식 | 사용 필드 | 구현 메커니즘 |
|---------|---------|---------|
| 환경 변수 | `.spec.adminUser` | Operator가 사용자 이름과 비밀번호를 컨테이너 환경 변수로 자동 변환하고, 컨테이너 내부의 보조 서비스가 이를 읽습니다 |
| [Secret](https://kubernetes.io/docs/concepts/configuration/secret/) | `.spec.authSecret` | Operator가 Basic Authentication Secret을 컨테이너의 지정된 위치에 파일로 마운트하고, 컨테이너 내부의 보조 서비스가 이를 파싱합니다 |

## 시나리오 1: 배포 중 root 사용자 비밀번호 초기화 {#scenario-1-initialize-the-root-user-password-during-deployment}

클러스터를 처음 배포할 때 root를 관리 사용자로 사용하고 초기 비밀번호를 미리 설정할 수 있습니다. Doris는 `fe.conf`에 root 사용자 비밀번호를 암호화된 형태로 구성하는 기능을 지원합니다. 이를 통해 Doris 최초 배포 시 root 사용자 비밀번호를 설정하여 Doris Operator가 클러스터 노드를 자동으로 관리할 수 있습니다.

구성 절차 개요:

1. 암호화된 root 비밀번호 생성
2. `fe.conf`에 암호화된 비밀번호 구성
3. DorisDisaggregatedCluster에 관리용 인증 정보 구성(환경 변수 또는 Secret 중 하나 선택)

### 단계 1: 암호화된 root 비밀번호 생성 {#step-1-generate-the-encrypted-root-password}

Doris는 [FE 구성 파일](../../../admin-manual/config/fe-config#initial_root_password)에 root 사용자 비밀번호를 암호화된 형태로 설정하는 기능을 지원합니다. 암호화에는 두 단계 SHA-1 암호화를 사용합니다. 구현 예제 코드는 다음과 같습니다.

**Java 구현:**

```java
import org.apache.commons.codec.digest.DigestUtils;

public static void main(String[] args) {
    // the original password
    String a = "123456";
    String b = DigestUtils.sha1Hex(DigestUtils.sha1(a.getBytes())).toUpperCase();
    // output the 2 stage encrypted password.
    System.out.println("*" + b);
}
```

**Golang 구현:**

```go
import (
    "crypto/sha1"
    "encoding/hex"
    "fmt"
    "strings"
)

func main() {
    // original password
    plan := "123456"
    // the first stage encryption.
    h := sha1.New()
    h.Write([]byte(plan))
    eb := h.Sum(nil)

    // the two stage encryption.
    h.Reset()
    h.Write(eb)
    teb := h.Sum(nil)
    dst := hex.EncodeToString(teb)
    tes := strings.ToUpper(fmt.Sprintf("%s", dst))
    // output the 2 stage encrypted password.
    fmt.Println("*" + tes)
}
```

### 단계 2: fe.conf에 암호화된 비밀번호 구성 {#step-2-configure-the-encrypted-password-in-feconf}

구성 파일의 요구 사항에 따라 이전 단계에서 생성한 암호화된 비밀번호를 `fe.conf`에 구성합니다. [FE 시작 매개변수 구성 장](config-fe#custom-startup-configuration)의 안내에 따라 구성 파일을 `ConfigMap`으로 Kubernetes 클러스터에 전달합니다.

### 단계 3: DorisDisaggregatedCluster에 관리용 인증 정보 구성 {#step-3-configure-management-credentials-in-dorisdisaggregatedcluster}

구성 파일에 root 초기 비밀번호를 설정하면 첫 번째 Doris FE 노드가 시작될 때 root 비밀번호가 즉시 적용됩니다. 이후 노드가 클러스터에 합류할 때 Doris Operator는 root 사용자 이름과 비밀번호를 사용하여 노드를 추가합니다. 따라서 Doris Operator가 클러스터 노드를 관리할 수 있도록 배포할 DorisDisaggregatedCluster 리소스에 사용자 이름과 비밀번호를 지정해야 합니다.

다음 두 가지 방식 중 하나를 선택하여 구성합니다.

#### 방식 A: 환경 변수 구성 {#method-a-environment-variable-configuration}

DorisDisaggregatedCluster 리소스의 `.spec.adminUser.name` 및 `.spec.adminUser.password` 필드에 root 사용자 이름과 비밀번호를 구성합니다. Doris Operator는 이 설정을 컨테이너 환경 변수로 자동 변환하며, 컨테이너 내부의 보조 서비스는 환경 변수를 사용하여 클러스터에 노드를 추가합니다. 구성 형식은 다음과 같습니다.

```yaml
spec:
    adminUser:
        name: root
        password: ${password}
```

여기서 `${password}`는 암호화되지 않은 root 비밀번호입니다.

#### 방식 B: Secret 구성 {#method-b-secret-configuration}

Doris Operator는 [Basic Authentication Secret](https://kubernetes.io/docs/concepts/configuration/secret/#basic-authentication-secret)을 사용하여 노드 관리에 사용할 사용자 이름과 비밀번호를 지정하는 기능을 지원합니다. Doris Operator는 Secret을 컨테이너의 지정된 위치에 파일로 자동 마운트하며, 컨테이너 내부의 보조 서비스는 파일에서 사용자 이름과 비밀번호를 파싱하여 클러스터에 노드를 자동으로 추가하는 데 사용합니다. Basic Authentication Secret의 stringData에는 username과 password 두 필드만 포함됩니다.

**단계 1: Secret 생성 및 배포**

사용할 Basic Authentication Secret을 다음 형식으로 구성합니다.

```yaml
stringData:
    username: root
    password: ${password}
```

여기서 `${password}`는 root에 설정한 암호화되지 않은 비밀번호입니다.

다음 명령으로 Secret을 Kubernetes 클러스터에 배포합니다.

```shell
kubectl -n ${namespace} apply -f ${secretFileName}.yaml
```

| 매개변수 | 설명 |
|------|------|
| `${namespace}` | DorisDisaggregatedCluster 리소스를 배포할 네임스페이스 |
| `${secretFileName}` | 배포할 Secret의 파일 이름 |

**단계 2: DorisDisaggregatedCluster에서 Secret 참조**

배포할 DorisDisaggregatedCluster 리소스에 사용할 Secret을 지정합니다. 구성은 다음과 같습니다.

```yaml
spec:
    authSecret: ${secretName}
```

여기서 `${secretName}`은 root 사용자 이름과 비밀번호가 포함된 Secret의 이름입니다.

## 시나리오 2: 배포 중 root가 아닌 관리 사용자 자동 생성(권장) {#scenario-2-automatically-create-a-non-root-management-user-during-deployment-recommended}

클러스터를 처음 배포할 때 Operator가 root가 아닌 전용 관리 사용자를 자동으로 생성하도록 할 수 있습니다. 최초 배포 시 root 초기 비밀번호를 설정하지 않았다면 환경 변수 또는 Secret을 통해 root가 아닌 사용자와 로그인 비밀번호를 구성할 수 있습니다. Doris 컨테이너의 보조 서비스가 Doris에 사용자를 자동으로 생성하고 비밀번호를 설정한 뒤 Node_priv 권한을 부여합니다. 이후 Doris Operator는 자동으로 생성된 사용자 이름과 비밀번호를 사용하여 클러스터 노드를 관리합니다.

다음 두 가지 방식 중 하나를 선택하여 구성합니다.

### 방식 A: 환경 변수 구성 {#method-a-environment-variable-configuration-1}

배포할 DorisDisaggregatedCluster 리소스를 다음 형식으로 구성합니다.

```yaml
spec:
    adminUser:
        name: ${DB_ADMIN_USER}
        password: ${DB_ADMIN_PASSWD}
```

| 매개변수 | 설명 |
|------|------|
| `${DB_ADMIN_USER}` | 관리 권한을 부여하여 생성할 사용자 이름 |
| `${DB_ADMIN_PASSWD}` | 새 사용자의 비밀번호 |

### 방식 B: Secret 구성 {#method-b-secret-configuration-1}

**단계 1: Secret 생성 및 배포**

사용할 Basic Authentication Secret을 다음 형식으로 구성합니다.

```yaml
stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
```

| 매개변수 | 설명 |
|------|------|
| `${DB_ADMIN_USER}` | 새로 생성할 사용자 이름 |
| `${DB_ADMIN_PASSWD}` | 새로 생성할 사용자 이름에 설정할 비밀번호 |

다음 명령으로 Secret을 Kubernetes 클러스터에 배포합니다.

```shell
kubectl -n ${namespace} apply -f ${secretFileName}.yaml
```

| 매개변수 | 설명 |
|------|------|
| `${namespace}` | DorisDisaggregatedCluster 리소스가 배포되는 네임스페이스 |
| `${secretFileName}` | 배포할 Secret의 파일 이름 |

**단계 2: DorisDisaggregatedCluster에서 Secret 참조**

아래와 같이 DorisDisaggregatedCluster 리소스에 사용할 Secret을 지정합니다.

```yaml
spec:
    authSecret: ${secretName}
```

여기서 `${secretName}`은 배포된 Basic Authentication Secret의 이름입니다.

:::tip 팁
배포 후 root 비밀번호를 설정하세요. Doris Operator는 새 사용자와 비밀번호를 사용하여 클러스터 노드를 관리하도록 전환합니다. 새로 생성한 사용자는 삭제하지 마세요.
:::

## 시나리오 3: 클러스터 배포 후 root 사용자 비밀번호 설정 {#scenario-3-set-the-root-user-password-after-the-cluster-is-deployed}

Doris 클러스터를 배포한 후에도 root 사용자의 비밀번호가 설정되어 있지 않다면 Doris Operator가 클러스터 노드를 자동으로 관리할 수 있도록 [Node_priv](../../../admin-manual/auth/authentication-and-authorization#types-of-permissions) 권한이 있는 사용자를 구성해야 합니다. root 사용자를 사용하지 않는 것이 좋습니다. [사용자 생성 및 권한 부여 장](../../../sql-manual/sql-statements/account-management/CREATE-USER)을 참고하여 새 사용자를 생성하고 Node_priv 권한을 부여하세요. 사용자를 생성한 후 환경 변수 또는 Secret을 통해 새 관리 사용자와 비밀번호를 구성하고 DorisDisaggregatedCluster 리소스에 설정합니다.

구성 절차 개요:

1. MySQL 프로토콜을 사용하여 Node_priv 권한이 있는 사용자 생성
2. 새 사용자에게 Node_priv 권한 부여
3. DorisDisaggregatedCluster에 관리용 인증 정보 구성(환경 변수 또는 Secret 중 하나 선택)

### 단계 1: Node_priv 권한이 있는 사용자 생성 {#step-1-create-a-user-with-the-node_priv-privilege}

MySQL 프로토콜로 데이터베이스에 연결한 후 다음 명령으로 사용자를 생성하고 비밀번호를 설정합니다.

```shell
CREATE USER '${DB_ADMIN_USER}' IDENTIFIED BY '${DB_ADMIN_PASSWD}';
```

| 매개변수 | 설명 |
|------|------|
| `${DB_ADMIN_USER}` | 생성할 사용자 이름 |
| `${DB_ADMIN_PASSWD}` | 설정할 비밀번호 |

### 단계 2: 새 사용자에게 Node_priv 권한 부여 {#step-2-grant-the-node_priv-privilege-to-the-new-user}

MySQL 프로토콜로 데이터베이스에 연결한 후 다음 명령을 실행하여 새 사용자에게 Node_priv 권한을 부여합니다.

```shell
GRANT NODE_PRIV ON *.*.* TO ${DB_ADMIN_USER};
```

여기서 `${DB_ADMIN_USER}`는 새로 생성한 사용자 이름입니다.

사용자 생성, 비밀번호 설정 및 권한 부여에 대한 자세한 내용은 공식 [CREATE-USER](../../../sql-manual/sql-statements/account-management/CREATE-USER) 문서를 참고하세요.

### 단계 3: DorisDisaggregatedCluster에 관리용 인증 정보 구성 {#step-3-configure-management-credentials-in-dorisdisaggregatedcluster-1}

다음 두 가지 방식 중 하나를 선택하여 구성합니다.

#### 방식 A: 환경 변수 구성 {#method-a-environment-variable-configuration-2}

DorisDisaggregatedCluster 리소스에 새로 생성한 사용자와 비밀번호를 다음 형식으로 구성합니다.

```yaml
spec:
    adminUser:
        name: ${DB_ADMIN_USER}
        password: ${DB_ADMIN_PASSWD}
```

| 매개변수 | 설명 |
|------|------|
| `${DB_ADMIN_USER}` | 새로 생성한 사용자 이름 |
| `${DB_ADMIN_PASSWD}` | 새로 생성한 사용자에게 설정한 비밀번호 |

#### 방식 B: Secret 구성 {#method-b-secret-configuration-2}

**단계 1: Secret 생성 및 배포**

다음 형식으로 Basic Authentication Secret을 생성합니다.

```yaml
stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
```

| 매개변수 | 설명 |
|------|------|
| `${DB_ADMIN_USER}` | 새로 생성한 사용자 이름 |
| `${DB_ADMIN_PASSWD}` | 새로 생성한 사용자 이름에 설정한 비밀번호 |

다음 명령으로 Secret을 Kubernetes 클러스터에 배포합니다.

```shell
kubectl -n ${namespace} apply -f ${secretFileName}.yaml
```

| 매개변수 | 설명 |
|------|------|
| `${namespace}` | DorisDisaggregatedCluster 리소스가 배포되는 네임스페이스 |
| `${secretFileName}` | 배포할 Secret의 파일 이름 |

**단계 2: DorisDisaggregatedCluster에서 Secret 참조**

아래와 같이 DorisDisaggregatedCluster 리소스에 사용할 Secret을 지정합니다.

```yaml
spec:
    authSecret: ${secretName}
```

여기서 `${secretName}`은 배포된 Basic Authentication Secret의 이름입니다.

:::tip 팁
배포 후 root 비밀번호를 설정하고 노드 관리 권한이 있는 새 사용자 이름과 비밀번호를 구성하면 기존 서비스에 대해 롤링 재시작이 한 번 수행됩니다.
:::

## Kerberos 인증 파일 마운트 {#mounting-kerberos-authentication-files}

이 절에서는 Kubernetes 환경에서 스토리지와 컴퓨트가 분리된 Doris 클러스터에 Kerberos 인증 파일을 마운트하는 방법을 설명합니다. 구성 후에는 Kerberos 인증에 필요한 `krb5.conf` 구성 파일과 `keytab` 키 파일이 Doris 컨테이너에 마운트되어 [Hive Catalog](../../../lakehouse/catalogs/hive-catalog)와 같은 기능에서 사용됩니다. 이를 통해 Doris는 Kerberos 인증이 활성화된 Hive 또는 기타 외부 데이터 소스에 연결할 수 있습니다.

:::caution 주의
이 구성은 Kerberos를 통해 Doris 클러스터에 접근하기 위한 것이 아닙니다. 마운트 후 Doris는 이 Kerberos 파일을 사용하여 다른 외부 데이터 소스(예: HDFS)에 접근할 수 있습니다.
:::

### 사전 요구 사항 {#prerequisites}

- Doris Operator 25.5.1 이상
- 스토리지와 컴퓨트가 분리된 Doris 클러스터 2.1.10 또는 3.0.6 이상

### 필요한 파일 {#required-files}

| 파일 | 설명 |
|------|------|
| [krb5.conf](https://web.mit.edu/kerberos/krb5-1.12/doc/admin/conf_files/krb5_conf.html) | Kerberos 구성 파일 |
| [keytab 파일](https://web.mit.edu/Kerberos/krb5-1.16/doc/basic/keytab_def.html) | Kerberos principal과 암호화 키가 포함된 파일 |

### 단계 1: krb5.conf를 저장할 ConfigMap 생성 {#step-1-create-a-configmap-to-store-krb5conf}

```shell
kubectl create -n ${namespace} configmap ${name} --from-file=krb5.conf
```

| 매개변수 | 설명 |
|------|------|
| `${namespace}` | `DorisDisaggregatedCluster`가 배포되는 네임스페이스 |
| `${name}` | ConfigMap 이름 |

### 단계 2: keytab 파일을 저장할 Secret 생성 {#step-2-create-a-secret-to-store-the-keytab-file}

```shell
kubectl create -n ${namespace} secret generic ${name} --from-file=${xxx.keytab}
```

| 매개변수 | 설명 |
|------|------|
| `${namespace}` | `DorisDisaggregatedCluster`가 배포되는 네임스페이스 |
| `${name}` | Secret 이름 |
| `${xxx.keytab}` | keytab 파일 이름 |

:::tip 팁
여러 `keytab` 파일을 마운트해야 하는 경우 [kubectl create secret 문서](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_create/kubectl_create_secret/)를 참고하여 여러 `keytab` 파일을 하나의 Secret에 넣으세요.
:::

### 단계 3: DorisDisaggregatedCluster에 Kerberos 정보 구성 {#step-3-configure-kerberos-information-in-dorisdisaggregatedcluster}

```yaml
spec:
    kerberosInfo:
        krb5ConfigMap: ${krb5ConfigMapName}
        keytabSecretName: ${keytabSecretName}
        keytabPath: ${keytabPath}
```

| 매개변수 | 설명 |
|------|------|
| `${krb5ConfigMapName}` | `krb5.conf` 파일이 포함된 ConfigMap의 이름 |
| `${keytabSecretName}` | keytab 파일이 포함된 Secret의 이름 |
| `${keytabPath}` | 컨테이너 내부에서 keytab 파일이 마운트되는 경로 |

### 단계 4: Hive Catalog에서 Kerberos 인증 사용 {#step-4-use-kerberos-authentication-in-hive-catalog}

Kerberos 구성을 마치면 Hive Catalog를 생성할 때 Kerberos 인증을 활성화할 수 있습니다. 구체적인 구성 방법은 [Hive Catalog 구성 문서](../../../lakehouse/catalogs/hive-catalog#配置-catalog)를 참고하세요.
