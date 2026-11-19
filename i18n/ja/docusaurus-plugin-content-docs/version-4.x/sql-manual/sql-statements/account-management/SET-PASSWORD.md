---
{
    "title": "SET PASSWORD",
    "language": "ja",
    "description": "Doris のログインパスワードを変更し、必要に応じてローテーション中に現在のパスワードを保持します。"
}
---

## 説明 {#description}

`SET PASSWORD` ステートメントは、ユーザーのログインパスワードを変更するために使用します。

4.2.1 以降、Doris の組み込みパスワード認証では、`RETAIN CURRENT PASSWORD` と `DISCARD OLD PASSWORD` による二重パスワードがサポートされています。

## 構文 {#syntax}

```sql
SET PASSWORD [FOR <user_identity>] =
    { PASSWORD(<plain_password>) | <hashed_password> }
    [RETAIN CURRENT PASSWORD]
```

## 必須パラメータ {#required-parameters}

**1. `<plain_password>`**

> 入力するのは平文パスワードです。パスワード `123456` を例にすると、文字列 `123456` をそのまま使用します。

**2. `<hashed_password>`**

> 入力するのは暗号化されたパスワードです。パスワード 123456 を例にすると、関数 `PASSWORD('123456')` の戻り値である文字列 `*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9` をそのまま使用します。

## オプションパラメータ {#optional-parameters}

**1. `<user_identity>`**

> `FOR` を指定する場合は、ホスト部分を含め、`CREATE USER` で作成したアカウントの識別子を正確に指定します。`FOR` を省略した場合、Doris は `CURRENT_USER()` が返す認証済みアカウントを使用します。これは `USER()` が返すクライアント IP の識別子とは異なります。現在のアカウントは `SHOW GRANTS` で確認できます。

**2. `RETAIN CURRENT PASSWORD`（4.2.1 以降）**

> 従来の主パスワードを副パスワードとして保持し、指定した新しいパスワードを主パスワードに設定します。どちらのパスワードでも認証でき、以前から存在する副パスワードは置き換えられます。自分のパスワードを変更する場合も、グローバルの `GRANT_PRIV` または `ADMIN_PRIV` が必要です。

## アクセス制御要件 {#access-control-requirements}

この SQL コマンドを実行するユーザーには、少なくとも以下の権限が必要です。

| 権限 | 対象 | 備考 |
|:--------------|:----------|:------|
| なし | 現在のユーザー | RETAIN を使用せずに自分のパスワードを通常どおり変更する場合、追加の権限は不要です。 |
| GRANT_PRIV または ADMIN_PRIV | グローバル | 他のユーザーのパスワードを変更する場合、または自分のアカウントを含めて RETAIN CURRENT PASSWORD を使用する場合に必要です。 |

## 使用上の注意 {#usage-notes}

4.1.5 以降、特別な root 識別子は `'root'@'%'` のみです。`'root'@'localhost'` のような識別子は通常のユーザーのままであり、ユーザー名が root であるというだけで実際の root アカウントを変更する権限は得られません。実際の root アカウントに対する保護は、root という名前の他のユーザーには適用されません。

- `FOR user_identity` フィールドがない場合は、現在のユーザーのパスワードを変更します。

### 二重パスワード（4.2.1 以降） {#dual-passwords-since-421}

- RETAIN を指定せずに空でないパスワードへ通常どおり変更した場合、既存の副パスワードは保持されます。
- 現在の主パスワードが空の場合、RETAIN は失敗します。新しいパスワードが空の場合は、RETAIN を指定していても両方のパスワードが消去されます。
- 平文パスワードには `PASSWORD('<new_password>')` を使用します。文字列をそのまま指定する場合は、すでにハッシュ化されたパスワードでなければなりません。
- 副パスワードを無効にするには、`ALTER USER ... DISCARD OLD PASSWORD` を使用します。SET PASSWORD に DISCARD 句はありません。

手順全体とアップグレード時の制限については、[二重パスワード](../../../admin-manual/auth/authentication/internal#dual-passwords)を参照してください。これらの句は組み込みパスワードに適用されます。

## 例 {#example}

- 現在のユーザーのパスワードを変更する

```sql
SET PASSWORD = PASSWORD('123456')
SET PASSWORD = '*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9'
```

- 指定したユーザーのパスワードを変更する

```sql
SET PASSWORD FOR 'jack'@'192.%' = PASSWORD('123456')
SET PASSWORD FOR 'jack'@['domain'] = '*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9'
```

- 新旧のパスワードを併用する期間を設けてアカウントのパスワードをローテーションする（4.2.1 以降）

グローバルの `GRANT_PRIV` または `ADMIN_PRIV` を持つ管理者として実行します。

```sql
CREATE USER 'rotation_user'@'%' IDENTIFIED BY 'OldPwd_2026!';
SET PASSWORD FOR 'rotation_user'@'%' = PASSWORD('NewPwd_2026!') RETAIN CURRENT PASSWORD;
```

`OldPwd_2026!` と `NewPwd_2026!` のどちらでも認証できます。クライアントの移行後、古い認証情報を削除します。

```sql
ALTER USER 'rotation_user'@'%' DISCARD OLD PASSWORD;
```

以後、`NewPwd_2026!` でのみ認証できます。
