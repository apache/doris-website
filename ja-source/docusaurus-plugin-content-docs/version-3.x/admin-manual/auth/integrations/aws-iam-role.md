---
{
  "title": "Apache Doris IAM Assume Roleの動作方法",
  "language": "ja",
  "description": "AWS Assume Roleは、信頼されたエンティティ（IAMユーザーやEC2インスタンスなど）が"
}
---
# Apache Doris IAM Assume Role の仕組み

## 1. AWS リソースへの従来の AK/SK アクセスの問題

### キー管理のジレンマ:
- **長期間の露出リスク**：静的な AK/SK は設定ファイルにハードコーディングする必要があります。コードリーク、誤った送信、または悪意のある盗難によってキーが拡散すると、攻撃者はキー所有者と同等の完全な権限を永続的に取得でき、継続的なデータリーク、リソースの改ざん、および金銭的損失につながります；
- **監査の死角**：複数のユーザー/サービスが同じキーセットを共有する場合、クラウド操作ログはキー ID のみを記録し、特定のユーザーと関連付けることができないため、真の責任者やビジネスモジュールを追跡することが不可能です；
- **高い運用保守コスト**：キーローテーションは災難です；ビジネスモジュールキーの手動ローテーションが必要で、エラーが発生しやすく、サービス中断を引き起こす可能性があります；
- **制御不能な権限管理**：アカウントレベルの粗粒度認可は、サービス/インスタンスレベルでの最小権限管理の要件を満たすことができません。

## 2. AWS IAM Assume Role メカニズムの紹介

### AWS IAM Assume Role とは？
AWS Assume Role は、信頼されたエンティティ（IAM ユーザー、EC2 インスタンス、または外部アカウントなど）が STS（Security Token Service）を通じて対象ロールの権限を一時的に取得することを可能にする、セキュアな ID 転送メカニズムです。プロセスは以下の通りです：

![](/images/integrations/aws_iam_role_flow_en.png)

### アクセスに AWS IAM Assume Role を使用する利点：
- 永続的なキーの代わりに動的トークンメカニズム（15分から12時間有効）
- External ID による アカウント間セキュリティ分離、AWS バックエンドサービスによる監査可能性
- ロールベースの最小権限の原則

### S3 バケットにアクセスするための AWS IAM Assume Role 認証プロセス：

![](/images/integrations/iam_role_access_bucket.png)

#### フェーズ 1: ソースユーザー認証
1. **権限ポリシーチェック**  
   - ソースユーザーが AssumeRole リクエストを開始すると、ソースアカウントの IAM ポリシーエンジンがまず検証します：ユーザーは sts:AssumeRole アクションを呼び出す権限があるか？
   - チェック根拠：対象ロールにバインドされた IAM Trust Relationships Policies（どのアカウント/ユーザーがロールを引き受けることを許可されているかを指定）

2. **信頼関係の検証**  
   - STS サービスを通じて対象アカウントへのリクエストを開始：
     - ソースユーザーは対象ロールの信頼ポリシーでホワイトリストに登録されているか？
   - チェック根拠：対象ロールにバインドされた IAM Trust Relationships Policies（どのアカウント/ユーザーがロールを引き受けることを許可されているかを指定）

#### フェーズ 2: 対象ロール権限のアクティベーション
3. **一時認証情報の生成**  
   信頼関係の検証が通過すると、STS は三要素の一時認証情報を生成します

   ```json
    {
    "AccessKeyId": "***",
    "SecretAccessKey": "***",
    "SessionToken": "***" // Valid for 15 minutes to 12 hours
    }
   ```
4. **ターゲットロール権限の検証**  
   - ターゲットロールが一時的な認証情報を使用してS3にアクセスする前に、ターゲットアカウントのIAMポリシーエンジンが検証します：このロールは要求されたS3操作を実行する権限があるか？（例：s3:GetObject、s3:PutObject など）
   - チェック根拠：ターゲットロールにアタッチされたIAM Permissions Policies（ロールが実行できることを定義）

#### フェーズ3：リソース操作の実行
5. **バケットへのアクセス**  
   すべての検証が通過した後のみ、ターゲットロールはS3 API操作を実行できます

## 3、DorisがAWS IAM Assume Role認証メカニズムを使用する方法
1. DorisはFEおよびBEプロセスがデプロイされたAWS EC2インスタンスをソースアカウントにバインドすることで、AWS IAM Assume Role機能を使用します。主要なプロセスは以下の図に示されています：

![](/images/integrations/doris_iam_role.png)

2. 設定完了後、Doris FE/BEプロセスは自動的にEC2インスタンスプロファイルを取得し、Assume Role操作を実行してバケットにアクセスします。容量拡張時、BEノードは新しいEC2インスタンスがIAMロールに正常にバインドされているかどうかを自動的に検出し、不一致を防止します；

3. DorisのS3 Load、TVF、Export、Resource、Repository、Storage Vault、およびその他の機能は、バージョン3.0.6以上でAWS Assume Role方式をサポートします。SQL関連機能の実行時に接続性チェックが実行されます：

   ```sql
   CREATE REPOSITORY `s3_repo`
   WITH S3 ON LOCATION "s3://bucket/path/"
   PROPERTIES (
     "s3.role_arn" = "arn:aws:iam::1234567890:role/doris-s3-role",
     "s3.external_id" = "doris-external-id",
     "timeout" = "3600"
   );
   ```
ここで、「s3.role_arn」は AWS IAM Account2 の IAM ID に対応し、role2 の ARN 値において、「s3.external_id」は Trust Relationships Policies で設定された externalId 値に対応します（オプション）。より詳細な SQL ステートメントについては、以下を参照してください：
[AWS authentication and authorization](../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication)。
