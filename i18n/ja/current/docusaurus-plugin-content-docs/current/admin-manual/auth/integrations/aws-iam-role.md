---
{
  "title": "Apache Doris IAM Assume Roleの動作方法",
  "language": "ja",
  "description": "AWS Assume Roleは、信頼されたエンティティ（IAMユーザーやEC2インスタンスなど）が"
}
---
# Apache Doris IAM Assume Roleの動作原理

## 1. 従来のAK/SKによるAWSリソースへのアクセスの問題

### キー管理のジレンマ：
- **長期露出リスク**：静的AK/SKは設定ファイルにハードコーディングされる必要があります。コードリーク、誤提出、悪意のある盗用により一度キーが拡散すると、攻撃者はキー所有者と同等の完全な権限を永続的に取得し、継続的なデータ漏洩、リソース改ざん、財務損失を引き起こす可能性があります；
- **監査の死角**：複数のユーザー/サービスが同じキーセットを共有する場合、クラウド操作ログはキーのアイデンティティのみを記録し、特定のユーザーと関連付けることができないため、真の責任者やビジネスモジュールを追跡することが不可能です；
- **高い運用保守コスト**：キーローテーションは災害です；ビジネスモジュールキーの手動ローテーションが必要で、エラーが発生しやすく、サービス中断を引き起こす可能性があります；
- **制御不能な権限管理**：アカウントレベルの粗粒度認証は、サービス/インスタンスレベルでの最小権限管理要件を満たすことができません。

## 2. AWS IAM Assume Roleメカニズムの概要

### AWS IAM Assume Roleとは？
AWS Assume Roleは、信頼できるエンティティ（IAMユーザー、EC2インスタンス、外部アカウントなど）がSTS（Security Token Service）を通じてターゲットロールの権限を一時的に取得できる、安全なアイデンティティ転送メカニズムです。プロセスは以下の通りです：

![](/images/integrations/aws_iam_role_flow_en.png)

### アクセスにAWS IAM Assume Roleを使用する利点：
- 永続キーではなく動的トークンメカニズム（15分から12時間有効）
- External IDによるクロスアカウントセキュリティ分離、AWSバックエンドサービスによる監査可能
- ロールベースの最小権限原則

### S3バケットにアクセスするためのAWS IAM Assume Role認証プロセス：

![](/images/integrations/iam_role_access_bucket.png)

#### フェーズ1：ソースユーザー認証
1. **権限ポリシーチェック**  
   - ソースユーザーがAssumeRoleリクエストを開始すると、ソースアカウントのIAMポリシーエンジンが最初に検証します：ユーザーはsts:AssumeRoleアクションを呼び出す権限を持っていますか？
   - チェック根拠：ターゲットロールにバインドされたIAM Trust Relationships Policies（どのアカウント/ユーザーがロールを引き受けることが許可されているかを指定）

2. **信頼関係検証**  
   - STSサービスを通じてターゲットアカウントにリクエストを開始：
     - ソースユーザーはターゲットロールの信頼ポリシーのホワイトリストに登録されていますか？
   - チェック根拠：ターゲットロールにバインドされたIAM Trust Relationships Policies（どのアカウント/ユーザーがロールを引き受けることが許可されているかを指定）

#### フェーズ2：ターゲットロール権限の有効化
3. **一時認証情報生成**  
   信頼関係検証が通過すると、STSは3要素の一時認証情報を生成します

   ```json
    {
    "AccessKeyId": "***",
    "SecretAccessKey": "***",
    "SessionToken": "***" // Valid for 15 minutes to 12 hours
    }
   ```
4. **ターゲットロール権限検証**  
   - ターゲットロールが一時認証情報を使用してS3にアクセスする前に、ターゲットアカウントのIAMポリシーエンジンが検証します：そのロールは要求されたS3操作を実行する権限があるか？（例：s3:GetObject、s3:PutObject等）
   - 確認基準：ターゲットロールに関連付けられたIAM Permissions Policies（ロールが実行できる内容を定義）

#### フェーズ3：リソース操作の実行
5. **バケットへのアクセス**  
   すべての検証が通過した後にのみ、ターゲットロールはS3 API操作を実行できます

## 3、DorisにおけるAWS IAM Assume Role認証メカニズムの使用方法
1. DorisはAWS IAM Assume Role機能を使用し、FEおよびBEプロセスによってデプロイされたAWS EC2インスタンスをソースアカウントにバインドします。主なプロセスは以下の図に示されています：

![](/images/integrations/doris_iam_role.png)

2. 設定完了後、Doris FE/BEプロセスは自動的にEC2インスタンスプロファイルを取得し、Assume Role操作を実行してバケットにアクセスします。容量拡張時、BEノードは新しいEC2インスタンスがIAMロールに正常にバインドされているかを自動検出し、不一致を防ぎます；

3. DorisのS3 Load、TVF、Export、Resource、Repository、Storage Vault、およびその他の機能は、バージョン3.0.6以上でAWS Assume Role方式をサポートしています。SQL関連機能の実行時に接続性チェックが実行されます：

   ```sql
   CREATE REPOSITORY `s3_repo`
   WITH S3 ON LOCATION "s3://bucket/path/"
   PROPERTIES (
     "s3.role_arn" = "arn:aws:iam::1234567890:role/doris-s3-role",
     "s3.external_id" = "doris-external-id",
     "timeout" = "3600"
   );
   ```
「s3.role_arn」はAWS IAM Account2のIAM IDに対応し、role2のARN値において、「s3.external_id」はTrust Relationships Policiesで設定されたexternalId値に対応します（オプション）。より詳細なSQL文については、以下を参照してください：
[AWS authentication and authorization](../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication)。
