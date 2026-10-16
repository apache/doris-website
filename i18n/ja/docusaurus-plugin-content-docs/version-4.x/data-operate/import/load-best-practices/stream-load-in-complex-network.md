---
{
    "title": "複雑なネットワーク環境における Stream Load の実践",
    "language": "ja",
    "description": "パブリッククラウド、プライベートクラウド、Kubernetes のクラスタ間でのデータ取り込みなど、複雑なネットワーク環境で Doris Stream Load を使用する方法。複数エンドポイントの設定と Group Commit のスケジューリングについて説明します。",
    "keywords": [
        "Stream Load",
        "Group Commit",
        "複雑なネットワーク",
        "パブリッククラウドからのデータ取り込み",
        "Kubernetes でのデータ取り込み",
        "VPC 間のクラスタ接続",
        "ロードバランサー",
        "public_endpoint",
        "private_endpoint",
        "redirect-policy"
    ]
}
---

<!-- Knowledge type: architecture decision + operational steps -->
<!-- Applicable scenarios: data ingestion configuration in public cloud / private cloud / Kubernetes cross-cluster environments -->

パブリッククラウド、プライベートクラウド、Kubernetes のクラスタ間デプロイメントなど、複雑なネットワーク環境では、データの取り込みに固有の課題があります。ロードバランサー（LB）とネットワーク分離（VPC 内通信と外部アクセス）は、リクエストのルーティングの柔軟性とバッチ処理の効率の両方に影響します。

Apache Doris は、次の二つの機能でこれらの課題に対応します。

- **Stream Load の複数エンドポイント対応**：BE ノードに複数のネットワークエンドポイントを柔軟に設定できます。
- **Group Commit の LB スケジューリング最適化**：ロードバランサーを経由したリクエストも効率的にバッチ処理できます。

> バージョン要件：Doris 3.1.0 以降が必要です。

## 背景

### Stream Load

Stream Load は、JSON や CSV などの形式に対応する、HTTP ベースのデータ取り込み方式です。プッシュ型の方式であり、クライアントは MySQL プロトコルを経由せず、HTTP リクエストで BE ノードに直接データを送信します。この設計により、高い同時実行性、低レイテンシー、高スループットを実現できるため、小規模なバッチを高頻度で書き込むシナリオに適しています。

### Group Commit

Group Commit は、サーバー側で複数の小さなリクエストを大きなバッチ処理にまとめ、ディスク I/O、ロック競合、Compaction のオーバーヘッドを減らすことでスループットを最適化します。最大限の効率を得るには、同じテーブルへのリクエストを同じ BE ノードにルーティングする必要があります。

### 複雑なネットワーク環境における主な課題

クラウド環境では、ロードバランサーがリクエストを BE ノードにランダムに分散するため、Group Commit が依存する「ノードへのアフィニティ」が失われます。その結果、同じテーブルへのリクエストが異なるノードに分散します。テストでは、この影響によって高い同時実行性が求められるシナリオでスループットが 20-50% 低下することが示されています。

## Stream Load の複数エンドポイント対応

<!-- Knowledge type: configuration parameters -->

### BE アドレスの三種類

Doris の BE ノードは、異なるネットワークアクセスのシナリオに対応するため、次の三種類のアドレスをサポートします。

| アドレスの種類       | 用途                                             | 例                    |
| -------------------- | ------------------------------------------------------ | --------------------- |
| `be_host`            | クラスタ内部の通信                               | `192.168.1.1:9050`    |
| `public_endpoint`    | 外部のパブリックネットワークからのアクセス（LB またはパブリック IP 経由） | `11.10.20.12:8010`    |
| `private_endpoint`   | VPC 内または Kubernetes Service IP 経由のアクセス | `10.10.10.9:8020`     |

### BE エンドポイントの設定

SQL 文を使用して、BE ノードのエンドポイント情報を追加または変更します。

```sql
-- Add a BE node and configure its endpoints
ALTER SYSTEM ADD BACKEND '192.168.1.1:9050' PROPERTIES(
    'tag.public_endpoint' = '11.10.20.12:8010',
    'tag.private_endpoint' = '10.10.10.9:8020'
);

-- Modify the endpoints of an existing BE node
ALTER SYSTEM MODIFY BACKEND '192.168.1.1:9050' SET (
    'tag.public_endpoint' = '11.10.20.12:8010',
    'tag.private_endpoint' = '10.10.10.9:8020'
);
```

### リダイレクトポリシー（redirect-policy）

Stream Load リクエストに `redirect-policy` HTTP ヘッダーを設定すると、リクエストの転送先エンドポイントを制御できます。

| ポリシー        | 動作                              | 適用シナリオ                              |
| ------------- | ------------------------------------- | ------------------------------------------------- |
| `direct`      | `be_host` に転送する                   | 内部の低レイテンシー通信、Pod 間通信       |
| `public`      | `public_endpoint` に転送する           | 外部のパブリックネットワークからのアクセス |
| `private`     | `private_endpoint` に転送する          | VPC 内またはクラスタ間のアクセス           |
| デフォルト（空） | ホスト名に基づいてエンドポイントを自動選択する | 一般的なシナリオ |

`redirect-policy` を明示的に設定しない場合、FE は次の順序でエンドポイントを自動的に選択します。

1. リクエストのホスト名が `public_endpoint` のホスト名と一致する場合は、`public_endpoint` に転送します。
2. それ以外で `private_endpoint` が設定されている場合は、`private_endpoint` に転送します。
3. いずれにも該当しない場合は、`be_host` にフォールバックします。

### リクエストの例

```bash
curl --location-trusted -u user:pass \
    -H "redirect-policy: private" \
    -T data.csv \
    http://doris.example.com:8030/api/db_name/table_name/_stream_load
```

### 動作の仕組み

1. クライアントが FE に Stream Load リクエストを送信します。リクエストには必要に応じて `redirect-policy` ヘッダーを付けます。
2. FE はポリシーに従い、BE アドレスプールから転送先アドレスを選択します。
3. FE は、選択したエンドポイントを指す HTTP リダイレクト応答を返します。

## Group Commit の LB スケジューリング最適化

<!-- Knowledge type: architecture mechanism -->

### 二段階の転送の仕組み

ロードバランサーを経由する場合も Group Commit の効率を維持するために、Doris は二段階の転送の仕組みを実装しています。

**第 1 段階：FE によるリダイレクト**

- FE は `redirect-policy` に従って適切なエンドポイントを選択します。
- FE は対象テーブルを処理する BE ノードを決定します。
- リクエストは LB を経由するようにリダイレクトされ、LB が BE ノードにランダムに振り分けます。

**第 2 段階：BE による転送**

- リクエストを受け取った BE（BE1）が、そのテーブルに指定されたノードではないことがあります。
- その場合、BE1 は `be_host` を介して、適切な BE（BE2）にリクエストを内部転送します。
- これにより、同じテーブルへのすべてのリクエストが同じノードに到達します。

### Group Commit を有効にしたリクエストの例

対応する Group Commit モードを有効にするには、リクエストヘッダーに `group_commit` パラメーターを追加します。

```bash
curl --location-trusted -u user:pass \
    -H "redirect-policy: private" \
    -H "group_commit: async_mode" \
    -T data.csv \
    http://doris.example.com:8030/api/db_name/table_name/_stream_load
```

### パフォーマンス

二段階の転送で生じるオーバーヘッドは小さく（ミリ秒単位）、一方で Group Commit によるバッチ処理の最適化は、高い同時実行性が求められるシナリオでスループットを 20-50% 向上させる可能性があります。

## 代表的なユースケース

<!-- Applicable scenarios: endpoint and Group Commit combinations for different business forms -->

| シナリオ                | 設定                                       | 利点                              |
| ----------------------- | --------------------------------------------------- | ------------------------------------- |
| リアルタイムのログ取り込み | Group Commit と複数エンドポイント                       | 高スループットと柔軟なルーティング    |
| クラウドネイティブ BI     | `public_endpoint` を介した外部アクセス               | 外部ユーザーの安全なアクセス          |
| Kubernetes のクラスタ間データ取り込み | `private_endpoint` と Pod / Service IP の組み合わせ   | 効率的なクラスタ間通信                |

## 注意事項

- **設定計画**：エンドポイントのアドレスが正しく設定されていることを確認してください。特に Kubernetes 環境では、Service / Pod の IP 設計と一致させる必要があります。
- **監視**：監視ツールを使用して転送率とパフォーマンス指標を追跡し、二段階の転送のヒット率に注意してください。
- **バージョン要件**：Doris 3.1.0 以降が必要です。

## FAQ

**Q1：`public_endpoint` と `private_endpoint` はいつ設定する必要がありますか？**

クライアントと BE ノードの間にネットワーク分離がある場合（VPC の内外や Kubernetes クラスタの内外など）は、`public_endpoint`（パブリックネットワークまたは外部からのアクセス用）と `private_endpoint`（内部または VPC からのアクセス用）をそれぞれ設定する必要があります。これにより、異なるネットワーク上のクライアントが BE に正しくアクセスできます。

**Q2：ロードバランサーを経由しても Group Commit は機能しますか？**

はい。二段階の転送の仕組みにより、LB がリクエストをランダムに振り分けても、BE は同じテーブルへのリクエストを同じノードに転送し、Group Commit のバッチ処理による利点を維持します。

**Q3：`redirect-policy` を設定しない場合はどうなりますか？**

FE はリクエストのホスト名に基づいてエンドポイントを自動的に選択します。まず `public_endpoint` との一致を試み、次に `private_endpoint` を選択し、最後に `be_host` にフォールバックします。

**Q4：二段階の転送でレイテンシーは大幅に増加しますか？**

いいえ。BE 間の内部転送で生じるオーバーヘッドはミリ秒単位であり、高い同時実行性のもとで Group Commit がもたらす 20-50% のスループット向上と比べるとわずかです。

## トラブルシューティング

| 症状                                                | 考えられる原因                                                            | 対処方法                                                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| リダイレクト後にクライアントが BE アドレスへアクセスできない | `public_endpoint` / `private_endpoint` が実際のネットワークに合っていない | `ALTER SYSTEM MODIFY BACKEND` でエンドポイントの設定を修正する |
| 高い同時実行性のもとで Stream Load のスループットが期待より低い | Group Commit が有効になっていない、またはリクエストが二段階の転送を経由していない | リクエストヘッダーに `group_commit: async_mode` を追加し、BE 間のネットワーク接続を確認する |
| Kubernetes のクラスタ間データ取り込みが失敗する | `private_endpoint` が未設定、または `redirect-policy` が指定されていない | `private_endpoint` に Pod / Service IP を設定し、`redirect-policy: private` を指定する |
| デフォルトのリダイレクトで誤ったエンドポイントが選択される | ホスト名の照合ルールが想定どおりに一致しない | `redirect-policy: public` または `private` を明示的に指定する |
