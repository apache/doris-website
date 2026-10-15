---
{
    "title": "Doris Operator のアーキテクチャ",
    "sidebar_label": "アーキテクチャ",
    "language": "ja",
    "description": "Doris Operator のコントロールプレーン、データプレーン、Reconcile モデルと、一体型および分離型クラスターの制御経路を説明します。",
    "keywords": ["Doris Operator アーキテクチャ", "Kubernetes Operator", "Reconcile", "DorisCluster", "DorisDisaggregatedCluster"]
}
---

Doris Operator は標準的な Kubernetes Operator のパターンに従います。ユーザーは CRD を使って望ましい状態を宣言します。Operator は実際の状態を継続的に監視し、Kubernetes リソースの作成、更新、削除を通じて差分を解消します。

この文書では、全体のアーキテクチャを説明します。フィールドの定義やデプロイ手順は、対応するインストール、設定の文書を参照してください。

## アーキテクチャの層

Doris Operator は、コントロールプレーンとデータプレーンの二つの層で捉えられます。

![Doris Operator のアーキテクチャ層](/images/doris-operator/mermaid/02-architecture-layers.jpg)

コントロールプレーンは Doris のカスタムリソースを読み取り、Reconcile 処理を実行します。データプレーンは、Doris のコンポーネントを実際に動かす Kubernetes 標準リソースで構成されます。

## Reconcile モデル

Reconcile ループは Doris Operator の中核です。Doris のカスタムリソースが作成、更新されたときや、関連リソースの状態が変わったとき、Operator は望ましい状態と実際の状態の差を再計算し、必要な操作を実行します。

標準的な流れは次のとおりです。

1. Doris のカスタムリソースを読み取ります。
2. リソースが削除中か確認します。
3. コンポーネント、ストレージ、認証、アクセスの設定を解析します。
4. 対応する `StatefulSet`、`Service`、PVC などのリソースを作成または更新します。
5. コンポーネントの状態を集約し、CR の `status` に書き込みます。
6. クラスターの準備ができていない場合は、次の Reconcile ループを待ちます。

![Doris Operator の Reconcile モデル](/images/doris-operator/mermaid/03-architecture-reconcile-model.jpg)

## ストレージ・コンピュート一体型クラスターの制御経路

`DorisCluster` は一体型のデプロイに使います。一つのリソースに FE、BE、CN、Broker の設定を含められます。

![ストレージ・コンピュート一体型クラスターの制御経路](/images/doris-operator/mermaid/04-architecture-integrated-control-path.jpg)

この経路では、メインの Reconciler が CR の読み取り、コンポーネント操作の順序付け、無効なリソースのクリーンアップ、状態の集約を担当します。各コンポーネントのコントローラーは、それぞれのリソースを作成、確認します。

## ストレージ・コンピュート分離型クラスターの制御経路

`DorisDisaggregatedCluster` は分離型のデプロイに使います。一つのリソースに MetaService、FE、一つ以上の ComputeGroup が含まれます。

![ストレージ・コンピュート分離型クラスターの制御経路](/images/doris-operator/mermaid/05-architecture-decoupled-control-path.jpg)

一体型と比べ、この経路には Doris のメタデータに関わる操作が多く含まれます。たとえば ComputeGroup を縮小するとき、Operator は先にデコミッションや削除の操作を行ってから Kubernetes リソースを更新する必要があります。

## Webhook と検証

Doris Operator では、任意で Webhook を有効にし、デフォルト値の設定や明らかに無効な構成の拒否を Reconcile 処理に入る前に行えます。

一般的な検証項目は次のとおりです。

- FE のレプリカ数と選挙に関する設定の整合性。
- リソースフィールドの形式が CRD の制約を満たすか。
- コンポーネントの設定が Operator の対応モデルに合うか。

Webhook を有効にするかどうかは、デプロイ方法と環境によって異なります。Webhook がなくても、CRD スキーマ検証と Reconcile の状態フィードバックが基本的な制約を提供します。

## 状態の集約

Operator はリソースの作成だけでなく、コンポーネントの状態を Doris のカスタムリソースに書き戻します。`kubectl get` または `kubectl describe` で、コンポーネントが利用可能か、スケーリング中か、スケジューリング待ちか、失敗しているかを確認できます。

一体型クラスターでは FE、BE、CN、Broker ごとに状態を集約します。分離型クラスターでは MetaService、FE、ComputeGroup ごとに集約し、クラスター全体の健全性もまとめます。
