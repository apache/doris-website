---
{
    "title": "Doris Operator のステータスとトラブルシューティング",
    "sidebar_label": "ステータスとトラブルシューティング",
    "language": "ja",
    "description": "Kubernetes 上の Doris クラスターについて、Doris Operator のステータスフィールド、クラスターの健全性、実践的なトラブルシューティングの手順を説明します。",
    "keywords": ["Doris Operator トラブルシューティング", "ステータス", "clusterHealth", "DorisCluster", "DorisDisaggregatedCluster", "Kubernetes"]
}
---

Doris Operator は、Doris のカスタムリソースの `status` フィールドにコンポーネントの状態を書き込みます。Kubernetes 上の Doris で問題を調査するときは、まず CR のステータスを確認し、次に Operator のログ、Kubernetes リソース、Doris コンポーネントのログを調べます。

## リソースのステータスを確認する

ストレージ・コンピュート一体型クラスターでは `DorisCluster` を使います。一般的な略称は `dcr` です。

```shell
kubectl get dcr -n ${namespace}
kubectl describe dcr ${cluster_name} -n ${namespace}
```

ストレージ・コンピュート分離型クラスターでは `DorisDisaggregatedCluster` を使います。一般的な略称は `ddc` です。

```shell
kubectl get ddc -n ${namespace}
kubectl describe ddc ${cluster_name} -n ${namespace}
```

CR でコンポーネントが準備できていないことが示されている場合は、基になるリソースを確認します。

```shell
kubectl get pod,sts,svc,pvc -n ${namespace}
kubectl get event -n ${namespace} --sort-by=.lastTimestamp
```

## DorisCluster のステータス

`DorisCluster.status` はコンポーネントごとに集約されます。

| フィールド | 説明 |
| --- | --- |
| `feStatus` | FE のステータス |
| `beStatus` | BE のステータス |
| `cnStatus` | CN のステータス |
| `brokerStatus` | Broker のステータス |

各コンポーネントのステータスには通常、次の項目が含まれます。

| フィールド | 説明 |
| --- | --- |
| `accessService` | コンポーネントへの外部アクセス用 Service |
| `runningInstances` | 実行中のインスタンス |
| `creatingInstances` | 作成中のインスタンス |
| `failedInstances` | 失敗したインスタンス |
| `componentCondition.phase` | 現在のコンポーネントのフェーズ |
| `componentCondition.reason` | そのフェーズになった理由 |
| `componentCondition.message` | 人が読める形式のステータスメッセージ |

一般的なフェーズは次のとおりです。

| フェーズ | 意味 |
| --- | --- |
| `available` | コンポーネントを利用できる |
| `reconciling` | Operator がリソースを Reconcile している |
| `waitScheduling` | スケジューリングまたはその他のリソースを待機している |
| `haveMemberFailed` | 少なくとも一つのインスタンスが失敗している |
| `initializing` | コンポーネントを初期化している |
| `upgrading` | コンポーネントをアップグレードしている |
| `scaling` | コンポーネントをスケーリングしている |
| `restarting` | コンポーネントを再起動している |

## DorisDisaggregatedCluster のステータス

`DorisDisaggregatedCluster.status` には、コンポーネントのステータスとクラスター全体の健全性が含まれます。

| フィールド | 説明 |
| --- | --- |
| `metaServiceStatus` | MetaService のステータス |
| `feStatus` | FE のステータス |
| `computeGroupStatuses` | ComputeGroup のステータス一覧 |
| `clusterHealth` | クラスター全体の健全性 |
| `observedGeneration` | Operator が観測した世代 |

`clusterHealth` はクラスター全体の可用性を示します。

| フィールド | 説明 |
| --- | --- |
| `health` | `green`、`yellow`、`red` などで示される全体的な健全性 |
| `feAvailable` | FE を利用できるかどうか |
| `cgCount` | ComputeGroup の数 |
| `cgAvailableCount` | 利用可能な ComputeGroup の数 |
| `cgFullAvailableCount` | すべての Pod を利用できる ComputeGroup の数 |

| 健全性 | 意味 |
| --- | --- |
| `green` | 主要なコンポーネントを利用でき、ComputeGroup の可用性が想定どおりである |
| `yellow` | クラスターは部分的に利用できるが、完全には準備できていない |
| `red` | 主要なコンポーネントを利用できないか、利用可能な ComputeGroup が少なすぎる |

ComputeGroup のフェーズには、`Ready`、`Reconciling`、`Scaling`、`Decommissioning`、`ScaleDownFailed`、`Suspended` があります。

## 推奨されるトラブルシューティングの手順

次の順序で調査します。

![推奨されるトラブルシューティングの手順](/images/doris-operator/mermaid/14-troubleshooting-path.jpg)

## よくある問題と調査方法

### Pod が Pending のままになる

主な原因は次のとおりです。

- ノードの CPU またはメモリが不足している。
- ノードセレクター、アフィニティ、または toleration が一致していない。
- PVC のバインドに失敗している。

```shell
kubectl describe pod ${pod_name} -n ${namespace}
kubectl get event -n ${namespace} --sort-by=.lastTimestamp
kubectl get pvc -n ${namespace}
```

### PVC をバインドできない

主な原因は次のとおりです。

- StorageClass が存在しない。
- ストレージ容量が不足している。
- アクセスモードが一致していない。

```shell
kubectl get storageclass
kubectl describe pvc ${pvc_name} -n ${namespace}
```

### コンポーネントが再起動を繰り返す

主な原因は次のとおりです。

- Doris の起動設定が無効である。
- ポートが競合しているか、FQDN の設定が無効である。
- ストレージの権限またはマウントパスに問題がある。
- JVM またはシステムのパラメーターが要件を満たしていない。

```shell
kubectl logs ${pod_name} -n ${namespace}
kubectl describe pod ${pod_name} -n ${namespace}
```

Pod が `CrashLoopBackOff` 状態で、ログから原因を特定できない場合は、クラスター運用のドキュメントに記載されている Debug 手順を使用します。

### Service にアクセスできない

主な原因は次のとおりです。

- 内部用 Service を外部からのアクセスポイントとして使用している。
- Service の種類がアクセス環境に合っていない。
- Pod が Ready 状態ではないため、Endpoints が空である。
- クラウドの LoadBalancer の作成に失敗している。

```shell
kubectl get svc -n ${namespace}
kubectl get endpoints -n ${namespace}
kubectl describe svc ${service_name} -n ${namespace}
```

### 設定変更が反映されない

主な原因は次のとおりです。

- ConfigMap を変更したが、コンポーネントを再起動していない。
- ConfigMap のキーがコンポーネントの要件に合っていない。
- CR が ConfigMap を正しく参照していない。
- マウントパスと設定されたファイルパスが一致していない。

```shell
kubectl get configmap -n ${namespace}
kubectl describe dcr ${cluster_name} -n ${namespace}
kubectl describe ddc ${cluster_name} -n ${namespace}
```

ストレージ・コンピュート一体型クラスターで、主要な ConfigMap の変更を契機にローリング再起動させたい場合は、`enableRestartWhenConfigChange` が設定されているか確認します。

### authSecret の問題

Doris Operator は、ノードの登録、スケールイン、デコミッションなどの操作に Doris の管理用認証情報を必要とする場合があります。`authSecret` の設定が正しくないと、これらの操作を完了できません。

主な原因は次のとおりです。

- 参照先の Secret が存在しないか、異なる namespace にある。
- Secret の種類またはキーが正しくない。
- ユーザー名またはパスワードが Doris の管理アカウントと一致していない。
- 管理アカウントに必要な権限がない。

```shell
kubectl get secret ${auth_secret_name} -n ${namespace}
kubectl describe dcr ${cluster_name} -n ${namespace}
kubectl describe ddc ${cluster_name} -n ${namespace}
kubectl logs deployment/${operator_deployment_name} -n ${operator_namespace}
```

クラスターがデフォルト以外の管理アカウントを使用している場合や、root パスワードをすでに設定している場合は、`authSecret` が実際の Doris の認証情報と一致していることを確認します。

### ComputeGroup のスケールインが完了しない

ストレージ・コンピュート分離型クラスターでは、ComputeGroup のスケールインが `Decommissioning` または `ScaleDownFailed` の状態にとどまる場合があります。

主な原因は次のとおりです。

- Doris のメタデータレベルでのデコミッションが完了していない。
- FE を利用できない。
- 管理用認証情報が正しくない。
- 対象ノードにデータ移行またはクリーンアップのタスクが残っている。

```shell
kubectl describe ddc ${cluster_name} -n ${namespace}
kubectl logs deployment/${operator_deployment_name} -n ${operator_namespace}
```

Doris 側でノードと ComputeGroup のステータスも確認する必要がある場合があります。

## Operator のログ

CR のステータスだけでは失敗の原因が分からない場合は、Doris Operator のログを確認します。

```shell
kubectl get pod -n ${operator_namespace}
kubectl logs ${operator_pod_name} -n ${operator_namespace}
```
