# Melhorias no Sistema de Agrupamento por Período

## 📋 Resumo

Este documento descreve as melhorias implementadas no sistema de controle financeiro para permitir demonstrativos por diferentes períodos (dia, semana, mês) mantendo a visualização mensal.

## 🎯 Objetivo

Apesar de mostrar as informações agrupadas por mês, o usuário agora pode escolher visualizar demonstrativos detalhados por:
- **Descrição** (agrupamento original)
- **Dia** (cada dia separado)
- **Semana** (agrupamento semanal)
- **Mês** (agrupamento mensal)

## ✨ Funcionalidades Implementadas

### 1. Dashboard (Página Inicial)

#### Controle de Agrupamento
- **Localização**: Logo abaixo do campo "Prever Saldo para o dia"
- **Opções disponíveis**:
  - Por Descrição (padrão)
  - Por Dia
  - Por Semana
  - Por Mês

#### Comportamento Dinâmico
- O título da tabela muda dinamicamente conforme a seleção:
  - "Resumo por Descrição"
  - "Demonstrativo por Dia"
  - "Demonstrativo por Semana"
  - "Demonstrativo por Mês"

- O cabeçalho da primeira coluna muda de "Descrição" para "Período" quando não está agrupando por descrição

#### Visualização de Dados
Para cada agrupamento, a tabela mostra:
- **Período/Descrição**: Nome formatado do período ou descrição
- **Qtd**: Quantidade de transações no período
- **Total**: Valor total (pago + previsto)
- **Pago/Recebido**: Valores já realizados
- **Restante**: Valores ainda previstos

### 2. Página de Relatórios

#### Novo Filtro de Agrupamento
- **Localização**: Junto aos outros filtros (Período, Categoria, Descrição)
- **Opções**:
  - Sem Agrupamento (lista individual)
  - Por Dia
  - Por Semana
  - Por Mês
  - Por Categoria

#### Visualização com Agrupamento
Quando um agrupamento está selecionado:
- As transações são organizadas em grupos com cabeçalhos destacados
- Cada cabeçalho de grupo mostra:
  - Nome do período formatado
  - Quantidade de transações
  - Total de Receitas
  - Total de Despesas
  - Saldo do período
- As transações dentro do grupo aparecem com leve indentação

### 3. Modal de Detalhes

#### Novas Funcionalidades
- Ao clicar em um período agrupado, abre modal com todas as transações daquele período
- Mantém a funcionalidade original de clicar em descrições
- Exibe totais separados (Total Geral, Total Pago, Total Restante)

## 🔧 Implementações Técnicas

### Frontend

#### Arquivos Modificados

1. **www/index.html**
   - Adicionado seletor `agrupamentoPeriodo` no Dashboard
   - Adicionado seletor `agrupamentoRelatorio` na página de Relatórios
   - Atualizado cabeçalhos da tabela de resumo para serem dinâmicos

2. **www/js/utils/DateUtils.js**
   - **Novas funções**:
     - `inicioDoDia()`: Retorna início do dia (00:00:00)
     - `fimDoDia()`: Retorna fim do dia (23:59:59)
     - `inicioDaSemana()`: Retorna início da semana (domingo)
     - `fimDaSemana()`: Retorna fim da semana (sábado)
     - `inicioDoMes()`: Retorna primeiro dia do mês
     - `fimDoMes()`: Retorna último dia do mês
     - `formatarPeriodo()`: Formata período de forma legível
     - `obterChaveAgrupamento()`: Gera chave única para agrupamento
     - `formatarChaveAgrupamento()`: Formata chave para exibição

3. **www/script.js**
   - **Variáveis globais**:
     - Adicionado `agrupamentoPeriodoEl` para controlar o seletor
   
   - **Funções modificadas**:
     - `renderSummaryByDescription()`: Agora suporta múltiplos tipos de agrupamento
     - `renderAllTransactionsTable()`: Renderiza com ou sem agrupamento
   
   - **Novas funções**:
     - `showDashboardDetailsByPeriod()`: Exibe detalhes de um período específico
     - `renderDashboardDetailsModal()`: Função auxiliar para renderizar modal de detalhes
   
   - **Event Listeners**:
     - Listener para mudança no seletor de agrupamento do dashboard
     - Listener para mudança no seletor de agrupamento de relatórios

### Backend

#### Arquivos Modificados

1. **server/services/FinancialService.js**
   - **Novos métodos**:
     - `getTransactionsByPeriod()`: Agrupa transações por período usando SQL
       - Parâmetros: startDate, endDate, groupBy ('day', 'week', 'month')
       - Retorna: Array com dados agregados por período
     
     - `getTransactionsByDescription()`: Agrupa transações por descrição
       - Parâmetros: startDate, endDate
       - Retorna: Array com dados agregados por descrição

2. **server/index.js**
   - **Novos endpoints**:
     - `GET /api/financial/by-period`: Retorna transações agrupadas por período
       - Query params: startDate, endDate, groupBy
     
     - `GET /api/financial/by-description`: Retorna transações agrupadas por descrição
       - Query params: startDate, endDate

## 📊 Exemplos de Uso

### Dashboard - Agrupamento por Dia
```
Demonstrativo por Dia
┌─────────────────────────────┬─────┬───────────┬──────────────┬───────────┐
│ Período                     │ Qtd │ Total     │ Pago/Recebido│ Restante  │
├─────────────────────────────┼─────┼───────────┼──────────────┼───────────┤
│ Segunda-feira, 27/01/2026   │ 5   │ R$ 850,00 │ R$ 350,00    │ R$ 500,00 │
│ Terça-feira, 28/01/2026     │ 3   │ R$ 420,00 │ R$ 120,00    │ R$ 300,00 │
└─────────────────────────────┴─────┴───────────┴──────────────┴───────────┘
```

### Dashboard - Agrupamento por Semana
```
Demonstrativo por Semana
┌─────────────────────────────┬─────┬──────────────┬──────────────┬───────────┐
│ Período                     │ Qtd │ Total        │ Pago/Recebido│ Restante  │
├─────────────────────────────┼─────┼──────────────┼──────────────┼───────────┤
│ Semana de 26/01 a 01/02/2026│ 12  │ R$ 2.450,00  │ R$ 1.200,00  │ R$ 1.250,00│
│ Semana de 02/02 a 08/02/2026│ 8   │ R$ 1.890,00  │ R$ 890,00    │ R$ 1.000,00│
└─────────────────────────────┴─────┴──────────────┴──────────────┴───────────┘
```

### Relatórios - Agrupamento por Mês
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Janeiro 2026 (15 transações)
  Receitas: R$ 5.000,00  |  Despesas: R$ 3.200,00  |  Saldo: R$ 1.800,00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  15/01/2026  Salário           Realizado    R$ 5.000,00
  10/01/2026  Aluguel           Realizado   -R$ 1.200,00
  12/01/2026  Mercado (1/3)     Previsto    -R$ 450,00
  ...
```

## 🎨 Características Visuais

### Formatação de Períodos
- **Dia**: "Segunda-feira, 27/01/2026"
- **Semana**: "Semana de 26/01 a 01/02/2026"
- **Mês**: "Janeiro 2026"

### Cores e Indicadores
- **Verde**: Receitas e saldos positivos
- **Vermelho**: Despesas
- **Azul**: Valores previstos positivos
- **Laranja**: Valores previstos negativos
- **Cinza**: Valores zerados

## 🔄 Fluxo de Dados

```
Usuário seleciona agrupamento
        ↓
Frontend: renderSummaryByDescription() ou renderAllTransactionsTable()
        ↓
DateUtils.obterChaveAgrupamento() - gera chave de agrupamento
        ↓
Transações são agrupadas por chave
        ↓
DateUtils.formatarChaveAgrupamento() - formata para exibição
        ↓
Renderização na tabela com totais calculados
```

## 🚀 Como Usar

### No Dashboard

1. Acesse a página inicial (Dashboard)
2. Localize o campo "Prever Saldo para o dia"
3. Logo abaixo, selecione o tipo de agrupamento desejado
4. A tabela será automaticamente atualizada
5. Clique em qualquer linha para ver os detalhes

### Na Página de Relatórios

1. Acesse a aba "Relatórios" no menu inferior
2. Configure os filtros de período, categoria e descrição conforme desejado
3. No campo "Agrupar Por", selecione o tipo de agrupamento
4. As transações serão organizadas em grupos com subtotais

## ⚡ Performance

- Agrupamentos são calculados em tempo real no frontend
- Nenhuma consulta adicional ao banco de dados local (localStorage)
- Backend oferece endpoints otimizados com SQL para futuras integrações
- Ordenação cronológica automática dos períodos

## 🔮 Melhorias Futuras Sugeridas

1. **Exportação de Dados**
   - Exportar relatórios agrupados em Excel/PDF
   - Incluir gráficos por período

2. **Comparação de Períodos**
   - Comparar mês atual vs mês anterior
   - Mostrar variação percentual

3. **Filtros Avançados**
   - Combinar múltiplos agrupamentos
   - Filtro por status (realizado/previsto)

4. **Gráficos Dinâmicos**
   - Gráfico de barras por período
   - Linha do tempo de despesas

5. **Persistência de Preferências**
   - Salvar último agrupamento selecionado
   - Configurações personalizadas por usuário

## 📝 Notas de Implementação

- Todas as datas são tratadas no formato ISO (YYYY-MM-DD) internamente
- A formatação para exibição é sempre em português brasileiro
- O sistema é compatível com todas as funcionalidades existentes
- Não há necessidade de migração de dados

## ✅ Testes Recomendados

1. Testar cada tipo de agrupamento no Dashboard
2. Verificar formatação de datas em diferentes períodos
3. Validar totais calculados em cada agrupamento
4. Testar modal de detalhes para cada tipo de agrupamento
5. Verificar responsividade em diferentes resoluções
6. Testar com grande volume de transações

## 🐛 Troubleshooting

### Problema: Agrupamento não aparece
- Verifique se há transações no período selecionado
- Confirme que o campo "Prever Saldo para o dia" está preenchido

### Problema: Datas não formatadas corretamente
- Verifique se o arquivo DateUtils.js está carregado
- Confirme que não há erros no console do navegador

### Problema: Totais incorretos
- Limpe o cache do navegador
- Verifique se todas as transações têm status definido (realizado/previsto)

---

**Data da Implementação**: 25 de Janeiro de 2026  
**Versão**: 2.0.0  
**Desenvolvedor**: Sistema ContabilWeb
