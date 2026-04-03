---
{
  "title": "複雑なネットワーク環境におけるStream Load",
  "description": "複雑なネットワーク環境におけるStream Loadのベストプラクティス。パブリッククラウド、プライベートクラウド、およびKubernetesクロスクラスターアクセスシナリオを含む。",
  "language": "ja"
}
---
## 概要

パブリッククラウド、プライベートクラウド、Kubernetesクロスクラスターデプロイメントなどの複雑なネットワーク環境では、データインポートが固有の課題に直面します。ロードバランサー（LB）とネットワーク分離（VPC内部/外部アクセス）は、リクエストルーティングの柔軟性とバッチ処理効率の両方に影響を与える可能性があります。

Apache Dorisは、2つの主要な機能を通じてこれらの課題に対処します：
- **Stream Load Multi-Endpoint Support**：BEノードに対する複数のネットワークエンドポイントの柔軟な設定を可能にします
- **Group Commit LB Scheduling 最適化**：リクエストがロードバランサーを通過する場合でも、効率的なバッチ処理を保証します

## 背景

### Stream Load

Stream LoadはHTTPベースのデータインポート方法で、JSON、CSVなどの形式をサポートします。プッシュベースのアプローチとして、クライアントはMySQLプロトコルを迂回してHTTPリクエストを介してBackendノード（BE）に直接データを送信します。この設計により、高い同時実行性、低レイテンシ、高スループットが実現され、小規模バッチで頻繁な書き込みシナリオに最適です。

### Group Commit

Group Commitは、サーバーサイドで複数の小さなリクエストをより大きなバッチ操作に結合することでスループットを最適化し、ディスクI/O、ロック競合、コンパクション オーバーヘッドを削減します。最大の効率を得るため、Group Commitでは同じtableに対するリクエストを同じBEノードにルーティングする必要があります。

### 課題

クラウド環境では、ロードバランサーがBEノード間でリクエストをランダムに分散させます。これによりGroup Commitが必要とする「ノードアフィニティ」が破綻し、同じtableに対するリクエストが異なるノードに散らばってしまいます。テストでは、この問題により高同時実行性シナリオでスループットが20-50%低下する可能性があることが示されています。

## Stream Load Multi-Endpoint Support

### アドレスタイプ

Doris BEノードは、異なるネットワークアクセスシナリオに対応するため、3つのアドレスタイプをサポートします：

| アドレスタイプ | 目的 | 例 |
|-------------|---------|---------|
| `be_host` | 内部クラスター通信 | `192.168.1.1:9050` |
| `public_endpoint` | LBまたはパブリックIPを介した外部パブリックアクセス | `11.10.20.12:8010` |
| `private_endpoint` | VPC内またはKubernetes Service IPでのプライベートアクセス | `10.10.10.9:8020` |

### 設定

SQLステートメントを使用してエンドポイントを設定します：

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
| `direct` | `be_host`にルーティング | 内部低レイテンシ通信、Pod-to-Pod |
| `public` | `public_endpoint`にルーティング | パブリックネットワーク経由での外部アクセス |
| `private` | `private_endpoint`にルーティング | VPC内部またはクラスター間アクセス |
| デフォルト（空） | ホスト名マッチングに基づいて自動選択 | 一般的な用途 |

**デフォルトの動作：**
1. リクエストのホスト名が`public_endpoint`のホスト名と一致する場合、`public_endpoint`にルーティング
2. そうでない場合、`private_endpoint`が設定されていれば`private_endpoint`にルーティング
3. それ以外の場合、`be_host`にフォールバック

**例：**

```bash
curl --location-trusted -u user:pass \
    -H "redirect-policy: private" \
    -T data.csv \
    http://doris.example.com:8030/api/db_name/table_name/_stream_load
```
### 動作原理

1. Clientがオプションの`redirect-policy`ヘッダーと共にStream Load リクエストをFEに送信する
2. FEがポリシーに基づいてBEのアドレスプールからターゲットアドレスを選択する
3. FEが選択されたエンドポイントへのHTTPリダイレクトレスポンスを返す

## Group Commit LB スケジューリング最適化

### 2フェーズフォワーディング

ロードバランサーの背後でGroup Commitの効率性を維持するため、DorisはTwo-Phase Forwardingメカニズムを実装している：

**Phase 1: FE リダイレクト**
- FEが`redirect-policy`に基づいて適切なエンドポイントを選択する
- FEがターゲットTableを処理すべきBEノードを決定する
- リクエストがLBを通じてリダイレクトされ、LBがランダムにBEノードに配布する

**Phase 2: BE フォワーディング**
- 受信したBE（BE1）がTableの指定ノードでない場合
- BE1が`be_host`経由で正しいBE（BE2）にリクエストを内部的に転送する
- これにより、同じTableへのすべてのリクエストが同じノードに到達することが保証される

### 設定例

```bash
curl --location-trusted -u user:pass \
    -H "redirect-policy: private" \
    -H "group_commit: async_mode" \
    -T data.csv \
    http://doris.example.com:8030/api/db_name/table_name/_stream_load
```
### Performance

二段階転送は最小限のオーバーヘッド（ミリ秒レベル）を導入し、一方でGroup Commitのバッチ処理は高並行性シナリオにおいて20-50%のスループット向上を提供します。

## Use Cases

| シナリオ | 構成 | Benefit |
|----------|--------------|---------|
| リアルタイムログ取り込み | Group Commit + Multi-Endpoint | 柔軟なルーティングによる高スループット |
| Cloud-nativeのBI | `public_endpoint`による外部アクセス | 安全な外部ユーザーアクセス |
| Kubernetesクラスター間通信 | Pod/Service IPを使用した`private_endpoint` | 効率的なクラスター間通信 |

## Considerations

- **構成計画**: 特にKubernetes環境において、エンドポイントアドレスが正しく構成されていることを確認してください
- **監視**: 監視ツールを使用して転送レートとパフォーマンスを追跡してください
- **バージョン要件**: これらの機能にはDoris 3.1.0以降が必要です
