---
{
    "title": "カスタム認可プラグイン",
    "language": "ja",
    "description": "開発版の認可 SPI を使用して、カスタム認可ソースを実装、パッケージ化、設定します。",
    "keywords": [
        "Doris authorization",
        "AuthorizationPlugin",
        "AuthorizationPluginFactory"
    ]
}
---

開発版では、外部での権限判定、列マスキング、行フィルターに使用する `org.apache.doris.authorization.spi.AuthorizationPlugin` と `AuthorizationPluginFactory` が提供されています。

:::note
このインターフェースは開発版のものです。Doris 4.x では `CatalogAccessController` / `AccessControllerFactory` を使用します。詳しくは [4.x のガイド](https://doris.apache.org/docs/4.x/admin-manual/auth/authorization/custom) を参照してください。サービス記述ファイルとディレクトリ構成は、これらのバージョン間で異なります。
:::

## 前提条件 {#prerequisites}

デプロイ先の FE に対応するソースと JDK を使用し、`fe-authorization-api` と `fe-authorization-spi` を provided 依存関係としてコンパイルしてください。Doris API クラスをプラグイン JAR に含めないでください。デプロイには、すべての FE のプラグインディレクトリへの書き込み権限と、FE の再起動が必要です。検証には、対象のカタログを管理する権限を持つアカウントを使用してください。

## 最小構成のファクトリー {#minimal-factory}

以下の完全なファクトリーは、デフォルトですべての権限を拒否するプラグインを作成します。これにより、プラグインが検出されることを確認できます。実際にポリシーを適用するプラグインでは、`checkAction` または `checkPrivilege` をオーバーライドし、ポリシーソースを参照する必要があります。`name()` だけを実装したプラグインでは、アプリケーションのクエリを処理できません。

```java
package com.example.doris.authz;

import java.util.Map;
import org.apache.doris.authorization.spi.AuthorizationContext;
import org.apache.doris.authorization.spi.AuthorizationPlugin;
import org.apache.doris.authorization.spi.AuthorizationPluginFactory;

public final class MyAuthorizationPluginFactory implements AuthorizationPluginFactory {
    @Override
    public String name() { return "my-authz"; }

    @Override
    public AuthorizationPlugin create(Map<String, String> properties,
            AuthorizationContext context) {
        return new AuthorizationPlugin() {
            @Override
            public String name() { return "my-authz"; }
        };
    }
}
```

JAR 内の次のサービス記述ファイルに、ファクトリーのクラス名を追加してください。

```text
META-INF/services/org.apache.doris.authorization.spi.AuthorizationPluginFactory
```

```text
com.example.doris.authz.MyAuthorizationPluginFactory
```

## インターフェースの動作 {#interface-semantics}

- `checkPrivilege(subject, resource, requirement, context)` は正常に戻るとアクセスを許可し、`AccessDeniedException` を送出すると拒否します。デフォルトの実装では、requirement に含まれるアクションに対して、ALL/ANY の規則に従って `checkAction` を呼び出します。実装されていないチェックはアクセスを拒否します。
- `getRowFilters` は `List<RowFilterSpec>` を返し、`getDataMasks` は列名をキーとする `Map<String, DataMaskSpec>` を返します。空のコレクションはポリシーがないことを意味し、アクセスの許可を意味しません。NULL は返さないでください。ポリシーを読み込めない場合は例外を送出し、ステートメントを失敗させてください。
- 各リソースの認可は、単一の認可ソースが判定します。カタログに紐付けられたソースは、そのカタログ内のオブジェクトを管理します。インスタンスの認可ソースは、インスタンスのオブジェクトとカタログレベルの権限付与を管理します。グローバル権限による免除を適用するかどうかはプラグインが判断し、`AuthorizationContext.grantedByGlobalScopeAuthority` を参照できます。エンジンがすべてのプラグイン呼び出しを事前に認可するわけではありません。
- エンジンによる例外として、skipAuth、該当する外部管理のカタログに対する skip_catalog_priv_check、および文字どおりの root@'%' と admin@'%' アカウントに対する行フィルターとマスキングの免除は引き続き適用されます。
- インスタンスは再利用され、設定済みのインスタンスが置き換えられるときに `close()` が呼び出されます。ポリシーのキャッシュと更新、同時実行の制御、リソースの解放はプラグインが担当します。

## パッケージ化とデプロイ {#packaging-and-deployment}

JAR の MANIFEST に `Doris-Authorization-Plugin-Api-Version` を宣言してください。バージョンには、デプロイ先 FE の SPI JAR にある `META-INF/doris/authorization-plugin-api-version.properties` に記載された値を使用します。現在のメジャーバージョンは `1` です。例を示します。

```text
Doris-Authorization-Plugin-Api-Version: 1.0
```

宣言がない場合やメジャーバージョンが異なる場合、プラグインは拒否されます。各プラグインを `authorization_plugins_dir` の個別のサブディレクトリに配置してください。デフォルトのディレクトリは `${DORIS_HOME}/plugins/authorization` です。

```text
plugins/authorization/my-authz/my-authz.jar
plugins/authorization/my-authz/lib/policy-client.jar
```

すべての FE にデプロイして再起動してください。依存ライブラリは分離された子優先クラスローダーで読み込まれます。`org.apache.doris.authorization.*` は常に FE から提供されます。

## 設定と検証 {#configuration-and-validation}

内部カタログでは、`access_controller_type = my-authz` を `fe.conf` に設定します。プロパティは `authorization_config_file_path` から取得され、デフォルトでは `${DORIS_HOME}/conf/authorization.conf` に解決されます。デフォルト値の `default` を指定すると、組み込みの認可が選択されます。

外部カタログでは、まずアクセス可能な HMS を用意し、例のエンドポイントと認証情報を置き換えてください。

```sql
CREATE CATALOG my_catalog PROPERTIES (
    "type" = "hms",
    "hive.metastore.uris" = "thrift://127.0.0.1:9083",
    "access_controller.class" = "my-authz",
    "access_controller.properties.api_url" = "https://policy.example.com",
    "access_controller.properties.token" = "<token>"
);
```

`access_controller.class` には、ファクトリー名またはファクトリーのクラス名を指定します。Doris は `access_controller.properties.` を取り除いてから設定をファクトリーに渡します。内部カタログを変更する前に、テスト用カタログで許可されるクエリと拒否されるクエリを検証してください。ポリシーを取得できない場合、列権限、マスキング、行フィルターも確認してください。ファクトリーが見つからない場合は、FE の起動ログ、サービス記述ファイル、API バージョンの宣言、プラグインのディレクトリ構成を調べてください。

## 旧インターフェースからの移行 {#migrating-from-the-legacy-interface}

旧コントローラーは引き続きアダプターを介して動作しますが、非推奨です。`hasGlobal` のオーバーロードは削除され、データポリシーには `DataMaskSpec` / `RowFilterSpec` を使用するようになりました。ポリシーを持つ旧実装は再コンパイルが必要です。従来の Ranger のシングルトン動作を踏襲せず、新しい SPI のライフサイクルに従ってください。完全な実装はソースツリーの `fe/fe-core/src/test/java/org/apache/doris/authorizationexample/` にあり、パッケージ化の詳細は `fe/fe-authorization/fe-authorization-spi/README.md` に記載されています。
