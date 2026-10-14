---
{
    "title": "クラスター構成の計画",
    "language": "ja",
    "description": "Doris をデプロイする前に、アーキテクチャモードを選び、ポートとノード数を計画します。"
}
---

<!-- Knowledge type: Architecture selection + Configuration reference -->
<!-- Applicable scenarios: Deployment planning / Architecture selection / Capacity planning -->

## アーキテクチャの計画

<!-- Knowledge type: Architecture selection decision -->

ビジネス上の要件に応じて、アーキテクチャモードを選択します。

| アーキテクチャモード | 適した状況 | 依存関係 |
| ----------------- | ---------- | -------- |
| [ストレージ・コンピュート一体型](../../features-architecture/system-architecture#coupled-architecture) | 大幅な動的スケーリングが不要な場合 | 共有ストレージは不要 |
| [ストレージ・コンピュート分離型](../../features-architecture/system-architecture#decoupled-architecture) | コンピュートリソースを動的にスケーリングする必要がある場合 | 共有ストレージが必要 |

## ポートの計画

<!-- Knowledge type: Network configuration parameters -->

Doris のインスタンスはネットワークを介して通信します。管理者は環境に合わせてポート設定を調整できます。

| インスタンス | ポート名 | デフォルトポート | 通信方向 | 説明 |
| ---------- | -------- | ---------------- | -------- | ---- |
| BE | be_port | 9060 | FE → BE | Thrift Server。FE からのリクエストを受信 |
| BE | webserver_port | 8040 | BE ↔ BE | HTTP Server |
| BE | heartbeat_service_port | 9050 | FE → BE | ハートビートサービス（Thrift） |
| BE | brpc_port | 8060 | FE ↔ BE, BE ↔ BE | BRPC 通信 |
| FE | http_port | 8030 | FE ↔ FE, Client ↔ FE | HTTP Server |
| FE | rpc_port | 9020 | BE → FE, FE ↔ FE | Thrift Server。すべての FE で同じポートにする必要がある |
| FE | query_port | 9030 | Client ↔ FE | MySQL Server |
| FE | edit_log_port | 9010 | FE ↔ FE | bdbje 通信 |

## ノード数の計画

<!-- Knowledge type: Node capacity planning -->

### FE のノード数

FE はユーザーリクエストの受け付け、クエリプランニング、メタデータ管理、ノード管理を担当します。

| ノードの種類 | 役割 | 本番環境での推奨数 |
| ------------ | ---- | ------------------ |
| Follower | 選挙に参加し、Master が停止した場合に引き継ぐ | ≥ 3 |
| Observer | メタデータの同期のみを行い、読み取りサービスの処理能力を拡張する | 必要に応じて追加 |

### BE のノード数

BE はデータの保存と計算を担当します。本番環境では、信頼性を確保するために 3 レプリカを使用します。

| 推奨事項 | 説明 |
| -------- | ---- |
| ≥ 3 BEs | 3 レプリカによる信頼性の高いストレージを確保します（ストレージ・コンピュート一体型の場合。ストレージ・コンピュート分離型では、BE の数は 0 以上にできます）。 |
| 水平スケーリングに対応 | ノードを追加すると、クエリ性能と同時実行性能が向上します |
