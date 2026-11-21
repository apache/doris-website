---
{
    "title": "計算グループの設定",
    "language": "ja",
    "description": "Kubernetes 上の Doris 計算グループについて、BE のレプリカ数、CPU とメモリ、サービスへのアクセス、起動オプション、永続ストレージ、スケーリング操作を設定します。",
    "keywords": ["Doris", "Storage-Compute Decoupling", "Kubernetes", "Compute Group", "BE", "NodePort", "LoadBalancer", "Persistent Storage", "ConfigMap"]
}
---

計算グループは、同じタスクを処理する BE ノードの集合です。このドキュメントでは、`DorisDisaggregatedCluster` リソースで計算グループを設定する方法を、主に次のユースケースに沿って説明します。

- **基本的なデプロイ**：単一または複数の計算グループをすばやく構成する
- **リソース制御**：CPU やメモリなどの計算リソースを制限する
- **アクセス制御**：クラスターの内外から、さまざまな方法で BE サービスにアクセスする
- **起動時のカスタマイズ**：ConfigMap を使用して BE の起動パラメーターをカスタマイズする
- **データの永続化**：キャッシュ、ログ、StreamLoad の一時データを永続ストレージに保存する
- **スケーリング**：BE ノードや計算グループを追加・削除し、縮小結果を確認する

## シナリオ 1：単一の計算グループをすばやく構成する {#scenario-1-quickly-set-up-a-single-compute-group}

### 最小構成 {#minimal-configuration}

最もシンプルな計算グループの構成には、次の 3 つのフィールドだけが必要です。

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
| `uniqueId` | 計算グループの一意の識別子であり、計算グループの名前でもあります。設定後は変更できません。名前は `[a-zA-Z][0-9a-zA-Z_]+` という規則に一致する必要があります |
| `image` | BE サービスのデプロイに使用するイメージのアドレスです。[Apache Doris の公式イメージレジストリ](https://hub.docker.com/r/apache/doris)で提供されるイメージを使用してください |
| `replicas` | 計算グループ内の BE サービスノード数です |

### ノードのシステム初期化 {#be-system-initialization}

`skipDefaultSystemInit` のデフォルト値は `false` です。Doris Operator は、次のコマンドを実行する特権付きの BE init コンテナーを追加します。

```shell
sysctl -w vm.max_map_count=2000000 && swapoff -a
```

これらのコマンドは、ほかのワークロードと共有される設定を含め、基盤となる Linux ノードの設定を変更します。デスクトップ上で kind を使用している場合、影響を受ける Linux カーネルはコンテナーランタイムの仮想マシンに属していることがあります。この初期化の影響は BE プロセス内に限られません。

ノード管理者が必要な設定をすでに済ませている場合は、既存の計算グループのエントリに `skipDefaultSystemInit: true` を設定します。マニフェスト内のほかのフィールドと計算グループは維持してください。

```yaml
spec:
  computeGroups:
    - uniqueId: cg1
      skipDefaultSystemInit: true
```

Doris 3.0.4 以降では、このスイッチによって `SKIP_CHECK_ULIMIT=true` も注入され、一部のシステムパラメーターに対する起動時のチェックがスキップされます。有効にする前に、ノードの設定を自身で確認してください。

## シナリオ 2：業務を分離するために複数の計算グループをデプロイする {#scenario-2-deploy-multiple-compute-groups-for-business-isolation}

`DorisDisaggregatedCluster` リソースは複数の計算グループのデプロイをサポートしており、各計算グループは互いに独立しています。次の例は、`cg1` と `cg2` という名前の計算グループをデプロイする構成です。

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

各計算グループのレプリカ数は次のとおりです。

| 計算グループ名 | レプリカ数 |
|------|------|
| `cg1` | 3 |
| `cg2` | 2 |

ここで、`${beImage}` はデプロイする BE サービスのイメージを表します。

:::tip ヒント
計算グループは互いに独立していますが、同じストレージとコンピュートを分離したクラスター内のすべての計算グループで、BE サービスのイメージを統一することを推奨します。
:::

## シナリオ 3：計算グループの計算リソースを制限する {#scenario-3-limit-the-compute-resources-of-a-compute-group}

ストレージとコンピュートを分離する[デフォルトのデプロイ例](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml)では、BE サービスが使用する計算リソースに制限を設けていません。`DorisDisaggregatedCluster` では、Kubernetes の [resources.requests と resources.limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#requests-and-limits) を使用して CPU とメモリのリソースを指定します。

たとえば、`cg1` という名前の計算グループの BE に 8c 8Gi のリソースを割り当てるには、次のように設定します。

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

この設定を、デプロイする [`DorisDisaggregatedCluster` リソース](./install-doris-cluster.md#2-modify-key-configurations)に反映すると有効になります。

## シナリオ 4：計算グループへのアクセス方法を設定する {#scenario-4-configure-the-access-method-of-a-compute-group}

デフォルトでは、計算グループは外部にサービスを直接公開しません。Doris Operator は、`DorisDisaggregatedCluster` リソース内で計算グループへのアクセスを中継する Service を提供します。Service は次の公開モードに対応しています。アクセス元に合うものを選択してください。

| アクセスモード | 適用する場面 | 特徴 |
|------|------|------|
| `ClusterIP` | Kubernetes クラスター内からのアクセス | デフォルトのモードで、クラスター内のアドレスを提供します |
| `NodePort` | 自己管理の Kubernetes クラスターの外部からのアクセス | ホストマシンのポートを通じてサービスを公開します |
| `LoadBalancer` | クラウドプラットフォーム上の Kubernetes クラスターの外部からのアクセス | クラウドサービスプロバイダーが提供するロードバランサーを使用します |

### 4.1 ClusterIP（クラスター内からのアクセス） {#41-clusterip-access-within-the-cluster}

[ClusterIP アクセスモード](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)は、Kubernetes クラスター内のアドレスを提供します。このアドレスが、Kubernetes 内からサービスにアクセスするための入口になります。

#### ステップ 1：Service のタイプに ClusterIP を設定する {#step-1-configure-clusterip-as-the-service-type}

Doris は、Kubernetes 上で ClusterIP アクセスモードをデフォルトで有効にします。追加の設定なしで使用できます。

#### ステップ 2：Service のアクセスアドレスを取得する {#step-2-get-the-service-access-address}

クラスターのデプロイ後、次のコマンドで計算グループが公開する Service を確認します。

```shell
kubectl -n doris get svc
```

結果は次のようになります。

```shell
NAME                                     TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                               AGE
test-disaggregated-cluster-cg1           ClusterIP   10.152.183.154   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   2d
```

上記の結果から、`uniqueId` が `cg1` で、名前空間が `doris` の計算グループに対して利用できる Service がわかります。

### 4.2 NodePort（自己管理クラスターの外部からのアクセス） {#42-nodeport-external-access-for-self-managed-clusters}

Kubernetes クラスターの外部から Doris にアクセスするには、[NodePort モード](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)を選択します。NodePort モードには、次のポート割り当て方法があります。

| 割り当て方法 | 説明 |
|------|------|
| ホストポートの動的割り当て | ポートマッピングを明示的に設定しない場合、Kubernetes は Pod の作成時に未使用のホストポートを自動的に割り当てます（デフォルトの範囲は 30000-32767） |
| ホストポートの静的割り当て | ポートマッピングを明示的に指定すると、ホストポートが未使用で競合もない場合に、Kubernetes はその固定ポートを割り当てます |

静的割り当てにはポートマッピングの計画が必要です。Doris は外部との通信に次のポートを提供します。

**表 1：BE サービスのポートの説明**

| ポート名 | デフォルトポート | ポートの説明 |
|------|------|------|
| Web Server Port | 8040 | BE 上の HTTP サーバーポート。BE の情報を確認するために使用します |

#### 静的割り当ての設定 {#static-allocation-configuration}

次の例では、`cg1` という名前の計算グループにある BE のポート 8040 を、ホストのポート 31012 にマッピングします。

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

`cg1` という名前の計算グループで動的な NodePort アクセスモードを使用する場合は、次のように設定します。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: NodePort
```

### 4.3 LoadBalancer（クラウド環境のクラスター外部からのアクセス） {#43-loadbalancer-external-access-in-cloud-environments}

[LoadBalancer モード](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer)は、クラウドプラットフォーム上の Kubernetes 環境に適しており、クラウドサービスプロバイダーが提供するロードバランサーを使用します。次のように、`computeGroup.service` のタイプを `LoadBalancer` に設定します。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: LoadBalancer
      annotations:
        service.beta.kubernetes.io/load-balancer-type: "external"
```

## シナリオ 5：BE の起動設定をカスタマイズする {#scenario-5-customize-the-be-startup-configuration}

デフォルトのデプロイでは、各計算グループの BE サービスはイメージ内のデフォルト設定ファイルを使用して起動します。Doris Operator は Kubernetes の ConfigMap を使用して、カスタムの起動設定ファイルをマウントします。全体の流れは次のとおりです。

| 段階 | 説明 |
|------|------|
| 入力 | カスタムの `be.conf` 設定ファイル |
| 操作 | ConfigMap を作成し、`/etc/doris` ディレクトリにマウントする |
| 出力 | 計算グループの BE サービスがカスタム設定で起動する |

### ステップ 1：起動情報を含む ConfigMap を作成する {#step-1-create-a-configmap-that-contains-the-startup-information}

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
ストレージとコンピュートを分離したクラスターでは、BE サービスの起動設定に `file_cache_path` を指定する必要があります。書式については、[ストレージとコンピュートを分離した構成の `be.conf` 設定](../../deploy-manually/separating-storage-compute-deploy-manually)を参照してください。
:::

### ステップ 2：ConfigMap をデプロイする {#step-2-deploy-the-configmap}

次のコマンドを使用して、カスタムの起動設定を含む ConfigMap を Kubernetes クラスターにデプロイします。

```shell
kubectl apply -n ${namespace} -f ${beConfigMapFileName}.yaml
```

パラメーターの説明は次のとおりです。

| パラメーター | 説明 |
|------|------|
| `${namespace}` | `DorisDisaggregatedCluster` をデプロイする名前空間 |
| `${beConfigMapFileName}` | カスタム ConfigMap を含むファイルの名前 |

### ステップ 3：DorisDisaggregatedCluster リソースを更新する {#step-3-update-the-dorisdisaggregatedcluster-resource}

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

## シナリオ 6：計算グループに永続ストレージを設定する {#scenario-6-configure-persistent-storage-for-a-compute-group}

デフォルトのデプロイでは、BE サービスは Kubernetes の [EmptyDir](https://kubernetes.io/zh-cn/docs/concepts/storage/volumes/#emptydir) をサービスのキャッシュとして使用します。`EmptyDir` は非永続的なストレージモードです。サービスの再起動後はキャッシュデータが失われ、その分クエリの効率が低下します。

BE サービスの再起動後もキャッシュデータを保持し、クエリの効率を維持するには、キャッシュデータを永続化する必要があります。BE サービスに関係する主なストレージパスは次のとおりです。

| ストレージパス | 用途 |
|------|------|
| BE のログディレクトリ | BE サービスのログは標準出力に出力されるとともに、起動設定の `LOG_DIR` で指定されたディレクトリにも書き込まれます |
| `/opt/apache-doris/be/storage` | StreamLoad モードでデータをインポートする際の一時保存先です。サービスが異常終了して再起動した後に、一時保存したデータが失われるのを防ぎます |
| BE のキャッシュディレクトリ | クエリキャッシュです。再起動後にデータが失われると、クエリの効率が低下します |

### 6.1 永続ストレージの例 {#61-persistent-storage-example}

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

- ログディレクトリにはカスタムのストレージ設定を使用し、300Gi のストレージディスクをマウントします
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

## シナリオ 7：計算容量をスケーリングする {#scaling-compute-groups}

`DorisDisaggregatedCluster` リソースを変更して計算グループをスケーリングします。`replicas` フィールドが表すのは BE ノード数であり、オブジェクトストレージ内のデータのコピー数ではありません。この値を増やすと計算容量が増え、減らすと BE ノードとそのローカルキャッシュが削除されます。

以下の手順は [Doris Operator 26.0.1](https://github.com/apache/doris-operator/tree/26.0.1) に基づいています。同じリリースの CRD と Operator イメージを使用してください。縮小時の動作は BE イメージにも依存するため、すべてのイメージがグレースフルシャットダウンに対応しているとは想定しないでください。

### 7.1 クラスターを準備して確認する {#71-prepare-and-inspect-the-cluster}

容量を変更する前に、次を確認してください。

- FE、MetaService、FoundationDB、現在の BE ノードが正常であることを確認します。Operator は、[認証の設定](config-cluster.md)で構成した管理用認証情報を使って FE に接続できる必要があります。
- Kubernetes の CPU、メモリ、ストレージ容量を確認します。新しい PVC をバインドできるかどうかも確認してください。残りのワークロードを処理するのに十分な数の Ready 状態の BE ノードを維持します。
- 縮小する場合は、先にトラフィックを減らすか別の場所に振り分け、実行中のクエリとデータロードジョブが完了するのを待ちます。操作後にクライアントの再試行状況とデータロードジョブの状態を確認します。

次の例では、名前空間に `doris`、クラスターに `test-disaggregated-cluster`、計算グループに `cg1` を使用します。実際の名前に置き換えてください。

```shell
kubectl get ddc test-disaggregated-cluster -n doris -o yaml
kubectl get pods,sts,pvc -n doris
```

管理者として FE の SQL エンドポイントに接続し、現在の計算グループと BE ノードを記録します。

```sql
SHOW COMPUTE GROUPS;
SHOW BACKENDS;
```

クラスターのデプロイに使用した完全なマニフェストを編集してから、適用します。

```shell
kubectl apply -n doris -f ddc-sample.yaml
```

以下の YAML 断片は、変更するフィールドだけを示しています。ほかのフィールドと `spec.computeGroups` 内のすべてのほかのエントリは維持してください。既存のグループを省略すると、そのグループの削除が要求されます。Operator が Doris のメタデータと Kubernetes リソースを調整できるよう、StatefulSet を直接スケーリングせず、Doris のカスタムリソースを変更してください。

### 7.2 既存の計算グループを拡張する {#72-scale-out-an-existing-compute-group}

たとえば、完全なマニフェスト内の `cg1` を BE ノード 2 台から 3 台に変更します。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 3
```

既存の `uniqueId`、イメージ、リソース設定、ConfigMap、永続ボリュームの設定は維持します。マニフェストを適用すると、Operator は StatefulSet のレプリカ数を増やし、新しい BE は起動時にクラスターへ登録されます。

グループ内で 3 つの Pod が Ready 状態になり、`SHOW BACKENDS` に新しい BE が `Alive = true` で表示されることを確認します。新しいノードのキャッシュは空の状態から始まるため、ノードを追加しても、すぐに既存ノードと同じキャッシュが得られるわけではありません。

### 7.3 既存の計算グループを縮小する {#73-scale-in-an-existing-compute-group}

クラスター単位の Boolean 値 `spec.enableDecommission` によって、BE の削除方法が決まります。デフォルト値は `false` です。

| 値 | 計算グループの `replicas` を減らしたときの動作 |
| --- | --- |
| `true` | Doris BE のデコミッション操作を送信し、進行中は StatefulSet の元のレプリカ数を維持します。選択されたノードのデコミッションが完了した後、Doris から削除して StatefulSet を縮小します。 |
| `false` | デコミッションの手順を経ずに、選択された BE を Doris から削除します。Operator 26.0.1 は、BE イメージが対応している場合、まずグレースフルな縮小フローを使用します。対応していない場合は、直接削除する方法に切り替えます。 |

たとえば、デコミッションを経て `cg1` を 3 台から 2 台に減らすには、完全なマニフェストを次のように更新して適用します。

```yaml
spec:
  enableDecommission: true
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 2
```

Operator は、Pod の序数が目標レプリカ数以上のノードを選択します。デコミッションの実行中は、それらの Pod を手動で削除しないでください。進行状況は次のコマンドで確認します。

```shell
kubectl describe ddc test-disaggregated-cluster -n doris
kubectl get sts,pods,pvc -n doris
```

Doris で `SHOW BACKENDS;` を実行します。Operator のデコミッションチェックは、選択された BE について `SystemDecommissioned = true` かつ `TabletNum = 0` となるか、BE がすでに削除されるまで待ちます。処理中はグループが `Decommissioning` 状態のままになることがあります。目標数の Pod が Ready 状態になり、Doris 内の BE メンバーも対応する状態になって、はじめて完了です。

:::caution 縮小時のローカルストレージ
Operator 26.0.1 は StatefulSet の縮小後、削除した Pod の序数に対応する PVC を削除します。ストレージがその後どう扱われるかは、基盤となる PV の再利用ポリシーによって決まります。キャッシュ、ログ、Stream Load の一時データを永続化していても、縮小後にそのボリュームが残る保証はありません。BE を削除する前に、依存するデータロードジョブを完了させ、必要なログを保管してください。再び拡張しても、以前のローカルデータが復元される保証はありません。
:::

### 7.4 計算グループ全体を追加または削除する {#74-add-or-remove-an-entire-compute-group}

グループを追加する場合は、既存のグループをすべて維持したまま、新しい `uniqueId` を持つエントリを追加します。例を示します。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 2
  - uniqueId: cg2
    image: ${beImage}
    replicas: 2
```

完全なマニフェストを適用し、`cg2` が Ready 状態になって `SHOW COMPUTE GROUPS` に表示されるまで待ちます。トラフィックを送る前に、[計算グループの管理](../../../compute-storage-decoupled/managing-compute-cluster.md)に従ってユーザーのアクセス権とワークロードのルーティングを設定します。グループを追加しても、既存のセッションは自動的には移動しません。

グループを削除する場合は、まずそのグループのクエリとデータロードを別の利用可能なグループに移し、対象グループを参照しているユーザーのデフォルト設定やアプリケーション設定を更新します。完全なマニフェストからそのグループのエントリだけを削除して適用します。Operator は、そのグループの BE を Doris のメタデータから削除した後、管理対象の Service と StatefulSet を削除します。

:::caution グループ全体の削除とグループ内のレプリカ数の削減は動作が異なります
Operator 26.0.1 では、`computeGroups` のエントリ全体を削除すると、`enableDecommission` が `true` でも BE の直接削除方法が使われます。段階的なデコミッションを要求するためにエントリを削除しないでください。削除後は残存する PVC を確認し、保持ポリシーに従って処理してください。既存グループ内で縮小する場合と同じ方法でクリーンアップされるとは限りません。
:::

### 7.5 リソースとその他のコンポーネントの変更 {#75-resource-changes-and-other-components}

| 変更内容 | 操作と制約 |
| --- | --- |
| BE あたりの CPU やメモリを増減する | シナリオ 3 の説明に従ってグループの `requests` と `limits` を変更し、完全なマニフェストを適用します。Pod テンプレートが変わるため、BE が再起動することがあります。適用前にスケジューリング可能な容量を確認してください。 |
| FE をスケーリングする | `spec.feSpec.replicas` を変更します。この値は `electionNumber` 以上である必要があり、超過分の FE ノードは Observer になります。Operator は StatefulSet を縮小する前に、選択した Observer を Doris から削除します。既存クラスターの `electionNumber` は変更しないでください。[FE の設定](config-fe.md)を参照してください。 |
| MetaService、FoundationDB、Storage Vault の容量を変更する | 計算グループのレプリカ数とは独立して管理し、それぞれのメタデータとストレージを維持します。BE の縮小を理由に、これらのリソースやオブジェクトストレージ内のデータを削除しないでください。[MetaService の設定](config-ms.md)と[FoundationDB のデプロイ](install-fdb.md)を参照してください。 |

### 7.6 確認とトラブルシューティング {#76-verify-and-troubleshoot}

変更のたびに、カスタムリソースに示される計算グループのフェーズ、Pod の Ready 状態、`SHOW BACKENDS` の結果を合わせて確認します。ノード数が目標と一致し、残すノードが `Alive = true` で、廃止したノードが削除されていることを確認します。さらに、意図した計算グループを通じてクエリとデータロードが成功することを確認してください。

操作が進まない場合は、`kubectl describe ddc`、Pod Events、PVC のバインド状態、Operator のログを調べます。Pod が `Pending` の場合は通常、スケジューリングやストレージを確認します。`Decommissioning` の場合は Doris のデコミッションの進行状況を確認します。`ScaleDownFailed` の場合は Operator の SQL エラー、FE への接続、権限を確認します。報告された原因を解消してから再試行するか、リソースの強制削除を検討してください。[ステータスとトラブルシューティング](../doris-operator/status-and-troubleshooting.md)を参照してください。

## 計画的な BE の再起動 {#planned-be-restarts}

一時的な再起動では、BE の登録を維持してグレースフルシャットダウンを使用します。Doris 4.1.5 のストレージとコンピュートを分離したモードでは、`DECOMMISSION BACKEND` は永続的な縮小操作です。Pod を再起動しても取り消されず、`CANCEL DECOMMISSION BACKEND` はサポートされません。BE を恒久的に削除する場合は、上記の縮小手順を使用してください。

通常の `DROP BACKEND` が拒否されるのは、意図的な保護措置です。明示的に削除する `DROPP BACKEND` 構文については、[DROP BACKEND](../../../sql-manual/sql-statements/cluster-management/instance-management/DROP-BACKEND.md)を参照してください。恒久的な削除には、Doris のメタデータと Kubernetes リソースの整合性を保つため、Operator の縮小手順を優先してください。

Doris Operator は BE の `preStop` フックを設定します。Doris 4.1.5 の標準イメージのフックは `stop_be.sh --grace` を呼び出します。BE はハートビートを通じてシャットダウン状態を報告し、実行中のクエリが終了するのを待ちます。再起動前に次を確認してください。

1. 計算グループ内のほかの BE が正常で、十分な容量があることを確認します。
2. 生成された Pod の `terminationGracePeriodSeconds` を確認します。クエリの終了待ち、シャットダウン後の待機時間、処理上の余裕を含む必要があります。Doris 4.1.5 のデフォルト値は `grace_shutdown_wait_seconds=120` と `grace_shutdown_post_delay_seconds=30` です。Operator 26.0.1 は BE Pod の猶予期間をデフォルトで 200 秒に設定しますが、`be.conf` で `grace_shutdown_wait_seconds` を明示的に設定した場合も、生成される Pod の値が変わります。両方の設定を合わせて確認してください。
3. `preStop` が実行されるよう、強制削除ではなく通常の方法で Pod を削除します。

   ```shell
   kubectl delete pod ${be_pod} -n ${namespace}
   ```

4. 代替 Pod が Ready 状態になり、`SHOW BACKENDS` で BE が稼働中と報告され、シャットダウン状態が解消されたことを確認します。次の BE を再起動する前に、クエリとデータロードが正常に動作することを確認してください。

Operator 26.0.1 には、互換性のある BE イメージを必要とする、段階的に進むグレースフルなロールアウト機能もあります。Doris 4.1.5 の標準イメージは、そのフローの互換性チェックを満たさないため、Operator だけをアップグレードしても、このイメージで有効にはなりません。既存の `preStop` フックが引き続きグレースフル停止の仕組みとなります。グレースフルシャットダウンは影響を軽減しますが、ノードの突然の喪失や強制終了後も実行中のクエリを保護できるわけではありません。
