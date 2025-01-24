drop policy "Admin can delete roles" on "public"."user_roles";

drop policy "Admin can insert roles" on "public"."user_roles";

drop policy "Admin can update roles" on "public"."user_roles";

drop policy "Users can read roles" on "public"."user_roles";

alter table "public"."tickets" drop constraint "tickets_assignee_id_fkey";

alter table "public"."user_roles" drop constraint "user_roles_user_id_fkey";

alter table "public"."tickets" add constraint "tickets_assignee_id_fkey" FOREIGN KEY (assignee_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."tickets" validate constraint "tickets_assignee_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_roles" validate constraint "user_roles_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_all_user_roles()
 RETURNS SETOF user_roles
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT * FROM user_roles;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id_param uuid)
 RETURNS user_role
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT role FROM user_roles WHERE user_id = user_id_param;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin(user_id_param uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_id_param 
    AND role = 'admin'
  );
$function$
;

create policy "Staff can create tickets for others"
on "public"."tickets"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND ((user_roles.role = 'admin'::user_role) OR (user_roles.role = 'staff'::user_role))))));


create policy "Users can update their own tickets or staff can update all"
on "public"."tickets"
as permissive
for update
to authenticated
using (((customer_email = current_setting('request.jwt.claims.email'::text)) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND ((user_roles.role = 'admin'::user_role) OR (user_roles.role = 'staff'::user_role)))))));


create policy "Users can view their own tickets or staff can view all"
on "public"."tickets"
as permissive
for select
to authenticated
using (((customer_email = current_setting('request.jwt.claims.email'::text)) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND ((user_roles.role = 'admin'::user_role) OR (user_roles.role = 'staff'::user_role)))))));


create policy "Admins can manage all roles"
on "public"."user_roles"
as permissive
for all
to authenticated
using (is_admin(auth.uid()));


create policy "Admins can read all roles"
on "public"."user_roles"
as permissive
for select
to authenticated
using (is_admin(auth.uid()));


create policy "Users can create their own role"
on "public"."user_roles"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users can read their own role"
on "public"."user_roles"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));



