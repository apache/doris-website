---
{
  "title": "CUT_TO_FIRST_SIGNIFICANT_SUBDOMAIN",
  "description": "CUTTOFIRSTSIGNIFICANTSUBDOMAIN関数は、URLからドメインの有効部分を抽出します、",
  "language": "ja"
}
---
## 説明

CUT_TO_FIRST_SIGNIFICANT_SUBDOMAIN関数は、URLからドメインの有効部分を抽出します。これには、トップレベルドメインから「最初の重要なサブドメイン」までが含まれます。入力URLが無効な場合は、空文字列を返します。

## 構文

```sql
CUT_TO_FIRST_SIGNIFICANT_SUBDOMAIN(<url>)
```
## パラメータ
| Parameter | デスクリプション                                   |
| --------- | --------------------------------------------- |
| `<url>` | 処理対象のURL文字列。型: VARCHAR |

## Return Value

VARCHAR型を返し、抽出されたドメイン部分を表します。

特殊なケース:
- urlがNULLの場合、NULLを返します
- urlが有効なドメイン形式でない場合、空文字列を返します

## Examples

1. 基本的なドメイン処理

```sql
SELECT cut_to_first_significant_subdomain('www.baidu.com');
```
```text
+-----------------------------------------------------+
| cut_to_first_significant_subdomain('www.baidu.com') |
+-----------------------------------------------------+
| baidu.com                                           |
+-----------------------------------------------------+
```
2. マルチレベルドメイン処理

```sql
SELECT cut_to_first_significant_subdomain('www.google.com.cn');
```
```text
+---------------------------------------------------------+
| cut_to_first_significant_subdomain('www.google.com.cn') |
+---------------------------------------------------------+
| google.com.cn                                           |
+---------------------------------------------------------+
```
3. 無効なドメイン処理

```sql
SELECT cut_to_first_significant_subdomain('wwwwwwww');
```
```text
+------------------------------------------------+
| cut_to_first_significant_subdomain('wwwwwwww') |
+------------------------------------------------+
|                                                |
+------------------------------------------------+
```
