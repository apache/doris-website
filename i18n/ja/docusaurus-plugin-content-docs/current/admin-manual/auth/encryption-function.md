---
{
    "title": "暗号化とマスキングの関数",
    "language": "ja",
    "description": "Doris に組み込まれた暗号化、復号、ハッシュダイジェスト、データマスキングの関数を、AES、SM4、MD5、SM3、SHA、マスキングのカテゴリ別に紹介します。"
}
---

<!-- Knowledge type: Function index -->
<!-- Applicable scenarios: Sensitive data encryption / Data masking / Hash verification -->

Doris は、**暗号化、復号、ハッシュダイジェスト、データマスキング**のための組み込みスカラー関数を提供しています。これらの関数は、電話番号、身分証番号、パスワードダイジェストなどの機密フィールドを SQL で保護するためによく使用されます。このページでは、関数をカテゴリ別に紹介します。構文、パラメータ、使用例の詳細は、各関数の SQL マニュアルページを参照してください。

## 適用シナリオ

| シナリオ | 推奨関数 |
| --- | --- |
| 機密フィールドの対称暗号化・復号（国際標準アルゴリズム） | [AES_ENCRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-encrypt) / [AES_DECRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-decrypt) |
| 機密フィールドの対称暗号化・復号（中国国家標準アルゴリズム） | [SM4_ENCRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-encrypt) / [SM4_DECRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-decrypt) |
| 不可逆なハッシュダイジェストの生成（パスワードの保存やデータの検証など） | [MD5](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5), [MD5SUM](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5sum), [SM3](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3), [SM3SUM](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3sum), [SHA](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha), [SHA2](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha2) |
| クエリ結果に含まれる電話番号や身分証番号などのフィールドのマスキング | [DIGITAL_MASKING](../../sql-manual/sql-functions/scalar-functions/string-functions/digital-masking) |

## 関数のカテゴリ

<!-- Knowledge type: Function category index -->

すべての組み込み暗号化関数とマスキング関数を、アルゴリズムの種類別に以下に示します。

### 対称暗号化関数

フィールドに対して、可逆的な暗号化と復号を行います。

| 関数 | アルゴリズムの種類 | 説明 |
| --- | --- | --- |
| [AES_ENCRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-encrypt) | AES（国際標準） | AES による暗号化 |
| [AES_DECRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-decrypt) | AES（国際標準） | AES による復号 |
| [SM4_ENCRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-encrypt) | SM4（中国国家標準） | SM4 による暗号化 |
| [SM4_DECRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-decrypt) | SM4（中国国家標準） | SM4 による復号 |

### ハッシュダイジェスト関数

固定長で不可逆なダイジェストを生成します。パスワードの保存やデータの整合性検証によく使用されます。

| 関数 | アルゴリズムの種類 | 説明 |
| --- | --- | --- |
| [MD5](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5) | MD5 | MD5 ダイジェストを計算 |
| [MD5SUM](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5sum) | MD5 | MD5 チェックサムを計算 |
| [SM3](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3) | SM3（中国国家標準） | SM3 ダイジェストを計算 |
| [SM3SUM](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3sum) | SM3（中国国家標準） | SM3 チェックサムを計算 |
| [SHA](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha) | SHA | SHA ダイジェストを計算 |
| [SHA2](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha2) | SHA-2 | SHA-2 ダイジェストを計算 |

### データマスキング関数

クエリ結果に含まれる機密フィールドをマスキングして表示します。

| 関数 | 説明 |
| --- | --- |
| [DIGITAL_MASKING](../../sql-manual/sql-functions/scalar-functions/string-functions/digital-masking) | 電話番号や銀行カード番号などの数字列をマスキング |
