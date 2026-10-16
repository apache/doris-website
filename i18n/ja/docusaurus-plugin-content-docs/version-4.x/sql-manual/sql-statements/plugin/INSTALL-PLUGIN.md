---
{
    "title": "INSTALL PLUGIN",
    "language": "ja",
    "description": "このステートメントはプラグインのインストールに使用します"
}
---

## 説明

このステートメントはプラグインのインストールに使用します。

## 構文

```sql
INSTALL PLUGIN FROM <source> [PROPERTIES ("<key>"="<value>", ...)]
```

## 必須パラメータ

** 1. `<source>`**
>  インストールするプラグインのパスです。次の三種類を指定できます：
>   1. ZIP ファイルの絶対パス
>   2. プラグインディレクトリの絶対パス
>   3. http または https プロトコルで ZIP ファイルをダウンロードできる URL

## オプションパラメータ

** 1. `[PROPERTIES ("<key>"="<value>", ...)]`**
>  プラグインのインストール時にプロパティまたはパラメータを指定します。

## 権限制御

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です：

| 権限         | 対象   | 備考            |
|:-----------|:-----|:--------------|
| ADMIN_PRIV | クラスター全体 | クラスター全体に対する管理者権限が必要です |

## 注意事項

.zip ファイルと同じ名前の md5 ファイルを配置する必要があります。例： http://mywebsite.com/plugin.zip.md5 。その内容は .zip ファイルの MD5 値です。

## 例

- ローカルの ZIP ファイルからプラグインをインストールする：

    ```sql
    INSTALL PLUGIN FROM "/home/users/doris/auditdemo.zip";
    ```

- ローカルディレクトリからプラグインをインストールする：

    ```sql
    INSTALL PLUGIN FROM "/home/users/doris/auditdemo/";
    ```

- プラグインをダウンロードしてインストールする：

    ```sql
    INSTALL PLUGIN FROM "http://mywebsite.com/plugin.zip";
    ```

- プラグインをダウンロードしてインストールし、ZIP ファイルの md5sum 値を設定する：

    ```sql
    INSTALL PLUGIN FROM "http://mywebsite.com/plugin.zip" PROPERTIES("md5sum" = "73877f6029216f4314d712086a146570");
    ```
