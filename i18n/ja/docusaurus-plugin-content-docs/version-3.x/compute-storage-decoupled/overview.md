---
{
  "title": "概要 | コンピュート ストレージ分離",
  "language": "ja",
  "description": "この記事では、違い、利点を紹介します",
  "sidebar_label": "概要"
}
---
# 概要

この記事では、Dorisのcompute-storage coupledモードとcompute-storage decoupledモードの違い、利点、適用シナリオを紹介し、ユーザーの選択の参考を提供します。

以下のセクションでは、compute-storage decoupledモードでApache Dorisをデプロイして使用する方法を詳しく説明します。compute-storage coupledモードでのデプロイメントについては、[クラスター Deployment](../../../docs/install/deploy-manually/integrated-storage-compute-deploy-manually)セクションをご参照ください。

## Compute-storage coupled VS decoupled

DorisのアーキテクチャはFrontend（FE）とBackend（BE）の2種類のプロセスで構成されています。FEは主にユーザーリクエストアクセス、クエリ解析と計画、メタデータ管理、ノード管理を担当します。BEはデータストレージとクエリプラン実行を担当します。（[詳細情報](../gettingStarted/what-is-apache-doris)）

### Compute-storage coupled

compute-storage coupledモードでは、BEノードがデータストレージと計算の両方を実行し、複数のBEノードがmassively parallel processing（MPP）分散コンピューティングアーキテクチャを形成します。

![compute-storage-coupled](/images/compute-storage-coupled.png)

### Compute-storage decoupled

BEノードは主要データを保存しなくなります。代わりに、共有ストレージ層が統一された主要データストレージとして機能します。さらに、基盤となるオブジェクトストレージシステムの制限とネットワーク伝送のオーバーヘッドによって引き起こされるパフォーマンス損失を克服するために、Dorisはローカルコンピュートノード上に高速キャッシュを導入しています。

![compute-storage-decoupled](/images/compute-storage-decoupled.png)

**Meta data layer:**

FEはメタデータ、ジョブ情報、権限、その他のMySQLプロトコル依存データを保存します。

Meta Serviceは、compute-storage decouplingモードでのDorisメタデータサービスです。データインポートトランザクション処理、tablet meta、rowset meta、クラスターリソース管理を担当します。これは水平スケール可能なステートレスサービスです。

**Computation layer:** 

compute-storage decoupledモードでは、BEノードはステートレスです。クエリパフォーマンスを向上させるため、tablet metadataとデータの一部をキャッシュします。

compute clusterは、コンピューティングリソースとして機能するステートレスBEノードの集合です。複数のcompute clusterが単一のデータセットを共有し、compute clusterは必要に応じてノードを追加または削除することで柔軟にスケールできます。

:::info

compute-storage decoupledモードでのcompute clusterの概念は、[クラスター Deployment]や[Create クラスター]セクションで議論されている「cluster」とは異なります。

compute-storage decoupledモードの文脈では、「Compute クラスター」は具体的にコンピューティングリソースとして機能するステートレスBEノードの集合を指し、[クラスター Deployment]や[Create クラスター]セクションで説明されている複数のApache Dorisノードで構成される完全な分散システムとは異なります。

:::

**Shared storage layer:**

共有ストレージ層は、segmentファイルと転置インデックスファイルを含むデータファイルを保存します。

## 選択方法

### Compute-storage coupledモードの利点

- **シンプルなデプロイメント**: Apache Dorisは外部共有ファイルシステムやオブジェクトストレージに依存しません。物理サーバー上にFEとBEプロセスをデプロイするだけでクラスターをセットアップできます。クラスターは単一ノードから数百ノードまでスケールできます。このアーキテクチャはシステムの安定性も向上させます。
- **高パフォーマンス**: 計算を実行する際、Apache Dorisのコンピュートノードはローカルストレージに直接アクセスできます。これは、マシンI/Oを完全に活用でき、不要なネットワークオーバーヘッドを削減することでより高いクエリパフォーマンスを実現できることを意味します。

### Compute-storage coupledモードの適用シナリオ

- Dorisの簡単な使用や迅速な試用、または開発・テスト環境での使用
- 信頼できる共有ストレージオプション（HDFS、Ceph、またはオブジェクトストレージなど）が不足している場合
- 社内の異なるビジネスチームがApache Dorisを独立して維持し、Dorisクラスターを管理する専門DBAスタッフがいない場合
- 高い柔軟なスケーラビリティの要件がなく、Kubernetesコンテナ化が不要で、パブリックまたはプライベートクラウド上での実行が不要な場合

### Compute-storage decoupledモードの利点

- **柔軟なコンピューティングリソース**: Apache Dorisでは、異なる時点で異なる規模のコンピューティングリソースを使用して、異なるビジネスリクエストに対応できます。簡単に言えば、コストを節約するためのオンデマンドコンピューティングリソースをサポートします。
- **ワークロードの（完全な）分離**: 異なるビジネスチームが共有データ上でコンピューティングリソースを分離できるため、安定性と高効率の両方を提供します。
- **低ストレージコスト**: コンピューティングとストレージを分離することで、オブジェクトストレージ、HDFS、その他の低コストストレージソリューションの使用が可能になります。

### Compute-storage decoupledモードの適用シナリオ

- パブリッククラウドサービスをすでに採用している場合
- HDFS、Ceph、オブジェクトストレージなどの信頼できる共有ストレージシステムを持っている場合
- 高い柔軟なスケーラビリティ、Kubernetesコンテナ化、またはプライベートクラウド上での実行が必要な場合
- 複数のコンピューティンググループがデータを共有できる高スループット共有ストレージ機能
- 会社のデータウェアハウスプラットフォーム全体の維持を担当する専門チームがある場合
