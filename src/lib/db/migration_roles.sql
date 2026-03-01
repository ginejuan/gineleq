-- ============================================================
-- GineLeq — Migración: Sistema de Roles (idempotente)
-- ============================================================
-- Ejecutar en Supabase SQL Editor.
-- Seguro para ejecutar varias veces.
-- ============================================================

-- 1. Enum de roles (no falla si ya existe)
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('admin', 'gestor', 'consulta');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Eliminar tabla si existe (para recrearla limpia)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. Crear tabla de perfiles
CREATE TABLE public.profiles (
    id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre     TEXT,
    rol        app_role NOT NULL DEFAULT 'consulta',
    activo     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Trigger: crea perfil automáticamente al registrar un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.profiles (id, nombre)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Función SECURITY DEFINER para leer el rol sin recursividad en RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS app_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT rol FROM public.profiles WHERE id = auth.uid();
$$;

-- 6. RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Own profile read" ON public.profiles;
CREATE POLICY "Own profile read" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin full access" ON public.profiles;
CREATE POLICY "Admin full access" ON public.profiles
    FOR ALL USING (public.get_my_role() = 'admin');

-- ============================================================
-- 7. Asignar rol ADMIN al usuario actual
-- ============================================================
-- Ejecuta esto DESPUÉS del bloque anterior para que funcione:

INSERT INTO public.profiles (id, nombre, rol)
SELECT id, email, 'admin'::app_role
FROM auth.users
ORDER BY created_at
LIMIT 1
ON CONFLICT (id) DO UPDATE SET rol = 'admin';
