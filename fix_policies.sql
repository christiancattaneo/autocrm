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

-- Create simplified policy for user_roles
CREATE POLICY "Users can read their own role or admins can read all" ON user_roles
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
); 
