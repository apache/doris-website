---
{
    "title": "Kubernetes 上にデプロイする",
    "sidebar_label": "Kubernetes 上にデプロイする",
    "language": "ja",
    "description": "Kubernetes 上に DOG Stack をデプロイし、クラスターのコンテナログ、メトリクス、Events を収集する方法を説明します。Helm を使用した DOG Stack バックエンド（OpenTelemetry ゲートウェイ、Apache Doris、Grafana）と Kubernetes コレクターのインストールに加え、動作確認、ログ解析ルール、本番環境の設定、トラブルシューティングを扱います。",
    "keywords": [
        "DOG Stack",
        "Kubernetes",
        "Helm",
        "OpenTelemetry Collector",
        "Apache Doris",
        "Grafana",
        "Kubernetes ログ収集",
        "オブザーバビリティ"
    ]
}
---

<!-- Knowledge type: operational steps -->
<!-- Applicable scenario: observability platform / DOG Stack Kubernetes deployment and cluster collection -->

この記事では、Helm を使用して Kubernetes 上に DOG Stack をデプロイし、クラスターのコンテナログ、kubelet・ノード・クラスターのメトリクス、Kubernetes Events を収集する方法を説明します。手順を完了すると、Doris でデータをクエリし、Grafana のダッシュボードで確認できます。単一ホストにデプロイする場合は、[Docker Compose でデプロイする](./docker.md)を参照してください。

Kubernetes 上の DOG Stack は、独立した二つの Helm チャートで構成されます。

| チャート | 役割 | ワークロード |
| --- | --- | --- |
| `ai-observe-stack` | DOG Stack のバックエンド。一度だけインストールします。OTLP データを受信して Doris に書き込み、Grafana で表示します。単体ではデータを収集しません。 | OpenTelemetry ゲートウェイ（StatefulSet）、Doris App プラグインを備えた Grafana（Deployment）、および必要に応じて Doris Operator が管理する Doris クラスター |
| `dog-k8s-collector` | Kubernetes コレクター。収集対象の各クラスターに一度インストールし、ゲートウェイに接続します。 | agent（DaemonSet、各ノードに一つ）：コンテナログ、kubelet とノードのメトリクス、ノード上の OTLP 受信口。cluster（Deployment、各クラスターに一つ）：クラスターメトリクスと Kubernetes Events |

データの流れは次のとおりです。

```text
applications (OTLP SDK) ───────┐
                               │ OTLP
dog-k8s-collector ─────────────┤
  agent   (DaemonSet)          │
  cluster (Deployment)         ▼
ai-observe-stack
  gateway  OpenTelemetry Collector  receives OTLP, writes Doris
  doris    Apache Doris             stores logs, metrics, traces
  grafana  Grafana + Doris App      shows them
```

二つのチャート間に Helm の依存関係はなく、個別にインストール・アップグレードします。複数の Kubernetes クラスターから一つの DOG Stack にデータを送信でき、クラスター名で区別します。

:::tip
DOG Stack がすでに稼働している場合は、このチャートでインストールしたものか、別の方法でデプロイしたものか、別のクラスターにあるものかを問わず、[ステップ 2：Kubernetes コレクターをインストールする](#step-2-install-the-kubernetes-collector)に進んでください。必要なのは、そのゲートウェイの OTLP gRPC アドレスだけです。
:::

このガイドは、AI Observe Stack のコミット [`2c1fbee83170`](https://github.com/ai-observe/ai-observe-stack/tree/2c1fbee831701178c7dddba857e88130ef292949) に基づいて確認しています。以下のチェックアウトでこのリビジョンに固定するため、後から main ブランチが変更されてもパラメーターは変わりません。このリビジョンの Helm チャートのバージョンは `0.2.0`、デフォルトの Doris イメージは `4.0.3` です。

## 前提条件 {#prerequisites}

- Kubernetes 1.24 以降、Helm 3.8 以降、およびクラスターにアクセスできるよう設定した `kubectl`。
- クラスターレベルの RBAC 権限。コレクターは ClusterRole と ClusterRoleBinding を作成します。
- デフォルトのゲートウェイ送信キュー用の PersistentVolume プロビジョナー。外部 Doris を使用する場合も必要です。一時的な試用なら `gateway.persistence.enabled` を無効にできますが、Pod が置き換わるとキュー内のデータは失われます。
- ノードから `otel/opentelemetry-collector-contrib`、`otel/opentelemetry-collector-k8s`、`grafana/grafana`、`velodb/doris-app-plugin`、`busybox` の各イメージを取得できること。プライベートレジストリを使用する場合は、`global.imagePullSecrets` を `ai-observe-stack` に、`imagePullSecrets` を `dog-k8s-collector` に設定し、イメージのパラメーターをミラーに向けます。`ai-observe-stack` では `gateway.image.repository`、`grafana.image.repository`、`dorisPlugin.image.repository`、`global.helperImages.busybox` / `global.helperImages.curl`、`dog-k8s-collector` では `agent.image.repository` と `cluster.image.repository` を設定します。
- Doris について、次のいずれかを用意します。
  - 既存の Doris クラスター。Kubernetes クラスターから FE のポート 9030（MySQL プロトコル）と 8030（HTTP）に到達でき、対象データベースとテーブルの作成、データロード、Grafana 用テーブルのクエリが可能なアカウントが必要です。ゲートウェイは Stream Load でデータを書き込みます。FE は各リクエストを、BE が Doris に登録したアドレス（`SHOW BACKENDS` で確認可能）へリダイレクトするため、ゲートウェイ Pod からこれらの BE アドレスと BE の HTTP ポート（デフォルトは 8040）にも到達できる必要があります。
  - または、チャートで Doris をデプロイします。この場合は PersistentVolume プロビジョナーと、FE と BE それぞれに少なくとも二つの CPU コアと 4 GiB のメモリが必要です。

この記事のコマンドでは、リリース名と名前空間にそれぞれ `dog` を使用します。以下のオブジェクト名はこれらから生成されるため、別の名前を使う場合は適宜置き換えてください。

| オブジェクト | 名前 |
| --- | --- |
| ゲートウェイの StatefulSet と Service | `dog-ai-observe-stack-otel-gateway` |
| Grafana の Deployment と Service | `dog-ai-observe-stack-grafana` |
| Grafana 管理者の Secret | `dog-ai-observe-stack-grafana-admin` |
| DorisCluster（チャートで Doris をデプロイする場合） | `dog-ai-observe-stack-doris` |
| コレクター agent の DaemonSet | `dog-k8s-collector-agent` |
| コレクター cluster の Deployment | `dog-k8s-collector-cluster` |

## チャートを取得する {#get-the-charts}

リポジトリをクローンし、チャートの依存関係をダウンロードします。Doris Operator のサブチャートはチャートの依存関係に定義されているため、既存の Doris に接続する場合もこの手順が必要です。`helm repo add` を必要としない `helm dependency update` を使用してください。

```Bash
git clone https://github.com/ai-observe/ai-observe-stack.git
cd ai-observe-stack
git checkout 2c1fbee831701178c7dddba857e88130ef292949
cd helm-charts
helm dependency update ./ai-observe-stack
```

以降のコマンドはすべて `helm-charts` ディレクトリで実行します。

## ステップ 1：DOG Stack バックエンドをインストールする {#step-1-install-the-dog-stack-backend}

Doris の実行場所を選択します。

| | オプション A：既存の Doris を使用 | オプション B：チャートで Doris をデプロイ |
| --- | --- | --- |
| 適した用途 | 既存の Doris または SelectDB クラスター、本番環境 | Doris を利用できない場合の試用と開発 |
| データの保存場所 | 使用する Doris クラスター | Kubernetes クラスター内の PVC |

### オプション A：既存の Doris を使用する {#option-a-use-an-existing-doris}

1. 名前空間を作成し、Doris アカウントを Secret に保存します。Secret には `username` と `password` のキーが必要です。

   ```Bash
   kubectl create namespace dog
   kubectl create secret generic doris-credentials -n dog \
     --from-literal=username='<DORIS_USER>' --from-literal=password='<DORIS_PASSWORD>'
   ```

2. values ファイル `dog-values.yaml` を作成します。

   ```yaml
   doris:
     mode: external
     database: otel                  # the gateway creates this database and its tables
     external:
       host: <DORIS_FE_HOST>         # FE address reachable from the cluster
       port: 9030                    # MySQL protocol port
       feHttpPort: 8030              # HTTP port, used by Stream Load
       existingSecret: doris-credentials
     internal:
       operator:
         enabled: false              # do not install the Doris Operator
   ```

   同じファイルは、リポジトリの `examples/ai-observe-stack/minimal-external-doris.yaml` にもあります。

3. インストールします。

   ```Bash
   helm install dog ./ai-observe-stack -n dog -f dog-values.yaml
   ```

### オプション B：チャートで Doris をデプロイする {#option-b-the-chart-deploys-doris}

リポジトリには二つの構成例があります。

- `examples/ai-observe-stack/dev.yaml`：FE と BE が各一つ、永続化なし、ゲートウェイが一つ、デバッグ出力が有効です。試用専用です。
- `examples/ai-observe-stack/prod.yaml`：FE と BE が各三つ、永続化あり、ゲートウェイが三つで、Ingress も設定されています。本番環境の出発点として使用できます。使用前に、環境固有の設定である `storageClass`（AWS の `gp3` に設定されています）、Ingress クラス、ホスト、TLS 発行者、Grafana のパスワード（`CHANGE_ME`）を調整してください。

```Bash
cp examples/ai-observe-stack/dev.yaml dog-values.yaml
helm install dog ./ai-observe-stack -n dog --create-namespace -f dog-values.yaml
```

後のアップグレードに備えて `dog-values.yaml` を保存してください。本番環境では代わりに `prod.yaml` をコピーし、上記の環境固有の設定を調整してからインストールします。

Doris FE と BE がイメージを取得して初期化するには、二〜五分かかります。ゲートウェイは、FE のポート 9030 と 8030 に到達でき、少なくとも一つの BE がオンラインになるまで起動を待ちます。

:::caution
Doris Operator はクラスター全体で動作し、一つの Kubernetes クラスターでは一つしか実行できません。同じクラスターに別の DOG Stack をインストールする場合は、`doris.internal.operator.enabled: false` を設定してください。
:::

### バックエンドを確認する {#verify-the-backend}

インストールが完了すると、Helm が出力する NOTES に、ゲートウェイの OTLP gRPC アドレス `dog-ai-observe-stack-otel-gateway.dog.svc:4317` が含まれます。ステップ 2 で使用するため、記録してください。

1. Pod が稼働していることを確認します。ゲートウェイ Pod（デフォルトの二つのレプリカでは `dog-ai-observe-stack-otel-gateway-0` と `-1`。`dev.yaml` では一つ）、Grafana Pod、オプション B の場合は Doris FE と BE の Pod が、いずれも `Running` 状態で表示されるはずです。

   ```Bash
   kubectl get pods -n dog
   ```

2. 組み込みのパイプラインテストを実行します。テストはゲートウェイ経由でログレコードを送信し、Doris に届いたことを確認します。

   ```Bash
   helm test dog -n dog --logs
   ```

   出力は `OK: record found in Doris` で終わります。

3. Grafana 管理者のパスワード（デフォルトは `admin`）を取得します。

   ```Bash
   kubectl get secret -n dog dog-ai-observe-stack-grafana-admin -o jsonpath='{.data.admin-password}' | base64 -d; echo
   ```

4. Grafana にアクセスします。

   ```Bash
   kubectl port-forward -n dog svc/dog-ai-observe-stack-grafana 3000:3000
   ```

   http://localhost:3000 を開き、ユーザー名 `admin` と上記のパスワードでログインします。この時点ではまだゲートウェイにデータが送信されていないため、ダッシュボードは空です。

## ステップ 2：Kubernetes コレクターをインストールする {#step-2-install-the-kubernetes-collector}

ステップ 1 でインストールしたバックエンドは、データを受信するだけです。コレクターは Kubernetes クラスターからデータを収集してゲートウェイに送信します。各ノードの agent はすべてのコンテナの stdout と stderr を読み取り、kubelet とノードのメトリクスを収集します。cluster コレクターはクラスターレベルのメトリクスと Kubernetes Events を収集します。すべてのレコードには Pod、名前空間、ワークロード、クラスターの名前が付与されます。コレクターがない場合、DOG Stack に届くのはゲートウェイへ直接 OTLP を送信するアプリケーションのデータだけで、コンテナログ、ノードやクラスターのメトリクス、Events は収集されません。観測対象の各 Kubernetes クラスターに、コレクターのリリースを一つずつインストールしてください。

収集対象のクラスターに名前空間を用意します。ステップ 1 を省略した場合も、次の冪等なコマンドを実行してください。

```Bash
kubectl create namespace dog --dry-run=client -o yaml | kubectl apply -f -
```

1. 収集対象のクラスターからゲートウェイに到達できることを確認します。アドレスは実際のものに置き換えてください。

   ```Bash
   kubectl run -it --rm otlp-check --image=busybox:1.36 --restart=Never -- \
     sh -c 'sleep 2; nc -zv dog-ai-observe-stack-otel-gateway.dog.svc 4317'
   ```

   出力に `open` と表示されれば、ゲートウェイに到達できます。ゲートウェイのアドレスは DOG Stack の配置場所によって異なります。

   | DOG Stack の配置場所 | ゲートウェイのアドレス（`host:port`、`http://` は付けない） |
   | --- | --- |
   | このチャートで同じクラスターにインストール | `<release>-ai-observe-stack-otel-gateway.<namespace>.svc:4317` |
   | Doris exporter を備えた独自の OpenTelemetry Collector | その OTLP gRPC Service。通常は `<service>.<namespace>.svc:4317` |
   | 別の Kubernetes クラスター | LoadBalancer（`gateway.service.type: LoadBalancer`）または別途設定した gRPC ingress で公開したゲートウェイの gRPC アドレス。このチャートの Ingress が公開するのは OTLP/HTTP であり、OTLP/gRPC ではありません。選択したポートにクラスター間で到達できる必要があります |

2. agent は root として実行され、ノードの `/var/log/pods`、`/`（読み取り専用）、`/var/lib/otelcol` をマウントします。名前空間で Pod Security Standard の `restricted` が適用されている場合は、制限を緩和します。

   ```Bash
   kubectl label namespace dog pod-security.kubernetes.io/enforce=privileged --overwrite
   ```

3. values ファイル `collector-values.yaml` を作成します。

   ```yaml
   gateway:
     endpoint: dog-ai-observe-stack-otel-gateway.dog.svc:4317
   clusterName: my-cluster
   platform: generic
   ```

   | パラメーター | 必須 | デフォルト | 説明 |
   | --- | --- | --- | --- |
   | `gateway.endpoint` | はい | なし | ゲートウェイの OTLP gRPC アドレス。形式は `host:port`。 |
   | `clusterName` | いいえ | リリース名 | クラスターを区別するため、すべてのレコードに `k8s.cluster.name` として書き込まれます。 |
   | `platform` | いいえ | `generic` | `generic`、`k3s`、`eks`、`gke`、`aks`、`ack`、`openshift` のいずれか。クラウドリソース検出器と journald のユニット名を選択します。判断がつかない場合は `generic` を使用します。 |
   | `timezone` | いいえ | `UTC` | タイムゾーンのないログ行のタイムスタンプに適用する IANA タイムゾーン。解析ルールの `timestamp.timezone` で上書きできます。 |

4. インストールします。

   ```Bash
   helm install dog-k8s-collector ./dog-k8s-collector -n dog -f collector-values.yaml
   ```

コレクターでは、以下の収集プリセットがデフォルトで有効です。

| プリセット | デフォルト | 収集対象 | 実行場所 |
| --- | --- | --- | --- |
| `logsCollection` | 有効 | すべての名前空間にある全コンテナの stdout と stderr | agent |
| `kubeletMetrics` | 有効 | ノード、Pod、コンテナ、ボリュームの CPU、メモリ、ネットワーク、ファイルシステム、および上限に対する使用率 | agent |
| `hostMetrics` | 有効 | ノードの CPU、メモリ、負荷、ディスク、ファイルシステム、ネットワーク | agent |
| `otlp` | 有効 | アプリケーション SDK 向けのノード上の OTLP 受信口 | agent |
| `clusterMetrics` | 有効 | Deployment の可用性、ノードの状態、Pod のフェーズ、クォータ | cluster |
| `kubernetesEvents` | 有効 | Kubernetes Events。ログとして保存 | cluster |
| `prometheusScrape` | 無効 | `prometheus.io/scrape` アノテーションが付いた Pod | agent |
| `journald` | 無効 | ノードの journal。`journalctl` を含むイメージが必要 | agent |

:::caution
`examples/ai-observe-stack/dev.yaml` はゲートウェイのデバッグ出力を有効にしており、サンプリングされたレコードをゲートウェイのログに出力します。コレクターが同じクラスターで動作する場合は、各レコードの再収集を防ぐため、ゲートウェイのログファイルを除外してください。

```yaml
logs:
  excludePaths:
    - /var/log/pods/dog_dog-ai-observe-stack-otel-gateway-*/*/*.log
```
:::

## ステップ 3：収集を確認する {#step-3-verify-collection}

1. コレクターの Pod を確認します。ノードごとに agent Pod が一つ、クラスターに cluster Pod が一つあります。

   ```Bash
   kubectl get pods -n dog -l app.kubernetes.io/instance=dog-k8s-collector -o wide
   ```

   ```text
   NAME                                         READY   STATUS    NODE
   dog-k8s-collector-agent-7x2kq                1/1     Running   node-1
   dog-k8s-collector-agent-p9m4c                1/1     Running   node-2
   dog-k8s-collector-cluster-6f5d9c8b7d-hq2xn   1/1     Running   node-1
   ```

2. agent がエラーを報告していないことを確認します。次のコマンドでは何も出力されないはずです。

   ```Bash
   kubectl logs -n dog ds/dog-k8s-collector-agent | grep '"level":"error"'
   ```

3. Doris でデータをクエリします。オプション A では、MySQL クライアントから既存の Doris FE のポート 9030 に接続します。オプション B では、まず FE のポートを転送してから MySQL クライアントで接続します。

   ```Bash
   kubectl port-forward -n dog svc/dog-ai-observe-stack-doris-fe-service 9030:9030
   mysql -h127.0.0.1 -P9030 -uroot
   ```

   ```sql
   SELECT service_name, count(*) AS records
   FROM otel.otel_logs
   WHERE timestamp > now() - interval 5 minute
     AND cast(resource_attributes['k8s.cluster.name'] as string) = 'my-cluster'
   GROUP BY 1 ORDER BY 2 DESC;
   ```

   最初のレコードは agent の起動後 30 秒以内に届きます。`service_name` は Pod を所有するワークロードの名前で、Deployment、StatefulSet、DaemonSet、CronJob、Job の順に調べます。単独の Pod では Pod 名が使用されます。Kubernetes Events は `kubernetes-events` として表示されます。収集されるのはインストール後に書き込まれたログ行のみで、ノード上の既存のログファイルは再度読み取られません。

4. Grafana を開き、ダッシュボードを確認します。

   - **Logs Explorer**：名前空間、サービス、重大度、テキストでログを絞り込みます。
   - **Kubernetes Events**：Warning の件数、主な理由、イベントのテーブルを確認します。
   - **K8s Observability**：ノードと Pod の CPU とメモリを確認します。
   - **Collector Self-Monitoring**：agent、cluster コレクター、ゲートウェイのキュー長、失敗、拒否を確認します。

### エンドツーエンドの例 {#end-to-end-example}

次の Pod は毎秒一行の JSON ログを出力し、コンテナログから Doris までの経路全体を確認できます。

```Bash
kubectl create namespace demo
kubectl run json-app -n demo --image=busybox:1.36 --restart=Never -- sh -c \
  'i=0; while true; do i=$((i+1)); echo "{\"time\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"level\":\"info\",\"msg\":\"tick $i\"}"; sleep 1; done'
```

約 30 秒後、Doris でクエリします。

```sql
SELECT timestamp, severity_text, body, cast(resource_attributes['k8s.pod.name'] as string) AS pod
FROM otel.otel_logs
WHERE cast(resource_attributes['k8s.namespace.name'] as string) = 'demo'
ORDER BY timestamp DESC LIMIT 5;
```

`severity_text` が `INFO` で、`body` が `tick 42` のような行が返れば、コンテナログが収集され、JSON 行が解析され、Kubernetes メタデータが付与されています。`kubectl delete namespace demo` で後片付けしてください。

## 収集を設定する {#configure-collection}

収集内容を変更するには、`collector-values.yaml` を編集して次を実行します。

```Bash
helm upgrade dog-k8s-collector ./dog-k8s-collector -n dog -f collector-values.yaml
```

再起動するのは、影響を受ける agent または cluster コレクターだけです。`agent.storage.enabled=true` の場合、同じノードの同じストレージパスではファイルの読み取り位置が保持されます。これにより再読み取りは減りますが、正確に一度だけの配信は保証されません。再試行でレコードが重複することがあり、ノードやストレージの喪失、キューの枯渇によってデータが失われることもあります。

### 名前空間とコンテナを選択する {#select-namespaces-and-containers}

```yaml
logs:
  namespaces:
    include: ["*"]                          # or a list, such as [shop, payment]
    exclude: [kube-system, monitoring]
  containers:
    exclude: [istio-proxy, linkerd-proxy]   # container names, excluded in every namespace
```

除外設定は包含設定より優先されます。コレクター自身の Pod は収集されません。

### ログを解析する {#parse-logs}

- **JSON ログ**：`{` で始まる行は自動的に解析されます。`level` または `severity` は `severity_text`、`message` または `msg` は `body` となり、その他のキーは `log_attributes` に保存されます。別のフィールド名を使う場合は、`logs.json.severityFields` と `logs.json.messageFields` を設定します。
- **一般的なテキスト形式**：ルールで組み込みプリセットを使用します。`selector.container` が照合するのはコンテナ名であり、Pod 名や Deployment 名ではありません。

  ```yaml
  logs:
    rules:
      - name: shop-api
        selector: {namespace: "^shop$", container: "^api$"}
        preset: java-spring
  ```

  | プリセット | 形式 |
  | --- | --- |
  | `java-spring` | Spring Boot 3 のデフォルトのコンソール形式。スタックトレースを結合 |
  | `python-logging` | Python `logging.basicConfig` のデフォルト形式 |
  | `go-zap-console` | zap のコンソールエンコーダー |
  | `glog` | C++ と Go の glog |
  | `nginx-access`, `nginx-error` | nginx の combined 形式のアクセスログとエラーログ |
  | `mysql`, `postgres`, `redis` | 公式イメージのデフォルト形式 |
  | `doris-fe`, `doris-fe-audit`, `doris-be` | Apache Doris の FE ログ、FE 監査ログ、BE ログ |
  | `json-generic` | 一行の JSON |

  Doris FE は実行時ログと監査ログを同じコンテナに書き込みます。両方を解析するには、同じ selector で二つのルールを追加し、一方に `preset: doris-fe`、もう一方に `preset: doris-fe-audit` を指定します。

- **独自の形式**：タイムスタンプを表す `ts`、重大度を表す `level`、メッセージを表す `msg` の名前付きグループを持つ正規表現を記述します。

  ```yaml
  logs:
    rules:
      - name: shop-worker
        selector: {namespace: "^shop$", container: "^worker$"}
        regex: '^(?P<ts>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\s+(?P<level>[a-z]+)\s+(?P<msg>(?s:.*))$'
        timestamp: {layout: "%Y-%m-%dT%H:%M:%S.%L%z"}
        severity: {field: level}
        multiline: {firstLinePattern: '^\d{4}-\d{2}-\d{2}T'}   # stack trace lines join the previous record
        drop: ['GET /healthz']                             # dropped on the node
  ```

  ログ行のタイムスタンプにタイムゾーンがなく、コンテナが UTC で動作していない場合は、`timestamp` に `timezone` を追加します。例：`timestamp: {layout: "...", timezone: Asia/Shanghai}`。ルールは順に照合され、最初に一致したルールが適用されます。各レコードの `dog.log.rule` 属性から、解析に使われたルールを確認できます。

  ルールをデプロイする前に、リポジトリの `hack/test-rule.sh` を使用してサンプルログでテストできます。このスクリプトには helm、yq、Docker が必要です。

  ```Bash
  kubectl logs -n shop -l app=worker -c worker --tail=30 > worker.log
  hack/test-rule.sh -f collector-values.yaml -n shop -c worker worker.log
  ```

### アプリケーションから OTLP を受信する {#receive-otlp-from-applications}

OpenTelemetry SDK で計装したアプリケーションは、トレース、メトリクス、ログを同じノードの agent に送信できます。agent は Pod、名前空間、ワークロードのメタデータを付与します。ノード上で agent のポートを公開します。

```yaml
presets:
  otlp:
    hostPortHttp: 4318
    hostPortGrpc: 4317
```

次に、アプリケーションの Pod テンプレートでエンドポイントを設定します。

```yaml
env:
  - name: HOST_IP
    valueFrom: {fieldRef: {fieldPath: status.hostIP}}
  - name: OTEL_EXPORTER_OTLP_ENDPOINT
    value: http://$(HOST_IP):4318
  - name: OTEL_EXPORTER_OTLP_PROTOCOL
    value: http/protobuf
  - name: OTEL_SERVICE_NAME
    value: checkout
```

### Prometheus メトリクスをスクレイプする {#scrape-prometheus-metrics}

`presets.prometheusScrape.enabled: true` を設定し、アプリケーションの Pod に `prometheus.io/scrape: "true"`、`prometheus.io/port`、`prometheus.io/path` のアノテーションを付けます。メトリクスは `otel_metrics_*` テーブルに書き込まれ、`service_name` にはワークロード名が入ります。

### 複数のクラスターから収集する {#collect-multiple-clusters}

各クラスターにコレクターのリリースを一つずつインストールします。`gateway.endpoint` を同じゲートウェイに向け（クラスター間では LoadBalancer または別途設定した gRPC ingress を使用）、クラスターごとに異なる `clusterName` を指定します。クエリとダッシュボードでは `k8s.cluster.name` で絞り込みます。

## 本番環境での推奨設定 {#production-recommendations}

| 項目 | パラメーター | 説明 |
| --- | --- | --- |
| Doris のレプリカとディスク | `doris.internal.cluster.fe.replicas`, `doris.internal.cluster.be.replicas`, `doris.internal.cluster.persistence` | FE と BE をそれぞれ少なくとも三つ用意し、`gateway.dorisExporter.replicationNum: 3` を設定します。 |
| ゲートウェイのレプリカとキュー | `gateway.replicas`, `gateway.persistence.size`, `gateway.dorisExporter.sendingQueue` | ゲートウェイの各レプリカは、送信キューをそれぞれの PVC に保存します。書き込みが遅れる場合は、Collector Self-Monitoring ダッシュボードの `otelcol_exporter_queue_size` を確認します。 |
| データ保持 | `gateway.dorisExporter.historyDays` | デフォルトは 7 日です。 |
| Grafana のパスワード | `grafana.adminPassword` または `grafana.existingSecret` | デフォルトのパスワードは `admin` です。 |
| 外部からのアクセス | `ingress`, `gateway.service.type` | Grafana には Ingress を使用します。クラスター外のアプリケーションは OTLP/HTTP の Ingress パスまたは LoadBalancer を使用します。 |
| デバッグ出力 | `gateway.debug.enabled: false` | `dev.yaml` では有効です。 |
| 収集範囲 | `logs.namespaces.exclude` | 通常は `kube-system` を除外します。 |
| コレクターのリソース | `agent.resources`, `agent.queueSize` | 各 agent は 100m CPU と 128 MiB のメモリを要求し、上限は 1 CPU と 512 MiB です。ゲートウェイに到達できない間、各ノードは最大 `agent.queueSize` 件のレコード（デフォルトは 20,000 件）をローカルディスクにバッファリングします。 |

リポジトリの `examples/ai-observe-stack/prod.yaml` は、本番環境用 values ファイルの出発点になります。

デフォルトでは、`gateway.timeGuard.enabled=true` により、書き込み可能なパーティションの時間範囲から外れるレコードのタイムスタンプが受信時刻に変更されます。元の時刻はログでは `log.original_time_unix_nano`、トレースでは `span.original_start_time_unix_nano` に保持され、メトリクスのタイムスタンプは直接書き換えられます。過去データをバックフィルする場合は、`gateway.dorisExporter.createHistoryDays` と time guard の設定を併せて確認してください。Doris へのエクスポートのデフォルトの再試行期限は 10 分（`gateway.dorisExporter.retryMaxElapsedTime`）です。その時点でも失敗しているバッチはログに記録され、破棄されます。

## アップグレードとアンインストール {#upgrade-and-uninstall}

アップグレードまたは設定変更を行います。

```Bash
helm upgrade dog ./ai-observe-stack -n dog -f dog-values.yaml
helm upgrade dog-k8s-collector ./dog-k8s-collector -n dog -f collector-values.yaml
```

アンインストールします。

```Bash
helm uninstall dog-k8s-collector -n dog
helm uninstall dog -n dog
```

コレクターをアンインストールしても、DOG Stack や Doris 内のデータには影響しません。ノードの `/var/lib/otelcol` にあるファイルの読み取り位置は保持され、再インストールすると前回の位置から再開します。オプション A では、DOG Stack をアンインストールしても、使用している Doris のデータベースは削除されません。

Helm は、ゲートウェイの PersistentVolumeClaim、Doris の PersistentVolumeClaim（永続化を有効にしたオプション B）、完了済みの `helm test` Pod を削除しません。削除するには、次を実行します。

```Bash
kubectl delete pvc -n dog -l app.kubernetes.io/instance=dog
kubectl delete pvc -n dog -l 'app.doris.ownerreference/name in (dog-ai-observe-stack-doris-fe,dog-ai-observe-stack-doris-be)'
kubectl delete pod -n dog dog-ai-observe-stack-test-pipeline --ignore-not-found
```

オプション B では、Helm は Doris Operator とともにインストールされた CustomResourceDefinition `dorisclusters.doris.selectdb.com` も残します。Helm は CRD を削除しないためです。この CRD を削除すると、Kubernetes クラスター内のすべての DorisCluster が削除されます。Doris Operator が管理する他の Doris クラスターがない場合にのみ削除してください。

```Bash
kubectl delete crd dorisclusters.doris.selectdb.com
```

## トラブルシューティング {#troubleshooting}

| 症状 | 原因と対処法 |
| --- | --- |
| `helm install` が `missing in charts/ directory: doris-operator` を報告する | チャートの依存関係がダウンロードされていません。`helm dependency update ./ai-observe-stack` を実行します。 |
| `helm dependency build` が `no repository definition for https://charts.selectdb.com` を報告する | `helm dependency build` は `helm repo add` で追加したリポジトリだけを使用します。代わりに `helm dependency update ./ai-observe-stack` を実行します。 |
| `helm install` が `gateway.endpoint is required` を報告する | コレクターの `gateway.endpoint` にゲートウェイのアドレスを設定します。 |
| `helm install` が `additional properties 'xxx' not allowed` を報告する | values ファイルのトップレベルのキーにスペルミスがあります。 |
| `helm test` が失敗する、またはゲートウェイのログに Doris のエラーが出る | Doris FE のポート 9030 と 8030 に到達できること、アカウントに対象データベースとテーブルの作成、データロード、クエリの権限があることを確認します。`kubectl logs -n dog dog-ai-observe-stack-otel-gateway-0` でゲートウェイのログを確認します。 |
| agent Pod が `CreateContainerConfigError` を報告する、Pod Security に拒否される、または `/var/log/pods` について `permission denied` と記録される | 名前空間で `restricted` が適用されています。ステップ 2 を参照し、`privileged` ラベルを追加します。 |
| agent のログに `connection refused` または `Unavailable` が出る | ゲートウェイのアドレスが間違っている、ゲートウェイが停止している、またはネットワークポリシーがポート 4317 を遮断しています。問題が解決するまでレコードはノードにバッファリングされ、解決後に送信されます。 |
| agent Pod が `ContainerCreating` のままで、イベントに `MountVolume.SetUp failed for volume "zoneinfo"` と表示される | ノードにタイムゾーンデータベースがありません（一部の最小構成の OS イメージ）。`agent.tzdata.hostPath: ""` を設定し、`timezone` とすべてのルールの `timestamp.timezone` を UTC に保ちます。 |
| ある名前空間のログがない | `logs.namespaces.exclude` または `logs.containers.exclude` で除外されているか、インストール後に新しいログ行が書き込まれていません。 |
| ログは届くが `service_name` が空である | agent が Pod のメタデータを読み取れません。agent のログに RBAC の `forbidden` エラーがないか確認します。 |
| 解析ルールが適用されない（`dog.log.rule` が空である） | `selector.container` にコンテナ名ではなく Pod 名を指定しているか、それより前のルールが先に一致しています。`hack/test-rule.sh` で確認します。 |
| ログの時刻が数時間ずれる | ログ行にタイムゾーンがなく、コンテナが UTC で動作しておらず、`timestamp.timezone` も設定されていません。 |

agent が実際に使用している設定を確認するには、次を実行します。

```Bash
kubectl get cm -n dog dog-k8s-collector-agent-config -o jsonpath='{.data.config\.yaml}'
```

二つのチャートの全パラメーターについては、リポジトリの [helm-charts](https://github.com/ai-observe/ai-observe-stack/tree/main/helm-charts) にある各チャートの `USER_GUIDE.md` と `values.yaml` を参照してください。
