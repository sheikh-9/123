# نظام الحضور والانصراف

نظام إدارة حضور وانصراف الموظفين مبني بـ React و TypeScript و Supabase.

## المميزات

- ✅ تسجيل حضور وانصراف الموظفين
- ✅ إدارة بيانات الموظفين
- ✅ تقارير يومية
- ✅ تصدير البيانات إلى CSV
- ✅ واجهة مستخدم باللغة العربية
- ✅ تصميم متجاوب

## التقنيات المستخدمة

- React 18
- TypeScript
- Tailwind CSS
- Supabase
- Vite

## التشغيل المحلي

```bash
npm install
npm run dev
```

## النشر

يتم النشر تلقائياً على GitHub Pages عند رفع التغييرات على branch main.

## إعداد قاعدة البيانات

تحتاج لتنفيذ SQL التالي في Supabase:

```sql
-- إنشاء جدول الموظفين
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  employee_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- إنشاء جدول سجلات الحضور
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  check_in timestamptz,
  check_out timestamptz,
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "يمكن للجميع قراءة بيانات الموظفين" ON employees FOR SELECT TO public USING (true);
CREATE POLICY "يمكن للمستخدمين المصرح لهم إدارة الموظفين" ON employees FOR ALL TO authenticated USING (true);

CREATE POLICY "يمكن للجميع قراءة سجلات الحضور" ON attendance_records FOR SELECT TO public USING (true);
CREATE POLICY "يمكن للمستخدمين المصرح لهم إدارة سجلات الحضور" ON attendance_records FOR ALL TO authenticated USING (true);
```