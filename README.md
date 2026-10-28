# Marcas Vinculadas — D&D 5e

Versão 0.3.2. Integração atualizada para Foundry VTT 14.369+, D&D 5e 6.0.6+ e Midi-QOL 14.6.4+.
Interface em português. Sem compilação e sem bibliotecas adicionais às dependências do Midi-QOL.

O Midi-QOL 14.6.4 exige também **DAE 14.6.3+**, socketlib e lib-wrapper. A linha Midi-QOL 14.0.x é para D&D 5e 5.x; a linha 13.x é para Foundry 13. Elas não atendem aos requisitos desta versão.

## Instalação

No Foundry, abra **Add-on Modules → Install Module** e cole no campo **Manifest URL**:

```text
https://github.com/laislonhoft/source-bound-marks/releases/latest/download/module.json
```

O ZIP também está disponível na [página de releases](https://github.com/laislonhoft/source-bound-marks/releases). Para instalar manualmente:

1. Feche o Foundry. Crie a pasta `Data/modules/source-bound-marks` e extraia nela o ZIP da release (o `module.json` está na raiz do ZIP).
2. Confira a estrutura: `Data/modules/source-bound-marks/module.json`.
3. Reinicie o Foundry, abra o mundo D&D 5e e ative **Marcas Vinculadas — D&D 5e** em Gerenciar Módulos.
4. Mantenha Midi-QOL e as dependências dele habilitados, com a automação de acertos, dano e concentração configurada conforme a mesa.
5. Marque um alvo e use **Hunter's Mark** ou **Bestow Curse** diretamente na ficha. Não é necessário criar macro nem importar outra magia.

Para atualizar, use **Update** no módulo na tela de configuração do Foundry e reinicie o mundo para todos os jogadores. Na instalação manual, extraia o novo ZIP sobre a pasta do módulo com o Foundry fechado. Quem continua no D&D 5e 5.3.x deve manter a versão 0.2.0; a 0.3.2 requer o sistema 6.0.6+ e Midi-QOL 14.6.4+. As marcas existentes não precisam ser recriadas: os dados de origem e concentração foram preservados. A macro antiga pode ser mantida como alternativa manual:

```js
await game.modules.get("source-bound-marks").api.openMenu();
```

O arquivo `macros/aplicar-marca.json` é uma alternativa manual opcional para o mestre.
Para atualizações automáticas pelo Foundry, prefira a instalação por URL de manifesto.

## Uso na mesa

1. O jogador marca um único alvo usando **T** e lança a magia normalmente na ficha, pelo Midi-QOL.
2. Em Hunter's Mark, mantenha a concentração habilitada na conjuração. A marca é aplicada automaticamente quando a atividade termina.
3. Em Bestow Curse, use a atividade com resistência. Se o alvo passar, não há marca. Se falhar, confirme que escolheu a opção de **1d8 de dano necrótico**; as outras opções da maldição continuam com a magia original.
4. O alvo recebe um Active Effect com ícone de mira e o nome do conjurador. Um mestre precisa estar conectado, mas não precisa clicar em nada: o módulo processa a aplicação no cliente dele.
5. Os ataques seguintes do conjurador acrescentam o dano quando acertam esse alvo. Outros atacantes não recebem esse bônus.

**Checagem manual de acertos:** se `Auto check hits` estiver em `none`, o Midi deixa as listas de acertos vazias. Desde a versão 0.3.2, o módulo usa o sucesso/falha da rolagem de ataque quando disponível. Se o resultado não estiver definido, pergunta se o ataque acertou; recusar ou fechar não adiciona dano. Com a checagem automática habilitada, continua respeitando os acertos calculados pelo Midi. Não altera as configurações de aplicação de dano da mesa.

O bônus aparece no resultado de dano do chat, depois da rolagem e da eventual confirmação de ataque/dano do Midi. Ele não altera a fórmula exibida inicialmente no diálogo de dano da arma. Termine as confirmações pendentes no cartão antes de conferir o resultado. Rolagens avulsas fora de um workflow do Midi não acionam a integração.

O sistema original continua controlando alcance, recursos e testes. Bestow Curse em nível 5 ou superior não exige vínculo de concentração desta marca; a duração é calculada pelo nível efetivamente usado, incluindo duração permanente no nível 9. O módulo não altera a configuração de concentração da magia original: para esses níveis, desative-a no diálogo de conjuração se o item ainda a solicitar.

### Reconhecimento e magias renomeadas

Hunter's Mark / Marca do Caçador / Marca do Predador, Bestow Curse / Rogar Maldição / Lançar Maldição e Hex / Bruxaria são reconhecidas pelo nome ou identificador. Para Hunter's Mark, a edição vem de `system.source.rules`; quando ausente, use **Configurações → Marcas Vinculadas → edição padrão**.

Na janela da magia, o botão **Marca** permite escolher um perfil explicitamente, reconhecer automaticamente ou desativar a integração. Isso permite usar uma magia renomeada sem macro. Se configurar explicitamente **Bestow Curse — dano**, a pergunta sobre a opção não aparece; uma resistência falha continua obrigatória. Fichas alternativas que substituem o cabeçalho podem não exibir o botão; o reconhecimento automático continua independente dele.

**Uma rolagem por alvo.** Para ataque extra, rajadas e ataques múltiplos, faça cada ataque separadamente. Uma rolagem com vários alvos não recebe bônus desta versão e mostra um aviso. O módulo não divide automaticamente uma rolagem coletiva.

O dano acompanha a aplicação normal do Midi-QOL, incluindo tipo de dano, resistências, imunidades e redução de dano. Se a mesa usa aplicação manual, o bônus também depende da aplicação manual do resultado. Críticos de ataques usam `DamageRoll` do sistema com a opção `isCritical`; os dados do bônus são incluídos no crítico. Modificações especiais de outros módulos devem ser conferidas na sessão de validação.

## Perfis incluídos

| Perfil | Bônus | Gatilho |
|---|---|---|
| Hunter's Mark (2014) | 1d6 do primeiro tipo de dano do ataque | Ataque com arma corpo a corpo ou à distância |
| Hunter's Mark (2024) | 1d6 de força | Ataque que acerta |
| Bestow Curse — dano | 1d8 necrótico | Ataque que acerta ou magia com dano |
| Hex — dano | 1d6 necrótico | Ataque que acerta |

O bônus é fixo a cada ocorrência: não cresce de 1d6 para 2d6, 3d6 etc. A interpretação implementada é **dano adicional recorrente**.

Bestow Curse implementa somente a opção de dano adicional. Hex implementa somente o dano. Desvantagens, outras opções de maldição e requisitos para transferir a marca continuam sob controle da magia original e do mestre. Na alternativa manual, é possível escolher **Sem concentração** e ajustar a duração.

## Concentração, duração e transferência

- A marca guarda o UUID exato do efeito de concentração, não apenas o nome ou o estado genérico do conjurador.
- Quando a concentração é apagada, desativada ou expira, o bônus deixa de funcionar. O mestre ativo remove a marca do alvo.
- Isso também funciona com atores sintéticos de tokens não vinculados e alvos em outras cenas.
- O módulo não rola por conta própria testes de concentração: responde ao resultado aplicado pelo sistema/Midi-QOL. Se sua configuração deixa a concentração após um teste falho, encerre o efeito pelo sistema.
- A duração usa o relógio do mundo. A expiração depende de esse relógio avançar; não é um cronômetro de tempo real.
- Se a magia já oferece uma atividade de transferência, ela pode reaplicar a marca pelo mesmo fluxo, desde que gere mensagem de uso com o vínculo à concentração original. O módulo preserva o prazo da marca anterior. Não lance a magia de novo como se fosse uma transferência: isso pode consumir recursos e reiniciar a concentração pelo sistema. Para itens sem atividade de transferência, a alternativa manual do mestre continua disponível.
- Para remover antes do prazo, exclua o Active Effect no alvo; isso não encerra a concentração, permitindo a transferência quando as regras autorizarem.
- Há no máximo uma marca de cada perfil por conjurador gerenciada pela aplicação. Não aplique os perfis 2014 e 2024 simultaneamente para a mesma magia.
- A aplicação automática funciona nas conjurações dos jogadores sem permissão de editar a ficha da vítima. O mestre ativo valida o autor, o item, a atividade, a resistência registrada e a concentração antes de criar o efeito.

## Evitar dano duplicado

Desative qualquer automação que já acrescente o mesmo bônus dessa magia (macro DamageBonus, premade, efeito DAE etc.). Preserve a automação normal da concentração. O módulo preserva bônus de terceiros; não tenta adivinhar se outro bônus corresponde à mesma magia.

## Compatibilidade e validação

Código conferido contra as releases **Midi-QOL 14.6.4** e **D&D 5e 6.0.6**, em 27/10/2026, as mais recentes da linha Foundry 14 / D&D 6 nesta consulta. O manifesto exige Foundry 14.369–14.999, D&D 5e 6.0.6–6.999 e Midi-QOL 14.6.4–14.999, acompanhando os requisitos atuais do Midi. **Não houve execução deste módulo dentro de uma instalação real do Foundry.** Não se declara `verified`; a faixa de instalação não garante compatibilidade com todas as versões futuras.

Testes locais: `node --test tests/*.test.mjs`. Os 55 testes cobrem lógica e integração simulada, incluindo cartões 6.x, nível real da conjuração, concentração nova após reconjuração, resistência e execução pelo mestre. Não substituem testes do aplicativo Foundry nem do cálculo real de resistências.

Roteiro para validar em um mundo de teste:

1. Conjurador A marca vítima X; A acerta X e recebe o bônus. A erra X e não recebe o bônus.
2. Atacante B acerta X; o bônus de A não aparece. A acerta vítima Y sem marca; também não aparece.
3. Um crítico de A contra X dobra os dados adicionais; confira o tipo de dano.
4. Teste resistência/imunidade ao tipo adicional e confira os PV aplicados pelo Midi-QOL.
5. Remova a concentração de A; a marca desaparece e os próximos ataques não recebem bônus.
6. Transfira para Y mantendo a concentração; X deixa de receber bônus.
7. Repita com jogador, token não vinculado, outra cena, recarregamento e uma rerrolagem de dano.
8. Confira que uma rolagem com múltiplos alvos mostra o aviso e não propaga bônus à vítima errada.
9. Lance Hunter's Mark pela ficha de um jogador: verifique a marca automática, sem executar macro.
10. Lance Bestow Curse com sucesso/falha na resistência, confirme/recuse a opção de dano e teste conjuração em níveis 3, 5 e 9.
11. Use o botão Marca para configurar uma magia renomeada, desative a integração e confirme que ela deixa de aplicar a marca.

## API para macros do mestre

```js
await game.modules.get("source-bound-marks").api.applyMark({
  source: canvas.tokens.controlled[0].actor,
  target: [...game.user.targets][0].actor,
  preset: "hunter2024", // hunter2014, hunter2024, curse ou hex
  concentrationUuid: "Actor.ID.ActiveEffect.ID", // UUID real; null para dispensar concentração
  seconds: 3600
});
```

## Referências técnicas

- Foundry ActiveEffect: https://foundryvtt.com/api/classes/foundry.documents.ActiveEffect.html
- Foundry DialogV2: https://foundryvtt.com/api/classes/foundry.applications.api.DialogV2.html
- D&D 5e cartões: https://github.com/foundryvtt/dnd5e/blob/release-6.0.6/module/documents/chat-message.mjs
- Midi-QOL Workflow: https://gitlab.com/tposney/midi-qol/-/blob/v14.6.4/src/module/Workflow.ts

O módulo usa `midi-qol.RollComplete` para a aplicação, `midi-qol.DamageRollComplete` e `workflow.setBonusDamageRolls` para o dano. A solicitação de marca é salva na mensagem de uso; o mestre ativo a processa uma vez. Não modifica diretamente os PV nem instala macros nas magias originais. Solicitações com falha mostram o motivo no cliente que detectou a falha; não são reaplicadas retroativamente ao abrir o mundo.

