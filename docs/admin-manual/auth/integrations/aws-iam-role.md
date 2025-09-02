---
{
    "title": "Introduction to Apache Doris IAM Assume Role",
    "language": "en"
}
---

# A New Paradigm for Cloud Data Security: Apache Doris IAM Assume Role Unlocks Keyless Access to AWS S3 Data

## 1. Issues with Traditional AK/SK Access to AWS Resources

### Key Management Dilemma:
- **Long-Term Exposure Risk**：Static AK/SK must be hard-coded in configuration files. Once the key is spread due to code leaks, mis-submissions, or malicious theft, an attacker can permanently gain full permissions equivalent to the key owner, leading to ongoing data leaks, resource tampering, and financial losses;
- **Audit Blind Spot**：When multiple users/services share the same key set, cloud operation logs only record the key identity and cannot be associated with specific users, making it impossible to trace the true responsible individuals or business modules;
- **High Operational and Maintenance Cost**：Key rotation is a disaster; manual rotation of business module keys is required, which is prone to errors and triggering service interruptions;
- **Uncontrolled Permission Management**：Account-level, coarse-grained authorization fails to meet the requirements for least privilege management at the service/instance level.

## 2. Introduction to the AWS IAM Assume Role Mechanism

### What is AWS IAM Assume Role?
AWS Assume Role is a secure identity transfer mechanism that allows a trusted entity (such as an IAM user, EC2 instance, or external account) to temporarily obtain the permissions of a target role through STS (Security Token Service). The process is as follows:

![](/images/integrations/aws_iam_role_flow_en.png)

### Advantages of using AWS IAM Assume Role for access:
- Dynamic token mechanism (valid for 15 minutes to 12 hours) instead of permanent keys
- Cross-account security isolation through External IDs, auditable by AWS backend services
- Role-based principle of least privilege

### AWS IAM Assume Role authentication process for accessing an S3 bucket:

![](/images/integrations/iam_role_access_bucket.png)

#### Phase 1: Source User Authentication
1. **Permission Policy Check**  
   - When a source user initiates an AssumeRole request, the source account's IAM policy engine first verifies: Is the user authorized to call the sts:AssumeRole action?
   - Check basis: IAM Trust Relationships Policies bound to the target role (specifying which accounts/users are allowed to assume the role)

2. **Trust Relationship Verification**  
   - Initiate a request to the target account through the STS service:
     - Is the source user whitelisted in the target role's trust policy?
   - Check basis: IAM Trust Relationships Policies bound to the target role (specifying which accounts/users are allowed to assume the role)

#### Phase 2: Activating target role permissions
3. **Temporary Credential Generation**  
   If the trust relationship verification passes, STS generates three-factor temporary credentials
   ```json
    {
    "AccessKeyId": "***",
    "SecretAccessKey": "***",
    "SessionToken": "***" // Valid for 15 minutes to 12 hours
    }
   ```

4. **Target Role Permission Verification**  
   - Before the target role uses the temporary credentials to access S3, the target account's IAM policy engine verifies: Is the role authorized to perform the requested S3 operation? (e.g., s3:GetObject, s3:PutObject, etc.)
   - Check basis: IAM Permissions Policies attached to the target role (defining what the role can do)

#### Phase 3: Executing Resource Operations
5. **Accessing the Bucket**  
   Only after all verifications are passed can the target role perform S3 API operations

## 3、How Doris Uses the AWS IAM Assume Role Authentication Mechanism
1. Doris uses the AWS IAM Assume Role feature by binding the AWS EC2 instances deployed by the FE and BE processes to the source account. The main process is shown in the following figure:

![](/images/integrations/doris_iam_role.png)

2. After configuration is complete, the Doris FE/BE processes automatically obtain the EC2 instance profile and perform the Assume Role operation to access the bucket. During capacity expansion, the BE node will automatically detect whether the new EC2 instance is successfully bound to the IAM role to prevent mismatches;

3. Doris's S3 Load, TVF, Export, Resource, Repository, Storage Vault, and other functions support the AWS Assume Role method in versions 3.0.6 and above. Connectivity checks will be performed when executing SQL-related functions:
   ```sql
   CREATE REPOSITORY `s3_repo`
   WITH S3 ON LOCATION "s3://bucket/path/"
   PROPERTIES (
     "s3.role_arn" = "arn:aws:iam::1234567890:role/doris-s3-role",
     "s3.external_id" = "doris-external-id",
     "timeout" = "3600"
   );
   ```
Where "s3.role_arn" corresponds to the IAM ID in AWS IAM Account2 In the ARN value for role2, "s3.external_id" corresponds to the externalId value configured in the Trust Relationships Policies (optional). For more detailed SQL statements, see:
[AWS authentication and authorization](../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication).