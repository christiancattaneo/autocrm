-- Drop duplicate and conflicting policies
DROP POLICY IF EXISTS "user_roles_simple_policy" ON user_roles;
DROP POLICY IF EXISTS "Self registration" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own tickets or staff/admin can view all" ON tickets;

-- Add missing policies for user_roles
CREATE POLICY "Users can create their own role" ON user_roles
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "Admins can manage roles" ON user_roles
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
); 