# CivicConnect pgAdmin 4 PostgreSQL Database Verification Guide

This guide provides step-by-step instructions and exact SQL queries to inspect, verify, and test your **PostgreSQL** database (`civicconnect`) in **pgAdmin 4**.

---

## 1. Connecting to Database in pgAdmin 4

1. Launch **pgAdmin 4**.
2. Expand **Servers** -> Connect to your PostgreSQL server (Password: `Sakyath` or your configured password).
3. Under **Databases**, select **`civicconnect`**.
4. Right-click **`civicconnect`** -> Select **Query Tool** (or press `Ctrl + Shift + Q`).

---

## 2. Complete SQL Verification Test Suite

### Test 1: Verify Registered Users & Roles
Run this query to list all registered citizens and administrators:
```sql
SELECT id, name, email, role 
FROM users 
ORDER BY id ASC;
```
*Expected Result*: Returns user IDs, names, emails, and roles (`CITIZEN` or `ADMIN`). Note that passwords are encrypted using BCrypt.

---

### Test 2: Inspect Geotagged Issue Reports
Run this query to list all reported civic grievances with coordinates and photo attachments:
```sql
SELECT id, title, category, status, priority, latitude, longitude, address, image_url, user_id, created_at 
FROM issues 
ORDER BY created_at DESC;
```
*Expected Result*: Displays reported tickets with exact GPS geotags (`latitude`, `longitude`), landmark address strings, and proof photo image paths (`/uploads/...`).

---

### Test 3: Verify Status Breakdown Metrics (Matches Dashboard KPI Cards)
Run this query to check ticket counts grouped by resolution status:
```sql
SELECT status, COUNT(*) AS ticket_count 
FROM issues 
GROUP BY status;
```
*Expected Result*: Returns count per status (`SUBMITTED`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`), matching the Community and Admin Executive Dashboard counters in the React app.

---

### Test 4: Verify Category Distribution Metrics
Run this query to check issue counts by category:
```sql
SELECT category, COUNT(*) AS category_count 
FROM issues 
GROUP BY category 
ORDER BY category_count DESC;
```
*Expected Result*: Returns category distribution (`Roads`, `Sanitation`, `Water`, `Electricity`, `Public Safety`).

---

### Test 5: Test Admin Triage Lifecycle Update directly in SQL
To simulate administrative triage and update an issue status and priority:
```sql
-- Update status to IN_PROGRESS and priority to HIGH for Ticket #1
UPDATE issues 
SET status = 'IN_PROGRESS', priority = 'HIGH', updated_at = NOW() 
WHERE id = 1;

-- Verify update
SELECT id, title, status, priority, updated_at 
FROM issues 
WHERE id = 1;
```

---

### Test 6: Test User Role Promotion (Promote Citizen to Admin)
To promote a citizen account to an administrator:
```sql
UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'john@civic.org';

-- Verify role change
SELECT id, name, email, role 
FROM users 
WHERE email = 'john@civic.org';
```

---

### Test 7: Verify Password Reset Security Tokens
Run this query to view active password reset requests:
```sql
SELECT t.id, t.token, u.email, t.expiry_date, t.used 
FROM password_reset_token t
JOIN users u ON t.user_id = u.id
ORDER BY t.id DESC;
```

---

### Test 8: Cleanup / Purge Test Tickets
To delete a test ticket or spam report:
```sql
DELETE FROM issues WHERE id = 99;
```
