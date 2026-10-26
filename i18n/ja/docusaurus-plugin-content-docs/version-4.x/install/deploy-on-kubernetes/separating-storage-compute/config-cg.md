---
{
    "title": "Compute Group の設定",
    "language": "ja",
    "description": "レプリカ設定、複数の Compute Group の設定、リソース設定、アクセス方式の設定、起動パラメータの設定、永続ストレージの設定を含む、Compute Group の詳細な設定ガイド。",
    "keywords": ["Doris", "Storage-Compute Decoupling", "Kubernetes", "Compute Group", "BE", "NodePort", "LoadBalancer", "Persistent Storage", "ConfigMap"]
}
---

Compute Group は、同じタスクを処理する BE ノードの集合です。このドキュメントでは、用途別に `DorisDisaggregatedCluster` リソースで Compute Group を設定する方法を説明します。主な内容は次のとおりです。

- **基本的なデプロイ**: 単一または複数の Compute Group をすばやく設定する
- **リソース制御**: CPU やメモリなどのコンピュートリソースを制限する
- **アクセス制御**: クラスター内外からさまざまな方法で BE サービスにアクセスする
- **起動設定のカスタマイズ**: ConfigMap を使用して BE の起動パラメータをカスタマイズする
- **データの永続化**: キャッシュ、ログ、StreamLoad の一時保存データに永続ストレージを使用する

## シナリオ 1: 単一の Compute Group をすばやく設定する {#scenario-1-quickly-set-up-a-single-compute-group}

### 最小構成 {#minimal-configuration}

最も簡単な Compute Group の設定に必要なフィールドは、次の 3 つだけです。

```yaml
spec:
  computeGroups:
  - uniqueId: ${uniqueId}
    image: ${beImage}
    replicas: 1
```

### フィールドの説明 {#field-descriptions}

| フィールド | 説明 |
|------|------|
| `uniqueId` | Compute Group の一意の識別子であり、Compute Group の名前にもなります。設定後は変更できません。名前は `[a-zA-Z][0-9a-zA-Z_]+` という規則に一致する必要があります |
| `image` | BE サービスのデプロイに使用するイメージのアドレスです。[Apache Doris の公式イメージレジストリ](https://hub.docker.com/r/apache/doris)で提供されているイメージを使用してください |
| `replicas` | Compute Group 内の BE サービスノード数です |

## シナリオ 2: 業務を分離するために複数の Compute Group をデプロイする {#scenario-2-deploy-multiple-compute-groups-for-business-isolation}

`DorisDisaggregatedCluster` リソースでは複数の Compute Group をデプロイでき、それぞれが独立して動作します。次の例は、`cg1` と `cg2` という名前の Compute Group をデプロイする設定です。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 3
  - uniqueId: cg2
    image: ${beImage}
    replicas: 2
```

各 Compute Group のレプリカ数は次のとおりです。

| Compute Group 名 | レプリカ数 |
|------|------|
| `cg1` | 3 |
| `cg2` | 2 |

ここで、`${beImage}` はデプロイする BE サービスのイメージを表します。

:::tip ヒント
Compute Group はそれぞれ独立していますが、同じストレージ・コンピュート分離クラスター内のすべての Compute Group で、BE サービスのイメージを統一することを推奨します。
:::

## シナリオ 3: Compute Group のコンピュートリソースを制限する {#scenario-3-limit-the-compute-resources-of-a-compute-group}

ストレージ・コンピュート分離の[デフォルトのデプロイ例](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml)では、BE サービスが使用するコンピュートリソースに制限を設けていません。`DorisDisaggregatedCluster` では、Kubernetes の [resources.requests と resources.limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#requests-and-limits) を使用して CPU とメモリのリソースを指定します。

たとえば、`cg1` という名前の Compute Group の BE に 8c 8Gi のリソースを割り当てるには、次のように設定します。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    requests:
      cpu: 8
      memory: 8Gi
    limits:
      cpu: 8
      memory: 8Gi
```

この設定をデプロイ対象の [`DorisDisaggregatedCluster` リソース](./install-doris-cluster.md#2-modify-key-configurations)に反映すると有効になります。

## シナリオ 4: Compute Group へのアクセス方法を設定する {#scenario-4-configure-the-access-method-of-a-compute-group}

デフォルトでは、Compute Group のサービスは外部に直接公開されません。Doris Operator は、`DorisDisaggregatedCluster` リソースで Compute Group へのアクセスを仲介する Service を提供します。Service は次の 3 つの公開方式に対応しています。アクセス元に適した方式を選択してください。

| アクセス方式 | 適用する場面 | 特徴 |
|------|------|------|
| `ClusterIP` | Kubernetes クラスター内からアクセスする場合 | デフォルトの方式で、クラスター内のアドレスを提供します |
| `NodePort` | 自己管理の Kubernetes クラスターの外部からアクセスする場合 | ホストマシンのポートを通じてサービスを公開します |
| `LoadBalancer` | クラウドプラットフォーム上の Kubernetes クラスターの外部からアクセスする場合 | クラウドサービスプロバイダーが提供するロードバランサを使用します |

### 4.1 ClusterIP（クラスター内からのアクセス） {#41-clusterip-access-within-the-cluster}

[ClusterIP アクセス方式](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)は、Kubernetes クラスター内のアドレスを提供します。このアドレスが、Kubernetes 内からサービスにアクセスする際の入口になります。

#### ステップ 1: Service のタイプを ClusterIP に設定する {#step-1-configure-clusterip-as-the-service-type}

Doris は、Kubernetes で ClusterIP アクセス方式をデフォルトで有効にします。追加の設定なしで使用できます。

#### ステップ 2: Service のアクセスアドレスを取得する {#step-2-get-the-service-access-address}

クラスターのデプロイ後、次のコマンドで Compute Group が公開する Service を確認します。

```shell
kubectl -n doris get svc
```

結果は次のとおりです。

```shell
NAME                                     TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                               AGE
test-disaggregated-cluster-cg1           ClusterIP   10.152.183.154   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   2d
```

上記の結果から、`doris` 名前空間にある、`uniqueId` が `cg1` の Compute Group に対応する Service を確認できます。

### 4.2 NodePort（自己管理クラスターへの外部アクセス） {#42-nodeport-external-access-for-self-managed-clusters}

Kubernetes クラスターの外部から Doris にアクセスするには、[NodePort 方式](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)を選択します。NodePort 方式には、次の 2 つのポート割り当て方法があります。

| 割り当て方法 | 説明 |
|------|------|
| ホストポートの動的割り当て | ポートマッピングを明示的に設定しない場合、Pod の作成時に Kubernetes が未使用のホストポート（デフォルトの範囲は 30000-32767）を自動的に割り当てます |
| ホストポートの静的割り当て | ポートマッピングを明示的に指定した場合、ホストポートが未使用で競合がなければ、Kubernetes がその固定ポートを割り当てます |

静的割り当てでは、ポートマッピングを事前に計画する必要があります。Doris は、外部との通信に次のポートを提供します。

**表 1: BE サービスのポートの説明**

| ポート名 | デフォルトポート | ポートの説明 |
|------|------|------|
| Web Server Port | 8040 | BE 情報の表示に使用する、BE 上の HTTP サーバーポート |

#### 静的割り当ての設定 {#static-allocation-configuration}

次の例では、`cg1` という名前の Compute Group の BE 上のポート 8040 を、ホスト上のポート 31012 にマッピングします。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: NodePort
      portMaps:
      - nodePort: 31012
        targetPort: 8040
```

#### 動的割り当ての設定 {#dynamic-allocation-configuration}

`cg1` という名前の Compute Group で動的な NodePort アクセス方式を使用する設定は、次のとおりです。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: NodePort
```

### 4.3 LoadBalancer（クラウド環境での外部アクセス） {#43-loadbalancer-external-access-in-cloud-environments}

[LoadBalancer 方式](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer)は、クラウドプラットフォーム上の Kubernetes 環境に適しており、クラウドサービスプロバイダーが提供するロードバランサを使用します。次のように、`computeGroup.service` のタイプを `LoadBalancer` に設定します。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: LoadBalancer
      annotations:
        service.beta.kubernetes.io/load-balancer-type: "external"
```

## シナリオ 5: BE の起動設定をカスタマイズする {#scenario-5-customize-the-be-startup-configuration}

デフォルトのデプロイでは、各 Compute Group の BE サービスは、イメージ内のデフォルトの設定ファイルを使用して起動します。Doris Operator は、Kubernetes の ConfigMap を使用してカスタムの起動設定ファイルをマウントします。全体の流れは次のとおりです。

| 段階 | 説明 |
|------|------|
| 入力 | カスタムの `be.conf` 設定ファイル |
| 操作 | ConfigMap を作成し、`/etc/doris` ディレクトリにマウントします |
| 結果 | Compute Group の BE サービスがカスタム設定で起動します |

### ステップ 1: 起動設定を含む ConfigMap を作成する {#step-1-create-a-configmap-that-contains-the-startup-information}

BE サービスで使用できる ConfigMap の例を次に示します。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: be-configmap
  labels:
    app.kubernetes.io/component: be
data:
  be.conf: |
    # For jdk 17, this JAVA_OPTS will be used as default JVM options
    JAVA_OPTS_FOR_JDK_17="-Xmx1024m -DlogPath=$LOG_DIR/jni.log -Xlog:gc*:$LOG_DIR/be.gc.log.$CUR_DATE:time,uptime:filecount=10,filesize=50M -Djavax.security.auth.useSubjectCredsOnly=false -Dsun.security.krb5.debug=true -Dsun.java.command=DorisBE -XX:-CriticalJNINatives -XX:+IgnoreUnrecognizedVMOptions --add-opens=java.base/java.lang=ALL-UNNAMED --add-opens=java.base/java.lang.invoke=ALL-UNNAMED --add-opens=java.base/java.lang.reflect=ALL-UNNAMED --add-opens=java.base/java.io=ALL-UNNAMED --add-opens=java.base/java.net=ALL-UNNAMED --add-opens=java.base/java.nio=ALL-UNNAMED --add-opens=java.base/java.util=ALL-UNNAMED --add-opens=java.base/java.util.concurrent=ALL-UNNAMED --add-opens=java.base/java.util.concurrent.atomic=ALL-UNNAMED --add-opens=java.base/sun.nio.ch=ALL-UNNAMED --add-opens=java.base/sun.nio.cs=ALL-UNNAMED --add-opens=java.base/sun.security.action=ALL-UNNAMED --add-opens=java.base/sun.util.calendar=ALL-UNNAMED --add-opens=java.security.jgss/sun.security.krb5=ALL-UNNAMED --add-opens=java.management/sun.management=ALL-UNNAMED"
    file_cache_path = [{"path":"/opt/apache-doris/be/file_cache","total_size":107374182400,"query_limit":107374182400}]
    deploy_mode = cloud
```

:::tip ヒント
ストレージ・コンピュート分離クラスターの BE サービスでは、起動設定に `file_cache_path` を指定する必要があります。形式については、[ストレージ・コンピュート分離構成の `be.conf` 設定](../../deploy-manually/separating-storage-compute-deploy-manually)を参照してください。
:::

### ステップ 2: ConfigMap をデプロイする {#step-2-deploy-the-configmap}

次のコマンドで、カスタムの起動設定を含む ConfigMap を Kubernetes クラスターにデプロイします。

```shell
kubectl apply -n ${namespace} -f ${beConfigMapFileName}.yaml
```

パラメータの説明は次のとおりです。

| パラメータ | 説明 |
|------|------|
| `${namespace}` | `DorisDisaggregatedCluster` がデプロイされている名前空間 |
| `${beConfigMapFileName}` | カスタム ConfigMap を含むファイルの名前 |

### ステップ 3: DorisDisaggregatedCluster リソースを更新する {#step-3-update-the-dorisdisaggregatedcluster-resource}

ConfigMap をマウントするように [`DorisDisaggregatedCluster` リソース](./install-doris-cluster.md#2-modify-key-configurations)を更新します。設定は次のとおりです。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    configMaps:
    - name: be-configmap
      mountPath: "/etc/doris"
```

:::tip ヒント
起動設定は `/etc/doris` ディレクトリにマウントする必要があります。
:::

## シナリオ 6: Compute Group の永続ストレージを設定する {#scenario-6-configure-persistent-storage-for-a-compute-group}

デフォルトのデプロイでは、BE サービスのキャッシュに Kubernetes の [EmptyDir](https://kubernetes.io/zh-cn/docs/concepts/storage/volumes/#emptydir) を使用します。`EmptyDir` は非永続的なストレージ方式です。サービスを再起動するとキャッシュデータが失われ、それに伴ってクエリの効率が低下します。

BE サービスの再起動後もキャッシュデータを保持し、クエリの効率が低下しないようにするには、キャッシュデータを永続化する必要があります。BE サービスに関係する主なストレージパスは次のとおりです。

| ストレージパス | 用途 |
|------|------|
| BE のログディレクトリ | BE サービスのログは標準出力に出力されるほか、起動設定の `LOG_DIR` で指定したディレクトリにも書き込まれます |
| `/opt/apache-doris/be/storage` | StreamLoad 方式でインポートする際のデータの一時保存先です。サービスが異常終了して再起動した後も、一時保存されたデータが失われないようにします |
| BE のキャッシュディレクトリ | クエリキャッシュです。再起動後にデータが失われると、クエリの効率が低下します |

### 6.1 永続ストレージの設定例 {#61-persistent-storage-example}

永続化が必要なデータに永続ストレージをマウントする設定例を次に示します。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    persistentVolumes:
    - mountPaths:
      - /opt/apache-doris/be/log
      persistentVolumeClaimSpec:
        # storageClassName: ${storageclass_name}
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 300Gi
    - mountPaths:
      - /opt/apache-doris/be/storage
      persistentVolumeClaimSpec:
        # storageClassName: ${storageclass_name}
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 300Gi
    - persistentVolumeClaimSpec:
        # storageClassName: ${storageclass_name}
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 500Gi
```

上記の設定の内容は次のとおりです。

- ログディレクトリにはカスタムストレージ設定を使用し、300Gi のストレージディスクをマウントします
- WAL と StreamLoad のインポートに使用するディレクトリには、300Gi のストレージディスクをマウントします
- キャッシュディレクトリにはストレージテンプレートを使用し、500Gi のストレージディスクをマウントします

:::tip ヒント
`mountPaths` 配列が空の場合、現在のストレージ設定はテンプレート設定として扱われます。
:::

### 6.2 ログを永続化しない {#62-do-not-persist-logs}

ログを永続化せず、標準出力にのみ出力する場合は、次のように設定します。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    logNotStore: true
```
