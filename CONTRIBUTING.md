# Contributing to PS (Pirate Ship)

Thank you for your interest in contributing to PS! We welcome contributions from the community. This guide will help you get started.

## 🤝 Code of Conduct

We are committed to providing a welcoming and inspiring community for all. Please read and follow our Code of Conduct to ensure a positive environment.

## 📋 Getting Started

### Prerequisites
- Node.js v18+
- Docker & Docker Compose
- Git
- A GitHub account
- Familiarity with TypeScript, React, Node.js

### Fork & Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/PS-Projects.git
   cd PS-Projects
   ```
3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/original/PS-Projects.git
   ```

### Setup Development Environment

1. Follow the [SETUP.md](./docs/SETUP.md) guide for complete setup instructions
2. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 💻 Development

### Project Structure

See [REPOSITORY_STRUCTURE.md](./REPOSITORY_STRUCTURE.md) for detailed structure overview.

### Code Style

**TypeScript:**
- Use explicit types (avoid `any`)
- Prefer interfaces for objects
- Use strict null checking
- Use const/let (never var)

**React:**
- Functional components with hooks
- Use Context API for state management
- Keep components small and focused
- Use descriptive prop names

**General:**
- Use meaningful variable/function names
- Add comments for complex logic
- Keep functions small (DRY principle)
- Follow existing code patterns

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add OAuth integration with Google
fix: resolve card drag-and-drop issue
docs: update installation guide
refactor: reorganize middleware structure
test: add unit tests for auth service
chore: update dependencies
```

**Format:** `<type>: <subject>`

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting)
- `refactor` - Code refactoring
- `test` - Test additions/updates
- `chore` - Build, dependencies, etc.
- `perf` - Performance improvements
- `ci` - CI/CD configuration

### Pull Request Process

1. **Before you start**: Check [GitHub Issues](../../issues) for existing work
2. **Create your feature**: Implement your changes on your branch
3. **Test thoroughly**: Run tests and manual testing
4. **Build verification**: Ensure both builds complete successfully:
   ```bash
   # Backend
   cd Backend && npm run build
   
   # Frontend
   cd Frontend && npm run build
   ```
5. **Update documentation**: Add/update relevant docs
6. **Commit & push**: Follow commit message guidelines
7. **Create PR**: Push to your fork and create a pull request with:
   - Clear title describing the change
   - Description of what changed and why
   - Reference to related issues (#123)
   - Screenshots if UI changes

## 🧪 Testing

### Running Tests

```bash
# Backend tests
cd Backend && npm test

# Frontend tests
cd Frontend && npm test
```

### What to Test

- Existing functionality should continue working
- New features should have test coverage
- Edge cases and error handling
- Both development and production builds

## 🔒 Security

- Never commit `.env` or secret files
- Don't expose sensitive data in logs
- Report security vulnerabilities privately (see README.md)
- Follow authentication/authorization patterns

## 📚 Documentation

- Update README.md for user-facing changes
- Update relevant docs in `docs/` folder
- Add inline comments for complex logic
- Include API changes in API.md

## 🚀 Publishing Changes

1. **Update version** in `package.json` (both Backend & Frontend)
2. **Update CHANGELOG** with your changes
3. **Ensure all tests pass**
4. **Build verification**
5. **Merge to main**

## 🐛 Reporting Bugs

Found a bug? Great! Please report it via [GitHub Issues](../../issues) with:

- **Title**: Clear, concise description
- **Environment**: Node version, OS, browser (if frontend)
- **Steps to reproduce**: Detailed steps to reproduce the issue
- **Expected behavior**: What should happen
- **Actual behavior**: What's happening instead
- **Screenshots/logs**: If applicable
- **Possible fix**: If you have an idea (optional)

## 💡 Suggesting Features

Have an idea? We'd love to hear it! Open a [GitHub Discussion](../../discussions) or [Issue](../../issues) with:

- **Title**: Feature description
- **Use case**: Why is this needed?
- **Proposed solution**: Your implementation idea
- **Alternatives**: Other approaches considered
- **Additional context**: Any relevant info

## 📖 Resources

- [SETUP.md](./docs/SETUP.md) - Installation guide
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Technical architecture
- [API.md](./docs/API.md) - API documentation
- [DEVELOPMENT.md](./docs/DEVELOPMENT.md) - Development workflows
- [REPOSITORY_STRUCTURE.md](./REPOSITORY_STRUCTURE.md) - Project structure

## ✅ Checklist Before Submitting

- [ ] Code follows project style guide
- [ ] All tests pass locally
- [ ] Documentation is updated
- [ ] No console errors/warnings
- [ ] Commits have clear messages
- [ ] PR description is clear
- [ ] No breaking changes (or clearly documented)
- [ ] `.env` and secrets are NOT committed

## 🎓 Learning Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 📞 Questions?

- 💬 Open a [GitHub Discussion](../../discussions)
- 📧 Check existing issues for similar topics
- 🤔 Ask in pull request comments

## 🙏 Thank You

Your contributions help make PS better for everyone! Thank you for being part of our community. 

**Happy coding!** ⚓
