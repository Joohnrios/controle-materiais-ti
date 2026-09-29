# Controle de materiais de TI

Aplicativo para o suporte técnico controlar o que é de TI: suprimentos de impressora, descartes, patrimônios, ramais e computadores. A primeira versão roda neste computador, no navegador, e começa vazia.

## O que dá para fazer

- Ver no dashboard o que pede ação (estoque baixo, cadastro incompleto, descartes do mês) e os totais do cadastro.
- Controlar impressoras, toners e peças, com entrada, saída e histórico.
- Registrar descartes e filtrar por período, tipo, fabricante, setor e responsável.
- Cadastrar patrimônios de TI, ramais e computadores. O tombo fica no patrimônio; computador e ramal apontam para ele.
- Marcar conferência de inventário e consultar o histórico de alterações.
- Exportar a lista filtrada em PDF e Excel.
- Trocar o tema entre claro, escuro e o do sistema.
- Exportar e importar um backup com todos os dados.

O modo **Consulta** só visualiza e exporta. O uso neste computador começa como **Administrador**. Login, API e banco ainda não existem.

## Como abrir

É preciso ter [Node.js](https://nodejs.org/) 22 ou mais recente.

```powershell
cd controle-materiais-ti
npm install
npm run dev
```

Abra http://127.0.0.1:5173/

Para gerar a versão de produção:

```powershell
npm run build
npm run preview
```

## Onde ficam os dados

O cadastro fica no navegador, neste computador (`localStorage`). Ele não faz parte do código e não sobe para o GitHub.

Parar o servidor não apaga os registros. Eles somem se você limpar os dados do site, abrir outro navegador ou usar outro computador.

Antes de trocar de máquina, use **Configurações → Exportar backup**. O arquivo é um JSON com tudo. Guarde esse arquivo fora do repositório. A importação substitui o que está salvo naquele navegador.

O tema (claro, escuro ou sistema) também fica só neste navegador e não entra no backup.

## O que não entra no GitHub

O `.gitignore` deixa de fora:

- `node_modules` e a pasta `dist`
- arquivos `.env` e qualquer segredo local
- backups `backup-*.json`
- planilhas `.xlsx` exportadas

Não coloque backup, planilha nem dado real de tombo, IP ou nome de pessoa dentro desta pasta antes de enviar ao GitHub.

## Pastas

- `src/pages` — telas
- `src/components` — layout e peças visuais
- `src/domain` — tipos e regras (estoque, rótulos)
- `src/data` — repositório. Hoje grava no navegador. Amanhã a mesma porta pode falar com uma API
- `src/lib` — datas, PDF, Excel e tema

## Próximo passo

Backend com API e banco, para o cadastro não depender de um único navegador. As telas já passam pelo repositório, então essa troca não exige reescrever as páginas.
