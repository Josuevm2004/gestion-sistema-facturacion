-- =========================================================================
-- Script SQL para Azure SQL Server / SQL Database
-- Agrega las columnas de credenciales del sistema otorgado al cliente:
-- 1. link_sistema (VARCHAR 255)
-- 2. usuario_sistema (VARCHAR 100)
-- 3. clave_sistema (VARCHAR 100)
-- =========================================================================

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[cliente]') AND name = 'link_sistema')
BEGIN
    ALTER TABLE [dbo].[cliente] ADD [link_sistema] VARCHAR(255) NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[cliente]') AND name = 'usuario_sistema')
BEGIN
    ALTER TABLE [dbo].[cliente] ADD [usuario_sistema] VARCHAR(100) NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[cliente]') AND name = 'clave_sistema')
BEGIN
    ALTER TABLE [dbo].[cliente] ADD [clave_sistema] VARCHAR(100) NULL;
END;
