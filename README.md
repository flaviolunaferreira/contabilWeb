# 💰 Sistema de Controle Financeiro Mobile

Um aplicativo completo de gestão financeira pessoal desenvolvido com **Capacitor**, **Tailwind CSS** e **Chart.js**, projetado para funcionar perfeitamente tanto no navegador quanto em dispositivos móveis Android.

## 🌟 Características Principais

### 📱 **Multi-Plataforma**
- **Web**: Funciona em qualquer navegador moderno
- **Mobile**: Aplicativo Android nativo via Capacitor
- **Responsivo**: Interface adaptada para qualquer tamanho de tela

### 🎯 **Funcionalidades Principais**

#### 🏠 **Dashboard Inteligente**
- **Visão 360°** da sua situação financeira atual
- **5 Cartões Informativos**:
  - 💙 Saldo Realizado (dinheiro atual em caixa)
  - 💚 Previsão de Saldo Total (estimativa futura)
  - ❤️ Total de Despesas Previstas (contas a pagar)
  - 💎 Total a Receber (dinheiro por vir)
  - 💜 Total Pago (gastos já realizados)
- **Drill-down**: Clique nos cartões para ver detalhes das transações
- **Tabela Histórica**: Últimas transações com ordenação inteligente

#### ➕ **Gestão de Transações**
- **Adicionar Receitas e Despesas** com facilidade
- **Categorização** automática e manual
- **Status** realizado vs. previsto
- **Edição in-line**: Clique em qualquer transação para editar
- **Validação** completa de dados

#### 📊 **Previsões Avançadas**
- **Planejamento Financeiro** de longo prazo
- **Sistema de Filtros Completo**:
  - 📅 Por período (7 dias, 30 dias, 6 meses, 1 ano, personalizado)
  - 🏷️ Por categoria
  - 💰 Por tipo (receita/despesa)
  - 🔢 Por faixa de valor
  - 📝 Por descrição
  - ✅ Por status
- **Exportação** e análise de dados

#### 📈 **Visualização de Dados**
- **7 Tipos de Gráficos Diferentes**:
  - 🥧 Gráfico de Pizza (distribuição por categoria)
  - 📊 Gráfico de Barras (comparativo mensal)
  - 📈 Gráfico de Linha (tendências temporais)
  - 🏔️ Gráfico de Área (fluxo acumulado)
  - 🍩 Gráfico de Rosca (status das transações)
  - 📊 Gráfico de Barras Horizontal (ranking de categorias)
  - 📊 Estatísticas Detalhadas
- **Filtros Temporais**: Últimos 30 dias, 6 meses, 1 ano
- **Análise Inteligente** com insights automáticos

#### 💡 **Sistema de Ajuda Integrado**
- **Tooltips Contextuais**: Ajuda específica para cada campo
- **Modal de Ajuda Geral**: Guia completo do sistema
- **Navegação Intuitiva**: Interface autoexplicativa

## 🛠️ **Tecnologias Utilizadas**

### Frontend
- **HTML5** + **CSS3** + **JavaScript ES6+**
- **Tailwind CSS** - Framework de design responsivo
- **Chart.js** - Biblioteca de gráficos interativos

### Mobile
- **Capacitor** - Framework híbrido para apps nativos
- **Capacitor SQLite** - Banco de dados local

### Armazenamento
- **SQLite** (dispositivos móveis)
- **localStorage** (navegadores web)
- **Detecção automática** do ambiente

## 🚀 **Como Usar**

### 📖 **Passo a Passo**

#### 1. **Primeira Visita - Dashboard**
1. Ao abrir o app, você verá o **Dashboard** com os cartões informativos
2. Inicialmente, todos os valores serão R$ 0,00
3. Clique no **botão de ajuda (?)** no canto superior direito para orientações gerais

#### 2. **Adicionando Sua Primeira Transação**
1. Toque no botão **"+"** na barra inferior
2. Preencha os campos:
   - **Tipo**: Receita (dinheiro que entra) ou Despesa (dinheiro que sai)
   - **Valor**: Digite apenas números (ex: 1500.50)
   - **Descrição**: Seja específico (ex: "Salário Janeiro 2024")
   - **Categoria**: Escolha ou crie uma nova
   - **Data**: Data da transação
   - **Status**: Realizado (já aconteceu) ou Previsto (vai acontecer)
3. Toque em **"Adicionar"**

#### 3. **Explorando o Dashboard**
1. Volte ao **Dashboard** (ícone de casa)
2. Observe como os cartões foram atualizados
3. **Clique nos cartões** para ver detalhes das transações
4. **Clique nas linhas da tabela** para editar transações

#### 4. **Planejando com Previsões**
1. Vá para **"Previsões"** (ícone de gráfico)
2. Veja todas as transações futuras
3. Use os **filtros** para encontrar informações específicas:
   - Filtre por período para ver apenas os próximos 7 dias
   - Filtre por categoria para ver apenas "Alimentação"
   - Combine filtros para buscas precisas

#### 5. **Analisando com Gráficos**
1. Acesse a aba **"Gráficos"**
2. Explore os diferentes tipos de visualização
3. Use os filtros de período para análises temporais
4. Clique em **"Atualizar Gráficos"** para refresh

### 🎯 **Dicas de Uso Avançado**

#### 💰 **Gestão Inteligente**
- **Categorize bem**: Use categorias específicas como "Alimentação", "Transporte", "Moradia"
- **Seja detalhista**: Descrições claras ajudam na análise futura
- **Use previsões**: Registre gastos futuros para melhor planejamento
- **Revise regularmente**: Marque transações previstas como realizadas

#### 📊 **Análise de Dados**
- **Dashboard diário**: Comece sempre pelo Dashboard para visão geral
- **Filtros de previsão**: Use para planejar períodos específicos
- **Gráficos mensais**: Analise tendências e padrões de gastos
- **Drill-down**: Sempre que ver um valor interessante, clique para detalhes

#### 🔍 **Recursos Escondidos**
- **Ordenação**: Clique nos cabeçalhos das tabelas para ordenar
- **Edição rápida**: Clique em qualquer linha de transação para editar
- **Tooltips**: Passe o mouse sobre ícones (?) para ajuda específica
- **Modal de detalhes**: Clique nos cartões do Dashboard para análise detalhada

## 📱 **Instalação**

### 🌐 **Uso via Navegador**
1. Baixe os arquivos do projeto
2. Abra `www/index.html` em qualquer navegador moderno
3. Pronto! O sistema funcionará com localStorage

### 📲 **Instalação Mobile (Android)**
```bash
# Pré-requisitos: Node.js, Android Studio

# 1. Instalar dependências
npm install

# 2. Sincronizar com plataforma Android
npx cap sync android

# 3. Abrir no Android Studio
npx cap open android

# 4. Executar no dispositivo/emulador
# Pelo Android Studio: Run > Run 'app'
```

## 🎨 **Interface e Navegação**

### 🧭 **Barra de Navegação Inferior**
- 🏠 **Home**: Dashboard principal
- ➕ **Adicionar**: Nova transação
- 📊 **Previsões**: Planejamento futuro
- 📈 **Gráficos**: Visualização de dados

### 🎯 **Elementos Interativos**
- **Cartões clicáveis** no Dashboard
- **Cabeçalhos ordenáveis** nas tabelas
- **Linhas editáveis** nas transações
- **Filtros dinâmicos** nas previsões
- **Gráficos interativos** com tooltips

### 💡 **Sistema de Cores**
- 💙 **Azul**: Saldo atual/informações
- 💚 **Verde**: Receitas/valores positivos
- ❤️ **Vermelho**: Despesas/valores negativos
- 💜 **Roxo**: Estatísticas especiais
- 🧡 **Laranja**: Alertas e destaques

## 🔧 **Funcionalidades Técnicas**

### 💾 **Armazenamento Inteligente**
- **Auto-detecção** do ambiente (mobile vs web)
- **SQLite** para performance em mobile
- **localStorage** para compatibilidade web
- **Sincronização** automática entre interfaces

### 📊 **Análise de Dados**
- **Cálculos em tempo real** dos saldos
- **Filtros combinados** para análises precisas
- **Ordenação dinâmica** em todas as tabelas
- **Visualizações interativas** com Chart.js

### 🎨 **Design Responsivo**
- **Mobile-first** approach
- **Adaptação automática** para diferentes telas
- **Touch-friendly** em dispositivos móveis
- **Hover effects** em desktops

## 🤝 **Suporte e Ajuda**

### 🆘 **Recursos de Ajuda**
1. **Botão de Ajuda Geral** (? no canto superior direito)
2. **Tooltips Contextuais** (ícones ? ao lado dos campos)
3. **Esta documentação** README.md
4. **Interface intuitiva** com feedback visual

### 🐛 **Resolução de Problemas**

#### ❌ **Problemas Comuns**
- **Gráficos não aparecem**: Verifique conexão com internet (Chart.js CDN)
- **Dados não salvam**: Verifique permissões do navegador para localStorage
- **App mobile não conecta**: Verifique instalação do Capacitor e plugins

#### ✅ **Soluções Rápidas**
- **Refresh da página**: Resolve a maioria dos problemas de interface
- **Limpar cache**: Se dados parecem inconsistentes
- **Reinstalar app**: Para problemas persistentes no mobile

## 🏆 **Vantagens do Sistema**

### 💪 **Pontos Fortes**
- ✅ **100% Offline**: Funciona sem internet após carregar
- ✅ **Multi-plataforma**: Web + Android nativo
- ✅ **Interface moderna**: Design 2024 com Tailwind CSS
- ✅ **Análise avançada**: 7 tipos de gráficos diferentes
- ✅ **Filtros poderosos**: Encontre qualquer transação rapidamente
- ✅ **Ajuda integrada**: Sistema de help contextual completo
- ✅ **Performance**: Otimizado para dispositivos móveis
- ✅ **Escalável**: Suporta milhares de transações

### 🎯 **Casos de Uso Ideais**
- 👤 **Pessoas físicas** controlando finanças pessoais
- 👨‍👩‍👧‍👦 **Famílias** organizando orçamento doméstico
- 🏪 **Pequenos negócios** com controle simples
- 🎓 **Estudantes** aprendendo educação financeira
- 👴 **Aposentados** acompanhando receitas/despesas

## 📈 **Roadmap Futuro**

### 🔮 **Próximas Funcionalidades**
- 🔄 **Sincronização na nuvem**
- 🔔 **Notificações de vencimentos**
- 💳 **Integração bancária**
- 📱 **Versão iOS**
- 🎯 **Metas financeiras**
- 🤖 **IA para categorização automática**

---

## 📞 **Contato e Contribuição**

Este sistema foi desenvolvido como uma solução completa de controle financeiro, priorizando **simplicidade**, **performance** e **usabilidade**. 

### 🎉 **Aproveite seu controle financeiro!**

*"A riqueza não está em ter muito dinheiro, mas em saber exatamente onde cada centavo está sendo gasto."*

---
**Sistema de Controle Financeiro Mobile v1.0** 🏆
*Desenvolvido com ❤️ para facilitar sua vida financeira*