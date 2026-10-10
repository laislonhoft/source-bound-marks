# Histórico

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
