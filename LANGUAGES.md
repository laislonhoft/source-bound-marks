# Reconhecimento de magias em 10 idiomas

**Spell-name recognition in 10 languages.** O módulo reconhece os nomes abaixo tanto no nome da magia quanto em seu identificador, independentemente do idioma da interface do Foundry. A interface do módulo continua em português. A seleção cobre dez idiomas de comunidades e traduções disponíveis; não representa um ranking estatístico de uso do Foundry.

| Idioma | Hunter's Mark | Bestow Curse | Hex | Conjure Minor Elementals |
|---|---|---|---|---|
| Inglês | Hunter's Mark | Bestow Curse | Hex | Conjure Minor Elementals |
| Português | Marca do Caçador; Marca do Predador | Rogar Maldição; Lançar Maldição; Impor Maldição | Bruxaria; Danação | Conjurar Elementais Menores; Invocar Elementais Menores |
| Espanhol | Marca del cazador | Imponer maldición | Maleficio | Conjurar elementales menores |
| Francês | Marque du chasseur | Malédiction | Maléfice | Invocation d’élémentaires mineurs |
| Alemão | Zeichen des Jägers | Fluch | Verwünschung; Verwünschen | Schwache Elementare beschwören |
| Italiano | Marchio del cacciatore | Scagliare maledizione | Sortilegio | Evoca elementali minori |
| Polonês | Znak łowcy | Nałożenie klątwy | Urok | Wyczarowanie mniejszych żywiołaków |
| Russo | Метка охотника | Проклятие; Наложение проклятия | Сглаз | Призыв малых элементалей |
| Japonês | ハンターズ・マーク | ビストウ・カース | ヘクス; 呪い(ヘクス) | カンジャー・マイナー・エレメンタルズ |
| Chinês | 猎人印记; 獵人印記 | 降咒 | 脆弱诅咒; 脆弱詛咒 | 咒唤微元素群; 咒喚微元素群 |

Maiúsculas, acentos latinos, apóstrofos, espaços e hífens não precisam coincidir. Os alfabetos não latinos são preservados. São aceitos sufixos 2014/2024 e títulos bilíngues como `Сглаз [Hex]`, desde que ambas as partes correspondam à mesma magia. `Beston Curse` permanece como tolerância ao erro de digitação legado. Nomes completamente personalizados podem usar o botão **Marca** para escolher o perfil.

**Conjure Minor Elementals só automatiza a versão 2024.** O nome traduzido sozinho não distingue as regras: a magia deve indicar `system.source.rules = "2024"`, ter o sufixo `(2024)` ou receber o perfil 2024 explicitamente pelo botão Marca. A versão 2014 invoca criaturas e não é automatizada por esse perfil. Traduções antigas podem fornecer nomes úteis, mas não convertem o conteúdo de um item 2014 em 2024.

## Fontes dos nomes

Consulta em novembro de 2026. Usamos títulos oficiais onde disponíveis e títulos publicados pelas comunidades de tradução nos demais casos; não afirmamos que todas as variantes sejam traduções oficiais da Wizards.

- Inglês e regras: [SRD oficial](https://www.dndbeyond.com/srd) e [Conjure Minor Elementals 2024](https://www.dndbeyond.com/spells/2619049-conjure-minor-elementals).
- Espanhol: [SRD 5.2.1 oficial](https://media.dndbeyond.com/compendium-images/srd/5.2/SP_SRD_CC_v5.2.1.pdf).
- Francês: [SRD 5.2.1 oficial](https://media.dndbeyond.com/compendium-images/srd/5.2/FR_SRD_CC_v5.2.1.pdf).
- Alemão: [SRD 5.2.1 oficial](https://media.dndbeyond.com/compendium-images/srd/5.2/DE_SRD_CC_v5.2.1.pdf). O documento contém Verwünschen na lista e Verwünschung no título; ambos são aceitos.
- Italiano: [SRD 5.2.1 oficial](https://media.dndbeyond.com/compendium-images/srd/5.2/IT_SRD_CC_v5.2.1.pdf).
- Português: variantes legadas do módulo, o nome **Marca do Predador** confirmado em uma ficha de usuário e [catálogo comparativo de traduções](https://pt.scribd.com/document/616807807/Spells-translations), usado como referência comunitária para Danação/Bruxaria e Invocar/Conjurar Elementais Menores. As variantes extras são aliases de compatibilidade, não uma certificação de tradução oficial.
- Polonês: [catálogo do projeto de tradução Lioheart/lang-pl-dnd5](https://github.com/Lioheart/lang-pl-dnd5/blob/main/lang/pl/compendium/dnd5e.spells24.json).
- Russo: [Bestow Curse 2014](https://dnd.su/spells/285-bestow-curse/), [Bestow Curse 2024](https://next.dnd.su/spells/10441-bestow-curse/), [Hex](https://www.dnd.su/spells/312-hex/) e [Conjure Minor Elementals](https://next.dnd.su/spells/10209-conjure-minor-elementals/), catálogos comunitários D&D.su.
- Japonês: [catálogo BrotherSharper/dnd5eja](https://github.com/BrotherSharper/dnd5eja/blob/master/compendium/dnd5e.spells.json) e [tradução comunitária dos feitiços de nível 1 de 2024](https://wikiwiki.jp/5erpg2024/プレイヤー/7．呪文/1レベル呪文) para Hex.
- Chinês: [catálogo comunitário de nomes Huiji](https://dnd.huijiwiki.com/wiki/Wikitext/Data%3Aspellnamelist.json). As variantes em caracteres tradicionais são equivalentes gráficos adicionados para reconhecimento, não outra edição oficial.

Os dados utilizados para reconhecimento estão em [scripts/spell-names.mjs](scripts/spell-names.mjs). O módulo não distribui descrições completas nem compêndios de magias.
