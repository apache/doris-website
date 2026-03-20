---
{
  "title": "オブジェクト識別子",
  "description": "各データベースオブジェクト（table、カラム、インデックスなど）には名前があります。SQLステートメントでは、これらの名前はオブジェクト識別子と呼ばれます。",
  "language": "ja"
}
---
## デスクリプション

table、カラム、インデックスなどの各データベースオブジェクトには名前があります。SQLステートメントでは、これらの名前はオブジェクト識別子として参照されます。識別子はクォートありまたはクォートなしにできます。識別子に特殊文字や予約キーワードが含まれている場合は、参照されるたびにバッククォート（`）でクォートする必要があります。予約キーワードの詳細については、[Reserved Keywords](./reserved-keywords)セクションを参照してください。

## Object Identifier Restrictions

Dorisでは、オブジェクト識別子は変数`enable_unicode_name_support`によって制御され、Unicode文字がサポートされるかどうかを決定できます。Unicode文字サポートが有効になっている場合、識別子はUnicodeの任意の言語文字を使用できます。ただし、句読点や他の文字は許可されません。

Dorisでは、異なるオブジェクトが識別子に対して異なる制限を持っており、異なるオブジェクトの具体的な制限を以下に示します。

### table Names

| Mode               | Identifier Restrictions                             |
| :----------------- | :------------------------------------- |
| Closed Unicode Mode | `^[a-zA-Z][a-zA-Z0-9\\-_]*$`             |
| Enabled Unicode Mode | `^[a-zA-Z\\p{L}][a-zA-Z0-9\\-_\\p{L}]*$` |

### Column Names

| Mode               | Identifier Restrictions                                                   |
| :----------------- | :----------------------------------------------------------- |
| Closed Unicode Mode | `^[.a-zA-Z0-9_+\\-/?@#$%^&*\"\\s,:]{1,256}$` |
| Enabled Unicode Mode | `^[.a-zA-Z0-9_+\\-/?@#$%^&*\"\\s,:\\p{L}]{1,256}$` |

## OUTFILE Names

| Mode               | Identifier Restrictions                                   |
| :----------------- | :------------------------------------------- |
| Closed Unicode Mode | `^[_a-zA-Z][a-zA-Z0-9\\-_]{0,63}$`             |
| Enabled Unicode Mode | `^[_a-zA-Z\\p{L}][a-zA-Z0-9\\-_\\p{L}]{0,63}$` |

## User Names

| Mode               | Identifier Restrictions                              |
| :----------------- | :--------------------------------------- |
| Closed Unicode Mode | `^[a-zA-Z][a-zA-Z0-9.\\-_]*$`             |
| Enabled Unicode Mode | `^[a-zA-Z\\p{L}][a-zA-Z0-9.\\-_\\p{L}]*$` |

## LABEL Names

| Mode               | Identifier Restrictions                      |
| :----------------- | :------------------------------ |
| Closed Unicode Mode | `^[-_A-Za-z0-9:]{1,N}$`、ここで`N`はFEの`label_regex_length`設定によって決定され、デフォルト値は128です。 |
| Enabled Unicode Mode | `^[\\-_A-Za-z0-9:\\p{L}]{1,N}$`、ここで`N`はFEの`label_regex_length`設定によって決定され、デフォルト値は128です。 |

## Others

| Mode               | Identifier Restrictions                                  |
| :----------------- | :------------------------------------------ |
| Closed Unicode Mode | `^[a-zA-Z][a-zA-Z0-9\\-_]{0,63}$`             |
| Enabled Unicode Mode | `^[a-zA-Z\\p{L}][a-zA-Z0-9\\-_\\p{L}]{0,63}$` |
