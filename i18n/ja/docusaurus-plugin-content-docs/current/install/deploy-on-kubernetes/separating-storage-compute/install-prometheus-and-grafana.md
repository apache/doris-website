---
{
    "title": "Prometheus と Grafana のデプロイ",
    "language": "ja",
    "description": "Helm を使用して Kubernetes 上に Prometheus と Grafana をデプロイし、コンピュートとストレージを分離した Doris クラスターのメトリクスを収集・可視化します。",
    "keywords": ["Doris", "コンピュートとストレージの分離", "コンピュートとストレージを分離した構成", "Kubernetes", "K8s", "Prometheus", "Grafana", "Helm", "ServiceMonitor", "メトリクス", "メトリクス収集", "クラスターモニタリング", "モニタリングのデプロイ", "ダッシュボード", "kube-prometheus-stack"]
}
---

<!-- Knowledge type: Procedure -->
<!-- Use cases: monitoring deployment before a Doris compute-storage decoupled cluster goes live, monitoring onboarding for day-to-day operations -->

このドキュメントでは、Helm を使用して Kubernetes 上に Prometheus と Grafana をデプロイし、Apache Doris のコンピュートとストレージを分離したクラスターに接続して、メトリクスの収集、可視化、アラート通知を行う方法を説明します。Prometheus は、FE、BE、Meta Service が公開する HTTP メトリクスと bRPC メトリクスを収集します。Grafana はダッシュボードでクラスターの状態を表示します。

> 注：このドキュメントでは、Kubernetes 上での Helm と ServiceMonitor を使用した手順を中心に説明します。このガイドでダウンロードするクラウド用ダッシュボードテンプレートは、**Kubernetes を使用しない、コンピュートとストレージを分離したクラスター**にも適用できます。Doris のモニタリングアーキテクチャ、メトリクスの形式、ダッシュボードのパネルの説明、およびテンプレートの一覧については、[モニタリングとアラート](../../../admin-manual/maint-monitor/monitor-alert)を参照してください。

## ユースケース

| シナリオ | 説明 |
|------|------|
| 新しいクラスターの導入 | Doris のコンピュートとストレージを分離したクラスターを本番環境に投入する前にモニタリングを設定し、異常を早期に検出できるようにします。 |
| 日常の運用 | FE、BE、Meta Service の主要なメトリクスとノードのリソース使用量を継続的に監視します。 |
| トラブルシューティング | 過去のメトリクス、ダッシュボードの表示、アラートを使用して、パフォーマンスや可用性の問題をすばやく特定します。 |
| キャパシティプランニング | ノードとコンポーネントのメトリクスの推移から、スケールアウトの時期を判断します。 |

## 前提条件

- 使用可能な Kubernetes クラスターがあり、`kubectl` が設定済みであること。
- Doris Operator を使用して、コンピュートとストレージを分離したクラスターが `default` 名前空間にデプロイ済みであり、三種類のコンポーネント（FE、BE/Compute Group、Meta Service）がすべて稼働可能な状態であること。
- ノードが外部ネットワークにアクセスでき、Helm のインストールスクリプト、Prometheus Community Charts、Grafana Dashboard の JSON ファイルをダウンロードできること。
- Kubernetes で名前空間、Helm Release、ServiceMonitor などのリソースを作成する権限があること。

## デプロイの概要

1. Helm をインストールし、`kube-prometheus-stack` を使用して Prometheus、Grafana、Alertmanager をまとめてデプロイします。
2. Prometheus の `ServiceMonitor` を設定し、Doris クラスターの HTTP メトリクスと bRPC メトリクスを自動検出して収集できるようにします。
3. Grafana にログインして公式の Doris ダッシュボードをインポートし、必要に応じてノード監視パネルを追加します。

## ステップ 1：Helm、Prometheus、Grafana をデプロイする

<!-- Knowledge type: Procedure -->

### 1.1 Helm をインストールする

目的：ローカルマシンまたは運用ノードに Helm 3 をインストールし、Kubernetes 上のモニタリングコンポーネントのインストールと管理に使用します。

```shell
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### 1.2 Prometheus Community の Helm リポジトリを追加する

目的：`kube-prometheus-stack` Chart を提供するリポジトリを登録し、ローカルキャッシュを更新します。

```shell
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```

### 1.3 kube-prometheus-stack をデプロイする

目的：Prometheus、Grafana、Alertmanager、および関連する Operator を専用の `monitoring` 名前空間にデプロイします。

```shell
# Create the namespace
kubectl create namespace monitoring

# Deploy kube-prometheus-stack
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring
```

### 1.4 Pod の状態を確認する

目的：次のステップに進む前に、モニタリングスタックのすべての Pod が `Running` 状態であることを確認します。

```shell
kubectl get pods -n monitoring
```

正常な出力の例を次に示します。

```text
NAME                                                     READY   STATUS    RESTARTS         AGE
alertmanager-prometheus-kube-prometheus-alertmanager-0   2/2     Running   8 (5h28m ago)    4d23h
prometheus-grafana-7994c77c7-8nk7j                       3/3     Running   12 (5h28m ago)   5d
prometheus-kube-prometheus-operator-5576477887-dgp8h     1/1     Running   4 (5h28m ago)    5d
prometheus-kube-state-metrics-77885ddddc-hldlw           1/1     Running   4 (5h28m ago)    4d23h
prometheus-prometheus-kube-prometheus-prometheus-0       2/2     Running   0                4h11m
prometheus-prometheus-node-exporter-2tl9s                1/1     Running   4 (5h28m ago)    4d23h
prometheus-prometheus-node-exporter-b58rd                1/1     Running   4 (5h28m ago)    4d23h
prometheus-prometheus-node-exporter-fqp6v                1/1     Running   4 (5h28m ago)    4d23h
```

## ステップ 2：Doris のメトリクスを収集するよう Prometheus を設定する

<!-- Knowledge type: Configuration parameters -->
<!-- Use cases: enable Prometheus to auto-discover and scrape metrics exposed by Doris FE/BE/Meta Service -->

`ServiceMonitor` を作成し、Prometheus Operator が `default` 名前空間内でラベル `app.doris.disaggregated.cluster=test-disaggregated-cluster` を持つ Doris の Service を自動検出して、FE、BE、Meta Service の三種類のコンポーネントごとにメトリクスを収集できるようにします。

### 2.1 ServiceMonitor の YAML を用意する

目的：収集対象、エンドポイントのパス、収集間隔を定義し、`relabelings` を使用して各 Service にロールに応じた共通の `group` ラベルを付け、ダッシュボードでのフィルタリングに使用します。

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: doris-disaggregated-monitor
  namespace: monitoring
  labels:
    release: prometheus
spec:
  namespaceSelector:
    matchNames:
    - default
  selector:
    matchLabels:
      app.doris.disaggregated.cluster: test-disaggregated-cluster
  endpoints:
  - port: http
    path: /metrics
    interval: 15s
    relabelings:
    # 1. Unify the job name
    - action: replace
      targetLabel: job
      replacement: doris-cluster
    # 2. Map Service name suffix to component group: -cg1 -> be, -fe -> fe, -ms -> meta_service
    - sourceLabels: [__meta_kubernetes_service_name]
      regex: .*-cg1
      replacement: be
      targetLabel: group
    - sourceLabels: [__meta_kubernetes_service_name]
      regex: .*-fe
      replacement: fe
      targetLabel: group
    - sourceLabels: [__meta_kubernetes_service_name]
      regex: .*-ms
      replacement: meta_service
      targetLabel: group

  - port: brpc-port
    path: /brpc_metrics
    interval: 15s
    relabelings:
    # 1. Unify the job name
    - action: replace
      targetLabel: job
      replacement: doris-cluster
    # 2. Map Service name suffix to component group: -cg1 -> be, -fe -> fe, -ms -> meta_service
    - sourceLabels: [__meta_kubernetes_service_name]
      regex: .*-cg1
      replacement: be
      targetLabel: group
    - sourceLabels: [__meta_kubernetes_service_name]
      regex: .*-fe
      replacement: fe
      targetLabel: group
    - sourceLabels: [__meta_kubernetes_service_name]
      regex: .*-ms
      replacement: meta_service
      targetLabel: group
```

### 2.2 ServiceMonitor の主なフィールド

| フィールド | 値 | 説明 |
|------|------|------|
| `metadata.namespace` | `monitoring` | ServiceMonitor は Prometheus インスタンスと同じ名前空間に配置する必要があります。 |
| `metadata.labels.release` | `prometheus` | Helm Release の名前と一致させる必要があります。Prometheus Operator はこのラベルを使用して ServiceMonitor を検出します。 |
| `spec.namespaceSelector.matchNames` | `default` | Doris クラスターが稼働する名前空間です。環境に合わせて変更してください。 |
| `spec.selector.matchLabels` | `app.doris.disaggregated.cluster: test-disaggregated-cluster` | コンピュートとストレージを分離した Doris クラスターの Service を選択します。必要に応じてクラスター名を変更してください。 |
| `endpoints[0].port` | `http` | FE、BE、Meta Service が `/metrics` を公開する HTTP ポートの名前です。 |
| `endpoints[1].port` | `brpc-port` | BE が `/brpc_metrics` を公開する bRPC ポートの名前です。 |
| `endpoints[*].interval` | `15s` | メトリクスの収集間隔です。データ量と精度の要件に応じて変更してください。 |
| `group` ラベル（`relabelings` 内） | `be` / `fe` / `meta_service` | Service 名のサフィックスに基づいてメトリクスを三種類のコンポーネントに分類し、ダッシュボードの変数によるフィルタリングに使用します。 |

### 2.3 YAML を適用して確認する

目的：Prometheus Operator に新しい `ServiceMonitor` を検出させ、収集対象を更新します。

```shell
kubectl apply -f doris-monitor.yaml
```

ブラウザーで Prometheus（デフォルトポートは `9090`、例：`http://your_ip:9090`）を開き、**Status → Targets** に移動します。`doris-cluster` 配下にある FE、BE、Meta Service のすべてのターゲットが `UP` 状態であることを確認します。

## ステップ 3：Grafana とダッシュボードを設定する

<!-- Knowledge type: Procedure -->
<!-- Use cases: visualize Doris cluster and node metrics through Grafana -->

### 3.1 Grafana にログインする

目的：`kube-prometheus-stack` に含まれる Grafana にアクセスし、初回ログインを完了します。

1. ブラウザーで Grafana（デフォルトポートは `3000`、例：`http://your_ip:3000`）を開きます。
2. ユーザー名は `admin` です。次のコマンドで初期パスワードを取得します。

    ```shell
    kubectl get secret --namespace monitoring prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 --decode ; echo
    ```

### 3.2 Doris ダッシュボードをインポートする

目的：公式の Dashboard JSON ファイルを使用して、Doris クラスターのメトリクスを可視化します。

1. 公式のダッシュボードファイル [Doris-Dashboard-Cloud.json](https://doris.apache.org/files/doris-grafana-dashboard-cloud.json) をダウンロードします。
2. Grafana で **Dashboards → New → Import** に移動し、JSON ファイルをインポートして、付属の Prometheus をデータソースとして選択します。
3. ダッシュボードの URL に `&var-cluster_id=doris-cluster` を追加し、ServiceMonitor で設定した `job` 名に合わせます。例：

    ```text
    http://your_ip:3000/d/3fFiWJ4mz456/doris-cloud-dashboard-overview?orgId=1&var-cluster_id=doris-cluster&refresh=5s
    ```

### 3.3 ノード監視を追加する（任意）

目的：サンプルの JSON ファイルには、ホストノードを監視するパネルが含まれていません。公式の Grafana テンプレート `1860` を使用して、`node-exporter` のメトリクスを直接表示します。

1. Grafana でダッシュボードをインポートします。

    ![Grafana でダッシュボードをインポートする画面](/images/next/install/image-for-grafana-import-dashboard.png)

2. 公式テンプレート番号 `1860` を選択します。

    ![Grafana でテンプレート 1860 を選択する画面](/images/next/install/image-for-grafana-demo-1860.png)

3. インポートが完了すると、ノードのメトリクスを確認できます。

    ![ノードのメトリクスを表示する画面](/images/next/install/image-for-node-metrics.png)

## よくある問題

<!-- Knowledge type: Troubleshooting -->

| 問題 | 考えられる原因 | 対処方法 |
|------|----------|----------|
| Prometheus の **Targets** に Doris のターゲットが表示されない | ServiceMonitor の `namespaceSelector` または `matchLabels` が実際の Doris クラスターと一致していないか、`release` ラベルが Helm Release 名と一致していません。 | クラスターの名前空間と Service のラベル `app.doris.disaggregated.cluster` を確認し、`release` ラベルが `ServiceMonitor` で `prometheus` に設定されていることを確認します。 |
| ターゲットは表示されるが `DOWN` 状態になる | Pod が稼働可能な状態でないか、`http` / `brpc-port` のポート名が実際に公開されているポート名と一致していません。 | `kubectl get svc -n default` と `kubectl describe pod` を使用して、ポート名、稼働可能な状態、およびコンテナー内から `/metrics` と `/brpc_metrics` にアクセスできることを確認します。 |
| Grafana のダッシュボードのパネルが空白になる | URL に `var-cluster_id=doris-cluster` が含まれていないか、ServiceMonitor の `job` 名が変更されています。 | ダッシュボードの URL の `var-cluster_id` と、`job` ラベル（`ServiceMonitor` 内）が、どちらも `doris-cluster` に設定されていることを確認します。 |
| ポート 9090 の Prometheus またはポート 3000 の Grafana にアクセスできない | Service の種類はデフォルトで `ClusterIP` であり、クラスター外からアクセスできません。 | `kubectl port-forward` でポートを転送するか、対応する Service の種類を `NodePort` または `LoadBalancer` に変更します。 |
| Grafana のパスワードを取得するコマンドが `NotFound` を返す | Helm Release の名前が `prometheus` ではないため、Secret 名が異なります。 | `kubectl get secret -n monitoring` で実際の Grafana の Secret 名を調べ、コマンド内の `prometheus-grafana` を置き換えます。 |
