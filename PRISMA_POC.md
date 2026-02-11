# Prisma POC - NestJS Backend

## What Was Done

This PR introduces **Prisma ORM** as the database abstraction layer for the NestJS backend:

- ✅ Integrated `@prisma/client` and `@prisma/adapter-pg` for PostgreSQL
- ✅ Created initial `schema.prisma` with `User` model
- ✅ Generated initial migration (`20260209140251_init`)
- ✅ Set up `PrismaService` for dependency injection in NestJS
- ✅ Implemented `UsersController` and `UsersService` with basic POST endpoint
- ✅ Added convenient npm scripts for Prisma workflows

**Next steps** (documented for future PRs):
- Docker Compose local PostgreSQL setup
- Comprehensive CRUD endpoints for Users
- Additional models and relationships

---

## Local Setup

### 1. Configure Database URL

Create a `.env` file in the project root:

```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/healplace_dev"
```

**Example for local PostgreSQL** (after Docker Compose is set up):
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/healplace_dev"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run start:dev
```

The server starts at `http://localhost:3000`

---

## Database Commands

Use these npm scripts instead of memorizing Prisma CLI commands:

### Generate Prisma Client
```bash
npm run db:generate
```
Regenerates the Prisma Client after schema changes.

### Create & Apply Migrations (Development)
```bash
npm run db:migrate
```
Creates a new migration and applies it to your local database. Use this during development.

### Deploy Migrations (CI/Production)
```bash
npm run db:deploy
```
Applies existing migrations without creating new ones. Use in CI/CD pipelines and production.

### Prisma Studio (Visual Inspector)
```bash
npm run db:studio
```
Opens a web UI to browse and edit database records at `http://localhost:5555`

### Reset Database (Development Only)
```bash
npm run db:reset
```
⚠️ **WARNING**: Drops all data. Resets schema and reruns all migrations. Use only in local development.

---

## API Endpoints

### Current Implementation

#### Create User (POST)
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "name": "Alice Johnson"
  }'
```

**Response (201 Created):**
```json
{
  "id": 1,
  "email": "alice@example.com",
  "name": "Alice Johnson"
}
```

**Minimal request (name is optional):**
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"email": "bob@example.com"}'
```

### Complete CRUD Pattern (To Be Implemented)

Here's the recommended pattern for full CRUD support:

#### Get All Users (GET)
```bash
curl http://localhost:3000/users
```

#### Get User by ID (GET)
```bash
curl http://localhost:3000/users/1
```

#### Update User (PUT)
```bash
curl -X PUT http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Smith",
    "email": "alice.smith@example.com"
  }'
```

#### Delete User (DELETE)
```bash
curl -X DELETE http://localhost:3000/users/1
```

---

## Database Schema

### Current Schema

```prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
}
```

**Fields:**
- `id`: Auto-incrementing primary key
- `email`: Unique email address (required)
- `name`: Optional display name

---

## Development Workflow

### Making Schema Changes

1. Edit `prisma/schema.prisma`
2. Run migration:
   ```bash
   npm run db:migrate
   ```
3. Give your migration a descriptive name (e.g., "add_user_phone_number")
4. Prisma automatically regenerates the client
5. Update your controllers/services as needed

### Inspecting Data

```bash
npm run db:studio
```

Opens Prisma Studio at `http://localhost:5555` for a visual database browser.

---

## Next Steps

- **Docker Compose Setup**: Local PostgreSQL with docker-compose will be added in the next PR
- **Complete CRUD Endpoints**: Implement GET, PUT, DELETE endpoints following the controller pattern
- **Additional Models**: Users relationships (Practitioners, Clients, Appointments, etc.)
- **Validating DTOs**: Add validation decorators for request bodies

---

## Troubleshooting

### Error: `DATABASE_URL` not configured
Ensure `.env` file exists in the project root with a valid `DATABASE_URL`.

### Error: Cannot connect to database
- If using Docker Compose (next PR): Ensure PostgreSQL container is running
- Check connection string syntax: `postgresql://user:password@host:port/database`
- Verify PostgreSQL is accessible on the specified host/port

### Prisma Client out of sync
Run `npm run db:generate` to regenerate after schema changes.

---

## Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [NestJS + Prisma Guide](https://docs.nestjs.com/recipes/prisma)
- [PostgreSQL Connection Strings](https://www.prisma.io/docs/reference/database-reference/connection-urls/postgresql)
