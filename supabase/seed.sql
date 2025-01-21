-- Create users if they don't exist
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    email,
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
FROM (
    VALUES 
        ('christiandcattaneo@gmail.com'),
        ('christian.cattaneo@gauntletai.com'),
        ('vrillionaires@gmail.com')
) AS users(email)
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE users.email = auth.users.email
);

-- Insert admin role
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::user_role
FROM auth.users
WHERE email = 'christiandcattaneo@gmail.com'
ON CONFLICT (user_id) DO UPDATE
SET role = 'admin'::user_role;

-- Insert staff role
INSERT INTO user_roles (user_id, role)
SELECT id, 'staff'::user_role
FROM auth.users
WHERE email = 'christian.cattaneo@gauntletai.com'
ON CONFLICT (user_id) DO UPDATE
SET role = 'staff'::user_role;

-- Insert customer role
INSERT INTO user_roles (user_id, role)
SELECT id, 'customer'::user_role
FROM auth.users
WHERE email = 'vrillionaires@gmail.com'
ON CONFLICT (user_id) DO UPDATE
SET role = 'customer'::user_role; 