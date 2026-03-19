---
{
  "title": "概要 | コンピュート・ストレージ分離",
  "language": "ja",
  "description": "この記事では、違い、利点を紹介します。",
  "sidebar_label": "概要"
}
---
# 概要

この記事では、Dorisのcompute-storage coupledモードとcompute-storage decoupledモードの違い、利点、適用シナリオを紹介し、ユーザーの選択の参考資料を提供します。

以下のセクションでは、compute-storage decoupledモードでApache Dorisをデプロイして使用する方法を詳細に説明します。compute-storage coupledモードでのデプロイメントについては、[クラスター Deployment](../install/deploy-manually/integrated-storage-compute-deploy-manually.md)セクションを参照してください。

## **Compute-storage coupled VS decoupled**

DorisのアーキテクチャはFrontend (FE)とBackend (BE)の2つのプロセスで構成されています。FEは主にユーザーリクエストのアクセス、クエリの解析と計画、メタデータ管理、ノード管理を担当します。BEはデータの保存とクエリプランの実行を担当します。([詳細情報](../gettingStarted/what-is-apache-doris))

### Compute-storage coupled

compute-storage coupledモードでは、BEノードがデータの保存と計算の両方を実行し、複数のBEノードが大規模並列処理 (MPP) 分散計算アーキテクチャを形成します。

![compute storage coupled architecture](/images/compute-storage-coupled.png)

### **Compute-storage decoupled**

BEノードはもはやプライマリデータを保存しません。代わりに、共有ストレージ層が統一されたプライマリデータストレージとして機能します。さらに、基盤のオブジェクトストレージシステムの制限とネットワーク転送のオーバーヘッドによって引き起こされるパフォーマンス損失を克服するため、Dorisはローカルコンピュートノード上に高速キャッシュを導入しています。

![compute storage decoupled architecture](/images/compute-storage-decoupled.png)

**Meta data layer:**

FEはメタデータ、ジョブ情報、権限、およびその他のMySQLプロトコル依存データを保存します。

Meta ServiceはDorisのcompute-storage decouplingモードにおけるメタデータサービスです。データインポートトランザクション処理、tablet meta、rowset meta、およびクラスターリソース管理を担当します。これは水平スケールが可能なステートレスサービスです。

**Computation layer:** 

compute-storage decoupledモードでは、BEノードはステートレスです。クエリパフォーマンスを向上させるため、tabletメタデータとデータの一部をキャッシュします。

compute clusterは計算リソースとして機能するステートレスBEノードの集合です。複数のcompute clusterが単一のデータセットを共有し、compute clusterは必要に応じてノードを追加または削除することで弾力的にスケールできます。

:::info

compute-storage decoupledモードのcompute clusterの概念は、[クラスター Deployment]と[Create クラスター]セクションで説明されている「cluster」とは異なります。

compute-storage decoupledモードの文脈では、「Compute クラスター」は[クラスター Deployment]と[Create クラスター]セクションで説明されている複数のApache Dorisノードから構成される完全な分散システムではなく、特に計算リソースとして機能するステートレスBEノードの集合を指します。

:::

**Shared storage layer:**

共有ストレージ層は、segmentファイルとinverted indexファイルを含むデータファイルを保存します。

## 選択方法

### compute-storage coupledモードの利点

- **シンプルなデプロイメント**: Apache Dorisは外部の共有ファイルシステムやオブジェクトストレージに依存しません。物理サーバー上にFEとBEプロセスをデプロイするだけでクラスターを構築できます。クラスターは単一ノードから数百ノードまでスケールできます。このようなアーキテクチャはシステムの安定性も向上させます。
- **高パフォーマンス**: 計算を実行する際、Apache Dorisのコンピュートノードはローカルストレージに直接アクセスできます。これはマシンI/Oを最大限に活用し、不要なネットワークオーバーヘッドを削減することで、より高いクエリパフォーマンスを実現できることを意味します。

### compute-storage coupledモードの適用シナリオ

- Dorisの簡単な使用やクイック試用、または開発・テスト環境での使用の場合
- 信頼性の高い共有ストレージオプション（HDFS、Ceph、またはオブジェクトストレージなど）が不足している場合
- 会社の異なる事業チームがApache Dorisを独立して維持し、Dorisクラスターを管理する専用DBAスタッフがいない場合
- 高い弾力的スケーラビリティ、Kubernetesコンテナ化、パブリッククラウドやプライベートクラウドでの実行の要件がない場合

### compute-storage decoupledモードの利点

- **弾力的計算リソース**: Apache Dorisでは、異なる時点で異なる規模の計算リソースを使用して、異なる事業リクエストに対応できます。簡潔に言えば、コスト節約のためオンデマンド計算リソースをサポートします。
- **ワークロードの（完全な）分離**: 異なる事業チームが共有データの上で計算リソースを分離でき、安定性と高効率の両方を提供します。
- **低ストレージコスト**: 計算とストレージの分離により、オブジェクトストレージ、HDFSなどの低コストストレージソリューションの使用が可能になります。

### compute-storage decoupledモードの適用シナリオ

- すでにパブリッククラウドサービスを採用している場合
- HDFS、Ceph、オブジェクトストレージなど信頼性の高い共有ストレージシステムを持っている場合
- 高い弾力的スケーラビリティ、Kubernetesコンテナ化、またはプライベートクラウドでの実行を必要とする場合
- 複数の計算グループがデータを共有することを可能にする高スループット共有ストレージ機能
- 会社全体のデータウェアハウスプラットフォームの維持を担当する専用チームがいる場合
