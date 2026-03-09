---
{
  "title": "複雑なネットワーク環境におけるStream Load",
  "language": "ja",
  "description": "複雑なネットワーク環境におけるStream Loadのベストプラクティス（パブリッククラウド、プライベートクラウド、Kubernetesクロスクラスターアクセスシナリオを含む）。"
}
---
## 概要

パブリッククラウド、プライベートクラウド、およびKubernetesクロスクラスター展開などの複雑なネットワーク環境では、データインポートは固有の課題に直面します。ロードバランサー（LB）とネットワーク分離（VPC内部/外部アクセス）は、リクエストルーティングの柔軟性とバッチ処理の効率性の両方に影響を与える可能性があります。

Apache Dorisは、2つの主要機能を通じてこれらの課題に対処します：
- **Stream Load Multi-Endpoint Support**: BEノードの複数のネットワークエンドポイントの柔軟な設定を可能にします
- **Group Commit LB Scheduling Optimization**: リクエストがロードバランサーを通過する場合でも効率的なバッチ処理を保証します

## 背景

### Stream Load

Stream Loadは、JSON、CSV、その他の形式をサポートするHTTPベースのデータインポート方法です。プッシュベースのアプローチとして、クライアントはMySQLプロトコルをバイパスして、HTTPリクエストを介してBackendノード（BE）に直接データを送信します。この設計により、高同時実行性、低レイテンシ、高スループットが実現され、小バッチで頻繁な書き込みシナリオに最適です。

### Group Commit

Group Commitは、サーバー側で複数の小さなリクエストをより大きなバッチ操作に結合することでスループットを最適化し、ディスクI/O、ロック競合、およびcompactionのオーバーヘッドを削減します。最大の効率性のために、Group Commitでは同じテーブルへのリクエストを同じBEノードにルーティングする必要があります。

### 課題

クラウド環境では、ロードバランサーがリクエストをBEノード間にランダムに分散します。これにより、Group Commitで必要な「ノードアフィニティ」が破られ、同じテーブルへのリクエストが異なるノードに分散されます。テストによると、この問題により高同時実行シナリオでスループットが20-50%低下する可能性があります。

## Stream Load Multi-Endpoint Support

### アドレスタイプ

Doris BEノードは、異なるネットワークアクセスシナリオに対応するため、3つのアドレスタイプをサポートします：

| アドレスタイプ | 目的 | 例 |
|-------------|---------|---------|
| `be_host` | 内部クラスター通信 | `192.168.1.1:9050` |
| `public_endpoint` | LBまたはパブリックIPを介した外部パブリックアクセス | `11.10.20.12:8010` |
| `private_endpoint` | VPCまたはKubernetes Service IP内でのプライベートアクセス | `10.10.10.9:8020` |

### 設定

SQL文を使用してエンドポイントを設定します：

```sql
-- Add BE node with endpoints
ALTER SYSTEM ADD BACKEND '192.168.1.1:9050' PROPERTIES(
    'tag.public_endpoint' = '11.10.20.12:8010',
    'tag.private_endpoint' = '10.10.10.9:8020'
);

-- Modify existing BE node endpoints
ALTER SYSTEM MODIFY BACKEND '192.168.1.1:9050' SET (
    'tag.public_endpoint' = '11.10.20.12:8010',
    'tag.private_endpoint' = '10.10.10.9:8020'
);
```
### Redirect Policy

`redirect-policy` HTTPヘッダーを使用してリクエストルーティングを制御します：

| Policy | 動作 | 使用例 |
|--------|----------|----------|
| `direct` | `be_host`にルーティング | 内部低遅延通信、Pod間通信 |
| `public` | `public_endpoint`にルーティング | パブリックネットワーク経由の外部アクセス |
| `private` | `private_endpoint`にルーティング | VPC内部またはクラスター間アクセス |
| デフォルト（空） | ホスト名マッチングに基づいて自動選択 | 一般的な使用 |

**デフォルト動作:**
1. リクエストのホスト名が`public_endpoint`のホスト名と一致する場合、`public_endpoint`にルーティング
2. そうでなく`private_endpoint`が設定されている場合、`private_endpoint`にルーティング
3. それ以外の場合、`be_host`にフォールバック

**例:**

```bash
curl --location-trusted -u user:pass \
    -H "redirect-policy: private" \
    -T data.csv \
    http://doris.example.com:8030/api/db_name/table_name/_stream_load
```
### 動作原理

1. クライアントがオプションの`redirect-policy`ヘッダーと共にStream Load リクエストをFEに送信
2. FEがポリシーに基づいてBEのアドレスプールからターゲットアドレスを選択
3. FEが選択されたエンドポイントへのHTTPリダイレクトレスポンスを返す

## Group Commit LBスケジューリング最適化

### 二段階フォワーディング

ロードバランサー背後でのGroup Commit効率を維持するため、Dorisは二段階フォワーディングメカニズムを実装しています：

**フェーズ1：FEリダイレクト**
- FEが`redirect-policy`に基づいて適切なエンドポイントを選択
- FEがターゲットテーブルを処理すべきBEノードを決定
- リクエストがLBを通じてリダイレクトされ、BEノードにランダムに配布される

**フェーズ2：BEフォワーディング**
- 受信したBE（BE1）がテーブルの指定ノードでない場合
- BE1が`be_host`を介して正しいBE（BE2）にリクエストを内部的にフォワード
- これにより同じテーブルへの全てのリクエストが同じノードに到達することを保証

### 設定例

```bash
curl --location-trusted -u user:pass \
    -H "redirect-policy: private" \
    -H "group_commit: async_mode" \
    -T data.csv \
    http://doris.example.com:8030/api/db_name/table_name/_stream_load
```
### パフォーマンス

二段階転送は最小限のオーバーヘッド（ミリ秒レベル）を導入し、Group Commitのバッチ処理は高同時実行シナリオにおいて20-50%のスループット向上を提供します。

## ユースケース

| シナリオ | 設定 | メリット |
|----------|--------------|---------|
| リアルタイムログ取り込み | Group Commit + Multi-Endpoint | 柔軟なルーティングによる高スループット |
| Cloud-native BI | 外部アクセス用の`public_endpoint` | 安全な外部ユーザーアクセス |
| Kubernetes クロスクラスター | Pod/Service IPsでの`private_endpoint` | 効率的なクロスクラスター通信 |

## 考慮事項

- **設定計画**: 特にKubernetes環境において、エンドポイントアドレスが正しく設定されていることを確認してください
- **モニタリング**: モニタリングツールを使用して転送レートとパフォーマンスを追跡してください
- **バージョン要件**: これらの機能にはDoris 3.1.0以降が必要です
