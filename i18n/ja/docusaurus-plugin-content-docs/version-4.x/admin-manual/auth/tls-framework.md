---
{
    "title": "TLS フレームワークの設定",
    "language": "ja",
    "description": "固定された TLS 設定名、デフォルト値、対象コンポーネント、拡張時の指針を含む、Apache Doris の TLS フレームワーク設定契約のリファレンス。",
    "keywords": [
        "Doris TLS フレームワーク",
        "enable_tls",
        "tls_verify_mode",
        "mTLS",
        "TLS 設定"
    ]
}
---

<!-- Knowledge type: Configuration parameters / Extension contract -->
<!-- Applicable scenarios: TLS module integration / Configuration compatibility -->

このドキュメントでは、Apache Doris の TLS フレームワーク設定に関する契約を説明します。

:::note
このフレームワークは Apache Doris 4.1.4 から利用できます。4.0 では、これらの統一された TLS 設定は利用できません。
:::

オープンソース版の Doris パッケージには、TLS と証明書ベースの認証に関するフレームワーク、設定項目、パーサーのサポート、拡張ポイントが含まれています。ただし、すべてのプロトコルに対応する完全な TLS ランタイム実装は含まれていません。標準のオープンソースビルドでは、TLS モジュールが実装されていないプロトコルで TLS を有効にすると、TLS モジュールが必要であることを示すエラーが発生します。

以下に示す設定名、デフォルト値、意味はフレームワークによって固定されています。独自の TLS モジュールを実装する場合は、互換性を保つために、このフレームワークと設定項目を使用してください。証明書の読み込み、TLS コンテキストの作成、ハンドシェイクの動作、証明書の再読み込み、プロトコル固有のピア検証などの実装詳細は、TLS モジュールで実装できます。

## 設定リファレンス {#configuration-reference}

以下の設定項目はすべて省略可能で、表に示すデフォルト値が適用されます。FE の `fe.conf`、BE の `be.conf`、または Cloud Meta Service/Recycler コンポーネントの設定に指定してください。FE の `tls_cert_based_auth_ignore_password` は動的に変更できますが、それ以外は起動時の設定として扱い、該当するプロセスを再起動してください。対象プロトコルで TLS を有効にする前に、モジュールをデプロイして検証してください。

| 設定項目 | 型 | 対象コンポーネント | デフォルト値 | 説明 | 備考 |
| --- | --- | --- | --- | --- | --- |
| `enable_tls` | Boolean | FE、BE、Cloud | `false` | プロセスの統一 TLS フレームワークを有効にします。 | `true` の場合、`tls_excluded_protocols` で除外されていないプロトコルでは、モジュールが提供する TLS 実装が使用されることを想定します。関連するすべての Doris コンポーネントで、互換性のある TLS 設定を使用する必要があります。 |
| `tls_verify_mode` | String | FE、BE、Cloud | `verify_peer` | 証明書の検証動作を制御します。使用できる値は `verify_none`、`verify_peer`、`verify_fail_if_no_peer_cert` です。 | [TLS 検証モード](#tls-verification-modes)を参照してください。 |
| `tls_certificate_path` | String | FE、BE、Cloud | 空 | コンポーネントが TLS サーバーまたはクライアントとして動作する際に使用する証明書のパスです。 | フレームワークの契約では PEM 形式の証明書を想定しています。TLS モジュールは、リーフ証明書または証明書チェーン全体を含む PEM ファイルに対応できます。 |
| `tls_private_key_path` | String | FE、BE、Cloud | 空 | `tls_certificate_path` とともに使用する秘密鍵のパスです。 | フレームワークの契約では PEM 形式の秘密鍵を想定しています。 |
| `tls_private_key_password` | String | FE、BE、Cloud | 空 | 秘密鍵ファイルのパスワードです。 | Base64 でエンコードされた値ではなく、平文のパスワード文字列です。 |
| `tls_ca_certificate_path` | String | FE、BE、Cloud | 空 | ピア証明書の検証に使用する CA 証明書または CA バンドルのパスです。 | フレームワークの契約では PEM 形式の CA 証明書を想定しています。この値が空で、その利用が許される場合、TLS モジュールはシステムまたは JDK のデフォルトのトラストストアも使用できます。 |
| `tls_cert_refresh_interval_seconds` | Integer | FE、BE、Cloud | `3600` | 証明書ファイルの再読み込みが必要かどうかを確認する間隔です。単位は秒です。 | フレームワークはこの間隔を公開します。実際の証明書の再読み込み動作は TLS モジュールが実装します。 |
| `tls_excluded_protocols` | String | FE、BE、Cloud | 空 | TLS を使用しないプロトコル名をカンマで区切ったリストです。大文字と小文字は区別しません。 | 使用できるプロトコル名はコンポーネントと TLS モジュールによって異なります。オープンソースのフレームワークでは、`thrift`、`mysql`、`http`、`arrowflight`、`brpc`、`bdbje` などのセレクターが予約されています。実装がサポートするセレクターのみを使用してください。 |
| `tls_peer_cert_required_san_dns` | String | FE、BE、Cloud | 空 | 選択したプライベートプロトコルに対する、ピア証明書の DNS Subject Alternative Name の許可リストです。 | 構文は `<protocol>=<dns1>,<dns2>;...` です。フレームワークは、ピア証明書による接続許可の制御を必要とするモジュール実装のために、この契約を予約しています。 |
| `tls_cert_based_auth_ignore_password` | Boolean | FE | `false` | 証明書ベースの認証が成功した後、パスワード検証を省略できるようにします。 | FE のユーザー認証フローにのみ影響します。有効にするとパスワードによる保護が弱まるため、TLS モジュールが必要な証明書認証の動作を提供している環境でのみ使用してください。 |

## TLS 検証モード {#tls-verification-modes}

| モード | クライアント側 | サーバー側 | 用途 |
| --- | --- | --- | --- |
| `verify_none` | サーバー証明書を検証しません。 | クライアント証明書を検証しません。 | 証明書を検証せずに TLS による暗号化を必要とする環境向けです。 |
| `verify_peer` | サーバー証明書を検証します。 | クライアント証明書を要求しません。 | 一方向の TLS 検証向けです。この値は mTLS を要求しません。 |
| `verify_fail_if_no_peer_cert` | サーバー証明書を検証します。 | クライアント証明書を要求し、検証します。 | 相互の証明書検証を必要とする mTLS 環境向けです。 |

## オープンソースビルドでのフレームワークの動作 {#framework-behavior-in-the-open-source-build}

オープンソースのフレームワークは設定定義と拡張ポイントを提供します。`enable_tls` が `false` の場合、デフォルトのプロバイダーは既存の平文通信の動作を維持します。

`enable_tls` が `true` の場合、プロトコルの起動またはチャネルの作成は TLS フレームワークを経由します。対応する TLS モジュールが提供されていない場合、オープンソースのデフォルト実装はそのプロトコルの TLS 起動を拒否し、TLS モジュールが必要であることを通知します。

したがって、上の表は互換性に関する契約であり、標準のオープンソースパッケージで TLS を有効にするための完全な運用ガイドではありません。

## 実装上の指針 {#implementation-guidance}

カスタム TLS モジュールを実装する場合は、次の規則に従ってください。

- このドキュメントに記載された設定名と意味を使用してください。同じ TLS 動作に別の設定名を導入しないでください。
- 同じ設定項目が存在する FE、BE、Cloud コンポーネント間で、設定の動作を統一してください。
- ユーザーが TLS モジュールで処理するプロトコルを選択できるよう、`tls_excluded_protocols` を尊重してください。
- サーバー側とクライアント側の両方で `tls_verify_mode` を一貫して実装してください。
- 証明書の再読み込みをサポートする場合は、`tls_cert_refresh_interval_seconds` を再読み込みの確認間隔として使用してください。
- ピア証明書の DNS SAN による接続許可の制御をサポートする場合は、表に記載した `tls_peer_cert_required_san_dns` の構文を使用してください。
- 証明書ベースの認証では、フレームワークの拡張ポイントを通じて、実行時の認証実装を提供してください。カスタム実装がない場合、オープンソースのデフォルトサービスは何も行いません。
