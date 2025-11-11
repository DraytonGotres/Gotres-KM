# GOTRES-KM - Sistema de Gestão de Frota

<div align="center">
  <img src="public/logo.png" alt="GOTRES-KM Logo" width="200"/>
  
  ### Sistema moderno de gestão de frota de veículos
  
  [![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)
  [![PWA](https://img.shields.io/badge/PWA-Enabled-purple)](https://web.dev/progressive-web-apps/)
</div>

---

## 🚀 Funcionalidades

### 📋 Gestão de Veículos
- ✅ Cadastro completo de veículos
- ✅ Fabricantes brasileiros pré-cadastrados
- ✅ Informações de modelo, placa, cor e ano
- ✅ Edição e exclusão de veículos

### ⛽ Controle de Abastecimentos
- ✅ Registro de abastecimentos com cálculo automático
- ✅ Preço por litro e custo total
- ✅ Cálculo automático de consumo (km/L)
- ✅ KM anterior preenchido automaticamente
- ✅ Histórico completo de abastecimentos
- ✅ Edição e exclusão de registros

### 🔧 Gestão de Manutenções
- ✅ Registro de manutenções por tipo
- ✅ Tipos de manutenção pré-definidos
- ✅ Controle de custos e quilometragem
- ✅ Histórico detalhado

### 📊 Relatórios e Análises
- ✅ Filtros por veículo, período (mensal/anual/personalizado)
- ✅ Gráficos de pizza (custos por veículo e tipo de manutenção)
- ✅ Gráficos de barras (custos mensais)
- ✅ Gráfico de linha (evolução do consumo)
- ✅ Cards com estatísticas gerais

### 📱 PWA (Progressive Web App)
- ✅ Instalável em celular e desktop
- ✅ Funciona offline
- ✅ Ícone na tela inicial
- ✅ Experiência de app nativo

---

## 🛠️ Tecnologias

- **[Next.js 14](https://nextjs.org/)** - Framework React
- **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática
- **[Tailwind CSS](https://tailwindcss.com/)** - Estilização
- **[Supabase](https://supabase.com/)** - Banco de dados PostgreSQL
- **[Chart.js](https://www.chartjs.org/)** - Gráficos interativos
- **[Lucide React](https://lucide.dev/)** - Ícones
- **[date-fns](https://date-fns.org/)** - Manipulação de datas

---

## 📦 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/Gotres-Projetos/Gotres-KM.git
cd Gotres-KM
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o Supabase

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em **SQL Editor** e execute o arquivo `supabase-setup.sql`
4. Se já tiver dados, execute também `supabase-migration-add-price.sql`

### 4. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
```

### 5. Execute o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

---

## 🎨 Ícones do PWA

Para que o PWA funcione corretamente, crie os ícones:

1. Use sua logo e redimensione para:
   - `public/icon-192.png` (192x192 pixels)
   - `public/icon-512.png` (512x512 pixels)

2. Ou use: [PWA Builder Image Generator](https://www.pwabuilder.com/imageGenerator)

---

## 📱 Como Instalar o PWA

### Android (Chrome)
1. Abra o site no Chrome
2. Clique no banner "Instalar GOTRES-KM"
3. Ou Menu → "Instalar app"

### iPhone (Safari)
1. Abra o site no Safari
2. Toque em Compartilhar → "Adicionar à Tela de Início"

### Desktop (Chrome/Edge)
1. Clique no botão "Instalar App" no header
2. Ou ícone de instalação na barra de endereço

---

## 🚀 Deploy

### Vercel (Recomendado)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Gotres-Projetos/Gotres-KM)

1. Conecte seu repositório GitHub
2. Configure as variáveis de ambiente
3. Deploy automático!

### Netlify

1. Conecte seu repositório
2. Build command: `npm run build`
3. Publish directory: `.next`

---

## 📄 Estrutura do Projeto

```
Gotres-KM/
├── app/                    # Páginas Next.js
│   ├── page.tsx           # Página principal
│   ├── layout.tsx         # Layout global
│   └── globals.css        # Estilos globais
├── components/            # Componentes React
│   ├── VehicleList.tsx
│   ├── VehicleForm.tsx
│   ├── RefuelingList.tsx
│   ├── RefuelingForm.tsx
│   ├── MaintenanceList.tsx
│   ├── MaintenanceForm.tsx
│   ├── Reports.tsx
│   ├── InstallPWA.tsx
│   └── InstallButton.tsx
├── lib/                   # Utilitários
│   ├── supabase.ts       # Cliente Supabase
│   └── manufacturers.ts   # Dados de fabricantes
├── public/               # Arquivos estáticos
│   ├── logo.png
│   ├── manifest.json
│   └── sw.js            # Service Worker
└── supabase-setup.sql   # Schema do banco
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer um Fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abrir um Pull Request

---

## 📝 Licença

Este projeto foi desenvolvido por **Drayton Sousa** para **GOTRES**.

**GOTRES** - Todos direitos reservados © 2012-2025

---

## 👨‍💻 Autor

**Drayton Sousa**

Sistema de KM Veicular desenvolvido para GOTRES

---

## 📞 Suporte

Para suporte, entre em contato através do GitHub Issues.

---

<div align="center">
  <strong>Desenvolvido com ❤️ por Drayton Sousa</strong>
</div>
