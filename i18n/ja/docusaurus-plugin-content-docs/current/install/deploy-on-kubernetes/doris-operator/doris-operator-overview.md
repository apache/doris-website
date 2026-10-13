---
{
    "title": "Doris Operator の概要",
    "sidebar_label": "概要",
    "language": "ja",
    "description": "Doris Operator の概念、対象範囲、用途、機能の境界を紹介します。",
    "keywords": ["Doris Operator", "Kubernetes", "DorisCluster", "DorisDisaggregatedCluster", "Kubernetes への Doris のデプロイ"]
}
---

[Doris Operator](https://github.com/apache/doris-operator) は、Apache Doris の公式 Kubernetes Operator です。Doris の運用経験と Kubernetes のリソース管理を組み合わせ、Kubernetes 上で Doris をより簡単かつ効率的にデプロイ、運用できるようにします。

Doris Operator は CustomResourceDefinition（CRD）を通じて Kubernetes API を拡張します。Doris のカスタムリソースを登録すると、Operator は対応する `StatefulSet`、`Service`、`PersistentVolumeClaim` などの Kubernetes リソースを作成、維持します。状況によっては、ノードの登録、デコミッション、クリーンアップといった Doris のメタデータに関わる操作も実行します。

この文書では、Doris Operator の位置付け、管理対象、適した用途を説明します。まず全体像を理解するための文書です。インストールとデプロイの手順は、ストレージ・コンピュート一体型または分離型のデプロイガイドを参照してください。

## Doris Operator を使う理由

Kubernetes 上で Doris をデプロイするには、複数のコンポーネント、サービスディスカバリー、設定のマウント、ストレージの割り当て、ノード登録、スケーリング、ヘルスチェックを調整する必要があります。クラスターが大きくなり環境が複雑になると、リソースを手動で管理する方法では、設定が分散し、作業手順が増え、状態を追いにくくなります。

Doris Operator では、Doris のカスタムリソースを使ってクラスターの望ましい状態を宣言します。Operator は次の機能を提供します。

- 一つのリソースでクラスター構成を記述します。
- `StatefulSet`、`Service`、PVC などの関連リソースを自動的に作成、維持します。
- 依存関係に従ってコンポーネントの起動と変更を順序付けます。
- コンポーネントの状態を CR の `status` に集約します。
- 設定変更、スケーリング、ローリングアップデートなどの一般的な運用を支援します。
- 状況に応じて、Doris のメタデータ上でノードの登録、デコミッション、クリーンアップを行います。

## 動作の仕組み

Doris Operator は CRD を通じて Kubernetes API を拡張します。`kubectl`、Helm などのツールで Doris クラスターのリソースを登録すると、Operator はそのリソースを監視し、`StatefulSet`、`Service`、`PersistentVolumeClaim` などの Kubernetes 標準リソースに反映します。

![Doris Operator の動作の仕組み](/images/doris-operator/mermaid/01-overview-how-doris-operator-works.jpg)

このモデルでは、ユーザーが望ましい状態を管理し、Operator が実際の状態をその目標に向けて継続的に調整します。

## アーキテクチャ

Doris Operator はコントロールプレーンとデータプレーンの二つの層で捉えられます。コントロールプレーンには Doris Operator、Reconciler、任意の Webhook ロジック、状態集約が含まれます。Doris のカスタムリソースを監視し、実際の状態を望ましい状態に近づけます。データプレーンには `StatefulSet`、`Service`、PVC、HPA、Doris Pod などの Kubernetes 標準リソースがあり、Doris の各コンポーネントを実行します。

![Doris Operator のアーキテクチャ層](/images/doris-operator/mermaid/02-architecture-layers.jpg)

ユーザーが `kubectl`、Helm などで Doris のカスタムリソースを登録すると、Kubernetes API Server が望ましい状態を保存します。Doris Operator はリソースの変更を監視して Reconcile 処理を行い、基盤となる Kubernetes リソースを作成または更新します。この階層構造により、多数の低レベルリソースを直接管理する負担が減り、標準的な Kubernetes 環境で Doris を管理できます。

## 対応するクラスターリソース

Doris Operator は主に次の二種類のクラスターリソースに対応します。

| リソース | デプロイ構成 | 主なコンポーネント | 代表的な用途 |
| --- | --- | --- | --- |
| `DorisCluster` | ストレージ・コンピュート一体型 | FE、BE、CN、Broker | 運用構成を簡潔に保つ標準的な Doris クラスター |
| `DorisDisaggregatedCluster` | ストレージ・コンピュート分離型 | MetaService、FE、ComputeGroup | コンピュートグループの弾力的な拡張や分離が必要なワークロード |

- `DorisCluster` は一体型のデプロイに使います。一つのリソースに FE、BE、CN、Broker のイメージ、レプリカ数、資源、ストレージ、設定、アクセス方法を記述できます。
- `DorisDisaggregatedCluster` は分離型のデプロイに使います。クラスターを MetaService、FE、一つ以上の ComputeGroup に分け、それぞれを独立して設定、運用できます。

## 管理対象のオブジェクト

ユーザーから見た Doris Operator の主な管理対象は次のとおりです。

| オブジェクト | 説明 |
| --- | --- |
| Doris のカスタムリソース | `DorisCluster` や `DorisDisaggregatedCluster` で表す望ましいクラスター状態 |
| `StatefulSet` | Doris コンポーネント Pod のレプリカ数、安定したネットワーク ID、ローリングアップデート |
| `Service` | 内部通信と外部アクセス |
| PVC | 状態を持つコンポーネントの永続ストレージ |
| `ConfigMap` / `Secret` | 設定、認証情報、外部依存先の情報 |
| HPA | 対応するコンポーネントの自動スケーリング |
| `status` | コンポーネントの状態、可用性、クラスターの健全性 |

## デプロイ構成の選択

Kubernetes 上に初めて Doris をデプロイする場合は、多くの場合、一体型から始めます。コンピュートグループの弾力的な拡張、コンピュートの分離、オブジェクトストレージを基盤とするアーキテクチャが明確に必要な場合は、分離型を選んでください。

| 要件 | 推奨リソース |
| --- | --- |
| 標準的な Doris クラスターをすばやくデプロイする | `DorisCluster` |
| 少ない概念で検証する | `DorisCluster` |
| ワークロードごとに異なるコンピュート資源を使う | `DorisDisaggregatedCluster` |
| コンピュートを柔軟に拡張する | `DorisDisaggregatedCluster` |
| オブジェクトストレージと FoundationDB の使用を既に計画している | `DorisDisaggregatedCluster` |

## 機能の範囲

Doris Operator は Doris クラスターのリソースとライフサイクル管理に重点を置きます。Doris データベース自体の管理機能を置き換えるものではありません。

次のものは直接管理しません。

- データベース、テーブル、パーティション、インデックスなどの SQL オブジェクト。
- データのインポート、エクスポート、ワークロードのオーケストレーション方針。
- ユーザー権限モデルの設計。
- あらゆる障害からの自動復旧。
- Kubernetes、ストレージ、ネットワークのすべての問題の抽象化。

クラスターに異常がある場合は、Operator の状態、Kubernetes リソースの状態、Doris コンポーネントのログを組み合わせて原因を調べる必要があります。

## 次に読む文書

Doris Operator を初めて使う場合は、次の文書を順に読んでください。特定の問題を調べている場合は、該当するページに直接進んでください。

| 目的 | 推奨文書 |
| --- | --- |
| コントロールプレーン、データプレーン、Reconcile モデルを理解する | [Doris Operator のアーキテクチャ](./architecture) |
| Doris のカスタムリソースと `StatefulSet`、`Service`、PVC などの対応関係を理解する | [Doris Operator のリソースモデル](./resource-model) |
| 作成、スケーリング、設定変更、削除時の動作を理解する | [Doris Operator のライフサイクル管理](./lifecycle) |
| 状態フィールドと問題調査の手順を理解する | [Doris Operator の状態とトラブルシューティング](./status-and-troubleshooting) |
