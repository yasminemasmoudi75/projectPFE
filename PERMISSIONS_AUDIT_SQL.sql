-- ═════════════════════════════════════════════════════════════════════
-- 🔐 INFRASTRUCTURE AUDIT & OPTIMISATION
-- ═════════════════════════════════════════════════════════════════════

-- 1️⃣ CRÉER TABLE D'AUDIT (historique des actions)
CREATE TABLE AuditLog (
    ID INT PRIMARY KEY IDENTITY(1,1),
    UserID NVARCHAR(50) NOT NULL,
    UserRole NVARCHAR(50),
    Action NVARCHAR(255) NOT NULL,
    Module INT,
    ModuleName NVARCHAR(100),
    EntityType NVARCHAR(100),
    EntityID INT,
    OldValue NVARCHAR(MAX),
    NewValue NVARCHAR(MAX),
    Status INT,
    StatusMessage NVARCHAR(500),
    IPAddress NVARCHAR(15),
    UserAgent NVARCHAR(512),
    Timestamp DATETIME2 DEFAULT GETDATE(),
    ExecutionTime INT -- ms
);

-- Index pour recherches rapides
CREATE INDEX idx_audit_user ON AuditLog(UserID, Timestamp);
CREATE INDEX idx_audit_module ON AuditLog(Module, Timestamp);
CREATE INDEX idx_audit_entity ON AuditLog(EntityType, EntityID);

---

-- 2️⃣ OPTIMISER TabAWProfileAccess AVEC INDEX
CREATE INDEX idx_profile_role ON TabAWProfileAccess(ProfileUser, CodMod);
CREATE INDEX idx_profile_module ON TabAWProfileAccess(CodMod, Actif);

---

-- 3️⃣ VIEW: Permissions Par Utilisateur (pour le backend)
CREATE VIEW vw_UserPermissions AS
SELECT 
    u.UserID,
    u.EmailPro,
    u.UserRole,
    u.GUID,
    tap.CodMod,
    tap.LibMod,
    tap.Actif,
    tap.canAdd,
    tap.canEdit,
    tap.canDelt,
    tap.canValid,
    tap.CanImp,
    tap.canPDF,
    tap.FiltreRepres,
    tap.FiltreMag,
    tap.FiltreChauffeur
FROM [User] u
LEFT JOIN TabAWProfileAccess tap ON u.UserRole = tap.ProfileUser
WHERE u.IsActive = 1;

---

-- 4️⃣ VIEW: Modules Accessibles Par Rôle
CREATE VIEW vw_RoleModules AS
SELECT 
    ProfileUser as Role,
    CodMod,
    LibMod,
    COUNT(*) as PermissionCount,
    SUM(CASE WHEN Actif=1 THEN 1 ELSE 0 END) as ActiveCount,
    SUM(CASE WHEN canAdd=1 THEN 1 ELSE 0 END) as CanCreateCount,
    SUM(CASE WHEN canEdit=1 THEN 1 ELSE 0 END) as CanEditCount,
    SUM(CASE WHEN canDelt=1 THEN 1 ELSE 0 END) as CanDeleteCount
FROM TabAWProfileAccess
GROUP BY ProfileUser, CodMod, LibMod;

---

-- 5️⃣ VIEW: Analyse des Permissions par Rôle
CREATE VIEW vw_PermissionSummary AS
SELECT 
    tap.ProfileUser as Role,
    COUNT(DISTINCT tap.CodMod) as TotalModules,
    SUM(CASE WHEN tap.Actif=1 THEN 1 ELSE 0 END) as VisibleModules,
    SUM(CASE WHEN tap.canAdd=1 THEN 1 ELSE 0 END) as ModulesCanCreate,
    SUM(CASE WHEN tap.canEdit=1 THEN 1 ELSE 0 END) as ModulesCanEdit,
    SUM(CASE WHEN tap.canDelt=1 THEN 1 ELSE 0 END) as ModulesCanDelete,
    SUM(CASE WHEN tap.canValid=1 THEN 1 ELSE 0 END) as ModulesCanValidate,
    SUM(CASE WHEN tap.FiltreRepres=1 THEN 1 ELSE 0 END) as ModulesFiltered
FROM TabAWProfileAccess tap
GROUP BY tap.ProfileUser;

---

-- 6️⃣ PROCÉDURE STOCKÉE: Vérifier Permission
CREATE PROCEDURE sp_CheckPermission
    @UserID NVARCHAR(50),
    @CodMod INT,
    @Action NVARCHAR(50)
AS
BEGIN
    DECLARE @HasPermission BIT = 0;
    DECLARE @UserRole NVARCHAR(50);
    
    -- Obtenir le rôle de l'utilisateur
    SELECT @UserRole = UserRole FROM [User] WHERE UserID = @UserID;
    
    -- Vérifier la permission
    SELECT @HasPermission = CASE @Action
        WHEN 'view' THEN CASE WHEN Actif=1 THEN 1 ELSE 0 END
        WHEN 'create' THEN canAdd
        WHEN 'edit' THEN canEdit
        WHEN 'delete' THEN canDelt
        WHEN 'validate' THEN canValid
        WHEN 'export' THEN canPDF
        WHEN 'import' THEN CanImp
        ELSE 0
    END
    FROM TabAWProfileAccess
    WHERE ProfileUser = @UserRole AND CodMod = @CodMod;
    
    SELECT ISNULL(@HasPermission, 0) as HasPermission;
END;

---

-- 7️⃣ PROCÉDURE STOCKÉE: Enregistrer Action (Audit)
CREATE PROCEDURE sp_LogAction
    @UserID NVARCHAR(50),
    @UserRole NVARCHAR(50),
    @Action NVARCHAR(255),
    @Module INT,
    @ModuleName NVARCHAR(100),
    @EntityType NVARCHAR(100),
    @EntityID INT,
    @NewValue NVARCHAR(MAX),
    @Status INT,
    @IPAddress NVARCHAR(15) = NULL
AS
BEGIN
    INSERT INTO AuditLog
    (UserID, UserRole, Action, Module, ModuleName, EntityType, EntityID, 
     NewValue, Status, IPAddress, Timestamp)
    VALUES
    (@UserID, @UserRole, @Action, @Module, @ModuleName, @EntityType, @EntityID,
     @NewValue, @Status, @IPAddress, GETDATE());
END;

---

-- 8️⃣ PROCÉDURE STOCKÉE: Obtenir Permissions Utilisateur
CREATE PROCEDURE sp_GetUserPermissions
    @UserID NVARCHAR(50)
AS
BEGIN
    SELECT 
        u.UserID,
        u.EmailPro,
        u.UserRole,
        tap.CodMod,
        tap.LibMod,
        tap.Actif,
        tap.canAdd,
        tap.canEdit,
        tap.canDelt,
        tap.canValid,
        tap.CanImp,
        tap.canPDF,
        tap.FiltreRepres,
        tap.FiltreMag,
        tap.FiltreChauffeur,
        tap.CanShowCredit,
        tap.CanPhoto,
        tap.CanStatBL,
        tap.CanStatBC
    FROM [User] u
    JOIN TabAWProfileAccess tap ON u.UserRole = tap.ProfileUser
    WHERE u.UserID = @UserID
    ORDER BY tap.CodMod;
END;

---

-- 9️⃣ PROCÉDURE STOCKÉE: Retirer Accès Utilisateur
CREATE PROCEDURE sp_RevokeUserAccess
    @UserID NVARCHAR(50),
    @ModuleCode INT = NULL
AS
BEGIN
    DECLARE @UserRole NVARCHAR(50);
    SELECT @UserRole = UserRole FROM [User] WHERE UserID = @UserID;
    
    -- Si module spécifique
    IF @ModuleCode IS NOT NULL
    BEGIN
        UPDATE TabAWProfileAccess
        SET Actif = 0, canAdd = 0, canEdit = 0, canDelt = 0
        WHERE ProfileUser = @UserRole AND CodMod = @ModuleCode;
    END
    ELSE
    BEGIN
        -- Retirer tous les modules
        UPDATE TabAWProfileAccess
        SET Actif = 0, canAdd = 0, canEdit = 0, canDelt = 0
        WHERE ProfileUser = @UserRole;
    END
    
    -- Enregistrer en audit
    EXEC sp_LogAction @UserID, @UserRole, 'REVOKE_ACCESS', @ModuleCode, 
                      'Module', 'Permission', NULL, 'Access revoked', 200;
END;

---

-- 🔟 QUERY: Trouver les Incohérences de Permissions
SELECT 
    tap.ProfileUser,
    tap.CodMod,
    tap.LibMod,
    CASE 
        WHEN tap.Actif=0 AND (tap.canAdd=1 OR tap.canEdit=1 OR tap.canDelt=1) 
        THEN 'WARNING: Module inactif mais des actions activées'
        WHEN tap.canEdit=1 AND tap.Actif=0 
        THEN 'WARNING: Peut éditer module inactif'
        ELSE 'OK'
    END as Status
FROM TabAWProfileAccess tap
ORDER BY tap.ProfileUser, tap.CodMod;

---

-- 1️⃣1️⃣ NETTOYER AUDIT LOG (garder 90 jours)
DELETE FROM AuditLog 
WHERE Timestamp < DATEADD(day, -90, GETDATE());

---

-- 1️⃣2️⃣ STATISTIQUES D'UTILISATION
SELECT 
    Module,
    COUNT(*) as Total_Actions,
    COUNT(DISTINCT UserID) as Unique_Users,
    SUM(CASE WHEN Status=200 THEN 1 ELSE 0 END) as Successful,
    SUM(CASE WHEN Status!=200 THEN 1 ELSE 0 END) as Failed,
    CAST(AVG(CAST(ExecutionTime as FLOAT)) as INT) as Avg_Execution_Time_ms
FROM AuditLog
WHERE Timestamp > DATEADD(day, -30, GETDATE())
GROUP BY Module
ORDER BY Total_Actions DESC;
