---
{
    "title": "Apache Doris での IAM Assume Role の仕組み",
    "language": "ja",
    "description": "Apache Doris が AWS IAM Assume Role を使用して S3 へのアクセスを認証する仕組みを説明します。長期有効な AK/SK 認証情報を STS の一時的な認証情報に置き換え、クラウドリソースに安全にアクセスします。",
    "keywords": [
        "Apache Doris",
        "AWS IAM",
        "Assume Role",
        "STS の一時的な認証情報",
        "S3 認証",
        "Doris から S3 へのアクセス",
        "AK/SK の置き換え",
        "IAM Role",
        "External ID",
        "EC2 Instance Profile",
        "信頼関係",
        "最小権限の原則",
        "バケットへのアクセス",
        "S3 Load",
        "Storage Vault"
    ]
}
---

# Apache Doris での IAM Assume Role の仕組み

<!-- Knowledge type: Architecture principle / Authentication mechanism description -->
<!-- Applicable scenarios: Security compliance refactor / Replacing long-term AK/SK credentials / Cross-account S3 access -->

このドキュメントでは、Apache Doris が AWS IAM Assume Role の仕組みを利用して S3 リソースにアクセスする方法を説明します。従来の AK/SK 方式と比較した利点、STS の一時的な認証情報を使った認証フロー、EC2 にデプロイした Doris との連携を取り上げます。

## 適用シナリオ

| シナリオ | 説明 |
|------|------|
| 長期有効な AK/SK 認証情報の置き換え | STS の動的な一時的認証情報を使用し、ハードコードされたキーの漏洩リスクをなくす |
| アカウントをまたぐ S3 アクセス | ソースアカウントのエンティティがターゲットアカウントのロールを引き受け、External ID によって安全に分離する |
| 最小権限のコンプライアンス監査 | ロールベースで権限を付与し、AWS が個々の操作主体と操作の監査証跡を提供する |
| EC2 にデプロイした Doris クラスター | FE/BE ノードが EC2 Instance Profile を通じて自動的に Assume Role を実行する |

## 前提条件

- Apache Doris **3.0.6 以降**（S3 Load、TVF、Export、Resource、Repository、Storage Vault などの機能が Assume Role に対応）
- FE と BE のプロセスを、IAM Role が関連付けられた AWS EC2 インスタンスにデプロイしていること
- ソースアカウントとターゲットアカウントの IAM ロールおよび信頼関係を設計済みであること
- STS サービスにアクセスできること

## 1. 従来の AK/SK 方式で AWS リソースにアクセスする場合の問題

<!-- Knowledge type: Background analysis -->

固定の AK/SK を使用するアクセス方式には、キー管理、監査での追跡可能性、権限制御の面で大きな弱点があります。

| リスクの種類 | 具体的な問題 |
|----------|----------|
| **長期にわたる漏洩リスク** | 固定の AK/SK を設定ファイルにハードコードする必要がある。コードの公開、誤ったコミット、悪意ある窃取などで漏洩すると、攻撃者はキーの所有者と同等のすべての権限を永続的に取得し、データ漏洩、リソースの改ざん、金銭的損失のリスクが続く |
| **監査上の死角** | 複数のユーザーやサービスが同じキーを共有すると、クラウドの操作ログにはキーの ID しか記録されず、操作を特定のユーザーに結び付けられないため、実際の責任者や業務モジュールを追跡できない |
| **高い運用コスト** | キーのローテーションは非常に困難。業務モジュールごとのキーを手動で更新する必要があり、ミスやサービス停止を招きやすい |
| **権限制御の不足** | アカウント単位の大まかな権限付与では、サービスやインスタンスごとの最小権限の要件を満たせない |

## 2. AWS IAM Assume Role の仕組み

<!-- Knowledge type: Concept definition -->

### 2.1 AWS IAM Assume Role とは

AWS Assume Role は、信頼されたエンティティ（IAM ユーザー、EC2 インスタンス、外部アカウントなど）が STS（Security Token Service）を通じてターゲットロールの権限を一時的に取得できる、安全な ID 切り替えの仕組みです。処理の流れは次のとおりです。

![AWS IAM Assume Role のフロー図](/images/integrations/aws_iam_role_flow.png)

### 2.2 AWS IAM Assume Role を使用する利点

- **動的なトークンの仕組み**：永続的な認証情報を、有効期間が 15 分から 12 時間の一時的な認証情報に置き換える
- **アカウント間の安全な分離**：External ID を使用してアカウント間を安全に分離し、AWS コンソールから監査できる
- **最小権限の原則**：最小権限の原則に従い、ロールベースでアクセスを制御する

### 2.3 AWS IAM Assume Role による S3 バケットへのアクセス認証フロー

<!-- Knowledge type: Operation flow / Authentication flow -->

認証フロー全体は、ソースユーザーの ID 検証、ターゲットロールの権限の有効化、リソース操作の実行という三つの段階で構成されます。

![IAM Role による S3 バケットへのアクセス認証フロー](/images/integrations/iam_role_access_bucket.png)

#### ステージ 1：ソースユーザーの ID 検証

1. **権限ポリシーの確認**
    - ソースユーザーが AssumeRole リクエストを開始すると、ソースアカウントの IAM ポリシーエンジンは、まずそのユーザーに `sts:AssumeRole` アクションの実行権限があるかどうかを確認します。
    - 確認の根拠：ソースユーザーの ID にアタッチされた IAM Permissions Policies

2. **信頼関係の検証**
    - STS を通じてターゲットアカウントにリクエストを送り、ソースユーザーがターゲットロールの信頼ポリシーの許可リストに含まれるかどうかを確認します。
    - 確認の根拠：ターゲットロールに関連付けられた IAM Trust Relationships Policies（そのロールを引き受けられるアカウントやユーザーを明示的に指定）

#### ステージ 2：ターゲットロールの権限の有効化

3. **一時的な認証情報の生成**

    信頼関係の検証に成功すると、STS は次の三つの要素からなる一時的な認証情報を生成します。

    ```json
    {
        "AccessKeyId": "***",
        "SecretAccessKey": "***",
        "SessionToken": "***"
    }
    ```

    認証情報の有効期間は 15 分から 12 時間です。

4. **ターゲットロールの権限の検証**
    - ターゲットロールが一時的な認証情報を使用して S3 にアクセスする前に、ターゲットアカウントの IAM ポリシーエンジンは、要求された S3 アクション（`s3:GetObject` や `s3:PutObject` など）をそのロールが実行できるかどうかを確認します。
    - 確認の根拠：ターゲットロールにアタッチされた IAM Permissions Policies（そのロールに許可される操作を定義）

#### ステージ 3：リソース操作の実行

5. **バケットへのアクセス**：すべての検証に成功すると、ターゲットロールは S3 API 操作を実行できます。

## 3. Doris での AWS IAM Assume Role の利用

<!-- Knowledge type: Integration solution -->
<!-- Applicable scenarios: Configuring STS authentication for Doris on EC2 clusters -->

### 3.1 連携の仕組み

Doris は、FE と BE のプロセスを実行する AWS EC2 インスタンスをソースアカウントに関連付けることで、AWS IAM Assume Role 機能を利用します。主な流れを次の図に示します。

![Doris と IAM Role の連携フロー](/images/integrations/doris_iam_role.png)

設定後、Doris の FE と BE のプロセスは EC2 インスタンスのプロファイルを自動的に取得し、Assume Role を実行してバケットにアクセスします。クラスターをスケールアウトする際、BE ノードは新しい EC2 インスタンスそれぞれに IAM Role が関連付けられているかどうかを自動的に確認し、設定漏れを防ぎます。

### 3.2 対応機能

S3 Load、TVF、Export、Resource、Repository、Storage Vault などの Doris の機能は、**3.0.6 以降**で AWS Assume Role 方式に対応しています。これらの機能の SQL 文を実行するときに接続が確認されます。

### 3.3 SQL の設定例

次の例では、S3 Repository を作成します。

```sql
CREATE REPOSITORY `s3_repo`
WITH S3 ON LOCATION "s3://bucket/path/"
PROPERTIES (
  "s3.role_arn" = "arn:aws:iam::1234567890:role/doris-s3-role",
  "s3.external_id" = "doris-external-id",
  "timeout" = "3600"
);
```

主なパラメータ：

| パラメータ | 必須 | 説明 |
|------|------|------|
| `s3.role_arn` | はい | AWS IAM Account2 の IAM Role2 の ARN |
| `s3.external_id` | いいえ | IAM Trust Relationships Policies で設定した externalId の値 |
| `timeout` | いいえ | 操作のタイムアウト（秒） |

その他の機能での SQL 文の詳しい使い方については、[AWS の認証と認可](../../../admin-manual/auth/integrations/aws-authentication-and-authorization#assumed-role-authentication-and-authorization)を参照してください。
