---
{
  "title": "複雑なネットワーク環境でのStream Load",
  "description": "複雑なネットワーク環境における Stream Load のベストプラクティス。パブリッククラウド、プライベートクラウド、および Kubernetes クロスクラスターアクセスシナリオを含みます。",
  "language": "ja"
}
---
## 概要

パブリッククラウド、プライベートクラウド、Kubernetesクロスクラスターデプロイメントなどの複雑なネットワーク環境において、データインポートは独特な課題に直面します。ロードバランサー（LB）とネットワーク分離（VPC内部/外部アクセス）は、リクエストルーティングの柔軟性とバッチ処理効率の両方に影響を与える可能性があります。

Apache Dorisは、以下の2つの主要機能を通じてこれらの課題に対処します：
- **Stream Load Multi-Endpoint Support**: BEノードに対する複数のネットワークエンドポイントの柔軟な設定を可能にします
- **Group Commit LB Scheduling 最適化**: リクエストがロードバランサーを通過する場合でも効率的なバッチ処理を確保します

## 背景

### Stream Load

Stream LoadはHTTPベースのデータインポート方法で、JSON、CSVおよびその他の形式をサポートします。プッシュベースのアプローチとして、クライアントはHTTPリクエスト経由でBackendノード（BE）に直接データを送信し、MySQLプロトコルをバイパスします。この設計により高同期性、低レイテンシ、高スループットが可能となり、小バッチで頻繁な書き込みシナリオに最適です。

### Group Commit

Group Commitは、サーバー側で複数の小さなリクエストをより大きなバッチオペレーションに結合することでスループットを最適化し、ディスクI/O、ロック競合、およびコンパクションオーバーヘッドを削減します。最大効率を得るために、Group Commitは同じtableに対するリクエストを同じBEノードにルーティングする必要があります。

### 課題

クラウド環境では、ロードバランサーがBEノード間でリクエストをランダムに分散します。これによりGroup Commitが必要とする「ノードアフィニティ」が破綻し、同じtableに対するリクエストが異なるノードに分散してしまいます。テストでは、この問題により高同期性シナリオでスループットが20-50%低下する可能性があることが示されています。

## Stream Load Multi-Endpoint Support

### アドレスタイプ

Doris BEノードは、異なるネットワークアクセスシナリオに対応するため3つのアドレスタイプをサポートします：

| アドレスタイプ | 目的 | 例 |
|-------------|---------|---------|
| `be_host` | 内部クラスター通信 | `192.168.1.1:9050` |
| `public_endpoint` | LBまたはパブリックIP経由の外部パブリックアクセス | `11.10.20.12:8010` |
| `private_endpoint` | VPC内またはKubernetes Service IP内でのプライベートアクセス | `10.10.10.9:8020` |

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

| Policy | Behavior | Use Case |
|--------|----------|----------|
| `direct` | `be_host`にルーティング | 内部低レイテンシ通信、Pod間通信 |
| `public` | `public_endpoint`にルーティング | パブリックネットワーク経由の外部アクセス |
| `private` | `private_endpoint`にルーティング | VPC内部またはクラスタ間アクセス |
| デフォルト（空） | ホスト名マッチングに基づいて自動選択 | 一般的な用途 |

**デフォルト動作：**
1. リクエストのホスト名が`public_endpoint`のホスト名と一致する場合、`public_endpoint`にルーティング
2. そうでなく、`private_endpoint`が設定されている場合、`private_endpoint`にルーティング
3. それ以外の場合、`be_host`にフォールバック

**例：**

```bash
curl --location-trusted -u user:pass \
    -H "redirect-policy: private" \
    -T data.csv \
    http://doris.example.com:8030/api/db_name/table_name/_stream_load
```
### 動作原理

1. クライアントがオプションの`redirect-policy`ヘッダーと共にStream Load要求をFEに送信
2. FEがポリシーに基づいてBEのアドレスプールからターゲットアドレスを選択
3. FEが選択されたエンドポイントへのHTTPリダイレクト応答を返却

## Group Commit LBスケジューリング最適化

### 二段階フォワーディング

ロードバランサー配下でGroup Commit効率を維持するため、Dorisは二段階フォワーディングメカニズムを実装しています：

**フェーズ1: FEリダイレクト**
- FEが`redirect-policy`に基づいて適切なエンドポイントを選択
- FEがターゲットTableを処理すべきBEノードを決定
- 要求がLB経由でリダイレクトされ、LBがランダムにBEノードに分散

**フェーズ2: BEフォワーディング**
- 受信したBE（BE1）がTableの指定ノードでない場合
- BE1が`be_host`経由で正しいBE（BE2）に内部的に要求をフォワード
- これにより同じTableへのすべての要求が同じノードに到達することを保証

### 設定例

```bash
curl --location-trusted -u user:pass \
    -H "redirect-policy: private" \
    -H "group_commit: async_mode" \
    -T data.csv \
    http://doris.example.com:8030/api/db_name/table_name/_stream_load
```
### パフォーマンス

2段階転送は最小限のオーバーヘッド（ミリ秒レベル）を導入する一方で、Group Commitのバッチ処理は高並行シナリオにおいて20-50%のスループット向上を提供します。

## 使用例

| シナリオ | 設定 | 利点 |
|----------|--------------|---------|
| リアルタイムログ取り込み | Group Commit + Multi-Endpoint | 柔軟なルーティングによる高スループット |
| クラウドネイティブBI | 外部アクセス用の`public_endpoint` | 安全な外部ユーザーアクセス |
| Kubernetesクラスター間 | Pod/Service IPを使用した`private_endpoint` | 効率的なクラスター間通信 |

## 考慮事項

- **設定計画**: 特にKubernetes環境において、エンドポイントアドレスが正しく設定されていることを確認してください
- **監視**: 監視ツールを使用して転送レートとパフォーマンスを追跡してください
- **バージョン要件**: これらの機能にはDoris 3.1.0以降が必要です
