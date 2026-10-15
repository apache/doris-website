---
{
    "title": "CUT_TO_FIRST_SIGNIFICANT_SUBDOMAIN",
    "language": "ja",
    "description": "CUT_TO_FIRST_SIGNIFICANT_SUBDOMAIN 関数は、URL から、トップレベルドメインから最初の有意なサブドメインまでを含むドメインの有効な部分を抽出します。"
}
---

## 説明

CUT_TO_FIRST_SIGNIFICANT_SUBDOMAIN 関数は、URL から、トップレベルドメインから「最初の有意なサブドメイン」までを含むドメインの有効な部分を抽出します。入力 URL が無効な場合は、空文字列を返します。

## 構文

```sql
CUT_TO_FIRST_SIGNIFICANT_SUBDOMAIN(<url>)
```

## パラメータ
| パラメータ | 説明                                   |
| --------- | --------------------------------------------- |
| `<url>` | 処理する URL 文字列。型: VARCHAR |

## 戻り値

抽出したドメイン部分を表す VARCHAR 型の値を返します。

特殊なケース:
- url が NULL の場合は、NULL を返します。
- url が有効なドメイン形式でない場合は、空文字列を返します。

## 例

1. 基本的なドメインの処理
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

2. 複数階層のドメインの処理
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

3. 無効なドメインの処理
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
