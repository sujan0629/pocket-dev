INSERT INTO users (id, email, "passwordHash", name, tier, "createdAt", "updatedAt")
VALUES 
  ('user-free-demo', 'free@pocketdev.dev', '$2a$10$Sn4W.7P8dH0yVpxNZkvFquJsI4YmP82kb5RlnugLSOW3xMhG6tlyq', 'Free Demo', 'FREE', NOW(), NOW()),
  ('user-paid-demo', 'paid@pocketdev.dev', '$2a$10$Sn4W.7P8dH0yVpxNZkvFquJsI4YmP82kb5RlnugLSOW3xMhG6tlyq', 'Paid Demo', 'PAID', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO subscriptions (id, "userId", tier, "quotaJobsPerDay", "createdAt", "updatedAt")
VALUES 
  ('sub-free-demo', 'user-free-demo', 'FREE', 50, NOW(), NOW()),
  ('sub-paid-demo', 'user-paid-demo', 'PAID', 1000, NOW(), NOW())
ON CONFLICT ("userId") DO NOTHING;

INSERT INTO projects (id, "userId", name, slug, "createdAt", "updatedAt")
VALUES 
  ('project-hello-world', 'user-free-demo', 'Hello World', 'hello-world', NOW(), NOW()),
  ('project-sandbox', 'user-paid-demo', 'Sandbox', 'sandbox', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
