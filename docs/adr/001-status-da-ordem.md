# Status da ordem é uma máquina de estados

Uma ordem de serviço não é um campo livre. O técnico não pode marcar como entregue um aparelho que ainda nem foi diagnosticado, e a interface não é o lugar certo para impedir isso: um cliente HTTP, um script ou uma segunda aba conseguiriam pular a regra.

## Opções

- Confiar nos botões da tela e gravar qualquer status enviado.
- Guardar um histórico de eventos e calcular o status atual.
- Registrar as transições permitidas no servidor e rejeitar o resto com 422.

## Decisão

A API guarda o status atual e só aceita as saídas definidas em `order-status.ts`:

- aberto → em diagnóstico
- em diagnóstico → aguardando peça ou pronto
- aguardando peça → em diagnóstico ou pronto
- pronto → entregue
- entregue não tem saída

A resposta de cada ordem inclui `allowedTransitions`, então o painel não duplica a regra. A troca usa `updateMany` filtrando o status lido antes. Se outra requisição mudou a ordem no meio do caminho, a atualização não grava e a API pede para recarregar.

## Consequência

Incluir um atalho novo, por exemplo cancelar a ordem, é uma mudança de domínio com teste, não um `if` na tela. O histórico completo de quem mudou o quê fica para uma próxima versão: hoje só o responsável da primeira transição é gravado.
