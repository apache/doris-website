---
{
    "title": "クラスターの計画",
    "language": "ja",
    "description": "Doris のデプロイ前にアーキテクチャを選び、ポートとノード数を計画します。"
}
---

<!-- Knowledge type: Architecture selection + Configuration reference -->
<!-- Applicable scenarios: Deployment planning / Architecture selection / Capacity planning -->

## アーキテクチャの計画

<!-- Knowledge type: Architecture selection decision -->

業務上の要件に応じてアーキテクチャを選びます。

| アーキテクチャ | 適した状況 | 依存条件 |
| ----------------- | ------------------- | ---------- |
| [ストレージ・コンピュート一体型](../../features-architecture/system-architecture#coupled-architecture) | 大幅な弾力的スケーリングが不要 | 共有ストレージは不要 |
| [ストレージ・コンピュート分離型](../../features-architecture/system-architecture#decoupled-architecture) | コンピュート資源を動的に拡張する必要がある | 共有ストレージが必要 |

## ポートの計画

<!-- Knowledge type: Network configuration parameters -->

Doris の各インスタンスはネットワーク経由で通信します。管理者は環境に合わせてポートを変更できます。

| インスタンス | ポート名 | デフォルトポート | 通信方向 | 説明 |
| -------- | --------- | ------------ | ----------------------- | ----------- |
| BE | be_port | 9060 | FE → BE | FE からの要求を受ける Thrift Server |
| BE | webserver_port | 8040 | BE ↔ BE | HTTP Server |
| BE | heartbeat_service_port | 9050 | FE → BE | ハートビートサービス（Thrift） |
| BE | brpc_port | 8060 | FE ↔ BE, BE ↔ BE | BRPC 通信 |
| FE | http_port | 8030 | FE ↔ FE, Client ↔ FE | HTTP Server |
| FE | rpc_port | 9020 | BE → FE, FE ↔ FE | Thrift Server。すべての FE で同じ値にする |
| FE | query_port | 9030 | Client ↔ FE | MySQL Server |
| FE | edit_log_port | 9010 | FE ↔ FE | bdbje 通信 |

## ノード数の計画

<!-- Knowledge type: Node capacity planning -->

### FE ノード数

FE はユーザー要求の受け付け、クエリ計画、メタデータ管理、ノード管理を担当します。

| ノード種別 | 役割 | 本番環境での推奨値 |
| --------- | ---- | ------------------------- |
| Follower | 選挙に参加し、Master が停止したときに引き継ぐ | ≥ 3 |
| Observer | メタデータのみを同期し、読み取りサービスの処理能力を拡張する | 必要に応じて追加 |

### BE ノード数

BE はデータの保存と計算を担当します。本番環境では信頼性確保のために 3 レプリカを使用します。

| 推奨事項 | 説明 |
| -------------- | ----------- |
| ≥ 3 台の BE | 一体型構成では 3 レプリカによる信頼性の高い保存を実現する。分離型構成では BE の数を 0 台以上にできる |
| 水平スケーリングに対応 | ノードを追加すると、クエリ性能と同時実行能力が向上する |
