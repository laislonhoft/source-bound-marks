# Estilos de luta e talentos — regras de 2024

A partir da versão 0.5.0, o módulo também prepara o dano de armas para estes cinco perfis, diretamente pela ficha e sem macros:

| Perfil | Automação |
|---|---|
| Great Weapon Fighting / Combate com Armas Grandes | Dados básicos da arma corpo a corpo têm mínimo 3 quando usada com duas mãos e propriedade Duas Mãos ou Versátil. |
| Great Weapon Master / Mestre de Armas Grandes | Soma proficiência ao dano de cada ataque elegível com arma Pesada, após confirmar ação Atacar no próprio turno. |
| Dueling / Duelismo | +2 ao dano com arma corpo a corpo em uma mão, sem outra arma equipada; escudo permitido. |
| Thrown Weapon Fighting / Combate com Armas de Arremesso | +2 ao dano de ataque à distância com arma de propriedade Arremesso. |
| Two-Weapon Fighting / Combate com Duas Armas | Acrescenta o modificador positivo de habilidade ao ataque secundário com arma Leve, se o sistema ainda não o incluiu. Modificador negativo já incluído não é somado novamente. |

## Como habilitar

1. Tenha o talento/estilo como um **item de característica (`feat`) na ficha**. Somente escrever o nome no texto da classe não cria esse item.
2. Itens com regras **2024** e identificadores ingleses canônicos são reconhecidos automaticamente, mesmo com nome traduzido. Nomes ingleses e variantes portuguesas também são reconhecidos.
3. Para outro nome ou item sem edição, abra a característica e use o novo botão **Combate**, escolhendo o perfil 2024. O botão também permite **Desativado** para manter outra automação.
4. Use a arma normalmente pelo Midi-QOL. Para Versátil, selecione o modo de ataque **duas mãos**. Para o ataque adicional da propriedade Leve, selecione o modo **offhand / mão secundária**, inclusive quando Nick permitir fazê-lo dentro da ação Atacar.

O reconhecimento em **10 idiomas** anunciado no README refere-se às **magias**. Estes novos perfis de combate têm nomes reconhecidos em inglês/português, identificadores ingleses independentes da tradução e seleção explícita para qualquer idioma. Não há reconhecimento automático de todos os nomes de talentos nas dez línguas.

## Regras e limites

- **Great Weapon Fighting 2024 não rerrola dados.** Usa mínimo 3 somente na parcela básica da arma. Hex, Hunter's Mark, Elementais Menores, Divine Smite e demais parcelas adicionais não recebem esse mínimo. Usa o dado versátil quando escolhido e a configuração de crítico do sistema. Fórmulas básicas personalizadas com pools, referências, rerrolagens ou somas produzem aviso para configuração manual; não são reescritas de maneira ambígua.
- **Great Weapon Master 2024 não aplica -5/+10 e não é limitado a uma vez por turno.** O módulo pergunta se aquele ataque é parte da ação Atacar no próprio turno: ataques de oportunidade, ação bônus, Cleave e ataques da ação Magia não qualificam. Uma arma Pesada à distância também pode qualificar. Se o rastreador indicar turno de outro token, não há bônus. A confirmação é por workflow; cada ataque da ação Atacar é rolado separadamente.
- **Hew:** o módulo mostra um lembrete após crítico com arma corpo a corpo ou resultado de dano que leve um alvo de PV positivos a zero. O jogador confirma a aplicação do dano e a disponibilidade da ação bônus, e rola o ataque com a mesma arma separadamente. Não é um ataque grátis: o módulo não rola nem consome a ação bônus por conta própria. Ao rolar esse ataque, recuse a pergunta sobre ação Atacar. O aumento de +1 em Força do talento continua pelo avanço normal da ficha.
- **Duelismo:** o inventário não registra perfeitamente o que está na mão. O módulo trata outra arma marcada como equipada como impeditivo; deixe armas guardadas como não equipadas. Escudos não impedem o bônus. A empunhadura selecionada deve refletir a usada na mesa.
- **Duas Armas:** o modo secundário identifica o ataque adicional. O módulo não decide elegibilidade para atacar, não concede ataques, não implementa Nick ou Dual Wielder e não adiciona novamente `@mod`. Bônus de habilidade digitado como número no campo situacional não pode ser identificado com segurança: não o adicione manualmente junto desta automação.
- Os bônus fixos entram na parcela de dano da arma; usam seu tipo, aplicação de resistências e opções de crítico do sistema. Com as regras normais, os valores fixos não dobram no crítico. Configurações da mesa que multiplicam modificadores numéricos continuam sendo respeitadas.
- **Arquearia e Defesa** mantêm os efeitos nativos do compêndio D&D 5e. Esta atualização não implementa reações de Proteção/Interceptação nem todos os estilos existentes.

## Evitar duplicação

O módulo não acumula cópias do mesmo perfil. Se a característica tiver macro Midi ou efeito ativo de dano/rolagem detectável, ignora o perfil e mostra aviso. Efeitos de aumento de atributo não bloqueiam o perfil. Essa detecção não identifica toda automação externa, bônus numérico manual ou efeito desvinculado da característica. Desative pelo botão **Combate** o perfil já atendido por premades, DAE, fórmula da arma ou outro módulo. As fórmulas dos itens não são alteradas permanentemente.

## Validação

114 testes locais e de integração simulada no total do módulo. Os novos casos cobrem edição, identificadores, mínimo apenas nos dados básicos, armas versáteis, armas à distância, ataque secundário, bônus existente, duplicação, restrições do turno e lembrete de Hew. **Ainda não validado dentro de uma sessão real do Foundry.**

Em um mundo de teste: compare arma de duas mãos com/sem o estilo; teste Versátil em uma/duas mãos; confira que Hex permanece normal; faça dois ataques da ação Atacar com GWM, depois um ataque de oportunidade e um bônus; teste Duelismo com escudo/outra arma; arremesse e ataque corpo a corpo com a mesma arma; teste modificador positivo e negativo no ataque secundário.

## Fontes

- [Great Weapon Fighting e restrição aos dados da arma — Sage Advice oficial](https://www.dndbeyond.com/sources/dnd/sae/sage-advice-compendium#SAC-Feat-GreatWeaponFighting1).
- [Great Weapon Master 2024 — ficha oficial de Bobby](https://media.dndbeyond.com/compendium-images/uhlh/downloads/bobby-character-sheet.pdf).
- [Duelismo — PHB 2024 no compêndio licenciado Roll20](https://roll20.net/compendium/dnd5e/Feats:Dueling?expansion=32231).
- [Armas de Arremesso — PHB 2024 no compêndio licenciado Roll20](https://roll20.net/compendium/dnd5e/Feats:Thrown%20Weapon%20Fighting?expansion=32231).
- [Great Weapon Fighting no sistema: efeito não automatizado](https://github.com/foundryvtt/dnd5e/blob/release-6.0.6/packs/_source/feats24/fighting-style-feats/great-weapon-fighting.yml).
- [Two-Weapon Fighting no sistema: efeito não automatizado](https://github.com/foundryvtt/dnd5e/blob/release-6.0.6/packs/_source/feats24/fighting-style-feats/two-weapon-fighting.yml).
- [Construção das parcelas básicas e modo offhand](https://github.com/foundryvtt/dnd5e/blob/release-6.0.6/module/data/activity/attack-data.mjs).
- [Gancho de construção da rolagem](https://github.com/foundryvtt/dnd5e/blob/release-6.0.6/module/dice/basic-roll.mjs).
