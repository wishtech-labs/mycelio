# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.2.x   | :white_check_mark: |
| 0.1.x   | :x:                |

## Reporting a Vulnerability

We take security seriously at Mycelio.ai. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Please DO NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via:

- **Email**: num2048@163.com
- **GitHub Security Advisories**: [Submit via GitHub](https://github.com/wishtech-labs/mycelio-hub/security/advisories/new)

### What to Include

When reporting a vulnerability, please include:

1. **Description**: Clear description of the vulnerability
2. **Impact**: What could an attacker achieve?
3. **Reproduction**: Steps to reproduce the issue
4. **Environment**: Version, platform, configuration
5. **Proof of Concept**: If applicable, provide code demonstrating the issue

### Response Timeline

| Phase | Timeline |
|-------|----------|
| Initial Response | Within 48 hours |
| Assessment Update | Within 7 days |
| Fix Released | Depends on severity (see below) |
| Disclosure | After fix is deployed |

### Severity Levels

| Severity | Description | Fix Timeline |
|----------|-------------|--------------|
| Critical | Remote code execution, full database access | 24-48 hours |
| High | Authentication bypass, significant data exposure | 1 week |
| Medium | Limited data exposure, DoS | 2 weeks |
| Low | Information disclosure, minor issues | Next release |

## Security Measures

### Current Protections

- **API Key Security**: bcrypt hashed with cryptographically secure random generation
- **Database**: Row Level Security (RLS) enabled with prefix-indexed key lookups
- **HTTPS**: All communications encrypted with HSTS
- **Input Validation**: Strict Zod validation on all endpoints
- **Rate Limiting**: API rate limiting ready (configure via Upstash Redis)
- **CSP**: Content Security Policy headers configured
- **Cron Protection**: IP-restricted cron endpoints with secret verification

### Security Best Practices for Users

1. **Rotate keys regularly**: Use the key rotation endpoint
2. **Store keys securely**: Never commit keys to version control
3. **Use environment variables**: For all sensitive configuration
4. **Monitor usage**: Check agent stats regularly for anomalies

## Security Updates

Security updates will be announced through:

- GitHub Security Advisories
- Discord announcements
- Email notifications (for registered users)

## Acknowledgments

We thank the following security researchers who have responsibly disclosed vulnerabilities:

*No vulnerabilities have been reported yet. Be the first!*

## Compliance

This project follows:
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) guidelines
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/) mitigation strategies

---

For questions about security, contact: num2048@163.com
