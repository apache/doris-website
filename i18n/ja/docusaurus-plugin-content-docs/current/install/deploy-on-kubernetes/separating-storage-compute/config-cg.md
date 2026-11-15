---
{
    "title": "コンピュートグループの設定",
    "language": "ja",
    "description": "Kubernetes 上の Doris コンピュートグループについて、BE のレプリカ数、CPU とメモリ、サービスへのアクセス、起動オプション、永続ストレージ、スケーリング操作を設定する方法を説明します。",
    "keywords": ["Doris", "Storage-Compute Decoupling", "Kubernetes", "Compute Group", "BE", "NodePort", "LoadBalancer", "Persistent Storage", "ConfigMap"]
}
---

コンピュートグループ（Compute Group）は、同じタスクを処理する BE ノードの集合です。このドキュメントでは、`DorisDisaggregatedCluster` リソースでコンピュートグループを設定する方法を用途別に説明します。主な内容は次のとおりです。

- **基本的なデプロイ**：単一または複数のコンピュートグループをすばやく構築する
- **リソース制御**：CPU やメモリなどのコンピュートリソースを制限する
- **アクセス制御**：クラスタの内部または外部から、異なる方法で BE サービスにアクセスする
- **起動設定のカスタマイズ**：ConfigMap を使用して BE の起動パラメータをカスタマイズする
- **データの永続化**：キャッシュ、ログ、StreamLoad の一時保存データに永続ストレージを使用する
- **スケーリング**：BE ノードやコンピュートグループを追加・削除し、縮小時の状態を確認する

## シナリオ 1：単一のコンピュートグループをすばやく構築する {#scenario-1-quickly-set-up-a-single-compute-group}

### 最小構成 {#minimal-configuration}

最も簡単なコンピュートグループの構成に必要なフィールドは、次の 3 つだけです。

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
| `uniqueId` | コンピュートグループの一意の識別子であり、グループ名でもあります。設定後は変更できません。名前は `[a-zA-Z][0-9a-zA-Z_]+` に一致する必要があります |
| `image` | BE サービスのデプロイに使用するイメージのアドレスです。[Apache Doris の公式イメージレジストリ](https://hub.docker.com/r/apache/doris)で提供されるイメージを使用してください |
| `replicas` | コンピュートグループ内の BE サービスノード数です |

## シナリオ 2：業務を分離するために複数のコンピュートグループをデプロイする {#scenario-2-deploy-multiple-compute-groups-for-business-isolation}

`DorisDisaggregatedCluster` リソースは複数のコンピュートグループのデプロイをサポートしており、各グループは互いに独立しています。次の例は、`cg1` と `cg2` という名前のコンピュートグループをデプロイする構成です。

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

各コンピュートグループのレプリカ数は次のとおりです。

| コンピュートグループ名 | レプリカ数 |
|------|------|
| `cg1` | 3 |
| `cg2` | 2 |

ここで、`${beImage}` はデプロイする BE サービスのイメージを表します。

:::tip ヒント
コンピュートグループは互いに独立していますが、同じストレージ・コンピュート分離クラスタ内では、すべてのコンピュートグループで使用する BE サービスのイメージを統一することを推奨します。
:::

## シナリオ 3：コンピュートグループのコンピュートリソースを制限する {#scenario-3-limit-the-compute-resources-of-a-compute-group}

ストレージ・コンピュート分離の[デフォルトのデプロイ例](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml)では、BE サービスが使用するコンピュートリソースに制限を設けていません。`DorisDisaggregatedCluster` では、Kubernetes の [resources.requests と resources.limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#requests-and-limits) を使用して CPU とメモリのリソースを指定します。

たとえば、`cg1` という名前のコンピュートグループの BE に 8c 8Gi のリソースを割り当てるには、次のように設定します。

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

上記の設定を、デプロイする [`DorisDisaggregatedCluster` リソース](./install-doris-cluster.md#2-modify-key-configurations)に反映すると有効になります。

## シナリオ 4：コンピュートグループへのアクセス方法を設定する {#scenario-4-configure-the-access-method-of-a-compute-group}

デフォルトでは、コンピュートグループはサービスを外部に直接公開しません。Doris Operator は、`DorisDisaggregatedCluster` リソースでコンピュートグループへのアクセスプロキシとなる Service を提供します。Service は、次の 3 つの公開モードをサポートします。アクセス元に合ったモードを選択してください。

| アクセスモード | 適した用途 | 特徴 |
|------|------|------|
| `ClusterIP` | Kubernetes クラスタ内からのアクセス | デフォルトのモードで、クラスタ内のアドレスを提供します |
| `NodePort` | 自己管理型 Kubernetes クラスタの外部からのアクセス | ホストマシンのポートを通じてサービスを公開します |
| `LoadBalancer` | クラウドプラットフォーム上の Kubernetes クラスタの外部からのアクセス | クラウドサービスプロバイダーが提供するロードバランサーを使用します |

### 4.1 ClusterIP（クラスタ内からのアクセス） {#41-clusterip-access-within-the-cluster}

[ClusterIP アクセスモード](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)は、Kubernetes クラスタ内のアドレスを提供します。このアドレスが、Kubernetes 内からサービスにアクセスするための入口になります。

#### ステップ 1：Service のタイプに ClusterIP を設定する {#step-1-configure-clusterip-as-the-service-type}

Doris では、Kubernetes 上で ClusterIP アクセスモードがデフォルトで有効になっています。追加の設定なしで使用できます。

#### ステップ 2：Service のアクセスアドレスを取得する {#step-2-get-the-service-access-address}

クラスタのデプロイ後、次のコマンドでコンピュートグループが公開する Service を確認します。

```shell
kubectl -n doris get svc
```

結果は次のとおりです。

```shell
NAME                                     TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                               AGE
test-disaggregated-cluster-cg1           ClusterIP   10.152.183.154   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   2d
```

上記の結果から、名前空間 `doris` にある、`uniqueId` が `cg1` のコンピュートグループで利用できる Service を確認できます。

### 4.2 NodePort（自己管理型クラスタの外部からのアクセス） {#42-nodeport-external-access-for-self-managed-clusters}

Kubernetes クラスタの外部から Doris にアクセスするには、[NodePort モード](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)を選択できます。NodePort モードには、次の 2 つのポート割り当て方法があります。

| 割り当て方法 | 説明 |
|------|------|
| ホストポートの動的割り当て | ポートマッピングを明示的に設定していない場合、Kubernetes は Pod の作成時に未使用のホストポートを自動的に割り当てます（デフォルトの範囲は 30000-32767） |
| ホストポートの静的割り当て | ポートマッピングを明示的に指定した場合、ホストポートが使用されておらず競合もなければ、Kubernetes は指定された固定ポートを割り当てます |

静的割り当てでは、ポートマッピングを計画する必要があります。Doris は外部との通信に次のポートを提供します。

**表 1：BE サービスのポートの説明**

| ポート名 | デフォルトポート | ポートの説明 |
|------|------|------|
| Web Server Port | 8040 | BE 上の HTTP サーバーポートです。BE の情報を確認するために使用します |

#### 静的割り当ての設定 {#static-allocation-configuration}

次の例では、`cg1` という名前のコンピュートグループにある BE のポート 8040 を、ホストのポート 31012 にマッピングします。

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

`cg1` という名前のコンピュートグループで動的な NodePort アクセスモードを使用する場合の設定は次のとおりです。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: NodePort
```

### 4.3 LoadBalancer（クラウド環境での外部アクセス） {#43-loadbalancer-external-access-in-cloud-environments}

[LoadBalancer モード](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer)は、クラウドプラットフォーム上の Kubernetes 環境に適しており、クラウドサービスプロバイダーが提供するロードバランサーを使用します。次のように、`LoadBalancer` を `computeGroup.service` のタイプに設定します。

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

デフォルトのデプロイでは、各コンピュートグループの BE サービスは、イメージ内のデフォルト設定ファイルを使用して起動します。Doris Operator は Kubernetes の ConfigMap を使用して、カスタムの起動設定ファイルをマウントします。全体の流れは次のとおりです。

| 段階 | 説明 |
|------|------|
| 入力 | カスタムの `be.conf` 設定ファイル |
| 操作 | ConfigMap を作成し、`/etc/doris` ディレクトリにマウントします |
| 出力 | コンピュートグループの BE サービスがカスタム設定で起動します |

### ステップ 1：起動情報を含む ConfigMap を作成する {#step-1-create-a-configmap-that-contains-the-startup-information}

次に、BE サービスで使用できる ConfigMap の例を示します。

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
ストレージ・コンピュート分離クラスタの BE サービスでは、起動設定に `file_cache_path` を指定する必要があります。形式については、[ストレージ・コンピュート分離の `be.conf` 設定](../../deploy-manually/separating-storage-compute-deploy-manually)を参照してください。
:::

### ステップ 2：ConfigMap をデプロイする {#step-2-deploy-the-configmap}

次のコマンドを使用して、カスタム起動設定を含む ConfigMap を Kubernetes クラスタにデプロイします。

```shell
kubectl apply -n ${namespace} -f ${beConfigMapFileName}.yaml
```

パラメータの説明：

| パラメータ | 説明 |
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

## シナリオ 6：コンピュートグループに永続ストレージを設定する {#scenario-6-configure-persistent-storage-for-a-compute-group}

デフォルトのデプロイでは、BE サービスは Kubernetes の [EmptyDir](https://kubernetes.io/zh-cn/docs/concepts/storage/volumes/#emptydir) をキャッシュに使用します。`EmptyDir` は非永続ストレージです。サービスを再起動するとキャッシュデータが失われ、それに伴ってクエリの効率が低下します。

BE サービスの再起動後もキャッシュデータを保持し、クエリ効率の低下を防ぐには、キャッシュデータを永続化する必要があります。BE サービスで使用する主なストレージパスは次のとおりです。

| ストレージパス | 用途 |
|------|------|
| BE のログディレクトリ | BE サービスのログは標準出力に出力されるほか、起動設定の `LOG_DIR` で指定されたディレクトリにも書き込まれます |
| `/opt/apache-doris/be/storage` | StreamLoad モードでのデータロード時にデータを一時保存する場所です。サービスの異常な再起動後に一時保存データが失われるのを防ぎます |
| BE のキャッシュディレクトリ | クエリキャッシュです。再起動後にデータが失われると、クエリの効率が低下します |

### 6.1 永続ストレージの設定例 {#61-persistent-storage-example}

次に、永続化が必要なデータ用に永続ストレージをマウントする設定例を示します。

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

上記の設定では、次のようにストレージをマウントします。

- ログディレクトリにはカスタムストレージ設定を使用し、300Gi のストレージディスクをマウントします
- WAL と StreamLoad のデータロードに使用するディレクトリには、300Gi のストレージディスクをマウントします
- キャッシュディレクトリにはストレージテンプレートを使用し、500Gi のストレージディスクをマウントします

:::tip ヒント
`mountPaths` 配列が空の場合、そのストレージ設定はテンプレート設定として扱われます。
:::

### 6.2 ログを永続化しない場合 {#62-do-not-persist-logs}

ログを永続化せず、標準出力だけに出力する場合は、次のように設定します。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    logNotStore: true
```

## シナリオ 7：コンピュート容量をスケーリングする {#scaling-compute-groups}

`DorisDisaggregatedCluster` リソースを変更して、コンピュートグループをスケーリングします。`replicas` フィールドは BE ノード数を表し、オブジェクトストレージ内のデータのコピー数ではありません。この値を増やすとコンピュート容量が増え、減らすと BE ノードとそのローカルキャッシュが削除されます。

以下の手順は [Doris Operator 26.0.1](https://github.com/apache/doris-operator/tree/26.0.1) に基づいています。同じリリースの CRD と Operator イメージを使用してください。縮小時の動作は BE イメージにも依存するため、すべてのイメージがグレースフルシャットダウンに対応しているとは限りません。

### 7.1 クラスタの準備と確認 {#71-prepare-and-inspect-the-cluster}

容量を変更する前に、次を確認してください。

- FE、MetaService、FoundationDB、および現在の BE ノードが正常であることを確認します。Operator は、[認証の設定](config-cluster.md)で設定された管理用の認証情報を使用して FE に接続できる必要があります。
- Kubernetes の CPU、メモリ、ストレージの容量を確認します。新しい PVC をバインドできるかどうかも確認してください。残りのワークロードを処理できる数の Ready 状態の BE ノードを維持します。
- 縮小する場合は、先にトラフィックを減らすか別の場所へ振り向け、実行中のクエリとデータロードジョブが完了するのを待ちます。操作後はクライアントのリトライとデータロードジョブの状態を確認します。

以下の例では、名前空間に `doris`、クラスタに `test-disaggregated-cluster`、コンピュートグループに `cg1` を使用します。実際の名前に置き換えてください。

```shell
kubectl get ddc test-disaggregated-cluster -n doris -o yaml
kubectl get pods,sts,pvc -n doris
```

管理者として FE の SQL エンドポイントに接続し、現在のコンピュートグループと BE ノードを記録します。

```sql
SHOW COMPUTE GROUPS;
SHOW BACKENDS;
```

クラスタのデプロイに使用した完全なマニフェストを編集し、適用します。

```shell
kubectl apply -n doris -f ddc-sample.yaml
```

以下の YAML 断片には、変更するフィールドだけを示します。ほかのフィールドと `spec.computeGroups` 内の既存のほかのエントリは保持してください。既存のグループを省略すると、そのグループの削除が要求されます。Operator が Doris のメタデータと Kubernetes リソースを調整できるように、StatefulSet を直接スケーリングせず、Doris のカスタムリソースを変更してください。

### 7.2 既存のコンピュートグループを拡大する {#72-scale-out-an-existing-compute-group}

たとえば、完全なマニフェストで `cg1` の BE ノード数を 2 から 3 に変更します。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 3
```

既存の `uniqueId`、イメージ、リソース設定、ConfigMap、永続ボリュームの設定を保持してください。マニフェストを適用すると、Operator が StatefulSet のレプリカ数を増やし、新しい BE は起動時にクラスタへ登録されます。

グループで 3 つの Pod が Ready 状態になり、`SHOW BACKENDS` に新しい BE が `Alive = true` として表示されることを確認します。新しいノードのキャッシュは空の状態から始まるため、ノードを追加しても、既存のノードと同じキャッシュがすぐに得られるわけではありません。

### 7.3 既存のコンピュートグループを縮小する {#73-scale-in-an-existing-compute-group}

クラスタレベルの Boolean フィールド `spec.enableDecommission` によって、BE の削除方法が決まります。デフォルトは `false` です。

| 値 | コンピュートグループの `replicas` を減らした場合の動作 |
| --- | --- |
| `true` | Doris BE の退役操作を実行し、その処理中は StatefulSet の元のレプリカ数を維持します。選択されたノードの退役が完了した後、Doris からそのノードを削除し、StatefulSet のレプリカ数を減らします。 |
| `false` | 選択された BE を退役手順なしで Doris から削除します。Operator 26.0.1 は、BE イメージが対応している場合、まずグレースフルな縮小処理を使用し、対応していない場合は直接削除する方法に切り替えます。 |

たとえば、退役処理を使用して `cg1` を 3 ノードから 2 ノードに減らすには、完全なマニフェストを次のように更新して適用します。

```yaml
spec:
  enableDecommission: true
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 2
```

Operator は、Pod の序数が目標レプリカ数以上のノードを選択します。退役の実行中は、それらの Pod を手動で削除しないでください。次のコマンドで進行状況を確認します。

```shell
kubectl describe ddc test-disaggregated-cluster -n doris
kubectl get sts,pods,pvc -n doris
```

Doris で `SHOW BACKENDS;` を実行します。Operator の退役チェックは、選択された BE について `SystemDecommissioned = true` かつ `TabletNum = 0` になるか、すでに削除されるまで待機します。処理中はグループが `Decommissioning` 状態のままになることがあります。目標数の Pod が Ready 状態になり、Doris 内の BE メンバー構成も目標どおりになって初めて完了です。

:::caution 縮小時のローカルストレージ
Operator 26.0.1 は、StatefulSet のレプリカ数を減らした後、削除された Pod の序数に対応する PVC を削除します。基盤となる PV の回収ポリシーによって、ストレージのその後の扱いが決まります。キャッシュ、ログ、または Stream Load の一時保存データを永続化していても、縮小後にそれらのボリュームが残るとは限りません。BE を削除する前に、依存するデータロードジョブを完了し、必要なログを保存してください。再び拡大しても、以前のローカルデータが復元される保証はありません。
:::

### 7.4 コンピュートグループ全体を追加または削除する {#74-add-or-remove-an-entire-compute-group}

グループを追加するには、既存のすべてのグループを保持したまま、新しい `uniqueId` を持つエントリを追加します。例：

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

完全なマニフェストを適用し、`cg2` が Ready 状態になって `SHOW COMPUTE GROUPS` に表示されるまで待ちます。そのグループにトラフィックを送る前に、[コンピュートグループの管理](../../../compute-storage-decoupled/managing-compute-cluster.md)の説明に従って、ユーザーのアクセスとワークロードのルーティングを設定してください。グループを追加しても、既存のセッションは自動的には移動しません。

グループを削除するには、まずそのグループのクエリとデータロードを別の利用可能なグループに移し、そのグループを参照するユーザーのデフォルト設定やアプリケーション設定を更新します。完全なマニフェストから対象グループのエントリだけを削除し、適用してください。Operator はそのグループの BE を Doris のメタデータから削除した後、管理対象の Service と StatefulSet を削除します。

:::caution グループ全体の削除とレプリカ数の削減は動作が異なります
Operator 26.0.1 では、`computeGroups` のエントリ全体を削除すると、`enableDecommission` が `true` でも BE の直接削除処理が使用されます。段階的な退役を要求するためにエントリを削除しないでください。削除後は残存する PVC を確認し、保持ポリシーに従って処理してください。既存グループ内の縮小と同じクリーンアップが行われるとは限りません。
:::

### 7.5 リソースの変更とその他のコンポーネント {#75-resource-changes-and-other-components}

| 変更内容 | 操作と制約 |
| --- | --- |
| BE ごとの CPU・メモリを増減する | シナリオ 3 の説明に従ってグループの `requests` と `limits` を変更し、完全なマニフェストを適用します。Pod テンプレートが変更され、BE が再起動する可能性があります。適用前にスケジューリングに必要な容量を確認してください。 |
| FE をスケーリングする | `spec.feSpec.replicas` を変更します。値は `electionNumber` 以上である必要があり、それを超える FE ノードは Observer になります。Operator は StatefulSet のレプリカ数を減らす前に、選択された Observer を Doris から削除します。既存のクラスタでは `electionNumber` を変更しないでください。[FE の設定](config-fe.md)を参照してください。 |
| MetaService、FoundationDB、Storage Vault の容量を変更する | これらはコンピュートグループのレプリカ数とは独立して管理し、メタデータとストレージを保持してください。BE の縮小を理由に、これらのリソースやオブジェクトストレージ内のデータを削除する必要はありません。[MetaService の設定](config-ms.md)と[FoundationDB のデプロイ](install-fdb.md)を参照してください。 |

### 7.6 検証とトラブルシューティング {#76-verify-and-troubleshoot}

変更するたびに、カスタムリソース内のコンピュートグループのフェーズ、Pod の Ready 状態、`SHOW BACKENDS` をあわせて確認します。ノード数が目標どおりであること、保持するノードが `Alive = true` であること、退役したノードが削除されていること、対象のコンピュートグループを通じてクエリとデータロードが成功することを確認してください。

操作が進まない場合は、`kubectl describe ddc`、Pod Events、PVC のバインド状態、Operator のログを確認します。Pod が `Pending` の場合は通常、スケジューリングやストレージを確認する必要があります。`Decommissioning` の場合は Doris の退役処理の進行状況を確認し、`ScaleDownFailed` の場合は Operator の SQL エラーと FE への接続状態または権限を確認してください。報告された原因を解決してから、再試行やリソースの強制削除を行ってください。[ステータスとトラブルシューティング](../doris-operator/status-and-troubleshooting.md)を参照してください。
