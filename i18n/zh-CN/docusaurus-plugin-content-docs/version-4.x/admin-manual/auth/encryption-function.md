---
{
    "title": "加密和脱敏函数",
    "language": "zh-CN",
    "description": "Doris 内置加密、解密、哈希摘要与数据脱敏函数总览，按 AES、SM4、MD5、SM3、SHA、脱敏分类索引。"
}
---

<!-- 知识类型: 函数索引 -->
<!-- 适用场景: 敏感数据加密 / 数据脱敏 / 哈希校验 -->

Doris 内置了一组用于**加密、解密、哈希摘要和数据脱敏**的标量函数，常用于在 SQL 中保护敏感字段（如手机号、身份证号、密码摘要）。本页对这些函数进行分类索引，详细语法、参数和示例请参考各函数对应的 SQL 手册页面。

## 适用场景

| 场景 | 推荐函数 |
| --- | --- |
| 对称加密／解密敏感字段（国际算法） | [AES_ENCRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-encrypt) / [AES_DECRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-decrypt) |
| 对称加密／解密敏感字段（国密算法） | [SM4_ENCRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-encrypt) / [SM4_DECRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-decrypt) |
| 生成不可逆哈希摘要（如密码存储、数据校验） | [MD5](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5)、[MD5SUM](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5sum)、[SM3](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3)、[SM3SUM](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3sum)、[SHA](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha)、[SHA2](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha2) |
| 查询时对手机号、身份证号等字段做脱敏展示 | [DIGITAL_MASKING](../../sql-manual/sql-functions/scalar-functions/string-functions/digital-masking) |

## 函数分类

<!-- 知识类型: 函数分类索引 -->

按算法族分组列出所有内置加密与脱敏函数。

### 对称加密函数

用于对字段进行可逆加密、解密。

| 函数 | 算法族 | 说明 |
| --- | --- | --- |
| [AES_ENCRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-encrypt) | AES（国际标准） | AES 加密 |
| [AES_DECRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-decrypt) | AES（国际标准） | AES 解密 |
| [SM4_ENCRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-encrypt) | SM4（国密） | SM4 加密 |
| [SM4_DECRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-decrypt) | SM4（国密） | SM4 解密 |

### 哈希摘要函数

用于生成定长不可逆摘要，常用于密码存储和数据完整性校验。

| 函数 | 算法族 | 说明 |
| --- | --- | --- |
| [MD5](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5) | MD5 | 计算 MD5 摘要 |
| [MD5SUM](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5sum) | MD5 | 计算 MD5 校验和 |
| [SM3](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3) | SM3（国密） | 计算 SM3 摘要 |
| [SM3SUM](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3sum) | SM3（国密） | 计算 SM3 校验和 |
| [SHA](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha) | SHA | 计算 SHA 摘要 |
| [SHA2](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha2) | SHA-2 | 计算 SHA-2 摘要 |

### 数据脱敏函数

用于在查询输出时对敏感字段进行掩码展示。

| 函数 | 说明 |
| --- | --- |
| [DIGITAL_MASKING](../../sql-manual/sql-functions/scalar-functions/string-functions/digital-masking) | 对数字串（如手机号、银行卡号）进行掩码脱敏 |
