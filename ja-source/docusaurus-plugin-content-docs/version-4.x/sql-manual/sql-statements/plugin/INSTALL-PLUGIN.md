---
{
  "title": "プラグインのインストール",
  "description": "このステートメントはプラグインをインストールするために使用されます。",
  "language": "ja"
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
>  インストールするプラグインパスで、3つのタイプをサポートします：
>   1. zipファイルへの絶対パス
>   2. プラグインディレクトリへの絶対パス
>   3. httpまたはhttpsプロトコルでzipファイルダウンロードパスを指す

## オプションパラメータ

** 1. `[PROPERTIES ("<key>"="<value>", ...)]`**
>  プラグインインストール時にプロパティまたはパラメータを指定するために使用

## 権限制御

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限         | オブジェクト   | 備考            |
|:-----------|:-----|:--------------|
| ADMIN_PRIV | クラスタ全体 | クラスタ全体の管理者権限が必要 |

## 注意事項

.zipファイルと同じ名前のmd5ファイルを配置する必要があることに注意してください。例：http://mywebsite.com/plugin.zip.md5 。内容は.zipファイルのMD5値です。

## 例

- ローカルzipファイルプラグインをインストール：

    ```sql
    INSTALL PLUGIN FROM "/home/users/doris/auditdemo.zip";
    ```
- プラグインをローカルディレクトリにインストールします：

    ```sql
    INSTALL PLUGIN FROM "/home/users/doris/auditdemo/";
    ```
- プラグインのダウンロードとインストール：

    ```sql
    INSTALL PLUGIN FROM "http://mywebsite.com/plugin.zip";
    ```
- プラグインをダウンロードしてインストールし、zipファイルのmd5sum値を設定する：

    ```sql
    INSTALL PLUGIN FROM "http://mywebsite.com/plugin.zip" PROPERTIES("md5sum" = "73877f6029216f4314d712086a146570");
    ```
