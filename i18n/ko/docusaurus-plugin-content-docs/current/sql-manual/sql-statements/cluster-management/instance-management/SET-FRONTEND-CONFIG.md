---
{
    "title": "SET FRONTEND CONFIG",
    "language": "ko",
    "description": "이 문은 클러스터의 구성 항목을 설정하는 데 사용됩니다(현재는 FE 구성 항목 설정만 지원합니다)."
}
---

## 설명 {#description}

이 문은 클러스터의 구성 항목을 설정하는 데 사용됩니다(현재는 FE 구성 항목 설정만 지원합니다).

## 구문: {#syntax}

```sql
ADMIN SET {ALL FRONTENDS | FRONTEND} CONFIG ("<fe_config_key>" = "<fe_config_value>")
```

## 필수 매개변수 {#required-parameters}
**`{ALL FRONTENDS | FRONTEND}`**
> **`ALL FRONTENDS`**: Doris 클러스터의 모든 FE 노드를 나타냅니다.
>
> **`FRONTEND`**: 현재 연결된 FE 노드, 즉 사용자가 상호 작용 중인 FE 노드를 나타냅니다.

## 선택 매개변수 {#optional-parameters}
변경할 `<fe_config_key>`와 `<fe_config_value>`는 [SHOW FRONTEND CONFIG](./SHOW-FRONTEND-CONFIG) 명령으로 확인할 수 있습니다.

:::tip 설명

- 2.0.11 및 2.1.5 버전부터 `ALL` 키워드를 지원합니다. `ALL` 키워드를 사용하면 구성 매개변수가 모든 FE에 적용됩니다(`master_only` 매개변수 제외).
- 이 구문은 구성을 영구적으로 변경하지 않습니다. FE가 재시작되면 변경한 구성은 더 이상 유효하지 않습니다. 변경 사항을 영구적으로 유지하려면 구성 항목을 fe.conf에도 함께 추가해야 합니다.
:::

## 예제 {#example}

1. `disable_balance`를 `true`로 설정

    ```sql
    ADMIN SET FRONTEND CONFIG ("disable_balance" = "true");
    ```

2. 모든 FE 노드의 `disable_balance`를 `true`로 설정
   ```sql
   ADMIN SET ALL FRONTENDS CONFIG ("disable_balance" = "true");
   ```
