# BeautySalon Management

Sistema web **multi-tenant** de gestão e agendamento para salões de beleza: API REST em ASP.NET Core e painel administrativo em React, com página pública de agendamento por loja.

## Funcionalidades
- **Multi-tenant por slug**: cada loja tem seus próprios dados (`/api/{slug}/...`).
- **Agendamento público**: o cliente escolhe serviço, profissional e data; os horários livres são calculados pela jornada de trabalho de cada profissional (`WorkSchedule`) e pela duração do serviço.
- **Painel administrativo**: agenda (calendário), serviços, estoque com movimentações e dashboard.
- **Autenticação JWT** (ASP.NET Identity + BCrypt) com papéis `Boss`, `Professional` e `Client`.
- **Recuperação de senha** por código enviado por e-mail.

## Stack
| Camada | Tecnologias |
| --- | --- |
| API | C#, ASP.NET Core (.NET 8), Entity Framework Core, MySQL (Pomelo), Identity, JWT, FluentValidation, AutoMapper, Swagger |
| Front-end | React 19, Vite, Tailwind CSS, React Router, FullCalendar / react-big-calendar, Recharts, MUI |

## Estrutura
```
BeautySalonAPI/        API (Controllers, Entities, DTOs, Data, Infrastructure/Tenancy, Services)
BeautySalonFront/
  admin-panel/         Painel e página pública de agendamento (React + Vite)
```

## Como rodar

### Pré-requisitos
.NET 8 SDK, Node.js 20+ e MySQL 8.

### 1. API
```bash
cd BeautySalonAPI

# Configuração local (não vai para o Git)
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "server=localhost;port=3306;database=beautysalon;user=SEU_USUARIO;password=SUA_SENHA"
dotnet user-secrets set "Jwt:Key" "$(openssl rand -base64 48)"

# Opcional: e-mail (recuperação de senha)
dotnet user-secrets set "Email:User" "seu-email@gmail.com"
dotnet user-secrets set "Email:Password" "sua-senha-de-app"
dotnet user-secrets set "Email:From" "seu-email@gmail.com"

# Opcional (só em Development): cria um usuário Boss para acessar o painel
dotnet user-secrets set "Seed:BossEmail" "admin@exemplo.com"
dotnet user-secrets set "Seed:BossPassword" "UmaSenhaForte#123"

dotnet ef database update
dotnet run --launch-profile https   # https://localhost:7244 (Swagger em /swagger)
```
> As lojas (tenants) precisam existir na tabela `Tenants`; o cadastro público cria apenas usuários `Client`.

### 2. Front-end
```bash
cd BeautySalonFront/admin-panel
cp .env.example .env       # ajuste VITE_API_URL se necessário
npm install
npm run dev                # http://localhost:5173
```

## Segurança
- Nenhum segredo no repositório: JWT, banco e e-mail vêm de **User Secrets** ou **variáveis de ambiente** (`Jwt__Key`, `ConnectionStrings__DefaultConnection`, `Email__Password`).
- A API **não inicia** sem `Jwt:Key` com 32+ caracteres.
- Rotas administrativas exigem JWT; a loja (tenant) e o papel vêm do **token**, não de parâmetros da requisição.
- Rotas públicas (agendamento): lojas, serviços, profissionais, disponibilidade, horários ocupados e criação de agendamento.
- CORS restrito às origens em `Cors:AllowedOrigins`.

## Endpoints principais
| Método | Rota | Acesso |
| --- | --- | --- |
| POST | `/api/auth/login`, `/api/auth/register` | Público |
| GET | `/api/{slug}/service`, `/api/{slug}/availability`, `/api/{slug}/appointment/busy` | Público |
| POST | `/api/{slug}/appointment/public` | Público |
| GET/POST/PUT/DELETE | `/api/appointment` | Autenticado |
| GET/POST/PUT/DELETE | `/api/service` (escrita: Boss) | Autenticado |
| GET/POST/PUT/DELETE | `/api/stock`, `/api/stockmovement` (escrita: Boss) | Autenticado |
| GET | `/api/dashboard` | Autenticado |

## Próximos passos
- Testes automatizados (xUnit) para o cálculo de disponibilidade e para o isolamento entre lojas.
- Lembretes automáticos de agendamento por e-mail (job em background).
- Renovação de token (refresh token) e limite de tentativas de login.
- Paginação nas listagens e deploy com Docker.
