# Histórico

## 0.5.0 — 2026-11-19

- Cinco perfis de combate 2024: Great Weapon Fighting, Great Weapon Master, Duelismo, Armas de Arremesso e Duas Armas, sem macros na ficha.
- Botão Combate nas características para selecionar/desativar o perfil; reconhecimento automático exige edição 2024.
- Mínimo 3 apenas nos dados básicos da arma; proficiência de GWM mediante confirmação de ação Atacar no próprio turno; lembrete de Hew sem conceder ataque grátis.
- Usa as parcelas e empunhadura do sistema; ignora automações equivalentes detectadas. Arquearia/Defesa permanecem nativas.
- 114 testes simulados aprovados. Leia COMBAT.md para condições e limites; sem validação em uma sessão real do Foundry.

## 0.4.0 — 2026-11-19

- Reconhecimento de Hunter's Mark, Bestow Curse, Hex e Conjure Minor Elementals em 10 idiomas: inglês, português, espanhol, francês, alemão, italiano, polonês, russo, japonês e chinês. Tabela e fontes em LANGUAGES.md; interface em português.
- Normalização preserva alfabetos não latinos, aceita títulos bilíngues da mesma magia e sufixos de edição. Inclui Marca do Predador, Marca do Caçador, Bruxaria e Danação.
- Conjure Minor Elementals 2024: efeito no conjurador, concentração de até 10 minutos, dano em ataques dentro de 15 pés/4,5 m, escolha de ácido/frio/fogo/elétrico por ataque e escala corrigida pela errata (+1d8 por espaço acima do 4º). A versão 2014 não é reconhecida automaticamente como esse perfil.
- Alcance consultado no Midi-QOL; terreno difícil e desenho da emanação permanecem manuais. Uma rolagem por alvo/ataque.
- 89 testes locais de lógica e integração simulada. Sem validação em uma sessão real de Foundry; requisitos de instalação preservados.

## 0.3.2 — 28/10/2026

- Reconhece Hunter's Mark traduzida como **Marca do Predador**, incluindo o identificador `marca-do-predador` confirmado no diagnóstico do usuário. A ausência desse nome impedia a criação da solicitação de marca, sem gerar erro.
- Aceita os sufixos 2014/2024 nas traduções Marca do Predador e Marca do Caçador, preservando a seleção de edição e a opção de desativar o perfil.
- 55 testes simulados; inclui conjuração e aplicação pelo mestre com os dados da magia relatada. Após atualizar, conjure novamente: usos antigos sem solicitação não são reaplicados automaticamente.

## 0.3.1 — 27/10/2026

- Corrige dano ausente de Hunter's Mark e Hex com a checagem automática de acertos do Midi desativada: listas vazias nesse modo não significam necessariamente erro do ataque.
- Usa o resultado disponível da rolagem; quando desconhecido, pede confirmação do acerto antes de adicionar o bônus. Erros confirmados, recusa e fechamento não concedem dano.
- Mantém a checagem automática do Midi como autoridade quando habilitada; preserva bônus de terceiros e críticos.
- Revalida concentração após a confirmação e ignora workflows abortados.
- Atualiza requisitos para Foundry 14.369+, D&D 5e 6.0.6+ e Midi-QOL 14.6.4+ (este requer DAE 14.6.3+).
- 53 testes simulados, incluindo regressões do dano nos três perfis Hunter 2014/2024 e Hex. Validação no mundo do usuário ainda necessária.

## 0.3.0 — 10/10/2026

- Atualiza a integração para Midi-QOL 14.6.0 e D&D 5e 6.x; APIs conferidas no sistema 6.0.6.
- Lê item e atividade pelas APIs dos cartões do sistema, com validação da atividade que originou a mensagem.
- Usa `system.concentration` e `system.level`, evitando concentração anterior e nível básico incorreto em magias conjuradas com espaços superiores.
- Valida o alvo registrado e a resistência; resultados desconhecidos ou bem-sucedidos não aplicam Bestow Curse.
- Aceita workflows executados pelo mestre em nome do autor, mantendo a validação de controle do conjurador.
- Ignora atualizações de chat alheias à solicitação de marca e workflows cancelados.
- Preserva marcas existentes e permite ler metadados legados quando os campos atuais não existem.
- 42 testes locais/simulados. Validação em sessão real pendente.

## 0.2.0

- Aplicação das marcas diretamente pelas magias, integração de dano com Midi-QOL e vínculo de concentração.
- Destinada à linha D&D 5e 5.3.x / Midi-QOL 14.0.x.

