---
{
  "title": "プラグインをインストール",
  "language": "ja",
  "description": "このステートメントはプラグインをインストールするために使用されます"
}
---
## 説明

このステートメントはプラグインをインストールするために使用されます

## 構文

```sql
INSTALL PLUGIN FROM <source> [PROPERTIES ("<key>"="<value>", ...)]
```
## 必須パラメータ

** 1. `<source>`**
>  インストールするプラグインパス、3つのタイプをサポート：
>   1. zipファイルへの絶対パス
>   2. プラグインディレクトリへの絶対パス
>   3. httpまたはhttpsプロトコルでzipファイルダウンロードパスを指定

## オプションパラメータ

** 1. `[PROPERTIES ("<key>"="<value>", ...)]`**
>  プラグインをインストールする際にプロパティまたはパラメータを指定するために使用

## 権限制御

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限         | オブジェクト   | 備考            |
|:-----------|:-----|:--------------|
| ADMIN_PRIV | クラスタ全体 | クラスタ全体の管理者権限が必要 |

## 注意事項

.zipファイルと同名のmd5ファイルを配置する必要があります。例：http://mywebsite.com/plugin.zip.md5 。内容は.zipファイルのMD5値です。

## 例

- ローカルzipファイルプラグインをインストール：

    ```sql
    INSTALL PLUGIN FROM "/home/users/doris/auditdemo.zip";
    ```
- プラグインをローカルディレクトリにインストールします：

    ```sql
    INSTALL PLUGIN FROM "/home/users/doris/auditdemo/";
    ```
- プラグインをダウンロードしてインストールする：

    ```sql
    INSTALL PLUGIN FROM "http://mywebsite.com/plugin.zip";
    ```
- プラグインをダウンロードしてインストールし、zipファイルのmd5sum値を設定します：

    ```sql
    INSTALL PLUGIN FROM "http://mywebsite.com/plugin.zip" PROPERTIES("md5sum" = "73877f6029216f4314d712086a146570");
    ```
