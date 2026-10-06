# Documentation Index

Complete guide to all documentation available in this project.

---

## 📚 Main Documentation

### [Entrega de requisitos del cliente](./docs/client-delivery-operations.md)

Publicación de garantías, imagen del Home y favicon; configuración privada del
correo y comprobación de la cuenta existente. La respuesta comercial y las guías
para el cliente se preparan con `$client-response`, fuera del repositorio.

### 🏠 [README.md](./README.md)
**Main project documentation**

- Project overview
- Quick start guide
- Architecture summary
- Tech stack
- API endpoints
- Common commands

**Start here if you're new to the project.**

---

### 🚀 [SETUP.md](./SETUP.md)
**Complete setup guide**

- Prerequisites
- Step-by-step backend setup
- Step-by-step frontend setup
- Testing the setup
- Common commands reference
- Troubleshooting

**Use this for detailed installation instructions.**

---

### 🎨 [frontend/README.md](./frontend/README.md)
**Frontend documentation**

- Project structure
- Routes
- Authentication flow
- Environment variables
- Vue → Next.js quick reference

---

## 🗂️ Backend Documentation

### 📂 Location: `/backend/`

---

#### 📖 [django_attachments/README.md](./backend/django_attachments/README.md)
**Gallery system documentation**

- Installation and configuration
- Usage in models
- ModelForm creation
- Admin configuration
- Serializers for API
- Complete examples with multiple galleries

**Use this when implementing image galleries.**

---

#### 📖 [docs/FAKE_DATA_COMMANDS.md](./backend/docs/FAKE_DATA_COMMANDS.md)
**Fake data system guide**

- Architecture and principles
- Basic usage
- Adding new models
- Dependency diagrams
- Command templates
- Testing guidelines

**Reference when creating fake data for new models.**

---

#### 📖 [core_app/management/commands/README.md](./backend/core_app/management/commands/README.md)
**Management commands quick reference**

- Command architecture overview
- Usage examples
- How to add new commands
- Dependency order
- Testing commands

**Quick reference within the commands directory.**

---

## 🎨 Frontend Documentation

### 📂 Location: `/frontend/`

---

#### 📖 [frontend/README.md](./frontend/README.md)
**Frontend-specific documentation**

- Project structure
- Features
- Available commands
- Routes
- Authentication flow
- Styling with Tailwind
- Architecture patterns
- Comparison with Vue

**Reference for frontend development.**

---

## 📋 Documentation by Topic

### Getting Started

1. **First Time Setup**
   - Read: [SETUP.md](./SETUP.md)
   - Follow step-by-step instructions
   - Test the setup

2. **Understanding the Architecture**
   - Read: [README.md](./README.md) - Architecture section
   - Review project structure
   - Explore code organization

3. **Vue to Next.js Transition** (if applicable)
   - Read: [frontend/README.md](./frontend/README.md)
   - Study concept mappings
   - Follow learning path

---

### Development

1. **Adding Models**
   - Read: Architecture guide (models section)
   - Follow modular structure: `models/entity_name.py`

2. **Creating API Endpoints**
   - Pattern: Serializers (List, Detail, CreateUpdate)
   - Views: Function-based with `@api_view`
   - URLs: Organized by module

3. **Implementing Galleries**
   - Read: [django_attachments/README.md](./backend/django_attachments/README.md)
   - Follow examples
   - Implement in your models

4. **Creating Fake Data**
   - Read: [FAKE_DATA_COMMANDS.md](./backend/docs/FAKE_DATA_COMMANDS.md)
   - Create command file per model
   - Add to master orchestrator

5. **Building Frontend Pages**
   - Read: [frontend/README.md](./frontend/README.md)
   - Follow component patterns
   - Implement auth guards for protected routes

---

### Operations

1. **Running the Project**
   - Backend: `python manage.py runserver`
   - Frontend: `npm run dev`
   - See: [SETUP.md](./SETUP.md) - Part 1 & 2

2. **Managing Database**
   - Migrations: `python manage.py migrate`
   - Fake data: `python manage.py create_fake_data`
   - Cleanup: `python manage.py delete_fake_data --confirm`

3. **Troubleshooting**
   - See: [SETUP.md](./SETUP.md) - Troubleshooting section
   - See: [frontend/README.md](./frontend/README.md) - Troubleshooting section

---

### Standards & Best Practices

1. **Coding Standards**
   - **Documentation:** All in English (DocStrings, comments, READMEs)
   - **Structure:** Modular (one file per model/entity)
   - **Serializers:** Separate List, Detail, CreateUpdate
   - **Commands:** One command per model

2. **File Organization**
   - Backend: Separate folders for models, serializers, views, urls
   - Frontend: App Router structure, lib for shared code

3. **Naming Conventions**
   - Files: snake_case (Python), kebab-case or camelCase (TypeScript)
   - Classes: PascalCase
   - Functions: snake_case (Python), camelCase (TypeScript)
   - Constants: UPPER_CASE

---

## 🔍 Finding Documentation

### By File Type

**Python Code:**
- Models: `/backend/core_app/models/*.py`
- Serializers: `/backend/core_app/serializers/*.py`
- Views: `/backend/core_app/views/*.py`
- Commands: `/backend/core_app/management/commands/*.py`

**TypeScript Code:**
- Pages: `/frontend/app/**/page.tsx`
- Stores: `/frontend/lib/stores/*.ts`
- Services: `/frontend/lib/services/*.ts`
- Types: `/frontend/types/*.ts`

**Configuration:**
- Backend: `/backend/core_project/settings.py`
- Frontend: `/frontend/next.config.ts`
- Environment: `/backend/.env`, `/frontend/.env.local`

---

### By Feature

**Authentication:**
- Backend: `/backend/core_app/views/auth_views.py`
- Frontend: `/frontend/app/auth/*/page.tsx`
- Store: `/frontend/lib/stores/authStore.ts`
- HTTP: `/frontend/lib/services/http.ts`

**User Management:**
- Model: `/backend/core_app/models/user.py`
- Serializers: `/backend/core_app/serializers/auth_serializers.py`
- Admin: `/backend/core_app/admin.py`
- Fake data: `/backend/core_app/management/commands/create_fake_users.py`

**Galleries:**
- Library: `/backend/django_attachments/`
- Docs: `/backend/django_attachments/README.md`
- Models: `/backend/django_attachments/models.py`
- Fields: `/backend/django_attachments/fields.py`

---

## 📝 Documentation Guidelines

When creating new documentation:

### ✅ DO

- ✅ Write in **English** (all docs, comments, DocStrings)
- ✅ Include **examples** with code snippets
- ✅ Provide **step-by-step** instructions
- ✅ Add **troubleshooting** sections
- ✅ Use **clear headings** and structure
- ✅ Include **diagrams** when helpful
- ✅ Keep it **up-to-date** with code changes

### ❌ DON'T

- ❌ Write in Spanish (except user-facing content if needed)
- ❌ Assume prior knowledge without explanation
- ❌ Use vague terms without examples
- ❌ Create documentation without structure
- ❌ Leave documentation outdated

---

## 🔄 Keeping Documentation Updated

### When to Update

- ✅ Adding new models/features
- ✅ Changing architecture patterns
- ✅ Modifying setup procedures
- ✅ Fixing bugs that affect documented behavior
- ✅ Adding new dependencies

### What to Update

- **README.md** - If main architecture changes
- **SETUP.md** - If setup steps change
- **Specific docs** - If feature changes
- **Code comments** - If logic changes

---

## 🎯 Quick Reference

### Most Used Commands

```bash
# Backend
python manage.py migrate
python manage.py create_fake_data
python manage.py runserver

# Frontend
npm run dev
npm run build
```

### Most Read Docs

1. [SETUP.md](./SETUP.md) - Setup guide
2. [README.md](./README.md) - Project overview
3. [FAKE_DATA_COMMANDS.md](./backend/docs/FAKE_DATA_COMMANDS.md) - Fake data


---

## 📞 Need Help?

1. **Check Documentation First**
   - Use this index to find relevant docs
   - Search for keywords in documentation

2. **Review Code Examples**
   - Existing code is well-documented
   - Follow established patterns

3. **Check Troubleshooting Sections**
   - [SETUP.md](./SETUP.md) - Troubleshooting
   - [frontend/README.md](./frontend/README.md) - Troubleshooting

---

**Last Updated:** February 2026

**Documentation Maintainers:** Development Team
