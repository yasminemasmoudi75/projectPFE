USE AA;
GO

DECLARE @UserId INT = 17;
DECLARE @IsIdentity INT = 0;

IF OBJECT_ID('dbo.Sec_Users', 'U') IS NULL
BEGIN
    SELECT 'ERROR: Table dbo.Sec_Users not found' AS StatusMessage;
    RETURN;
END;

IF OBJECT_ID('dbo.UCS_USERS', 'U') IS NULL
BEGIN
    SELECT 'ERROR: Table dbo.UCS_USERS not found' AS StatusMessage;
    RETURN;
END;

IF NOT EXISTS (SELECT 1 FROM dbo.UCS_USERS WHERE USER_ID = @UserId)
BEGIN
    SELECT 'ERROR: User not found in UCS_USERS' AS StatusMessage, @UserId AS UserId;
    RETURN;
END;

SELECT @IsIdentity = COLUMNPROPERTY(OBJECT_ID('dbo.Sec_Users'), 'UserID', 'IsIdentity');

IF EXISTS (SELECT 1 FROM dbo.Sec_Users WHERE UserID = @UserId)
BEGIN
    UPDATE su
    SET
        su.LoginName = COALESCE(u.USER_NAME, su.LoginName),
        su.FullName = COALESCE(u.REAL_NAME, su.FullName),
        su.Enabled = COALESCE(su.Enabled, 1)
    FROM dbo.Sec_Users su
    INNER JOIN dbo.UCS_USERS u ON u.USER_ID = su.UserID
    WHERE su.UserID = @UserId;

    SELECT 'OK: User already existed in Sec_Users and was refreshed' AS StatusMessage, @UserId AS UserId;
END
ELSE
BEGIN
    BEGIN TRY
        IF @IsIdentity = 1
            SET IDENTITY_INSERT dbo.Sec_Users ON;

        INSERT INTO dbo.Sec_Users
        (
            UserID,
            LoginName,
            FullName,
            Password,
            LastAccess,
            Enabled,
            CreatedDate,
            LastAccTime,
            CreatedTime,
            AccessCount
        )
        SELECT
            u.USER_ID,
            COALESCE(u.USER_NAME, CONCAT('user', CONVERT(VARCHAR(20), u.USER_ID))),
            COALESCE(u.REAL_NAME, u.USER_NAME, CONCAT('User ', CONVERT(VARCHAR(20), u.USER_ID))),
            '',
            NULL,
            1,
            CONVERT(date, GETDATE()),
            CONVERT(time, GETDATE()),
            CONVERT(time, GETDATE()),
            0
        FROM dbo.UCS_USERS u
        WHERE u.USER_ID = @UserId;

        IF @IsIdentity = 1
            SET IDENTITY_INSERT dbo.Sec_Users OFF;
    END TRY
    BEGIN CATCH
        IF @IsIdentity = 1
            SET IDENTITY_INSERT dbo.Sec_Users OFF;
        THROW;
    END CATCH

    SELECT 'OK: User inserted into Sec_Users' AS StatusMessage, @UserId AS UserId;
END;

SELECT TOP 1 *
FROM dbo.Sec_Users
WHERE UserID = @UserId;

SELECT TOP 1 ID, NumTicket, NomTechnicien, TechnicienID, Statut
FROM dbo.TabReclamation
WHERE ID = 10;
