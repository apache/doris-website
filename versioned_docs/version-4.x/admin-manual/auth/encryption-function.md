---
{
    "title": "Encryption and Masking Functions",
    "language": "en",
    "description": "Overview of Doris built-in encryption, decryption, hash digest, and data masking functions, indexed by AES, SM4, MD5, SM3, SHA, and masking categories."
}
---

<!-- Knowledge type: Function index -->
<!-- Applicable scenarios: Sensitive data encryption / Data masking / Hash verification -->

Doris provides a set of built-in scalar functions for **encryption, decryption, hash digest, and data masking**, commonly used in SQL to protect sensitive fields such as phone numbers, ID numbers, and password digests. This page indexes these functions by category. For detailed syntax, parameters, and examples, refer to the corresponding SQL manual page for each function.

## Applicable Scenarios

| Scenario | Recommended Function |
| --- | --- |
| Symmetric encryption/decryption of sensitive fields (international algorithm) | [AES_ENCRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-encrypt) / [AES_DECRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-decrypt) |
| Symmetric encryption/decryption of sensitive fields (Chinese national algorithm) | [SM4_ENCRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-encrypt) / [SM4_DECRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-decrypt) |
| Generate irreversible hash digests (such as password storage or data verification) | [MD5](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5), [MD5SUM](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5sum), [SM3](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3), [SM3SUM](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3sum), [SHA](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha), [SHA2](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha2) |
| Mask fields such as phone numbers and ID numbers in query output | [DIGITAL_MASKING](../../sql-manual/sql-functions/scalar-functions/string-functions/digital-masking) |

## Function Categories

<!-- Knowledge type: Function category index -->

All built-in encryption and masking functions are listed below, grouped by algorithm family.

### Symmetric Encryption Functions

Used to perform reversible encryption and decryption on fields.

| Function | Algorithm Family | Description |
| --- | --- | --- |
| [AES_ENCRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-encrypt) | AES (international standard) | AES encryption |
| [AES_DECRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-decrypt) | AES (international standard) | AES decryption |
| [SM4_ENCRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-encrypt) | SM4 (Chinese national standard) | SM4 encryption |
| [SM4_DECRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-decrypt) | SM4 (Chinese national standard) | SM4 decryption |

### Hash Digest Functions

Used to generate fixed-length, irreversible digests, commonly used for password storage and data integrity verification.

| Function | Algorithm Family | Description |
| --- | --- | --- |
| [MD5](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5) | MD5 | Compute MD5 digest |
| [MD5SUM](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5sum) | MD5 | Compute MD5 checksum |
| [SM3](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3) | SM3 (Chinese national standard) | Compute SM3 digest |
| [SM3SUM](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3sum) | SM3 (Chinese national standard) | Compute SM3 checksum |
| [SHA](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha) | SHA | Compute SHA digest |
| [SHA2](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha2) | SHA-2 | Compute SHA-2 digest |

### Data Masking Functions

Used to display sensitive fields with masking in query output.

| Function | Description |
| --- | --- |
| [DIGITAL_MASKING](../../sql-manual/sql-functions/scalar-functions/string-functions/digital-masking) | Mask numeric strings such as phone numbers and bank card numbers |
