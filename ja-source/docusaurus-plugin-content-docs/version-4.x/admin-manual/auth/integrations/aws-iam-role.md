---
{
  "title": "Apache Doris IAM Assume Roleの動作方法",
  "language": "ja",
  "description": "AWS Assume Roleは、信頼されたエンティティ（IAMユーザー、EC2インスタンスなど）が"
}
---
# Apache Doris IAM Assume Roleの動作方法

## 1. AWSリソースへの従来のAK/SKアクセスの問題

### キー管理のジレンマ:
- **長期間の露出リスク**：静的なAK/SKは設定ファイルにハードコードする必要があります。コードリーク、誤提出、または悪意のある盗難によりキーが拡散すると、攻撃者はキー所有者と同等の完全な権限を永続的に取得でき、継続的なデータリーク、リソース改ざん、および経済的損失につながります;
- **監査の死角**：複数のユーザー/サービスが同じキーセットを共有する場合、クラウド運用ログはキーIDのみを記録し、特定のユーザーと関連付けることができないため、真の責任者やビジネスモジュールを追跡することができません;
- **高い運用保守コスト**：キーローテーションは災害です; ビジネスモジュールキーの手動ローテーションが必要で、エラーが発生しやすく、サービス中断を引き起こします;
- **制御不能な権限管理**：アカウントレベルの粗い粒度の認可は、サービス/インスタンスレベルでの最小権限管理の要件を満たしません。

## 2. AWS IAM Assume Roleメカニズムの紹介

### AWS IAM Assume Roleとは？
AWS Assume Roleは、信頼できるエンティティ（IAMユーザー、EC2インスタンス、または外部アカウントなど）がSTS（Security Token Service）を通じて対象ロールの権限を一時的に取得できる安全なIDトランスファーメカニズムです。プロセスは以下の通りです：

![](/images/integrations/aws_iam_role_flow_en.png)

### アクセスにAWS IAM Assume Roleを使用する利点：
- 永続キーではなく動的トークンメカニズム（15分から12時間有効）
- External IDによるクロスアカウントセキュリティ分離、AWSバックエンドサービスによる監査可能
- ロールベースの最小権限の原則

### S3バケットにアクセスするためのAWS IAM Assume Role認証プロセス：

![](/images/integrations/iam_role_access_bucket.png)

#### フェーズ1: ソースユーザー認証
1. **権限ポリシーチェック**  
   - ソースユーザーがAssumeRoleリクエストを開始すると、ソースアカウントのIAMポリシーエンジンが最初に確認します：ユーザーはsts:AssumeRoleアクションを呼び出す権限がありますか？
   - チェック根拠：対象ロールに紐づけられたIAM Trust Relationships Policies（どのアカウント/ユーザーがロールをassumeできるかを指定）

2. **信頼関係の確認**  
   - STSサービスを通じて対象アカウントへのリクエストを開始：
     - ソースユーザーは対象ロールの信頼ポリシーのホワイトリストに登録されていますか？
   - チェック根拠：対象ロールに紐づけられたIAM Trust Relationships Policies（どのアカウント/ユーザーがロールをassumeできるかを指定）

#### フェーズ2: 対象ロール権限の活性化
3. **一時的な認証情報の生成**  
   信頼関係の確認が通過すると、STSは3要素の一時的な認証情報を生成します

   ```json
    {
    "AccessKeyId": "***",
    "SecretAccessKey": "***",
    "SessionToken": "***" // Valid for 15 minutes to 12 hours
    }
   ```
4. **ターゲットロール権限の検証**  
   - ターゲットロールが一時的な認証情報を使用してS3にアクセスする前に、ターゲットアカウントのIAMポリシーエンジンが検証します：ロールは要求されたS3操作を実行する権限を持っているか？（例：s3:GetObject、s3:PutObject等）
   - 確認根拠：ターゲットロールにアタッチされたIAM Permissions Policies（ロールが実行できることを定義）

#### フェーズ3：リソース操作の実行
5. **バケットへのアクセス**  
   すべての検証を通過した後にのみ、ターゲットロールはS3 API操作を実行できます

## 3、DorisにおけるAWS IAM Assume Role認証メカニズムの使用方法
1. DorisはAWS IAM Assume Role機能を使用し、FEおよびBEプロセスによってデプロイされたAWS EC2インスタンスをソースアカウントにバインドします。主な流れは以下の図に示されています：

![](/images/integrations/doris_iam_role.png)

2. 設定完了後、Doris FE/BEプロセスは自動的にEC2インスタンスプロファイルを取得し、Assume Role操作を実行してバケットにアクセスします。容量拡張時、BEノードは新しいEC2インスタンスがIAMロールに正常にバインドされているかを自動検出し、不一致を防止します；

3. DorisのS3 Load、TVF、Export、Resource、Repository、Storage Vault、およびその他の機能は、バージョン3.0.6以降でAWS Assume Role方式をサポートしています。SQL関連機能を実行する際に接続性チェックが実行されます：

   ```sql
   CREATE REPOSITORY `s3_repo`
   WITH S3 ON LOCATION "s3://bucket/path/"
   PROPERTIES (
     "s3.role_arn" = "arn:aws:iam::1234567890:role/doris-s3-role",
     "s3.external_id" = "doris-external-id",
     "timeout" = "3600"
   );
   ```
ここで、"s3.role_arn"はAWS IAM Account2のIAM IDに対応し、role2のARN値において、"s3.external_id"はTrust Relationships Policiesで設定されたexternalId値に対応します（オプション）。より詳細なSQL文については、以下を参照してください：
[AWS authentication and authorization](../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication)。
