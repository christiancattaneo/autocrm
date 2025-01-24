-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can read roles" ON user_roles;
DROP POLICY IF EXISTS "Admin can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Admin can update roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON tickets;
DROP POLICY IF EXISTS "Staff can create tickets" ON tickets;
DROP POLICY IF EXISTS "Customers can create tickets" ON tickets;
DROP POLICY IF EXISTS "Admin can delete roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own tickets or staff can view all" ON tickets;
DROP POLICY IF EXISTS "Users can update their own tickets or staff can update all" ON tickets;
DROP POLICY IF EXISTS "Staff can create tickets for others" ON tickets;
DROP POLICY IF EXISTS "Users can read their own role or admins can read all" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Users can create their own role" ON user_roles;

-- Create a function to check if a user is admin (without recursion)
CREATE OR REPLACE FUNCTION is_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_id_param 
    AND role = 'admin'
  );
$$;

-- Create a function to get all user roles (for admin use)
CREATE OR REPLACE FUNCTION get_all_user_roles()
RETURNS SETOF user_roles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM user_roles;
$$;

-- Create simplified policies for tickets
CREATE POLICY "Users can view their own tickets or staff can view all" ON tickets
FOR SELECT TO authenticated
USING (
  customer_email = current_setting('request.jwt.claims.email')::text OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND (role = 'admin' OR role = 'staff')
  )
);

CREATE POLICY "Users can update their own tickets or staff can update all" ON tickets
FOR UPDATE TO authenticated
USING (
  customer_email = current_setting('request.jwt.claims.email')::text OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND (role = 'admin' OR role = 'staff')
  )
);

CREATE POLICY "Customers can create tickets" ON tickets
FOR INSERT TO authenticated
WITH CHECK (
  customer_email = current_setting('request.jwt.claims.email')::text
);

CREATE POLICY "Staff can create tickets for others" ON tickets
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND (role = 'admin' OR role = 'staff')
  )
);

-- Create simplified policies that use our functions
CREATE POLICY "Users can read their own role" ON user_roles
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all roles" ON user_roles
FOR SELECT TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Users can create their own role" ON user_roles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON user_roles
FOR ALL TO authenticated
USING (is_admin(auth.uid())); 
